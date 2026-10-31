import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { normalizeChaos, validateCompetitiveSnapshot } from '../src/lib/competitive/normalize.js'
import { readRegulationConfig, root } from './regulation-config.mjs'

const hash = (text) => createHash('sha256').update(text).digest('hex')
const pause = (ms) => new Promise((done) => setTimeout(done, ms))
const json = (data) => `${JSON.stringify(data)}\n`
export const snapshotId = ({ period, format, cutoff }) => `${period}-${format}-${cutoff}`

export function assertCompleteMonth(period, now = new Date()) {
  const current = now.toISOString().slice(0, 7)
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period ?? '') || period < '2014-11' || period >= current) throw new Error('Specify a complete past month as --month YYYY-MM; no automatic period fallback.')
}

export async function fetchChaos(url, { fetchImpl = fetch, sleep = pause } = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let response
    try { response = await fetchImpl(url, { signal: AbortSignal.timeout(30000), headers: { Accept: 'application/json' } }) }
    catch (error) {
      if (attempt === 2) throw error
      await sleep(1000 * 2 ** attempt)
      continue
    }
    if (response.ok) {
      if (!/application\/json/i.test(response.headers.get('content-type') ?? '')) throw new Error('Provider returned a non-JSON response')
      return response.text()
    }
    if ((response.status !== 429 && response.status < 500) || attempt === 2) throw new Error(`Smogon HTTP ${response.status}; previous snapshot retained`)
    const retryAfter = response.headers.get('retry-after')
    const delay = retryAfter ? (/^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : Date.parse(retryAfter) - Date.now()) : 1000 * 2 ** attempt
    // A long Retry-After stops this run instead of retrying before the provider permits it.
    if (!Number.isFinite(delay) || delay > 10000) throw new Error('Provider requested a later retry; run the import later')
    await sleep(Math.max(0, delay))
  }
}

async function atomicWrite(path, content) {
  await mkdir(new URL('./', path), { recursive: true })
  const temporary = new URL(`${path.href}.tmp`)
  await writeFile(temporary, content)
  await rename(temporary, path)
}

export async function importCompetitive({ regulationId, period, cutoff, offline = false, refresh = false, now = new Date(), fetchImpl = fetch, directory = root }) {
  assertCompleteMonth(period, now)
  if (!Number.isInteger(cutoff) || cutoff < 0 || cutoff > 10000) throw new Error('Explicit integer --cutoff required')
  if (offline && refresh) throw new Error('--offline and --refresh cannot be combined')
  const { regulation } = await readRegulationConfig(regulationId)
  if (regulation.mechanics !== 'champions' || !/^gen9championsvgc/.test(regulation.format)) throw new Error('Only configured Champions VGC formats are supported')
  const { default: gameData } = await import(new URL(`../src/data/regulations/${regulation.id}.js`, import.meta.url))
  if (gameData.source.commit !== regulation.commit || gameData.source.format !== regulation.format) throw new Error('Regulation snapshot/config mismatch')
  const sourceUrl = `https://www.smogon.com/stats/${period}/chaos/${regulation.format}-${cutoff}.json`
  const id = snapshotId({ period, format: regulation.format, cutoff })
  const cache = new URL(`.cache/competitive/${id}.json`, directory)
  let raw
  if (!refresh) { try { raw = await readFile(cache, 'utf8') } catch (error) { if (error.code !== 'ENOENT') throw error } }
  if (!raw) {
    if (offline) throw new Error('No cached source for this exact dataset')
    raw = await fetchChaos(sourceUrl, { fetchImpl })
    await atomicWrite(cache, raw)
  }
  const descriptor = {
    id, provider: 'smogon', regulationId: regulation.id, regulationLabel: regulation.label,
    format: regulation.format, formatLabel: regulation.formatName, battleStyle: 'doubles', statSystem: 'champions-sp',
    period, cutoff, sourceUrl, sourceHash: hash(raw), mechanicsReference: regulation.commit, importedAt: now.toISOString(),
  }
  const snapshot = normalizeChaos(JSON.parse(raw), descriptor, gameData.roster)
  validateCompetitiveSnapshot(snapshot, gameData.roster)
  const folder = new URL('src/data/competitive/', directory)
  const manifestPath = new URL('manifest.json', folder)
  let manifest = { schemaVersion: 1, snapshots: [] }
  try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.snapshots)) throw new Error('Invalid competitive manifest')
  const prior = manifest.snapshots.find((entry) => entry.id === id)
  if (prior && !/^[a-z0-9-]+\.json$/.test(prior.file)) throw new Error('Unsafe competitive asset path')
  if (prior?.sourceHash === descriptor.sourceHash && prior.mechanicsReference === descriptor.mechanicsReference) {
    // Do not update the date for identical data. Also refuse to silently accept damaged output.
    const previous = JSON.parse(await readFile(new URL(prior.file, folder), 'utf8'))
    validateCompetitiveSnapshot(previous, gameData.roster)
    const { importedAt: oldDate, ...oldData } = previous
    const { importedAt: newDate, ...newData } = snapshot
    if (json(oldData) === json(newData) && oldDate === prior.importedAt && newDate) return { changed: false, snapshot: previous }
  }
  // Content-addressed files keep the prior manifest usable if writing its replacement fails.
  const file = `${id}-${hash(json(snapshot)).slice(0, 12)}.json`
  await atomicWrite(new URL(file, folder), json(snapshot))
  const entry = { ...descriptor, file, pokemonCount: snapshot.pokemon.length, battles: snapshot.battles }
  manifest.snapshots = [...manifest.snapshots.filter((row) => row.id !== id), entry].sort((a, b) => b.period.localeCompare(a.period) || a.id.localeCompare(b.id))
  await atomicWrite(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  return { changed: true, snapshot }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2), options = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--regulation') options.regulationId = args[++i]
    else if (args[i] === '--month') options.period = args[++i]
    else if (args[i] === '--cutoff') options.cutoff = Number(args[++i])
    else if (args[i] === '--offline') options.offline = true
    else if (args[i] === '--refresh') options.refresh = true
    else throw new Error(`Unknown argument: ${args[i]}`)
  }
  const result = await importCompetitive(options)
  console.log(`${result.changed ? 'Imported' : 'Unchanged'}: ${result.snapshot.id}, ${result.snapshot.pokemon.length} Pokémon. Review the diff; nothing was published.`)
}

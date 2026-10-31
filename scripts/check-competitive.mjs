import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { validateCompetitiveSnapshot } from '../src/lib/competitive/normalize.js'
import { readRegulationConfig, root } from './regulation-config.mjs'
import { assertCompleteMonth, snapshotId } from './import-competitive.mjs'

export async function checkCompetitive(directory = root) {
  const folder = new URL('src/data/competitive/', directory)
  const manifest = JSON.parse(await readFile(new URL('manifest.json', folder), 'utf8'))
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.snapshots)) throw new Error('Invalid competitive manifest')
  const seen = new Set()
  for (const entry of manifest.snapshots) {
    if (!/^[a-z0-9-]+\.json$/.test(entry.file) || seen.has(entry.id)) throw new Error('Unsafe path or duplicate snapshot')
    seen.add(entry.id)
    const { regulation } = await readRegulationConfig(entry.regulationId)
    const { default: gameData } = await import(new URL(`../src/data/regulations/${regulation.id}.js`, import.meta.url))
    const content = await readFile(new URL(entry.file, folder), 'utf8')
    // Git may check out text as CRLF on Windows; the checksum uses the generated LF form.
    const contentHash = createHash('sha256').update(content.replace(/\r\n/g, '\n')).digest('hex').slice(0, 12)
    if (entry.file !== `${entry.id}-${contentHash}.json`) throw new Error(`Competitive asset integrity mismatch: ${entry.id}`)
    const snapshot = JSON.parse(content)
    validateCompetitiveSnapshot(snapshot, gameData.roster)
    assertCompleteMonth(snapshot.period)
    for (const [key, value] of Object.entries(entry)) {
      if (key === 'file') continue
      const actual = key === 'pokemonCount' ? snapshot.pokemon.length : snapshot[key]
      if (actual !== value) throw new Error(`Competitive manifest mismatch: ${entry.id}.${key}`)
    }
    if (snapshot.id !== snapshotId(snapshot) || snapshot.format !== regulation.format || snapshot.regulationLabel !== regulation.label || snapshot.formatLabel !== regulation.formatName || snapshot.mechanicsReference !== gameData.source.commit || snapshot.mechanicsReference !== regulation.commit) throw new Error(`Competitive regulation mismatch: ${entry.id}`)
  }
  console.log(`Competitive snapshots verified offline: ${seen.size}. A regulation without statistics remains explicitly unavailable.`)
  return manifest
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await checkCompetitive()

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { CHAMPIONS_MOVES } from '../src/lib/damage/championsData.js'

// Pin the source so a future regulation cannot silently change this roster.
export const SHOWDOWN_COMMIT = '1636bf6d0848fb3c9330576963a647d4e179d278'
const root = new URL('../', import.meta.url)
const source = `https://raw.githubusercontent.com/smogon/pokemon-showdown/${SHOWDOWN_COMMIT}/`
const toId = (value) => String(value).toLowerCase().replace(/[^a-z0-9]/g, '')

const API_NAMES = {
  aegislash: 'aegislash-shield',
  basculegion: 'basculegion-male', basculegionf: 'basculegion-female',
  gourgeist: 'gourgeist-average', lycanroc: 'lycanroc-midday',
  meowstic: 'meowstic-male', meowsticf: 'meowstic-female',
  meowsticmmega: 'meowstic-male-mega', meowsticfmega: 'meowstic-female-mega',
  mimikyu: 'mimikyu-disguised', morpeko: 'morpeko-full-belly',
  pyroar: 'pyroar-male', palafin: 'palafin-zero',
  indeedee: 'indeedee-male', indeedeef: 'indeedee-female',
  toxtricity: 'toxtricity-amped',
  taurospaldeacombat: 'tauros-paldea-combat-breed',
  taurospaldeablaze: 'tauros-paldea-blaze-breed',
  taurospaldeaaqua: 'tauros-paldea-aqua-breed',
  maushold: 'maushold-family-of-three',
  squawkabilly: 'squawkabilly-green-plumage',
  squawkabillyyellow: 'squawkabilly-yellow-plumage',
}

export function mergeLearnsets(base, champions) {
  const result = { ...base, ...champions }
  for (const [id, entry] of Object.entries(champions)) {
    if (entry === null) delete result[id]
    else if (entry.inherit) result[id] = { ...base[id], ...entry }
  }
  return result
}

export function getLearnedMoves(id, pokedex, learnsets, visited = new Set()) {
  if (visited.has(id)) throw new Error(`Circular learnset inheritance: ${id}`)
  visited.add(id)
  if (learnsets[id]?.learnset) return Object.keys(learnsets[id].learnset).filter((move) => learnsets[id].learnset[move]).sort()
  const species = pokedex[id]
  const parent = toId(species?.changesFrom || species?.battleOnly || species?.baseSpecies || '')
  if (parent && parent !== id) return getLearnedMoves(parent, pokedex, learnsets, visited)
  throw new Error(`Missing Champions learnset: ${id}`)
}

export function buildRoster(pokedex, formats, abilityText, learnsets) {
  const cosmetics = new Set(Object.values(pokedex).flatMap((entry) => entry.cosmeticFormes ?? []).map(toId))
  const seenForms = new Set()
  return Object.entries(pokedex).flatMap(([id, species]) => {
    const format = formats[id] ?? {}
    const parent = formats[toId(species.battleOnly || species.baseSpecies || species.name)] ?? {}
    const tier = format.tier || parent.tier
    const nonstandard = format.isNonstandard ?? species.isNonstandard
    if (cosmetics.has(id) || nonstandard || !tier || tier === 'Illegal' || species.num <= 0) return []
    const tags = species.tags ?? pokedex[toId(species.baseSpecies)]?.tags ?? []
    if (tags.some((tag) => ['Mythical', 'Restricted Legendary'].includes(tag))) return []

    const signature = JSON.stringify([
      toId(species.baseSpecies || species.name),
      [...species.types].sort(), Object.entries(species.baseStats).sort(),
      Object.entries(species.abilities).map(([slot, ability]) => `${slot === 'H' ? 'hidden' : 'regular'}:${toId(ability)}`).sort(),
      getLearnedMoves(id, pokedex, learnsets),
      // Battle states can change ability/move behaviour without changing their names.
      species.battleOnly ? id : null,
    ])
    if (seenForms.has(signature)) return []
    seenForms.add(signature)

    const isMega = species.forme?.includes('Mega') ?? false
    let displayName = species.forme ? species.name.replaceAll('-', ' ') : species.name
    if (isMega) {
      const suffix = species.forme.replace('Mega', '').replace(/^-|-$/g, '').replaceAll('-', ' ')
      displayName = `Mega ${species.baseSpecies}${suffix ? ` ${suffix}` : ''}`
    }
    if (id === 'basculegion') displayName = 'Basculegion Male'
    if (id === 'basculegionf') displayName = 'Basculegion Female'
    if (id === 'meowsticmmega') displayName = 'Mega Meowstic Male'
    if (id === 'meowsticfmega') displayName = 'Mega Meowstic Female'
    const apiName = Object.hasOwn(API_NAMES, id)
      ? API_NAMES[id]
      : species.name.toLowerCase().replaceAll('’', '').replaceAll('.', '').replaceAll(' ', '-')
    const abilities = Object.entries(species.abilities).map(([slot, name]) => ({
      id: toId(name), name, isHidden: slot === 'H',
      description: abilityText[toId(name)]?.shortDesc ?? 'Descrizione non disponibile.',
    }))
    return [{
      showdownId: id, showdownName: species.name, displayName, apiName,
      category: isMega ? 'mega' : species.forme ? 'form' : 'base',
      dexNumber: species.num, types: species.types.map((type) => type.toLowerCase()),
      baseStats: species.baseStats, abilities,
    }]
  }).sort((a, b) => a.displayName.localeCompare(b.displayName, 'en'))
}

async function readSource(path, key) {
  const cacheFile = new URL(`.cache/showdown/${SHOWDOWN_COMMIT}/${path.replaceAll('/', '_')}`, root)
  let content
  try {
    content = await readFile(cacheFile, 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    const response = await fetch(source + path)
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`)
    content = await response.text()
    await writeFile(cacheFile, content)
  }
  if (!key) return content
  // These upstream files are data tables. Evaluate without host capabilities.
  const code = stripTypeScriptTypes(content).replace(new RegExp(`export const ${key}\\s*=`), 'globalThis.result =')
  const context = {}
  vm.runInNewContext(code, context, { timeout: 1000 })
  return context.result
}

async function main() {
  await mkdir(new URL(`.cache/showdown/${SHOWDOWN_COMMIT}/`, root), { recursive: true })
  const [pokedex, formats, abilityText, baseLearnsets, championsLearnsets, config, license] = await Promise.all([
    readSource('data/pokedex.ts', 'Pokedex'),
    readSource('data/mods/champions/formats-data.ts', 'FormatsData'),
    readSource('data/text/abilities.ts', 'AbilitiesText'),
    readSource('data/learnsets.ts', 'Learnsets'),
    readSource('data/mods/champions/learnsets.ts', 'Learnsets'),
    readSource('config/formats.ts'), readSource('LICENSE'),
  ])
  if (!/name: "\[Gen 9 Champions\] VGC 2026 Reg M-C",\s+mod: 'champions'/.test(config)) {
    throw new Error('The pinned Showdown source no longer defines M-C with the champions mod')
  }
  const learnsets = mergeLearnsets(baseLearnsets, championsLearnsets)
  const roster = buildRoster(pokedex, formats, abilityText, learnsets)
  if (!roster.length || new Set(roster.map((entry) => entry.displayName)).size !== roster.length) {
    throw new Error('Empty roster or duplicate display names')
  }
  const output = `// Generated by npm run data:regulation-mc. Do not edit by hand.\n` +
    `// Source: smogon/pokemon-showdown@${SHOWDOWN_COMMIT} (MIT; see docs/licenses/pokemon-showdown.txt).\n` +
    `export const REGULATION_MC_SOURCE = ${JSON.stringify({ repository: 'https://github.com/smogon/pokemon-showdown', commit: SHOWDOWN_COMMIT, format: 'gen9championsvgc2026regmc', mod: 'champions' }, null, 2)}\n\n` +
    `export const REGULATION_MC_ROSTER = [\n${roster.map((entry) => `  ${JSON.stringify(entry)},`).join('\n')}\n]\n\n` +
    `export const REGULATION_MC_POKEMON = REGULATION_MC_ROSTER.map((entry) => entry.displayName)\n`
  await writeFile(new URL('src/data/regulationMc.js', root), output)
  const damageMoveIds = Object.keys(CHAMPIONS_MOVES)
  const pools = []
  const poolIndexes = new Map()
  const references = roster.map((entry) => {
    const learned = new Set(getLearnedMoves(entry.showdownId, pokedex, learnsets))
    const supported = damageMoveIds.filter((id) => learned.has(toId(id)))
    const signature = JSON.stringify(supported)
    if (!poolIndexes.has(signature)) {
      poolIndexes.set(signature, pools.length)
      pools.push(supported)
    }
    return `  ${JSON.stringify(entry.showdownId)}: movePools[${poolIndexes.get(signature)}],`
  })
  await writeFile(new URL('src/data/championsDamageLearnsets.js', root),
    `// Generated by npm run data:regulation-mc from Pokemon Showdown @ ${SHOWDOWN_COMMIT}.\n` +
    `// MIT; see docs/licenses/pokemon-showdown.txt. Includes only moves implemented by our damage engine.\n` +
    `const movePools = ${JSON.stringify(pools)}\n\nexport const CHAMPIONS_DAMAGE_LEARNSETS = {\n${references.join('\n')}\n}\n`)
  await mkdir(new URL('docs/licenses/', root), { recursive: true })
  await writeFile(new URL('docs/licenses/pokemon-showdown.txt', root), license)
  console.log(`Imported ${roster.length} forms (${roster.filter((entry) => entry.category === 'mega').length} Mega forms) from ${SHOWDOWN_COMMIT}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main()
}

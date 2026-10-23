import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

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
  maushold: 'maushold-family-of-three', mausholdfour: 'maushold-family-of-four',
  squawkabilly: 'squawkabilly-green-plumage',
  squawkabillyblue: 'squawkabilly-blue-plumage',
  squawkabillyyellow: 'squawkabilly-yellow-plumage',
  squawkabillywhite: 'squawkabilly-white-plumage',
  // These forms have no separate pokemon resource. Never use the base form's data.
  vivillonfancy: null, vivillonpokeball: null,
  polteageistantique: null, sinistchamasterpiece: null,
}

export function buildRoster(pokedex, formats, abilityText) {
  const cosmetics = new Set(Object.values(pokedex).flatMap((entry) => entry.cosmeticFormes ?? []).map(toId))
  return Object.entries(pokedex).flatMap(([id, species]) => {
    const format = formats[id] ?? {}
    const parent = formats[toId(species.battleOnly || species.baseSpecies || species.name)] ?? {}
    const tier = format.tier || parent.tier
    const nonstandard = format.isNonstandard ?? species.isNonstandard
    if (cosmetics.has(id) || nonstandard || !tier || tier === 'Illegal' || species.num <= 0) return []
    const tags = species.tags ?? pokedex[toId(species.baseSpecies)]?.tags ?? []
    if (tags.some((tag) => ['Mythical', 'Restricted Legendary'].includes(tag))) return []

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
  const [pokedex, formats, abilityText, config, license] = await Promise.all([
    readSource('data/pokedex.ts', 'Pokedex'),
    readSource('data/mods/champions/formats-data.ts', 'FormatsData'),
    readSource('data/text/abilities.ts', 'AbilitiesText'),
    readSource('config/formats.ts'), readSource('LICENSE'),
  ])
  if (!/name: "\[Gen 9 Champions\] VGC 2026 Reg M-C",\s+mod: 'champions'/.test(config)) {
    throw new Error('The pinned Showdown source no longer defines M-C with the champions mod')
  }
  const roster = buildRoster(pokedex, formats, abilityText)
  if (!roster.length || new Set(roster.map((entry) => entry.displayName)).size !== roster.length) {
    throw new Error('Empty roster or duplicate display names')
  }
  const output = `// Generated by npm run data:regulation-mc. Do not edit by hand.\n` +
    `// Source: smogon/pokemon-showdown@${SHOWDOWN_COMMIT} (MIT; see docs/licenses/pokemon-showdown.txt).\n` +
    `export const REGULATION_MC_SOURCE = ${JSON.stringify({ repository: 'https://github.com/smogon/pokemon-showdown', commit: SHOWDOWN_COMMIT, format: 'gen9championsvgc2026regmc', mod: 'champions' }, null, 2)}\n\n` +
    `export const REGULATION_MC_ROSTER = [\n${roster.map((entry) => `  ${JSON.stringify(entry)},`).join('\n')}\n]\n\n` +
    `export const REGULATION_MC_POKEMON = REGULATION_MC_ROSTER.map((entry) => entry.displayName)\n`
  await writeFile(new URL('src/data/regulationMc.js', root), output)
  await mkdir(new URL('docs/licenses/', root), { recursive: true })
  await writeFile(new URL('docs/licenses/pokemon-showdown.txt', root), license)
  console.log(`Imported ${roster.length} forms (${roster.filter((entry) => entry.category === 'mega').length} Mega forms) from ${SHOWDOWN_COMMIT}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main()
}

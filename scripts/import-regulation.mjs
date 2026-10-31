import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import vm from 'node:vm'
import { createHash } from 'node:crypto'
import { buildMegaEvolutionLinks, buildRoster, getLearnedMoves, mergeLearnsets } from './import-regulation-mc.mjs'
import { configPath, readRegulationConfig, root } from './regulation-config.mjs'

const moveId = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Presentation stays separate from the fields consumed by the damage engine.
export function getShortDescription(entry, text, mods = []) {
  let shortDesc = text?.shortDesc
  for (const mod of mods) {
    if (text?.[mod]?.shortDesc !== undefined) shortDesc = text[mod].shortDesc
  }
  // Showdown also permits descriptions directly on modded moves and items.
  if (entry.shortDesc !== undefined || entry.desc !== undefined) shortDesc = entry.shortDesc || entry.desc
  if (typeof shortDesc !== 'string' || !shortDesc.trim()) throw new Error(`Missing short description: ${entry.name}`)
  return shortDesc.trim()
}

export function getMovePresentationMetadata(move, text, mods = []) {
  const metadata = { accuracy: move.accuracy, shortDesc: getShortDescription(move, text, mods) }
  if (move.damage || move.damageCallback) metadata.fixedDamage = move.damage ?? true
  if (move.basePowerCallback || move.onBasePower) metadata.variablePower = true
  return metadata
}

export function fingerprintAbility(ability) {
  const behavior = Object.fromEntries(Object.entries(ability)
    .filter(([key]) => key.startsWith('on') || key === 'condition' || key === 'flags' || key === 'suppressWeather')
    .sort(([a], [b]) => a.localeCompare(b, 'en')))
  return createHash('sha256').update(JSON.stringify(behavior, (key, value) => typeof value === 'function' ? value.toString() : value)).digest('hex')
}

export function fingerprintItem(item) {
  const behavior = { events: fingerprintAbility(item), fling: item.fling, boosts: item.boosts, isBerry: item.isBerry, isGem: item.isGem, megaStone: item.megaStone, megaEvolves: item.megaEvolves }
  return createHash('sha256').update(JSON.stringify(behavior, (key, value) => typeof value === 'function' ? value.toString() : value)).digest('hex')
}

export async function writeAtomic(path, content) {
  const temporary = new URL(`${path.pathname}.tmp`, path)
  await writeFile(temporary, content)
  await rename(temporary, path)
}

export function createSourceReader(commit, offline = false) {
  return async (path, key, optional = false) => {
    const cache = new URL(`.cache/showdown/${commit}/${path.replaceAll('/', '_')}`, root)
    let content
    try { content = await readFile(cache, 'utf8') }
    catch (error) {
      if (error.code !== 'ENOENT') throw error
      if (offline) {
        // An absent optional file must also be confirmed from a pinned source.
        try { if (await readFile(new URL(`${cache.href}.absent`), 'utf8') === '404\n') return null } catch { /* Fetch required. */ }
        throw new Error(`Missing offline source: ${path}`)
      }
      const response = await fetch(`https://raw.githubusercontent.com/smogon/pokemon-showdown/${commit}/${path}`, { signal: AbortSignal.timeout(30000) })
      if (optional && response.status === 404) {
        await writeFile(new URL(`${cache.href}.absent`), '404\n')
        return null
      }
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`)
      content = await response.text()
      await writeFile(cache, content)
    }
    if (!key) return content
    const code = stripTypeScriptTypes(content).replace(new RegExp(`export const ${key}\\s*=`), 'globalThis.result =')
    const context = {}
    vm.runInNewContext(code, context, { timeout: 1000 })
    if (!context.result) throw new Error(`Missing ${key} in ${path}`)
    return context.result
  }
}

export function verifyFormat(config, regulation) {
  const context = {}
  vm.runInNewContext(stripTypeScriptTypes(config).replace(/export const Formats\s*[^=]*=/g, 'globalThis.result ='), context, { timeout: 1000 })
  const format = context.result?.find((entry) => entry.name === regulation.formatName)
  if (!format || format.mod !== regulation.mod || format.gameType !== 'doubles') throw new Error(`Format/mod mismatch: ${regulation.formatName}`)
  const expected = ['Flat Rules', 'VGC Timer', 'Open Team Sheets']
  if (JSON.stringify(format.ruleset) !== JSON.stringify(expected) || format.banlist?.length || format.unbanlist?.length || format.restricted?.length) {
    throw new Error('Format rules changed: review roster legality before importing')
  }
}

export function validateSnapshot(snapshot) {
  const { source, roster, moves, learnsets, items, megaEvolutions, abilityMechanics } = snapshot
  if (!source?.id || source.mechanics !== 'champions' || !roster?.length) throw new Error('Invalid regulation snapshot')
  for (const field of ['showdownId', 'displayName']) {
    if (new Set(roster.map((entry) => entry[field])).size !== roster.length) throw new Error(`Duplicate ${field}`)
  }
  const itemIds = new Set(items.map((item) => item.id))
  if (itemIds.size !== items.length) throw new Error('Duplicate items')
  for (const pokemon of roster) {
    if (Object.keys(pokemon.baseStats).length !== 6 || Object.values(pokemon.baseStats).some((stat) => !Number.isInteger(stat) || stat <= 0)) throw new Error(`Invalid stats: ${pokemon.showdownId}`)
    if (!learnsets[pokemon.showdownId]?.length || learnsets[pokemon.showdownId].some((id) => !moves[id])) throw new Error(`Invalid learnset: ${pokemon.showdownId}`)
    if (!pokemon.types.length || !pokemon.abilities.length) throw new Error(`Incomplete Pokemon: ${pokemon.showdownId}`)
    for (const ability of pokemon.abilities) {
      const mechanics = abilityMechanics?.[moveId(ability.name)]
      if (!mechanics || !/^[a-f0-9]{64}$/.test(mechanics.fingerprint)) throw new Error(`Missing ability mechanics: ${ability.name}`)
    }
    if (pokemon.category === 'mega' && megaEvolutions.filter((link) => link.megaId === pokemon.showdownId).length !== 1) throw new Error(`Missing Mega link: ${pokemon.showdownId}`)
  }
  for (const link of megaEvolutions) {
    if (!itemIds.has(link.itemId) || !roster.some((entry) => entry.showdownId === link.baseId) || !roster.some((entry) => entry.showdownId === link.megaId)) throw new Error(`Invalid Mega link: ${link.megaId}`)
  }
  return snapshot
}

export async function generateSnapshot(regulation, { offline = false } = {}) {
  await mkdir(new URL(`.cache/showdown/${regulation.commit}/`, root), { recursive: true })
  const read = createSourceReader(regulation.commit, offline)
  verifyFormat(await read('config/formats.ts'), regulation)
  const [pokedex, abilityText, baseLearnsets, baseMoves, baseItems, baseAbilities, moveText, itemText] = await Promise.all([
    read('data/pokedex.ts', 'Pokedex'), read('data/text/abilities.ts', 'AbilitiesText'),
    read('data/learnsets.ts', 'Learnsets'), read('data/moves.ts', 'Moves'), read('data/items.ts', 'Items'),
    read('data/abilities.ts', 'Abilities'),
    read('data/text/moves.ts', 'MovesText'),
    read('data/text/items.ts', 'ItemsText'),
  ])
  let formats = {}, learnsets = baseLearnsets, moves = baseMoves, items = baseItems
  let abilities = baseAbilities
  const mods = [...regulation.parents, regulation.mod]
  for (const [index, mod] of mods.entries()) {
    const scripts = await read(`data/mods/${mod}/scripts.ts`)
    const parent = scripts.match(/\binherit:\s*['"]([a-z0-9]+)['"]/)?.[1] ?? 'base'
    const expected = index === 0 ? 'base' : mods[index - 1]
    if (parent !== expected) throw new Error(`Unexpected mod inheritance for ${mod}: ${parent}`)
    const [modFormats, modLearnsets, modMoves, modItems, modAbilities] = await Promise.all([
      read(`data/mods/${mod}/formats-data.ts`, 'FormatsData'),
      read(`data/mods/${mod}/learnsets.ts`, 'Learnsets'),
      read(`data/mods/${mod}/moves.ts`, 'Moves'), read(`data/mods/${mod}/items.ts`, 'Items'),
      read(`data/mods/${mod}/abilities.ts`, 'Abilities', true),
    ])
    formats = mergeLearnsets(formats, modFormats)
    learnsets = mergeLearnsets(learnsets, modLearnsets)
    moves = mergeLearnsets(moves, modMoves)
    items = mergeLearnsets(items, modItems)
    if (modAbilities) abilities = mergeLearnsets(abilities, modAbilities)
  }
  const roster = buildRoster(pokedex, formats, abilityText, learnsets, { excludedTags: regulation.excludedTags })
  const teamMoves = {}, teamLearnsets = {}, abilityMechanics = {}
  for (const entry of roster) {
    for (const ability of entry.abilities) {
      const implementation = abilities[ability.id]
      if (!implementation) throw new Error(`Missing ability implementation: ${ability.name}`)
      abilityMechanics[moveId(ability.name)] = {
        name: ability.name, fingerprint: fingerprintAbility(implementation),
        handlers: Object.keys(implementation).filter((key) => key.startsWith('on') && typeof implementation[key] === 'function').sort(),
        breakable: Boolean(implementation.flags?.breakable),
        flags: implementation.flags ?? {},
      }
    }
    teamLearnsets[entry.showdownId] = getLearnedMoves(entry.showdownId, pokedex, learnsets).map((id) => {
      const move = moves[id]
      if (!move?.name) throw new Error(`Missing move: ${id}`)
      const key = moveId(move.name)
      teamMoves[key] = { name: move.name, type: move.type.toLowerCase(), category: move.category.toLowerCase(), basePower: move.basePower ?? 0,
        target: move.target, flags: move.flags ?? {}, ...(move.multihit ? { multihit: move.multihit } : {}),
        ...(move.willCrit ? { isCrit: true } : {}), ...(move.overrideOffensiveStat ? { overrideOffensiveStat: move.overrideOffensiveStat } : {}),
        ...(move.overrideDefensiveStat ? { overrideDefensiveStat: move.overrideDefensiveStat } : {}) }
      if (move.overrideOffensivePokemon) teamMoves[key].overrideOffensivePokemon = move.overrideOffensivePokemon
      if (move.ignoreDefensive) teamMoves[key].ignoreDefensive = true
      for (const field of ['priority', 'ohko', 'noFaint', 'multiaccuracy', 'selfdestruct', 'hasCrashDamage', 'hasSheerForceBoost', 'breaksProtect']) if (move[field]) teamMoves[key][field] = move[field]
      teamMoves[key].hasSecondary = Boolean(move.secondary || move.secondaries?.length)
      if (move.recoil) teamMoves[key].recoil = move.recoil
      if (move.drain) teamMoves[key].drain = move.drain
      if (move.self?.boosts) teamMoves[key].selfBoosts = move.self.boosts
      if (move.secondary || move.secondaries) teamMoves[key].secondaries = move.secondaries ?? [move.secondary]
      teamMoves[key].presentation = getMovePresentationMetadata(move, moveText[id], mods)
      return key
    })
    entry.weightkg = pokedex[entry.showdownId].weightkg
    if (pokedex[entry.showdownId].battleOnly) entry.battleOnly = pokedex[entry.showdownId].battleOnly
  }
  return validateSnapshot({
    source: { ...regulation, repository: 'https://github.com/smogon/pokemon-showdown' }, roster,
    moves: Object.fromEntries(Object.entries(teamMoves).sort(([a], [b]) => a.localeCompare(b, 'en'))),
    learnsets: teamLearnsets,
    abilityMechanics: Object.fromEntries(Object.entries(abilityMechanics).sort(([a], [b]) => a.localeCompare(b, 'en'))),
    items: Object.entries(items).filter(([, item]) => item.name && !item.isNonstandard).map(([id, item]) => ({ id: moveId(item.name), name: item.name, description: getShortDescription(item, itemText[id], mods), fingerprint: fingerprintItem(item), megaStone: Boolean(item.megaStone), flingPower: item.fling?.basePower ?? 0, isBerry: Boolean(item.isBerry) })).sort((a, b) => a.name.localeCompare(b.name, 'en')),
    megaEvolutions: buildMegaEvolutionLinks(roster, items),
  })
}

export async function importRegulation({ id, activate = false, offline = false } = {}) {
  const { config, regulation } = await readRegulationConfig(id)
  const snapshot = await generateSnapshot(regulation, { offline })
  await mkdir(new URL('src/data/regulations/', root), { recursive: true })
  const { learnsets, ...data } = snapshot
  await writeAtomic(new URL(`src/data/regulations/${regulation.id}-learnsets.js`, root), `// Generated from pinned Showdown sources. MIT; see docs/licenses/pokemon-showdown.txt.\nexport default ${JSON.stringify(learnsets)}\n`)
  await writeAtomic(new URL(`src/data/regulations/${regulation.id}.js`, root), `// Generated from pinned Showdown sources. MIT; see docs/licenses/pokemon-showdown.txt.\nimport learnsets from './${regulation.id}-learnsets.js'\nexport default { ...${JSON.stringify(data)}, learnsets }\n`)
  if (activate || regulation.id === config.active) {
    await writeAtomic(new URL('src/data/activeRegulation.js', root), `// Generated by npm run data:regulation.\nexport { default } from './regulations/${regulation.id}.js'\n`)
    if (activate) await writeAtomic(configPath, `${JSON.stringify({ ...config, active: regulation.id }, null, 2)}\n`)
  }
  console.log(`Generated ${regulation.label}: ${snapshot.roster.length} forms, ${Object.keys(snapshot.moves).length} moves, ${snapshot.items.length} items`)
  return snapshot
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const args = process.argv.slice(2)
  const allowed = new Set(['--regulation', '--activate', '--offline'])
  for (let index = 0; index < args.length; index++) {
    if (!allowed.has(args[index])) throw new Error(`Unknown argument: ${args[index]}`)
    if (args[index] === '--regulation') index++
  }
  const selected = args.indexOf('--regulation')
  if (selected !== -1 && !args[selected + 1]) throw new Error('--regulation requires an id')
  await importRegulation({ id: selected === -1 ? undefined : args[selected + 1], activate: args.includes('--activate'), offline: args.includes('--offline') })
}

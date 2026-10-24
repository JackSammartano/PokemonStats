import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

// Pin the source so a future regulation cannot silently change this roster.
export const SHOWDOWN_COMMIT = '1636bf6d0848fb3c9330576963a647d4e179d278'
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

export function buildMegaEvolutionLinks(roster, items) {
  const byId = new Map(roster.map((entry) => [entry.showdownId, entry]))
  const links = Object.values(items).flatMap((item) => {
    if (!item.megaStone || item.isNonstandard) return []
    const pairs = typeof item.megaStone === 'string' ? [[item.megaEvolves, item.megaStone]] : Object.entries(item.megaStone)
    return pairs.flatMap(([baseName, megaName]) => {
      const base = byId.get(toId(baseName)), mega = byId.get(toId(megaName))
      if (!base || !mega || mega.category !== 'mega') return []
      return [{ baseId: base.showdownId, megaId: mega.showdownId,
        itemId: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), itemName: item.name }]
    })
  }).sort((a, b) => a.megaId.localeCompare(b.megaId))
  for (const entry of roster.filter((pokemon) => pokemon.category === 'mega')) {
    if (links.filter((link) => link.megaId === entry.showdownId).length !== 1) throw new Error(`Missing or ambiguous Mega mapping: ${entry.showdownId}`)
  }
  return links
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

export function buildRoster(pokedex, formats, abilityText, learnsets, { excludedTags = ['Mythical', 'Restricted Legendary'] } = {}) {
  const cosmetics = new Set(Object.values(pokedex).flatMap((entry) => entry.cosmeticFormes ?? []).map(toId))
  const seenForms = new Set()
  return Object.entries(pokedex).flatMap(([id, species]) => {
    const format = formats[id] ?? {}
    const parent = formats[toId(species.battleOnly || species.baseSpecies || species.name)] ?? {}
    const tier = format.tier || parent.tier
    const nonstandard = format.isNonstandard ?? species.isNonstandard
    if (cosmetics.has(id) || nonstandard || !tier || tier === 'Illegal' || species.num <= 0) return []
    const tags = species.tags ?? pokedex[toId(species.baseSpecies)]?.tags ?? []
    if (tags.some((tag) => excludedTags.includes(tag))) return []

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

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const { importRegulation } = await import('./import-regulation.mjs')
  await importRegulation({ id: 'mc' })
}

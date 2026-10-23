import { REGULATION_MC_ROSTER } from '../data/regulationMc.js'
import { CHAMPIONS_TYPE_CHART } from './damage/championsData.js'

const API_BASE = 'https://pokeapi.co/api/v2'
export const TYPE_NAMES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
]

const memoryCache = new Map()
const rosterByName = new Map(REGULATION_MC_ROSTER.map((entry) => [entry.displayName, entry]))

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function fetchJson(url) {
  if (memoryCache.has(url)) {
    return memoryCache.get(url)
  }

  const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  memoryCache.set(url, data)
  return data
}

async function fetchPokemonResource(displayName) {
  const entry = rosterByName.get(displayName)
  const apiName = entry ? entry.apiName : slugify(displayName)
  if (!apiName) throw new Error('No separate PokeAPI resource for this form')
  return { pokemon: await fetchJson(`${API_BASE}/pokemon/${apiName}`) }
}

async function fetchAbility(abilityRef) {
  const ability = await fetchJson(abilityRef.url)
  const italianEffect =
    ability.effect_entries.find((entry) => entry.language.name === 'it') ??
    ability.flavor_text_entries.find((entry) => entry.language.name === 'it')
  const englishEffect =
    ability.effect_entries.find((entry) => entry.language.name === 'en') ??
    ability.flavor_text_entries.find((entry) => entry.language.name === 'en')
  const bestEffect = italianEffect ?? englishEffect

  return {
    id: ability.name,
    name: formatName(ability.name),
    isHidden: abilityRef.is_hidden,
    description:
      bestEffect?.short_effect ??
      bestEffect?.effect ??
      bestEffect?.flavor_text?.replace(/\s+/g, ' ') ??
      'Descrizione non disponibile in PokeAPI.',
  }
}

async function loadTypeChart() {
  try {
    const entries = await Promise.all(
      TYPE_NAMES.map(async (type) => [type, await fetchJson(`${API_BASE}/type/${type}`)]),
    )
    return Object.fromEntries(entries)
  } catch {
    // The modern type chart also used by our calculator is available offline.
    return Object.fromEntries(TYPE_NAMES.map((defendingType) => [defendingType, {
      damage_relations: Object.fromEntries([
        ['double_damage_from', 2], ['half_damage_from', 0.5], ['no_damage_from', 0],
      ].map(([relation, multiplier]) => [relation, TYPE_NAMES
        .filter((attackingType) => (CHAMPIONS_TYPE_CHART[attackingType]?.[defendingType] ?? 1) === multiplier)
        .map((name) => ({ name }))])),
    }]))
  }
}

function relationNames(relations, key) {
  return relations[key].map((entry) => entry.name)
}

export function getDefenseProfile(typeNames, typeChart) {
  const multipliers = Object.fromEntries(TYPE_NAMES.map((type) => [type, 1]))

  for (const defendingType of typeNames) {
    const relations = typeChart[defendingType]?.damage_relations
    if (!relations) continue

    for (const type of relationNames(relations, 'double_damage_from')) {
      multipliers[type] *= 2
    }
    for (const type of relationNames(relations, 'half_damage_from')) {
      multipliers[type] *= 0.5
    }
    for (const type of relationNames(relations, 'no_damage_from')) {
      multipliers[type] *= 0
    }
  }

  return multipliers
}

export function getWeaknesses(typeNames, typeChart) {
  return Object.entries(getDefenseProfile(typeNames, typeChart))
    .filter(([, multiplier]) => multiplier > 1)
    .map(([type, multiplier]) => ({ type, multiplier }))
    .sort((a, b) => b.multiplier - a.multiplier || a.type.localeCompare(b.type))
}

export function getResistances(typeNames, typeChart) {
  return Object.entries(getDefenseProfile(typeNames, typeChart))
    .filter(([, multiplier]) => multiplier < 1)
    .map(([type, multiplier]) => ({ type, multiplier }))
    .sort((a, b) => a.multiplier - b.multiplier || a.type.localeCompare(b.type))
}

export function formatName(value) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const STAT_NAMES = {
  hp: 'hp', atk: 'attack', def: 'defense',
  spa: 'special-attack', spd: 'special-defense', spe: 'speed',
}

function applyShowdownData(result, entry, typeChart) {
  const { types } = entry
  return {
    ...result,
    displayName: entry.displayName,
    showdownId: entry.showdownId,
    showdownName: entry.showdownName,
    category: entry.category,
    id: entry.dexNumber,
    types,
    stats: Object.entries(entry.baseStats).map(([name, value]) => ({ name: STAT_NAMES[name], value })),
    abilities: entry.abilities.map((ability) => {
      const description = result.abilities?.find((candidate) =>
        candidate.id.replaceAll('-', '') === ability.id,
      )?.description
      return {
        ...ability,
        description: description && !description.startsWith('Descrizione non disponibile')
          ? description
          : ability.description,
      }
    }),
    defenseProfile: getDefenseProfile(types, typeChart),
    weaknesses: getWeaknesses(types, typeChart),
    resistances: getResistances(types, typeChart),
    status: 'ready',
  }
}

export async function fetchPokemon(displayName, typeChart) {
  const rosterEntry = rosterByName.get(displayName)
  try {
    const { pokemon } = await fetchPokemonResource(displayName)
    const types = pokemon.types
      .sort((a, b) => a.slot - b.slot)
      .map((entry) => entry.type.name)
    const abilities = await Promise.all(
      pokemon.abilities
        .sort((a, b) => a.slot - b.slot)
        .map((entry) =>
          fetchAbility(entry.ability).catch(() => ({
            id: entry.ability.name, name: formatName(entry.ability.name),
            description: 'Descrizione non disponibile in PokeAPI.',
          })).then((ability) => ({
            ...ability,
            isHidden: entry.is_hidden,
          })),
        ),
    )
    const moves = pokemon.moves
      .map((entry) => ({
        id: entry.move.name,
        name: formatName(entry.move.name),
      }))
      .sort((first, second) => first.name.localeCompare(second.name))

    const result = {
      displayName,
      apiName: pokemon.name,
      abilities,
      baseExperience: pokemon.base_experience,
      id: pokemon.id,
      image:
        pokemon.sprites.other?.home?.front_default ??
        pokemon.sprites.other?.['official-artwork']?.front_default ??
        pokemon.sprites.front_default,
      stats: pokemon.stats.map((entry) => ({
        name: entry.stat.name,
        value: entry.base_stat,
      })),
      moves,
      types,
      defenseProfile: getDefenseProfile(types, typeChart),
      weaknesses: getWeaknesses(types, typeChart),
      resistances: getResistances(types, typeChart),
      status: 'ready',
    }
    return rosterEntry ? applyShowdownData(result, rosterEntry, typeChart) : result
  } catch (error) {
    if (rosterEntry) {
      return applyShowdownData({ image: null, moves: [], apiName: rosterEntry.apiName ?? rosterEntry.showdownId }, rosterEntry, typeChart)
    }
    const candidates = [slugify(displayName)]

    return {
      displayName,
      apiName: null,
      candidates,
      error: error?.message ?? 'Not found',
      isNewOrUnverifiedMega: false,
      status: 'unsupported',
    }
  }
}

export async function loadPokemonDataset(names, onProgress) {
  const typeChart = await loadTypeChart()
  const results = []
  const batchSize = 10

  for (let index = 0; index < names.length; index += batchSize) {
    const batch = names.slice(index, index + batchSize)
    const loaded = await Promise.all(batch.map((name) => fetchPokemon(name, typeChart)))
    results.push(...loaded)
    onProgress?.(results.length)
  }

  return results
}

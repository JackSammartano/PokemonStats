import {
  NEW_OR_UNVERIFIED_MEGA_FORMS,
  POKEAPI_NAME_OVERRIDES,
} from '../data/regulationMb'

const API_BASE = 'https://pokeapi.co/api/v2'
const TYPE_NAMES = [
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

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function buildCandidates(displayName) {
  const explicit = POKEAPI_NAME_OVERRIDES[displayName] ?? []
  const baseSlug = slugify(displayName)

  if (!displayName.startsWith('Mega ')) {
    return unique([...explicit, baseSlug])
  }

  const speciesSlug = slugify(displayName.replace(/^Mega\s+/, ''))
  return unique([
    ...explicit,
    `${speciesSlug}-mega`,
    `${speciesSlug}-mega-x`,
    `${speciesSlug}-mega-y`,
    baseSlug,
  ])
}

function buildSpeciesCandidates(displayName) {
  const cleanName = displayName.replace(/^Mega\s+/, '').replace(/\s+[XY]$/, '')
  return unique([slugify(cleanName)])
}

function varietyScore(displayName, varietyName) {
  const normalizedDisplay = slugify(displayName)
  const normalizedVariety = slugify(varietyName)

  if (!displayName.startsWith('Mega ')) {
    if (normalizedDisplay === normalizedVariety) return 100
    if (normalizedVariety.startsWith(`${normalizedDisplay}-`)) return 50
    return 0
  }

  const wantsX = /\sX$/.test(displayName)
  const wantsY = /\sY$/.test(displayName)
  const isMega = normalizedVariety.includes('mega')

  if (!isMega) return 0
  if (wantsX && normalizedVariety.endsWith('-x')) return 100
  if (wantsY && normalizedVariety.endsWith('-y')) return 100
  if (!wantsX && !wantsY && !normalizedVariety.endsWith('-x') && !normalizedVariety.endsWith('-y')) {
    return 90
  }

  return 10
}

async function fetchJson(url) {
  if (memoryCache.has(url)) {
    return memoryCache.get(url)
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  memoryCache.set(url, data)
  return data
}

async function fetchPokemonResource(displayName) {
  const candidates = buildCandidates(displayName)
  let lastError = null

  for (const candidate of candidates) {
    try {
      return {
        pokemon: await fetchJson(`${API_BASE}/pokemon/${candidate}`),
        candidates,
      }
    } catch (error) {
      lastError = error
    }
  }

  for (const speciesCandidate of buildSpeciesCandidates(displayName)) {
    try {
      const species = await fetchJson(`${API_BASE}/pokemon-species/${speciesCandidate}`)
      const bestVariety = species.varieties
        .map((entry) => ({
          score:
            varietyScore(displayName, entry.pokemon.name) +
            (entry.is_default ? 25 : 0),
          url: entry.pokemon.url,
        }))
        .sort((a, b) => b.score - a.score)[0]

      if (bestVariety?.score > 0) {
        return {
          pokemon: await fetchJson(bestVariety.url),
          candidates: unique([...candidates, `${speciesCandidate} species varieties`]),
        }
      }
    } catch (error) {
      lastError = error
    }
  }

  throw Object.assign(new Error(lastError?.message ?? 'Not found'), { candidates })
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
  const entries = await Promise.all(
    TYPE_NAMES.map(async (type) => [type, await fetchJson(`${API_BASE}/type/${type}`)]),
  )

  return Object.fromEntries(entries)
}

function relationNames(relations, key) {
  return relations[key].map((entry) => entry.name)
}

export function getWeaknesses(typeNames, typeChart) {
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

  return Object.entries(multipliers)
    .filter(([, multiplier]) => multiplier > 1)
    .map(([type, multiplier]) => ({ type, multiplier }))
    .sort((a, b) => b.multiplier - a.multiplier || a.type.localeCompare(b.type))
}

export function formatName(value) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export async function fetchPokemon(displayName, typeChart) {
  try {
    const { pokemon } = await fetchPokemonResource(displayName)
    const types = pokemon.types
      .sort((a, b) => a.slot - b.slot)
      .map((entry) => entry.type.name)
    const abilities = await Promise.all(
      pokemon.abilities
        .sort((a, b) => a.slot - b.slot)
        .map((entry) =>
          fetchAbility(entry.ability).then((ability) => ({
            ...ability,
            isHidden: entry.is_hidden,
          })),
        ),
    )

    return {
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
      types,
      weaknesses: getWeaknesses(types, typeChart),
      status: 'ready',
    }
  } catch (error) {
    const candidates = error.candidates ?? buildCandidates(displayName)

    return {
      displayName,
      apiName: null,
      candidates,
      error: error?.message ?? 'Not found',
      isNewOrUnverifiedMega: NEW_OR_UNVERIFIED_MEGA_FORMS.has(displayName),
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

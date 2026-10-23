import { REGULATION_MC_ROSTER } from '../data/regulationMc.js'
import { POKEMON_IMAGES } from '../data/pokemonImages.js'
import { CHAMPIONS_TYPES } from './damage/championsData.js'
import { getTypeEffectiveness } from './damage/championsDamage.js'
import { CHAMPIONS_TEAM_LEARNSETS, CHAMPIONS_TEAM_MOVES } from '../data/championsTeamData.js'

const STAT_NAMES = { hp: 'hp', atk: 'attack', def: 'defense', spa: 'special-attack', spd: 'special-defense', spe: 'speed' }
const assetBase = import.meta.env?.BASE_URL ?? '/'
export const POKEMON_IMAGE_FALLBACK = `${assetBase}images/pokemon-placeholder.svg`

export function formatName(value) {
  return value.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

export function createPokemonDataset() {
  return REGULATION_MC_ROSTER.map((entry) => {
    const defenseProfile = Object.fromEntries(CHAMPIONS_TYPES.map((type) => [type, getTypeEffectiveness(type, entry.types)]))
    const relations = (predicate, order) => Object.entries(defenseProfile)
      .filter(([, multiplier]) => predicate(multiplier)).map(([type, multiplier]) => ({ type, multiplier }))
      .sort((a, b) => order * (a.multiplier - b.multiplier) || a.type.localeCompare(b.type))
    return {
      displayName: entry.displayName, showdownId: entry.showdownId, showdownName: entry.showdownName,
      apiName: entry.apiName, category: entry.category, id: entry.dexNumber,
      types: [...entry.types], stats: Object.entries(entry.baseStats).map(([name, value]) => ({ name: STAT_NAMES[name], value })),
      abilities: entry.abilities.map((ability) => ({ ...ability })),
      moves: (CHAMPIONS_TEAM_LEARNSETS[entry.showdownId] ?? []).map((id) => ({ id, name: CHAMPIONS_TEAM_MOVES[id].name })),
      image: POKEMON_IMAGES[entry.showdownId] ? `${assetBase}images/pokemon/${POKEMON_IMAGES[entry.showdownId].file}` : POKEMON_IMAGE_FALLBACK,
      defenseProfile, weaknesses: relations((value) => value > 1, -1), resistances: relations((value) => value < 1, 1),
      status: 'ready',
    }
  })
}

export const POKEMON_DATASET = createPokemonDataset()

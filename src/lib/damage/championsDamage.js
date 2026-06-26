import {
  CHAMPIONS_MOVES,
  CHAMPIONS_TYPE_CHART,
} from './championsData.js'
import {
  abilityBlocksMove,
  getAbilityAttackMods,
  getAbilityFinalMods,
  getAbilityStabMod,
} from './championsAbilities.js'
import {
  getItemAttackMods,
  getItemBasePowerMods,
  getItemDefenseMods,
  getItemFinalMods,
} from './championsItems.js'
import {
  calculateBaseDamage,
  calculateChampionsStats,
  calculateDamageRolls,
  chainMods,
  getModifiedStat,
  of32,
  pokeRound,
  toId,
} from './championsMath.js'

const DEFAULT_BOOSTS = {
  atk: 0,
  def: 0,
  hp: 0,
  spa: 0,
  spd: 0,
  spe: 0,
}

function normalizeTypes(types) {
  return types.map((type) => toId(type))
}

export function getTypeEffectiveness(moveType, defenderTypes, typeChart = CHAMPIONS_TYPE_CHART) {
  const attackingType = toId(moveType)

  return normalizeTypes(defenderTypes).reduce(
    (multiplier, defendingType) =>
      multiplier * (typeChart[attackingType]?.[defendingType] ?? 1),
    1,
  )
}

function getPokemonStats(pokemon) {
  if (pokemon.stats) return pokemon.stats

  return calculateChampionsStats({
    baseStats: pokemon.baseStats,
    nature: pokemon.nature,
    sps: pokemon.sps,
  })
}

function getBattleStats(pokemon, { ignoreNegative = false, ignorePositive = false } = {}) {
  const stats = getPokemonStats(pokemon)
  const boosts = { ...DEFAULT_BOOSTS, ...pokemon.boosts }

  return {
    ...stats,
    atk:
      ignoreNegative && boosts.atk < 0
        ? stats.atk
        : getModifiedStat(stats.atk, boosts.atk),
    def:
      ignorePositive && boosts.def > 0
        ? stats.def
        : getModifiedStat(stats.def, boosts.def),
    spa:
      ignoreNegative && boosts.spa < 0
        ? stats.spa
        : getModifiedStat(stats.spa, boosts.spa),
    spd:
      ignorePositive && boosts.spd > 0
        ? stats.spd
        : getModifiedStat(stats.spd, boosts.spd),
  }
}

function getMove(move) {
  if (typeof move !== 'string') {
    return {
      ...move,
      id: toId(move.name),
      type: toId(move.type),
      category: toId(move.category),
    }
  }

  const matchedMove = CHAMPIONS_MOVES[toId(move)]
  if (!matchedMove) {
    throw new Error(`Unsupported Champions move "${move}"`)
  }

  return {
    ...matchedMove,
    id: toId(matchedMove.name),
  }
}

function getWeatherBaseDamageMod(weather, moveType) {
  const normalizedWeather = toId(weather)

  if (normalizedWeather === 'sun' || normalizedWeather === 'harsh-sunshine') {
    if (moveType === 'fire') return 6144
    if (moveType === 'water') return 2048
  }

  if (normalizedWeather === 'rain' || normalizedWeather === 'heavy-rain') {
    if (moveType === 'water') return 6144
    if (moveType === 'fire') return 2048
  }

  return 4096
}

function getScreenFinalMods({ field, isCritical, move }) {
  if (isCritical) return []

  const defenderSide = field.defenderSide ?? {}
  const isPhysical = move.category === 'physical'
  const gameType = field.gameType ?? 'Singles'
  const screenMod = gameType === 'Singles' ? 2048 : 2732

  if (defenderSide.isAuroraVeil) return [screenMod]
  if (isPhysical && defenderSide.isReflect) return [screenMod]
  if (!isPhysical && defenderSide.isLightScreen) return [screenMod]

  return []
}

function getStabMod(attacker, move) {
  const baseStabMod = normalizeTypes(attacker.types).includes(move.type) ? 6144 : 4096

  return getAbilityStabMod({ attacker, move, stabMod: baseStabMod })
}

export function calculateChampionsDamage({
  attacker,
  defender,
  field = {},
  move,
  typeChart = CHAMPIONS_TYPE_CHART,
}) {
  const resolvedMove = getMove(move)

  if (resolvedMove.category === 'status' || resolvedMove.basePower === 0) {
    return {
      damage: Array(16).fill(0),
      max: 0,
      min: 0,
      move: resolvedMove,
    }
  }

  const isCritical = Boolean(field.isCritical || resolvedMove.isCrit)
  const attackerStats = getBattleStats(attacker, { ignoreNegative: isCritical })
  const defenderStats = getBattleStats(defender, { ignorePositive: isCritical })
  const isPhysical = resolvedMove.category === 'physical'
  let attack = isPhysical ? attackerStats.atk : attackerStats.spa
  let defense = isPhysical ? defenderStats.def : defenderStats.spd
  const effectiveness = getTypeEffectiveness(resolvedMove.type, defender.types, typeChart)

  if (effectiveness === 0 || abilityBlocksMove({ defender, field, move: resolvedMove })) {
    return {
      damage: Array(16).fill(0),
      effectiveness,
      max: 0,
      min: 0,
      move: resolvedMove,
    }
  }

  const attackMod = chainMods(
    [
      ...getAbilityAttackMods({ attacker, defender, move: resolvedMove }),
      ...getItemAttackMods({ attacker, move: resolvedMove }),
    ],
    410,
    131072,
  )
  const defenseMod = chainMods(
    getItemDefenseMods({ defender, move: resolvedMove }),
    410,
    131072,
  )
  const basePowerMod = chainMods(
    getItemBasePowerMods({ attacker, move: resolvedMove }),
    41,
    2097152,
  )
  const basePower = Math.max(
    1,
    pokeRound((resolvedMove.basePower * basePowerMod) / 4096),
  )

  attack = Math.max(1, pokeRound((attack * attackMod) / 4096))
  defense = Math.max(1, pokeRound((defense * defenseMod) / 4096))

  let baseDamage = calculateBaseDamage({
    attack,
    basePower,
    defense,
    level: attacker.level ?? 50,
  })

  const weatherMod = getWeatherBaseDamageMod(field.weather, resolvedMove.type)
  if (weatherMod !== 4096) {
    baseDamage = pokeRound(of32(baseDamage * weatherMod) / 4096)
  }
  if (isCritical) {
    baseDamage = Math.floor(of32(baseDamage * 1.5))
  }

  const finalMod = chainMods(
    [
      ...getScreenFinalMods({ field, isCritical, move: resolvedMove }),
      ...getAbilityFinalMods({ defender, effectiveness }),
      ...getItemFinalMods({ attacker, effectiveness }),
    ],
    41,
    131072,
  )
  const burn =
    attacker.status === 'brn' &&
    resolvedMove.category === 'physical' &&
    resolvedMove.name !== 'Facade'
  const damage = calculateDamageRolls({
    baseDamage,
    burn,
    effectiveness,
    finalMod,
    stabMod: getStabMod(attacker, resolvedMove),
  })

  return {
    attack,
    baseDamage,
    basePower,
    damage,
    defense,
    effectiveness,
    finalMod,
    max: Math.max(...damage),
    min: Math.min(...damage),
    move: resolvedMove,
  }
}

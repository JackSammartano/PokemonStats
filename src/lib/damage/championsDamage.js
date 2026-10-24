import {
  CHAMPIONS_MOVES,
  CHAMPIONS_TYPE_CHART,
} from './championsData.js'
import {
  abilityBlocksMove,
  getAbility,
  getAbilityAttackMods,
  getAbilityBasePowerMods,
  getAbilityDefenseMods,
  getAbilityFinalMods,
  getAbilityStabMod,
  resolveAbilityWeather,
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
import { REGULATION_ABILITY_MECHANICS, REGULATION_MOVES } from '../regulation.js'
import { isGrounded, isMatchingMegaStone, prepareChampionsMove } from './championsMoveEffects.js'
import { prepareChampionsBattle, transformAbilityMove } from './championsBattle.js'
import { getMoveConditions } from './championsMoveConditions.js'
import { runDamageSequence } from './championsMultiHit.js'

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

function getBattleStat(pokemon, stat, { ignoreNegative = false, ignorePositive = false } = {}) {
  const stats = getPokemonStats(pokemon)
  const boosts = { ...DEFAULT_BOOSTS, ...pokemon.boosts }

  if ((ignoreNegative && boosts[stat] < 0) || (ignorePositive && boosts[stat] > 0)) return stats[stat]
  return getModifiedStat(stats[stat], boosts[stat])
}

function getMove(move) {
  if (typeof move !== 'string') {
    return {
      ...REGULATION_MOVES[toId(move.name)],
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
    ...REGULATION_MOVES[toId(matchedMove.name)],
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

function isSpreadMove(field, move) {
  return (
    (field.gameType ?? 'Singles') !== 'Singles' &&
    ['allAdjacent', 'allAdjacentFoes'].includes(move.target)
  )
}

function getScreenFinalMods({ field, isCritical, move }) {
  if (isCritical || move.breaksScreens || move.infiltrates) return []

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

function moveEffectiveness(move, attacker, defender, field, typeChart) {
  let effectiveness = normalizeTypes(defender.types).reduce((product, type) => {
    if (move.id === 'freeze-dry' && type === 'water') return product * 2
    if (type === 'ghost' && ['normal', 'fighting'].includes(move.type) && move.scrappy) return product
    if (type === 'flying' && move.type === 'ground' && (field.isGravity || toId(defender.item) === 'iron-ball')) return product
    return product * (typeChart[move.type]?.[type] ?? 1)
  }, 1)
  if (move.id === 'flying-press') effectiveness *= getTypeEffectiveness('flying', defender.types, typeChart)
  return effectiveness
}

export function calculateChampionsDamage(input) {
  const { typeChart = CHAMPIONS_TYPE_CHART } = input
  const normalize = (pokemon) => ({ ...pokemon, ability: toId(pokemon.ability), item: toId(pokemon.item), types: normalizeTypes(pokemon.types), stats: getPokemonStats(pokemon) })
  const battle = prepareChampionsBattle(normalize(input.attacker), normalize(input.defender), input.field ?? {}, getMove(input.move))
  let { attacker, defender } = battle
  const { field } = battle
  const rawMove = transformAbilityMove(getMove(input.move), attacker)
  const effectiveDefender = (a, d) => toId(a.ability) === 'mold-breaker' && d.item !== 'ability-shield' && (REGULATION_ABILITY_MECHANICS[toId(d.ability)]?.breakable ?? getAbility(d.ability).breakable) ? { ...d, ability: '' } : d
  const move = prepareChampionsMove(rawMove, attacker, effectiveDefender(attacker, defender), { ...field, weather: toId(attacker.ability) === 'mega-sol' ? 'Sun' : field.weather })
  if (toId(attacker.ability) === 'infiltrator') move.infiltrates = true
  if (['protean', 'libero'].includes(toId(attacker.ability)) && attacker.typeChangeAvailable !== false && !move.flags?.futuremove) attacker = { ...attacker, types: [move.type] }
  if (attacker.item === 'normal-gem' && move.type === 'normal' && move.category !== 'status') attacker = { ...attacker, item: '', heldItem: '', gemActive: true, unburdenActive: toId(attacker.ability) === 'unburden' }
  if (move.chargeBoost) {
    const boost = (attacker.boosts?.spa ?? 0) + (toId(attacker.ability) === 'contrary' ? -1 : 1)
    attacker = { ...attacker, boosts: { ...attacker.boosts, spa: Math.max(-6, Math.min(6, boost)) } }
  }
  const conditions = getMoveConditions(move)
  let hits = move.hitPowers?.length ?? (move.multihit ? conditions.hits : 1)
  if (toId(attacker.ability) === 'skill-link' && (Array.isArray(move.multihit) || move.multiaccuracy)) hits = Array.isArray(move.multihit) ? move.multihit[1] : move.multihit
  if (move.id === 'dragon-darts' && conditions.splitDarts && field.gameType === 'Doubles') hits = 1
  const parental = move.category !== 'status' && toId(attacker.ability) === 'parental-bond' && !move.multihit && !move.hitPowers && !isSpreadMove(field, move) && !move.flags?.noparentalbond && !move.flags?.charge && !move.flags?.futuremove
  if (parental) hits = 2
  const locked = { ...rawMove, type: move.type, category: move.category, target: move.target, priority: move.priority, flags: move.flags, scrappy: rawMove.scrappy, ateAbility: rawMove.ateAbility, sequenceLocked: true,
    ...( ['weather-ball', 'terrain-pulse'].includes(move.id) ? { basePower: move.basePower } : {}) }
  const evaluate = (a, d, f, index) => {
    const activeDefender = effectiveDefender(a, d)
    const hitMove = index === 0 ? { ...move } : prepareChampionsMove(locked, a, activeDefender, { ...f, weather: toId(a.ability) === 'mega-sol' ? 'Sun' : f.weather })
    if (move.hitPowers) hitMove.basePower = move.hitPowers[index]
    if (move.id === 'triple-axel') hitMove.basePower = 20 * (index + 1)
    hitMove.parentalChild = parental && index === 1
    hitMove.protectedItem = isMatchingMegaStone(d)
    if (f.defenderSide?.isProtected && hitMove.flags?.protect && !hitMove.breaksProtect) {
      if (hitMove.flags.contact && ['unseen-fist', 'piercing-drill'].includes(toId(a.ability))) hitMove.protectQuarter = true
      else { hitMove.fixedDamage = 0; hitMove.failureReason = 'Il bersaglio è protetto.' }
    }
    let result
    if (hitMove.fixedDamage !== undefined) {
      const effectiveness = moveEffectiveness(hitMove, a, activeDefender, f, typeChart)
      const blocked = !effectiveness || abilityBlocksMove({ attacker: a, defender: activeDefender, field: f, move: hitMove })
      const amount = blocked ? 0 : hitMove.fixedDamage
      result = { move: hitMove, effectiveness, damage: Array(16).fill(amount), min: amount, max: amount, failureReason: hitMove.failureReason, accuracyDependentKO: hitMove.accuracyDependentKO }
    } else result = calculateSingleChampionsDamage({ field: f, attacker: a, defender: activeDefender, move: hitMove, typeChart })
    result.abilityIgnored = activeDefender !== d
    return result
  }
  const sequence = hits > 1 || ['sturdy', 'disguise', 'cheek-pouch'].includes(toId(defender.ability)) || ['focus-sash', 'focus-band'].includes(defender.item)
  let result = sequence ? runDamageSequence({ attacker, defender, field, move, hits, evaluate }) : evaluate(attacker, defender, field, 0)
  if (!sequence && move.noFaint) {
    const damage = result.damage.map((amount) => Math.min(amount, Math.max(0, (defender.currentHp ?? defender.stats.hp) - 1)))
    result = { ...result, damage, min: Math.min(...damage), max: Math.max(...damage) }
  }
  const defenderHp = defender.currentHp ?? defender.stats.hp
  return { ...result, guaranteedKO: result.guaranteedKO ?? result.min >= defenderHp, guaranteedSurvival: result.guaranteedSurvival ?? result.max < defenderHp, effectiveAttacker: attacker, effectiveDefender: defender, field }
}

function calculateSingleChampionsDamage({
  attacker,
  defender,
  field = {},
  move,
  typeChart = CHAMPIONS_TYPE_CHART,
}) {
  let resolvedMove = getMove(move)
  if (toId(attacker.ability) === 'long-reach') {
    resolvedMove = { ...resolvedMove, flags: { ...resolvedMove.flags, contact: 0 } }
  }
  if (toId(attacker.ability) === 'mold-breaker' && toId(defender.item) !== 'ability-shield' && (REGULATION_ABILITY_MECHANICS?.[toId(defender.ability)]?.breakable ?? getAbility(defender.ability).breakable)) {
    defender = { ...defender, ability: '' }
  }
  const weatherResolution = field.weatherResolved ? { weather: field.weather } : resolveAbilityWeather({
    attackerAbility: attacker.ability,
    defenderAbility: defender.ability,
    selectedWeather: field.weather,
  })
  if (weatherResolution.requiresChoice) throw new Error('Conflicting weather abilities require an explicit effective weather')
  const effectiveWeather = weatherResolution.weather

  if (resolvedMove.category === 'status' || resolvedMove.basePower === 0) {
    return {
      damage: Array(16).fill(0),
      max: 0,
      min: 0,
      move: resolvedMove,
    }
  }

  attacker = { ...attacker, stats: getPokemonStats(attacker) }
  defender = { ...defender, stats: getPokemonStats(defender) }

  const isCritical = !['battle-armor', 'shell-armor'].includes(toId(defender.ability)) && Boolean(field.isCritical || resolvedMove.isCrit || (toId(attacker.ability) === 'merciless' && ['psn', 'tox'].includes(defender.status)))
  const isPhysical = resolvedMove.category === 'physical'
  const attackStat = resolvedMove.id === 'body-press' && field.isWonderRoom ? 'spd' : resolvedMove.overrideOffensiveStat ?? (isPhysical ? 'atk' : 'spa')
  const defenseStat = resolvedMove.overrideDefensiveStat ?? (isPhysical ? 'def' : 'spd')
  const attackSource = resolvedMove.overrideOffensivePokemon === 'target' ? defender : attacker
  let attack = toId(defender.ability) === 'unaware' && ['atk', 'def', 'spa'].includes(attackStat) ? attackSource.stats[attackStat] : getBattleStat(attackSource, attackStat, { ignoreNegative: isCritical })
  let defense = resolvedMove.ignoreDefensive || toId(attacker.ability) === 'unaware' ? defender.stats[defenseStat] : getBattleStat(defender, defenseStat, { ignorePositive: isCritical })
  if (toId(attacker.ability) === 'hustle' && isPhysical) attack = pokeRound(attack * 1.5)
  if (toId(attacker.ability) !== 'mega-sol' && ((effectiveWeather === 'Sand' && normalizeTypes(defender.types).includes('rock') && defenseStat === 'spd')
    || (effectiveWeather === 'Snow' && normalizeTypes(defender.types).includes('ice') && defenseStat === 'def'))) defense = pokeRound(defense * 1.5)
  const effectiveness = moveEffectiveness(resolvedMove, attacker, defender, field, typeChart)

  if (effectiveness === 0 || abilityBlocksMove({ attacker, defender, field, move: resolvedMove })) {
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
      ...getAbilityAttackMods({ attacker, defender, move: resolvedMove, weather: effectiveWeather, field }),
      ...getItemAttackMods({ attacker, move: resolvedMove }),
    ],
    410,
    131072,
  )
  const defenseMod = chainMods(
    [...getAbilityDefenseMods({ defender, move: resolvedMove, field }), ...getItemDefenseMods({ defender, move: resolvedMove })],
    410,
    131072,
  )
  const basePowerMod = chainMods(
    [
      ...(['solar-beam', 'solar-blade'].includes(resolvedMove.id) && toId(attacker.ability) !== 'mega-sol' && ['Rain', 'Sand', 'Snow'].includes(effectiveWeather) ? [2048] : []),
      ...(resolvedMove.powerMods ?? []),
      ...(attacker.charged && resolvedMove.type === 'electric' ? [8192] : []),
      ...(field.terrain && isGrounded(attacker, field) && ({ Electric: 'electric', Grassy: 'grass', Psychic: 'psychic' })[field.terrain] === resolvedMove.type ? [5325] : []),
      ...(isGrounded(defender, field) && ((field.terrain === 'Misty' && resolvedMove.type === 'dragon') || (field.terrain === 'Grassy' && ['earthquake', 'bulldoze'].includes(resolvedMove.id))) ? [2048] : []),
      ...(field.attackerSide?.isHelpingHand ? [6144] : []),
      ...getAbilityBasePowerMods({ attacker, defender, move: resolvedMove, weather: effectiveWeather, field }),
      ...getItemBasePowerMods({ attacker, move: resolvedMove }),
    ],
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

  if (isSpreadMove(field, resolvedMove)) {
    baseDamage = pokeRound(of32(baseDamage * 3072) / 4096)
  }
  if (resolvedMove.parentalChild) baseDamage = pokeRound(of32(baseDamage * 1024) / 4096)

  const weatherMod = getWeatherBaseDamageMod(toId(attacker.ability) === 'mega-sol' ? 'Sun' : effectiveWeather, resolvedMove.type)
  if (weatherMod !== 4096) {
    baseDamage = pokeRound(of32(baseDamage * weatherMod) / 4096)
  }
  if (isCritical) {
    baseDamage = Math.floor(of32(baseDamage * 1.5))
  }

  const finalMod = chainMods(
    [
      ...getScreenFinalMods({ field, isCritical, move: resolvedMove }),
      ...getAbilityFinalMods({ attacker, defender, effectiveness, move: resolvedMove, isCritical }),
      ...(field.defenderSide?.isFriendGuard && toId(attacker.ability) !== 'mold-breaker' ? [3072] : []),
      ...getItemFinalMods({ attacker, defender, effectiveness, move: resolvedMove }),
    ],
    41,
    131072,
  )
  const burn =
    attacker.status === 'brn' &&
    !['guts', 'water-bubble'].includes(toId(attacker.ability)) &&
    resolvedMove.category === 'physical' &&
    resolvedMove.name !== 'Facade'
  const damage = calculateDamageRolls({
    baseDamage,
    burn,
    effectiveness,
    isCritical,
    finalMod,
    protect: Boolean(resolvedMove.protectQuarter),
    stabMod: getStabMod(attacker, resolvedMove),
  })

  return {
    attack,
    isCritical,
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

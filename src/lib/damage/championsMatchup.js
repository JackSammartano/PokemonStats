import { CHAMPIONS_MOVES } from './championsData.js'
import { calculateChampionsDamage } from './championsDamage.js'
import { calculateChampionsStats, toId } from './championsMath.js'
import { resolveAbilityWeather } from './championsAbilities.js'
import { getTeamMove } from '../teamData.js'
import { getBattleAbilityCoverageNotes } from './championsCoverage.js'
import { getEffectiveAbility } from './championsBattle.js'
import { createBattleConditions, getBattleConditions } from './championsBattleConditions.js'
import { getItemCoverageNote } from './championsItems.js'

const STAT_ALIASES = { hp: 'hp', attack: 'atk', defense: 'def', 'special-attack': 'spa', 'special-defense': 'spd', speed: 'spe' }

export function createDamageBuild() {
  return {
    ...createBattleConditions(),
    level: 50, gender: '',
    currentHp: null, abilityOn: false, status: '',
    moveConditions: {},
    ability: '', item: '', nature: 'serious', burned: false, reflect: false, lightScreen: false,
    sps: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  }
}

export function getBaseStats(pokemon) {
  return Object.fromEntries(pokemon.stats.map((stat) => [STAT_ALIASES[stat.name], stat.value]))
}

export function getBuildStats(pokemon, build) {
  return pokemon ? calculateChampionsStats({ baseStats: getBaseStats(pokemon), nature: build.nature, sps: build.sps }) : null
}

function toDamagePokemon(pokemon, build) {
  const stats = getBuildStats(pokemon, build)
  return {
    ...getBattleConditions(build),
    types: pokemon.types, level: 50, stats,
    baseStats: getBaseStats(pokemon), nature: build.nature, sps: build.sps, gender: build.gender,
    name: pokemon.showdownName ?? pokemon.displayName, showdownId: pokemon.showdownId,
    weightkg: build.weightkg ?? pokemon.weightkg,
    currentHp: build.currentHp == null ? stats.hp : Math.max(1, Math.min(stats.hp, build.currentHp)),
    abilityOn: build.abilityOn,
    ability: build.ability, item: build.item, boosts: { ...build.boosts, accuracy: build.accuracyBoost ?? 0, evasion: build.evasionBoost ?? 0 },
    status: build.status || (build.burned ? 'brn' : ''),
  }
}

export function calculateMoveRows(attacker, defender, attackingBuild, defendingBuild, moveIds, field) {
  let battlePokemon
  return moveIds.map((moveId, slot) => {
    const move = CHAMPIONS_MOVES[moveId] ? { ...CHAMPIONS_MOVES[moveId], ...getTeamMove(moveId), conditions: attackingBuild.moveConditions?.[moveId] ?? {} } : null
    if (!move) {
      const metadata = getTeamMove(moveId)
      return { slot, moveId, move: metadata, result: null, reason: metadata ? metadata.category === 'status' ? 'Mossa di stato · nessun danno diretto' : 'Formula del danno non ancora implementata' : '' }
    }
    if (!attacker || !defender) return { slot, moveId, move, result: null }
    const weather = resolveAbilityWeather({ attackerAbility: getEffectiveAbility(attackingBuild, defendingBuild, field), defenderAbility: getEffectiveAbility(defendingBuild, attackingBuild, field), selectedWeather: field.weather,
      attackerEntryActive: attackingBuild.entryAbilityActive !== false, defenderEntryActive: defendingBuild.entryAbilityActive !== false, weatherSuppressed: field.isCloudNine && field.gameType === 'Doubles' })
    if (weather.requiresChoice) return { slot, moveId, move, result: null, reason: 'Le abilità impostano meteo diversi: seleziona il meteo effettivo dopo l’ultimo ingresso.' }
    const unsupportedAbility = [...getBattleAbilityCoverageNotes(attackingBuild, defendingBuild, field), ...getBattleAbilityCoverageNotes(defendingBuild, attackingBuild, field), ...[attackingBuild, defendingBuild].map((build) => getItemCoverageNote(build.item, build.itemName))].filter(Boolean)
    if (unsupportedAbility.length) return { slot, moveId, move, result: null, reason: unsupportedAbility.join(' ') }
    if ((attackingBuild.level ?? 50) !== 50 || (defendingBuild.level ?? 50) !== 50) return { slot, moveId, move, result: null, reason: 'Il calcolo Champions supporta il livello 50; il livello importato è conservato.' }
    let result
    try {
      if (attackingBuild.isFainted || defendingBuild.isFainted) throw new RangeError('Seleziona due Pokémon non KO per il calcolo.')
      const battleSupports = (build) => ({ flowerVeil: build.flowerVeil && field.gameType === 'Doubles', sweetVeil: build.sweetVeil && field.gameType === 'Doubles' })
      battlePokemon ??= { attacker: { ...toDamagePokemon(attacker, attackingBuild), ...battleSupports(attackingBuild), partyAttack: field.attackerParty }, defender: { ...toDamagePokemon(defender, defendingBuild), ...battleSupports(defendingBuild), partyAttack: field.defenderParty } }
      result = calculateChampionsDamage({
      attacker: battlePokemon.attacker,
      defender: battlePokemon.defender,
      move,
      field: {
        ...field, gameType: field.gameType, weather: field.weather, isCritical: field.critical,
        attackerSide: { isHelpingHand: attackingBuild.helpingHand && field.gameType === 'Doubles', isSteelySpirit: attackingBuild.steelySpirit && field.gameType === 'Doubles' },
        defenderSide: { isReflect: defendingBuild.reflect, isLightScreen: defendingBuild.lightScreen, isAuroraVeil: defendingBuild.auroraVeil, isProtected: defendingBuild.isProtected, isFriendGuard: defendingBuild.friendGuard && field.gameType === 'Doubles', isPriorityGuard: defendingBuild.priorityGuard && field.gameType === 'Doubles' },
      },
    }) } catch (error) {
      if (!(error instanceof RangeError)) throw error
      return { slot, moveId, move, result: null, reason: error.message }
    }
    const defenderHp = battlePokemon.defender.stats.hp
    return { slot, moveId, move, result, defenderHp, currentDefenderHp: battlePokemon.defender.currentHp, minPercent: result.min / defenderHp * 100, maxPercent: result.max / defenderHp * 100 }
  })
}

export function createOptimizerContext(attacker, defender, attackingBuild, defendingBuild, move, field) {
  if (!attacker || !defender || !move || !CHAMPIONS_MOVES[toId(move.name)]) return null
  if (attackingBuild.isFainted || defendingBuild.isFainted) return null
  let attackConditions, defenseConditions
  try { attackConditions = getBattleConditions(attackingBuild); defenseConditions = getBattleConditions(defendingBuild) } catch (error) { if (error instanceof RangeError) return null; throw error }
  if (move.ohko) return null
  if (getBattleAbilityCoverageNotes(attackingBuild, defendingBuild, field).length || getBattleAbilityCoverageNotes(defendingBuild, attackingBuild, field).length || [attackingBuild, defendingBuild].some((build) => getItemCoverageNote(build.item, build.itemName))) return null
  if ([attackingBuild, defendingBuild].some((build) => (build.level ?? 50) !== 50)) return null
  const physical = move.category === 'physical'
  const offenseStat = move.overrideOffensiveStat ?? (physical ? 'atk' : 'spa')
  const defenseStat = move.overrideDefensiveStat ?? (physical ? 'def' : 'spd')
  const weatherResolution = resolveAbilityWeather({ attackerAbility: getEffectiveAbility(attackingBuild, defendingBuild, field), defenderAbility: getEffectiveAbility(defendingBuild, attackingBuild, field), selectedWeather: field.weather,
    attackerEntryActive: attackingBuild.entryAbilityActive !== false, defenderEntryActive: defendingBuild.entryAbilityActive !== false, weatherSuppressed: field.isCloudNine && field.gameType === 'Doubles' })
  if (weatherResolution.requiresChoice) return null
  return {
    attacker: {
      ...attackConditions, flowerVeil: attackConditions.flowerVeil && field.gameType === 'Doubles', sweetVeil: attackConditions.sweetVeil && field.gameType === 'Doubles', partyAttack: field.attackerParty, gender: attackingBuild.gender,
      ability: attackingBuild.ability, item: attackingBuild.item, nature: attackingBuild.nature,
      abilityOn: attackingBuild.abilityOn, currentHp: attackingBuild.currentHp, status: attackingBuild.status || (attackingBuild.burned ? 'brn' : ''), sps: { ...attackingBuild.sps },
      types: attacker.types, baseStats: getBaseStats(attacker),
      name: attacker.showdownName ?? attacker.displayName, showdownId: attacker.showdownId, weightkg: attackingBuild.weightkg ?? attacker.weightkg,
      offenseSp: attackingBuild.sps[offenseStat], boost: attackingBuild.boosts[offenseStat],
    },
    defender: {
      ...defenseConditions, flowerVeil: defenseConditions.flowerVeil && field.gameType === 'Doubles', sweetVeil: defenseConditions.sweetVeil && field.gameType === 'Doubles', partyAttack: field.defenderParty, gender: defendingBuild.gender,
      ability: defendingBuild.ability, item: defendingBuild.item, nature: defendingBuild.nature,
      abilityOn: defendingBuild.abilityOn, currentHp: defendingBuild.currentHp, sps: { ...defendingBuild.sps },
      types: defender.types, baseStats: getBaseStats(defender),
      name: defender.showdownName ?? defender.displayName, showdownId: defender.showdownId, weightkg: defendingBuild.weightkg ?? defender.weightkg, status: defendingBuild.status || (defendingBuild.burned ? 'brn' : ''),
      hp: Math.min(defendingBuild.currentHp ?? Infinity, getBuildStats(defender, defendingBuild).hp), hpSp: defendingBuild.sps.hp,
      defenseSp: defendingBuild.sps[defenseStat], boost: defendingBuild.boosts[defenseStat],
    },
    move, field: { ...field, gameType: field.gameType, weather: field.weather, screen: defendingBuild.auroraVeil ? 'Aurora Veil' : physical ? defendingBuild.reflect ? 'Reflect' : '' : defendingBuild.lightScreen ? 'Light Screen' : '',
      attackerSide: { isHelpingHand: attackingBuild.helpingHand && field.gameType === 'Doubles', isSteelySpirit: attackingBuild.steelySpirit && field.gameType === 'Doubles' },
      defenderSide: { isReflect: defendingBuild.reflect, isLightScreen: defendingBuild.lightScreen, isAuroraVeil: defendingBuild.auroraVeil, isProtected: defendingBuild.isProtected, isFriendGuard: defendingBuild.friendGuard && field.gameType === 'Doubles', isPriorityGuard: defendingBuild.priorityGuard && field.gameType === 'Doubles' },
    },
  }
}

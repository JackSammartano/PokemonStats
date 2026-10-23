import { CHAMPIONS_MOVES } from './championsData.js'
import { calculateChampionsDamage } from './championsDamage.js'
import { calculateChampionsStats, toId } from './championsMath.js'
import { resolveAbilityWeather } from './championsAbilities.js'
import { getTeamMove } from '../teamData.js'

const STAT_ALIASES = { hp: 'hp', attack: 'atk', defense: 'def', 'special-attack': 'spa', 'special-defense': 'spd', speed: 'spe' }

export function createDamageBuild() {
  return {
    level: 50, nickname: '', gender: '',
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
  return {
    types: pokemon.types, level: 50, stats: getBuildStats(pokemon, build),
    ability: build.ability, item: build.item, boosts: build.boosts,
    status: build.burned ? 'brn' : '',
  }
}

export function calculateMoveRows(attacker, defender, attackingBuild, defendingBuild, moveIds, field) {
  return moveIds.map((moveId, slot) => {
    const move = CHAMPIONS_MOVES[moveId]
    if (!move) {
      const metadata = getTeamMove(moveId)
      return { slot, moveId, move: metadata, result: null, reason: metadata ? metadata.category === 'status' ? 'Mossa di stato · nessun danno diretto' : 'Formula del danno non ancora implementata' : '' }
    }
    if (!attacker || !defender) return { slot, moveId, move, result: null }
    if ((attackingBuild.level ?? 50) !== 50 || (defendingBuild.level ?? 50) !== 50) return { slot, moveId, move, result: null, reason: 'Il calcolo Champions supporta il livello 50; il livello importato è conservato.' }
    const result = calculateChampionsDamage({
      attacker: toDamagePokemon(attacker, attackingBuild),
      defender: toDamagePokemon(defender, defendingBuild),
      move,
      field: {
        gameType: field.gameType, weather: field.weather, isCritical: field.critical,
        defenderSide: { isReflect: defendingBuild.reflect, isLightScreen: defendingBuild.lightScreen },
      },
    })
    const defenderHp = getBuildStats(defender, defendingBuild).hp
    return { slot, moveId, move, result, defenderHp, minPercent: result.min / defenderHp * 100, maxPercent: result.max / defenderHp * 100 }
  })
}

export function createOptimizerContext(attacker, defender, attackingBuild, defendingBuild, move, field) {
  if (!attacker || !defender || !move || !CHAMPIONS_MOVES[toId(move.name)]) return null
  if ([attackingBuild, defendingBuild].some((build) => (build.level ?? 50) !== 50)) return null
  const physical = move.category === 'physical'
  const weather = resolveAbilityWeather({ attackerAbility: attackingBuild.ability, defenderAbility: defendingBuild.ability, selectedWeather: field.weather }).weather
  return {
    attacker: {
      ability: attackingBuild.ability, item: attackingBuild.item, nature: attackingBuild.nature,
      types: attacker.types, baseStats: getBaseStats(attacker),
      offenseSp: attackingBuild.sps[physical ? 'atk' : 'spa'], boost: attackingBuild.boosts[physical ? 'atk' : 'spa'],
    },
    defender: {
      ability: defendingBuild.ability, item: defendingBuild.item, nature: defendingBuild.nature,
      types: defender.types, baseStats: getBaseStats(defender),
      hp: getBuildStats(defender, defendingBuild).hp, hpSp: defendingBuild.sps.hp,
      defenseSp: defendingBuild.sps[physical ? 'def' : 'spd'], boost: defendingBuild.boosts[physical ? 'def' : 'spd'],
    },
    move, field: { gameType: field.gameType, weather },
  }
}

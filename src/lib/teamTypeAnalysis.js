import { CHAMPIONS_TYPES } from './damage/championsData.js'
import { getTypeEffectiveness } from './damage/championsDamage.js'
import { getPokemonMoveSlots } from './damage/championsMoveSets.js'
import { getTeamMove } from './teamData.js'

export function analyzeTeamTypes(team) {
  return CHAMPIONS_TYPES.map((type) => {
    const members = team.map((pokemon) => ({ name: pokemon.displayName, multiplier: getTypeEffectiveness(type, pokemon.types) }))
    return {
      type, members,
      weak: members.filter((member) => member.multiplier > 1),
      resistant: members.filter((member) => member.multiplier > 0 && member.multiplier < 1),
      immune: members.filter((member) => member.multiplier === 0),
      count: team.filter((pokemon) => pokemon.types.includes(type)).length,
    }
  })
}

export function analyzeOffensiveCoverage(team, opponents, side, moveSets) {
  const moves = team.flatMap((pokemon) => getPokemonMoveSlots(moveSets, side, pokemon).map(getTeamMove))
    .filter((move) => move && move.category !== 'status')
  return opponents.map((pokemon) => {
    const best = moves.length ? Math.max(...moves.map((move) => getTypeEffectiveness(move.type, pokemon.types))) : null
    return { name: pokemon.displayName, best }
  })
}

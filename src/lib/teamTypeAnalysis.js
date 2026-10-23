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
  const moves = team.flatMap((pokemon) => getPokemonMoveSlots(moveSets, side, pokemon).flatMap((id, slot) => {
    const move = getTeamMove(id)
    return move && move.category !== 'status' ? [{ attacker: pokemon.displayName, moveId: id, moveName: move.name, type: move.type, slot }] : []
  }))
  return opponents.map((pokemon) => {
    const options = moves.map((move) => ({ ...move, multiplier: getTypeEffectiveness(move.type, pokemon.types) }))
      .sort((a, b) => b.multiplier - a.multiplier)
    return { name: pokemon.displayName, best: options[0]?.multiplier ?? null, options }
  })
}

export function groupCoverageByAttacker(options, attackers) {
  const grouped = new Map()
  for (const option of options) {
    if (!grouped.has(option.attacker)) grouped.set(option.attacker, [])
    grouped.get(option.attacker).push(option)
  }
  return attackers.map((pokemon) => ({ name: pokemon.displayName, options: grouped.get(pokemon.displayName) ?? [] }))
}

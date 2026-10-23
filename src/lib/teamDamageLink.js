import { getPokemonMoveSlots } from './damage/championsMoveSets.js'

export function resolveTeamMatchup(team, roster, draft, moveSets = {}) {
  const attacker = team.find((entry) => entry.displayName === draft.attackerName) ?? team[0] ?? null
  const defender = roster.find((entry) => entry.displayName === draft.defenderName)
    ?? roster.find((entry) => entry.displayName !== attacker?.displayName) ?? roster[0] ?? null
  const attackerMoves = getPokemonMoveSlots(moveSets, 'attacker', attacker)
  const defenderMoves = getPokemonMoveSlots(moveSets, 'defender', defender)
  return { attacker, defender, attackerMoves, defenderMoves, canCalculate: Boolean(attacker && defender && (attackerMoves.some(Boolean) || defenderMoves.some(Boolean))) }
}

import { getDamageMoveOptions } from './damage/championsOptions.js'

export function resolveTeamMatchup(team, roster, draft) {
  const attacker = team.find((entry) => entry.displayName === draft.attackerName) ?? team[0] ?? null
  const defender = roster.find((entry) => entry.displayName === draft.defenderName)
    ?? roster.find((entry) => entry.displayName !== attacker?.displayName) ?? roster[0] ?? null
  const moveOptions = getDamageMoveOptions(attacker)
  const move = moveOptions.options.find((option) => option.value === draft.moveName) ?? moveOptions.options[0] ?? null
  return { attacker, defender, move, moveOptions, canCalculate: Boolean(attacker && defender && move?.value) }
}

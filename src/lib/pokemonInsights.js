import { analyzeOffensiveCoverage, groupCoverageByAttacker } from './teamTypeAnalysis.js'

export function getPokemonCoverage(pokemon, side, ownTeam, opposingTeam, moveSets) {
  const otherSide = side === 'attacker' ? 'defender' : 'attacker'
  const opponents = side === 'attacker' ? opposingTeam : ownTeam
  const outgoing = analyzeOffensiveCoverage([pokemon], opponents, side, moveSets)
  const incoming = analyzeOffensiveCoverage(opponents, [pokemon], otherSide, moveSets)[0]?.options ?? []
  return {
    outgoing,
    incoming: groupCoverageByAttacker(incoming, opponents),
  }
}

export function derivePokemonInsights({ outgoing, incoming }) {
  const evaluated = incoming.filter((row) => row.options.length > 0).map((row) => ({
    name: row.name, worst: Math.max(...row.options.map((option) => option.multiplier)),
  }))
  const moves = new Map()
  for (const row of outgoing) {
    for (const option of row.options) {
      if (!moves.has(option.moveId)) moves.set(option.moveId, { name: option.moveName, targets: [] })
      if (option.multiplier > 1) moves.get(option.moveId).targets.push(row.name)
    }
  }
  const mostTargets = Math.max(0, ...[...moves.values()].map((move) => move.targets.length))
  return {
    threats: evaluated.filter((row) => row.worst > 1).sort((a, b) => b.worst - a.worst),
    resisted: evaluated.filter((row) => row.worst < 1).map((row) => row.name),
    unknown: incoming.filter((row) => !row.options.length).map((row) => row.name),
    evaluated: evaluated.length,
    covered: outgoing.filter((row) => row.best > 1).map((row) => row.name),
    gaps: outgoing.filter((row) => row.best !== null && row.best <= 1).map((row) => row.name),
    hasAttacks: moves.size > 0,
    bestMoves: mostTargets ? [...moves.values()].filter((move) => move.targets.length === mostTargets) : [],
  }
}


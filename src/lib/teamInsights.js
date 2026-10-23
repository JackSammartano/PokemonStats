import { analyzeOffensiveCoverage, groupCoverageByAttacker } from './teamTypeAnalysis.js'

function compareExposure(a, b) {
  return a.threats - b.threats || a.quadruple - b.quadruple || a.worst - b.worst || b.resisted - a.resisted
}

function summarizeTeamInsights(team, opponents, incoming, outgoing) {
  const exposure = incoming.map((row) => {
    const sourceMax = groupCoverageByAttacker(row.options, opponents)
      .filter((source) => source.options.length)
      .map((source) => Math.max(...source.options.map((option) => option.multiplier)))
    return { name: row.name, threats: sourceMax.filter((value) => value > 1).length,
      quadruple: sourceMax.filter((value) => value >= 4).length,
      worst: sourceMax.length ? Math.max(...sourceMax) : null,
      resisted: sourceMax.filter((value) => value < 1).length, evaluated: sourceMax.length }
  })
  const ranked = exposure.filter((row) => row.evaluated > 0).sort(compareExposure)
  const providers = team.map((pokemon) => ({ name: pokemon.displayName,
    covered: outgoing.filter((row) => row.options.some((option) => option.attacker === pokemon.displayName && option.multiplier > 1)).length }))
  const maxCovered = Math.max(0, ...providers.map((row) => row.covered))
  const most = ranked.at(-1)
  const least = ranked[0]
  return {
    mostExposed: most ? ranked.filter((row) => compareExposure(row, most) === 0) : [],
    leastExposed: least ? ranked.filter((row) => compareExposure(row, least) === 0) : [],
    sameExposure: ranked.length > 0 && compareExposure(most, least) === 0,
    gaps: outgoing.filter((row) => row.best !== null && row.best <= 1).map((row) => row.name),
    hasAttacks: outgoing.some((row) => row.best !== null),
    versatile: maxCovered > 0 ? providers.filter((row) => row.covered === maxCovered) : [],
    evaluatedOpponents: most?.evaluated ?? 0,
  }
}

export function deriveTeamInsights(team, opponents, side, moveSets) {
  const otherSide = side === 'attacker' ? 'defender' : 'attacker'
  return summarizeTeamInsights(team, opponents,
    analyzeOffensiveCoverage(opponents, team, otherSide, moveSets),
    analyzeOffensiveCoverage(team, opponents, side, moveSets))
}

export function deriveTeamMatchupInsights(team, opponents, moveSets) {
  const outgoing = analyzeOffensiveCoverage(team, opponents, 'attacker', moveSets)
  const incoming = analyzeOffensiveCoverage(opponents, team, 'defender', moveSets)
  return {
    attacker: summarizeTeamInsights(team, opponents, incoming, outgoing),
    defender: summarizeTeamInsights(opponents, team, outgoing, incoming),
  }
}

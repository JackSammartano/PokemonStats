import { analyzeOffensiveCoverage } from './teamTypeAnalysis.js'

export function getPokemonCoverage(pokemon, side, ownTeam, opposingTeam, moveSets) {
  const otherSide = side === 'attacker' ? 'defender' : 'attacker'
  const opponents = side === 'attacker' ? opposingTeam : ownTeam
  const outgoing = analyzeOffensiveCoverage([pokemon], opponents, side, moveSets)
  const incoming = analyzeOffensiveCoverage(opponents, [pokemon], otherSide, moveSets)[0]?.options ?? []
  return {
    outgoing,
    incoming: opponents.map((opponent) => ({ name: opponent.displayName, options: incoming.filter((option) => option.attacker === opponent.displayName) })),
  }
}

function compareExposure(a, b) {
  return a.threats - b.threats || a.quadruple - b.quadruple || a.worst - b.worst || b.resisted - a.resisted
}

export function deriveTeamInsights(team, opponents, side, moveSets) {
  const otherSide = side === 'attacker' ? 'defender' : 'attacker'
  const incoming = analyzeOffensiveCoverage(opponents, team, otherSide, moveSets)
  const exposure = incoming.map((row) => {
    const sourceMax = opponents.map((opponent) => {
      const options = row.options.filter((option) => option.attacker === opponent.displayName)
      return options.length ? Math.max(...options.map((option) => option.multiplier)) : null
    }).filter((value) => value !== null)
    return { name: row.name, threats: sourceMax.filter((value) => value > 1).length,
      quadruple: sourceMax.filter((value) => value >= 4).length,
      worst: sourceMax.length ? Math.max(...sourceMax) : null,
      resisted: sourceMax.filter((value) => value < 1).length, evaluated: sourceMax.length }
  })
  const ranked = exposure.filter((row) => row.evaluated > 0).sort(compareExposure)
  const outgoing = analyzeOffensiveCoverage(team, opponents, side, moveSets)
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

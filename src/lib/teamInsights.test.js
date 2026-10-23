import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deriveTeamInsights } from './teamInsights.js'
import { derivePokemonInsights, getPokemonCoverage } from './pokemonInsights.js'

const charizard = { displayName: 'Charizard', showdownId: 'charizard', types: ['fire', 'flying'] }
const venusaur = { displayName: 'Venusaur', showdownId: 'venusaur', types: ['grass', 'poison'] }
const blastoise = { displayName: 'Blastoise', showdownId: 'blastoise', types: ['water'] }
const moves = { 'attacker:Charizard': ['flamethrower', 'protect', '', ''], 'attacker:Blastoise': ['surf', '', '', ''], 'defender:Venusaur': ['giga-drain', 'protect', '', ''] }

test('individual deductions describe only the selected Pokemon and retain its perspective', () => {
  const own = derivePokemonInsights(getPokemonCoverage(charizard, 'attacker', [charizard, blastoise], [venusaur], moves))
  assert.deepEqual(own.threats, [])
  assert.deepEqual(own.resisted, ['Venusaur'])
  assert.deepEqual(own.covered, ['Venusaur'])
  assert.deepEqual(own.bestMoves, [{ name: 'Flamethrower', targets: ['Venusaur'] }])
  const enemy = derivePokemonInsights(getPokemonCoverage(venusaur, 'defender', [charizard, blastoise], [venusaur], moves))
  assert.deepEqual(enemy.threats, [{ name: 'Charizard', worst: 2 }])
  assert.deepEqual(enemy.resisted, ['Blastoise'])
  assert.deepEqual(enemy.covered, ['Blastoise'])
  assert.deepEqual(enemy.gaps, ['Charizard'])
})

test('individual deductions keep tied moves and distinguish missing data from favorable matchups', () => {
  const state = { ...moves, 'attacker:Charizard': ['flamethrower', 'heat-wave', '', ''], 'defender:Venusaur': ['protect', '', '', ''] }
  const insights = derivePokemonInsights(getPokemonCoverage(charizard, 'attacker', [charizard], [venusaur], state))
  assert.deepEqual(insights.bestMoves.map((move) => move.name), ['Flamethrower', 'Heat Wave'])
  assert.equal(insights.evaluated, 0)
  assert.deepEqual(insights.resisted, [])
  assert.deepEqual(insights.unknown, ['Venusaur'])
  const empty = derivePokemonInsights({ outgoing: [], incoming: [] })
  assert.equal(empty.hasAttacks, false)
  assert.deepEqual(empty.bestMoves, [])
})

test('own Pokemon modal keeps outgoing and incoming directions separate', () => {
  const own = getPokemonCoverage(charizard, 'attacker', [charizard, blastoise], [venusaur], moves)
  assert.equal(own.outgoing[0].name, 'Venusaur')
  assert.equal(own.outgoing[0].options[0].attacker, 'Charizard')
  assert.equal(own.outgoing[0].options[0].moveId, 'flamethrower')
  assert.equal(own.incoming[0].name, 'Venusaur')
  assert.equal(own.incoming[0].options[0].attacker, 'Venusaur')
  assert.equal(own.incoming[0].options[0].moveId, 'giga-drain')
  assert.equal(own.incoming[0].options[0].multiplier, 0.25)
})

test('opponent Pokemon modal reverses perspective without reversing squad ownership', () => {
  const enemy = getPokemonCoverage(venusaur, 'defender', [charizard, blastoise], [venusaur], moves)
  assert.deepEqual(enemy.outgoing.map((row) => row.name), ['Charizard', 'Blastoise'])
  assert.ok(enemy.outgoing.every((row) => row.options[0].attacker === 'Venusaur'))
  assert.equal(enemy.incoming.find((row) => row.name === 'Charizard').options[0].moveId, 'flamethrower')
  assert.equal(enemy.incoming.find((row) => row.name === 'Blastoise').options[0].moveId, 'surf')
})

test('mirror matches use builds and moves from their own squad', () => {
  const state = { 'attacker:Charizard': ['flamethrower', '', '', ''], 'defender:Charizard': ['air-slash', '', '', ''] }
  const enemy = getPokemonCoverage(charizard, 'defender', [charizard], [charizard], state)
  assert.equal(enemy.outgoing[0].options[0].moveId, 'air-slash')
  assert.equal(enemy.incoming[0].options[0].moveId, 'flamethrower')
})

test('deductions rank exposure by distinct opposing Pokemon, not duplicated move counts', () => {
  const result = deriveTeamInsights([charizard, blastoise], [venusaur], 'attacker', { ...moves, 'defender:Venusaur': ['giga-drain', 'energy-ball', 'protect', ''] })
  assert.deepEqual(result.mostExposed.map((row) => row.name), ['Blastoise'])
  assert.deepEqual(result.leastExposed.map((row) => row.name), ['Charizard'])
  assert.equal(result.mostExposed[0].threats, 1)
  assert.equal(result.leastExposed[0].resisted, 1)
  assert.deepEqual(result.gaps, [])
  assert.deepEqual(result.versatile, [{ name: 'Charizard', covered: 1 }])
})

test('partial movesets exclude unknown opponents rather than treating them as safe', () => {
  const result = deriveTeamInsights([charizard, blastoise], [venusaur, { ...venusaur, displayName: 'Unknown' }], 'attacker', { ...moves, 'defender:Unknown': ['', '', '', ''] })
  assert.equal(result.evaluatedOpponents, 1)
  assert.equal(result.mostExposed[0].evaluated, 1)
  assert.equal(result.mostExposed[0].threats, 1)
})

test('no selected attacks and tied exposures do not produce invented winners', () => {
  const state = { 'defender:Venusaur': ['protect', '', '', ''], 'attacker:Charizard': ['', '', '', ''] }
  const result = deriveTeamInsights([charizard], [venusaur], 'attacker', state)
  assert.deepEqual(result.mostExposed, [])
  assert.equal(result.hasAttacks, false)
  assert.deepEqual(result.gaps, [])
  const tied = deriveTeamInsights([charizard, { ...charizard, displayName: 'Twin' }], [venusaur], 'attacker', moves)
  assert.equal(tied.sameExposure, true)
  assert.equal(tied.mostExposed.length, 2)
})

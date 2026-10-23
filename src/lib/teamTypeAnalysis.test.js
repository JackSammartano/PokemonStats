import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analyzeOffensiveCoverage, analyzeTeamTypes } from './teamTypeAnalysis.js'
import { moveSetKey } from './damage/championsMoveSets.js'

test('defensive summary keeps weaknesses, resistances and immunities separate', () => {
  const rows = analyzeTeamTypes([{ displayName: 'Charizard', types: ['fire', 'flying'] }, { displayName: 'Gyarados', types: ['water', 'flying'] }])
  assert.equal(rows.find((row) => row.type === 'ground').immune.length, 2)
  assert.equal(rows.find((row) => row.type === 'rock').weak.length, 2)
  assert.equal(rows.find((row) => row.type === 'rock').weak[0].multiplier, 4)
  assert.equal(rows.find((row) => row.type === 'rock').resistant.length, 0)
})

test('offensive coverage uses damaging move types and excludes status moves', () => {
  const attacker = { displayName: 'Charizard', showdownId: 'charizard', types: ['fire', 'flying'] }
  const opponents = [{ displayName: 'Venusaur', types: ['grass', 'poison'] }, { displayName: 'Blastoise', types: ['water'] }]
  const state = { [moveSetKey('attacker', 'Charizard')]: ['flamethrower', 'will-o-wisp', '', ''] }
  assert.deepEqual(analyzeOffensiveCoverage([attacker], opponents, 'attacker', state).map((row) => row.best), [2, 0.5])
  state[moveSetKey('attacker', 'Charizard')] = ['will-o-wisp', '', '', '']
  assert.ok(analyzeOffensiveCoverage([attacker], opponents, 'attacker', state).every((row) => row.best === null))
})

test('coverage keeps source Pokemon, selected move and slot for each target, including immunities', () => {
  const team = [{ displayName: 'Charizard', showdownId: 'charizard' }, { displayName: 'Garchomp', showdownId: 'garchomp' }]
  const moves = { 'attacker:Charizard': ['flamethrower', 'protect', '', ''], 'attacker:Garchomp': ['earthquake', '', '', ''] }
  const [grass, flying] = analyzeOffensiveCoverage(team, [{ displayName: 'Venusaur', types: ['grass', 'poison'] }, { displayName: 'Charizard', types: ['fire', 'flying'] }], 'attacker', moves)
  assert.equal(grass.best, 2)
  assert.deepEqual(grass.options[0], { attacker: 'Charizard', moveId: 'flamethrower', moveName: 'Flamethrower', type: 'fire', slot: 0, multiplier: 2 })
  assert.equal(flying.options.find((option) => option.attacker === 'Garchomp').multiplier, 0)
  assert.ok(grass.options.every((option) => option.moveId !== 'protect'))
  assert.equal(analyzeOffensiveCoverage(team, [], 'attacker', moves).length, 0)
  assert.deepEqual(analyzeOffensiveCoverage([], [{ displayName: 'Target', types: ['normal'] }], 'defender', {}).map(({ best, options }) => ({ best, options })), [{ best: null, options: [] }])
})

test('opposing coverage reads only opponent moves and retains equally effective alternatives', () => {
  const team = [{ displayName: 'Charizard', showdownId: 'charizard' }]
  const target = [{ displayName: 'Venusaur', types: ['grass', 'poison'] }]
  const moves = { 'attacker:Charizard': ['protect', '', '', ''], 'defender:Charizard': ['flamethrower', 'heat-wave', '', ''] }
  const [row] = analyzeOffensiveCoverage(team, target, 'defender', moves)
  assert.equal(row.options.length, 2)
  assert.ok(row.options.every((option) => option.multiplier === 2))
  assert.deepEqual(row.options.map((option) => option.slot), [0, 1])
})

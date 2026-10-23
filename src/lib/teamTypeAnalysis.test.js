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

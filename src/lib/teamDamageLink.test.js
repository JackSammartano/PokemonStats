import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveTeamMatchup } from './teamDamageLink.js'
import { moveSetKey } from './damage/championsMoveSets.js'

const charizard = { displayName: 'Charizard', apiName: 'charizard', showdownId: 'charizard' }
const blastoise = { displayName: 'Blastoise', apiName: 'blastoise', showdownId: 'blastoise' }
const venusaur = { displayName: 'Venusaur', apiName: 'venusaur', showdownId: 'venusaur' }
const roster = [charizard, blastoise, venusaur]

test('team transfer honours both complete move sets in their selected order', () => {
  const left = ['flamethrower', 'earthquake', 'dragon-claw', 'air-slash']
  const right = ['sludge-bomb', 'giga-drain', 'earth-power', 'solar-beam']
  const draft = { attackerName: 'Charizard', defenderName: 'Venusaur' }
  const moveSets = { [moveSetKey('attacker', 'Charizard')]: left, [moveSetKey('defender', 'Venusaur')]: right }
  const result = resolveTeamMatchup([charizard, blastoise], roster, draft, moveSets)
  assert.equal(result.attacker, charizard)
  assert.equal(result.defender, venusaur)
  assert.deepEqual(result.attackerMoves, left)
  assert.deepEqual(result.defenderMoves, right)
  assert.equal(result.canCalculate, true)
  assert.deepEqual(draft, { attackerName: 'Charizard', defenderName: 'Venusaur' })
  assert.deepEqual(moveSets[moveSetKey('attacker', 'Charizard')], left)
})

test('removed team members and invalid moves do not leak into a transfer', () => {
  const result = resolveTeamMatchup([blastoise], roster, {
    attackerName: 'Charizard', defenderName: 'Venusaur',
  }, { [moveSetKey('attacker', 'Charizard')]: ['flamethrower', '', '', ''] })
  assert.equal(result.attacker, blastoise)
  assert.equal(result.defender, venusaur)
  assert.equal(result.attackerMoves.includes('flamethrower'), false)
  assert.equal(result.canCalculate, true)
})

test('empty teams cannot launch a prefilled calculation', () => {
  assert.equal(resolveTeamMatchup([], roster, {}).canCalculate, false)
  assert.equal(resolveTeamMatchup([charizard], [], {}).canCalculate, false)
})

test('an intentionally empty slot survives the round trip', () => {
  const moves = ['flamethrower', '', 'dragon-claw', 'air-slash']
  const result = resolveTeamMatchup([charizard], roster, {}, { [moveSetKey('attacker', 'Charizard')]: moves })
  assert.deepEqual(result.attackerMoves, moves)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveTeamMatchup } from './teamDamageLink.js'
import { CHAMPIONS_SET_MOVE_IDS } from '../data/championsSetMoves.js'

const charizard = { displayName: 'Charizard', apiName: 'charizard' }
const blastoise = { displayName: 'Blastoise', apiName: 'blastoise' }
const venusaur = { displayName: 'Venusaur', apiName: 'venusaur' }
const roster = [charizard, blastoise, venusaur]

test('team transfer honours the exact attacker, defender and selected supported move', () => {
  const moveId = CHAMPIONS_SET_MOVE_IDS.charizard[0]
  const draft = { attackerName: 'Charizard', defenderName: 'Venusaur', moveName: moveId }
  const result = resolveTeamMatchup([charizard, blastoise], roster, draft)
  assert.equal(result.attacker, charizard)
  assert.equal(result.defender, venusaur)
  assert.equal(result.move.value, moveId)
  assert.equal(result.canCalculate, true)
  assert.deepEqual(draft, { attackerName: 'Charizard', defenderName: 'Venusaur', moveName: moveId })
})

test('removed team members and invalid moves do not leak into a transfer', () => {
  const result = resolveTeamMatchup([blastoise], roster, {
    attackerName: 'Charizard', defenderName: 'Venusaur', moveName: 'unknown-move',
  })
  assert.equal(result.attacker, blastoise)
  assert.equal(result.defender, venusaur)
  assert.notEqual(result.move.value, 'unknown-move')
  assert.equal(result.canCalculate, true)
})

test('empty teams cannot launch a prefilled calculation', () => {
  assert.equal(resolveTeamMatchup([], roster, {}).canCalculate, false)
  assert.equal(resolveTeamMatchup([charizard], [], {}).canCalculate, false)
})

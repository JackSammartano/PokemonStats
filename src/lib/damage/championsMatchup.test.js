import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateMoveRows, createDamageBuild, createOptimizerContext } from './championsMatchup.js'

const makePokemon = (name, types, values) => ({ displayName: name, types, stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((name, index) => ({ name, value: values[index] })) })
const left = makePokemon('Left', ['fire', 'flying'], [78, 84, 78, 109, 85, 100])
const right = makePokemon('Right', ['grass', 'poison'], [80, 82, 83, 100, 100, 80])
const field = { weather: '', gameType: 'Singles', critical: false }
const ids = ['earthquake', 'flamethrower', 'air-slash', 'dragon-claw']

test('four independent results use the correct physical or special stats', () => {
  const a = createDamageBuild(), b = createDamageBuild()
  a.sps.atk = 32
  const rows = calculateMoveRows(left, right, a, b, ids, field)
  assert.equal(rows.length, 4)
  assert.equal(rows[0].result.attack, 136)
  assert.equal(rows[1].result.attack, 129)
  assert.equal(rows[0].result.defense, 103)
  assert.equal(rows[1].result.defense, 120)
  assert.equal(rows[0].defenderHp, 155)
  assert.equal(rows[0].minPercent, rows[0].result.min / 155 * 100)
  assert.equal(rows[2].move.category, 'special')
})

test('burn only reduces physical moves, and screens protect the correct side in reverse calculations', () => {
  const a = createDamageBuild(), b = createDamageBuild()
  const before = calculateMoveRows(left, right, a, b, ids, field)
  a.burned = true
  const burned = calculateMoveRows(left, right, a, b, ids, field)
  assert.ok(burned[0].result.max < before[0].result.max)
  assert.equal(burned[1].result.max, before[1].result.max)
  const reverseBefore = calculateMoveRows(right, left, b, a, ['surf', 'earthquake', '', ''], field)
  b.lightScreen = true
  const ownScreen = calculateMoveRows(right, left, b, a, ['surf', 'earthquake', '', ''], field)
  assert.equal(ownScreen[0].result.max, reverseBefore[0].result.max)
  a.lightScreen = true
  const enemyScreen = calculateMoveRows(right, left, b, a, ['surf', 'earthquake', '', ''], field)
  assert.ok(enemyScreen[0].result.max < ownScreen[0].result.max)
  assert.equal(enemyScreen[1].result.max, 0) // Flying immunity on the left.
})

test('empty and unknown slots have no fake damage and cannot create optimizer context', () => {
  const a = createDamageBuild(), b = createDamageBuild()
  const rows = calculateMoveRows(left, right, a, b, ['', 'unknown', 'surf', ''], field)
  assert.equal(rows[0].result, null)
  assert.equal(rows[1].result, null)
  assert.ok(rows[2].result)
  assert.equal(createOptimizerContext(left, right, a, b, rows[0].move, field), null)
})

test('optimizer follows the selected direction and relevant stats', () => {
  const a = createDamageBuild(), b = createDamageBuild()
  a.sps.spd = 12
  b.sps.spa = 24
  const reverse = calculateMoveRows(right, left, b, a, ['surf', '', '', ''], field)[0]
  const context = createOptimizerContext(right, left, b, a, reverse.move, field)
  assert.deepEqual(context.attacker.types, right.types)
  assert.equal(context.attacker.offenseSp, 24)
  assert.equal(context.defender.defenseSp, 12)
})

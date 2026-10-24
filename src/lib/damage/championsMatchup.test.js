import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateMoveRows, createDamageBuild, createOptimizerContext } from './championsMatchup.js'
import { getOptimizerBaseline } from './championsOptimizer.js'

const makePokemon = (name, types, values) => ({ displayName: name, types, stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((name, index) => ({ name, value: values[index] })) })
const left = makePokemon('Left', ['fire', 'flying'], [78, 84, 78, 109, 85, 100])
const right = makePokemon('Right', ['grass', 'poison'], [80, 82, 83, 100, 100, 80])
const field = { weather: '', gameType: 'Singles', critical: false }
const ids = ['earthquake', 'flamethrower', 'air-slash', 'dragon-claw']

test('optimizer preserves the weather hidden by Cloud Nine for later hits', () => {
  const a = { ...createDamageBuild(), ability: 'cloud-nine' }
  const b = { ...createDamageBuild(), ability: 'mummy' }
  const selectedField = { ...field, weather: 'Sun' }
  const [row] = calculateMoveRows(left, right, a, b, ['double-hit'], selectedField)
  const context = createOptimizerContext(left, right, a, b, row.move, selectedField)
  assert.ok(row.result && context)
  assert.equal(context.field.weather, 'Sun')
  assert.deepEqual(getOptimizerBaseline(context).damage, row.result.damage)
})

test('Stored Power includes configured accuracy and evasion stages from the page', () => {
  const a = { ...createDamageBuild(), accuracyBoost: 2, evasionBoost: 1 }
  const [row] = calculateMoveRows(left, right, a, createDamageBuild(), ['stored-power'], field)
  assert.equal(row.result.basePower, 80)
})

test('empty and status-only sets do not need to calculate battle stats', () => {
  const partial = { displayName: 'Ditto' }
  const rows = calculateMoveRows(partial, partial, createDamageBuild(), createDamageBuild(), ['', 'protect', 'toxic', 'transform'], field)
  assert.equal(rows.length, 4)
  assert.ok(rows.every((row) => row.result === null))
})

test('shared battle stats produce the same rows as independent calculations without mutating builds', () => {
  const a = createDamageBuild(), b = createDamageBuild()
  a.sps.atk = 32
  a.boosts.atk = 1
  b.reflect = true
  const original = structuredClone({ a, b })
  const rows = calculateMoveRows(left, right, a, b, ids, field)
  ids.forEach((id, index) => assert.deepEqual(rows[index].result, calculateMoveRows(left, right, a, b, [id], field)[0].result))
  assert.deepEqual({ a, b }, original)
})

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

test('imported status moves stay visible while multihit moves produce damage', () => {
  const a = createDamageBuild(), b = createDamageBuild()
  const rows = calculateMoveRows(left, right, a, b, ['protect', 'toxic', 'transform', 'rock-blast'], field)
  assert.equal(rows[0].move.name, 'Protect')
  assert.ok(rows[0].reason.includes('Mossa di stato'))
  assert.equal(rows[2].move.name, 'Transform')
  assert.equal(rows[3].move.name, 'Rock Blast')
  assert.ok(rows.slice(0, 3).every((row) => row.result === null))
  assert.equal(rows[3].result.hits, 3)
  assert.ok(rows[3].result.max > 0)
  assert.ok(createOptimizerContext(left, right, a, b, rows[3].move, field))
})

test('non-Champions levels are blocked while legacy IV values do not affect Champions calculations', () => {
  const a = createDamageBuild(), b = createDamageBuild()
  a.level = 100
  const levelRow = calculateMoveRows(left, right, a, b, ['flamethrower'], field)[0]
  assert.equal(levelRow.result, null)
  assert.equal(createOptimizerContext(left, right, a, b, levelRow.move, field), null)
  a.level = 50
  const normal = calculateMoveRows(left, right, a, b, ['earthquake'], field)[0].result
  a.ivs = { atk: 0 }
  assert.deepEqual(calculateMoveRows(left, right, a, b, ['earthquake'], field)[0].result, normal)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { describeSpeedOrder, getBattleSpeed, getSpeedBenchmarks } from './championsSpeed.js'

const pokemon = (name, speed) => ({ displayName: name, stats: [{ name: 'speed', value: speed }] })
const charizard = pokemon('Charizard', 100)

test('Speed uses Champions SP and natures and rounds Scarf after boosts', () => {
  assert.equal(getBattleSpeed(charizard, {}), 120)
  const build = { nature: 'timid', sps: { spe: 32 }, boosts: { spe: 1 }, item: 'choice-scarf' }
  assert.equal(getBattleSpeed(charizard, build), 375)
  assert.equal(getBattleSpeed(charizard, { nature: 'brave' }), 108)
  assert.equal(getBattleSpeed(charizard, { boosts: { spe: -1 } }), 80)
  assert.equal(getBattleSpeed(charizard, { item: 'iron-ball' }), 60)
})

test('weather speed abilities respond to the effective shared weather', () => {
  const build = { ability: 'swift-swim', item: 'choice-scarf' }
  assert.equal(getBattleSpeed(charizard, build, 'Rain'), 360)
  assert.equal(getBattleSpeed(charizard, build, 'Sun'), 180)
  assert.equal(getBattleSpeed(charizard, { ability: 'chlorophyll' }, 'Sun'), 240)
  assert.equal(getBattleSpeed(charizard, { ability: 'sand-rush' }, 'Sand'), 240)
  assert.equal(getBattleSpeed(charizard, { ability: 'slush-rush' }, 'Snow'), 240)
})

test('reference scenarios calculate from our roster and sort with deterministic ties', () => {
  const roster = [charizard, pokemon('Slow', 20), pokemon('Fast', 151), pokemon('Another fast', 151)]
  assert.deepEqual(getSpeedBenchmarks(roster).map(({ name, speed }) => [name, speed]), [['Another fast', 223], ['Fast', 223], ['Charizard', 167], ['Slow', 79]])
  assert.equal(getSpeedBenchmarks([charizard], 'neutral-invested')[0].speed, 152)
  assert.equal(getSpeedBenchmarks([charizard], 'scarf')[0].speed, 250)
  assert.equal(getSpeedBenchmarks([charizard], 'neutral')[0].speed, 120)
  assert.equal(getSpeedBenchmarks([charizard], 'minimum')[0].speed, 108)
})

test('ties, either faster side and unsupported levels are explicit', () => {
  assert.match(describeSpeedOrder(120, 120), /speed tie/)
  assert.match(describeSpeedOrder(121, 120), /1 più veloce di 1/)
  assert.match(describeSpeedOrder(120, 150), /2 più veloce di 30/)
  assert.equal(getBattleSpeed(charizard, { level: 100 }), null)
  assert.equal(getBattleSpeed(null, {}), null)
  assert.match(describeSpeedOrder(null, 150), /livello 50/)
})

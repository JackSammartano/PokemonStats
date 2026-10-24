import assert from 'node:assert/strict'
import { test } from 'node:test'
import { describeSpeedOrder, getBattleSpeed, getSpeedTableRow } from './championsSpeed.js'

const pokemon = (name, speed) => ({ displayName: name, stats: [{ name: 'speed', value: speed }] })
const charizard = pokemon('Charizard', 100)

test('two-Pokemon table exposes every numeric reference and a live current column', () => {
  const row = getSpeedTableRow(charizard, { nature: 'timid', sps: { spe: 32 }, boosts: { spe: 1 }, item: 'choice-scarf' })
  assert.deepEqual(row, { base: 100, current: 375, max: 167, neutral32: 152, neutral0: 120, minus0: 108, maxScarf: 250, neutralScarf: 228 })
  assert.equal(getSpeedTableRow(charizard, {}).current, 120)
  assert.equal(getSpeedTableRow(pokemon('Fast', 151), {}).max, 223)
  assert.equal(getSpeedTableRow(null, {}).max, null)
})

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

test('ties, either faster side and unsupported levels are explicit', () => {
  assert.match(describeSpeedOrder(120, 120), /speed tie/)
  assert.match(describeSpeedOrder(121, 120), /1 più veloce di 1/)
  assert.match(describeSpeedOrder(120, 150), /2 più veloce di 30/)
  assert.equal(getBattleSpeed(charizard, { level: 100 }), null)
  assert.equal(getBattleSpeed(null, {}), null)
  assert.match(describeSpeedOrder(null, 150), /livello 50/)
})

test('paralysis halves the final Speed while Quick Feet uses the status boost instead', () => {
  assert.equal(getBattleSpeed(charizard, { status: 'par', item: 'choice-scarf' }), 90)
  assert.equal(getBattleSpeed(charizard, { status: 'par', ability: 'quick-feet' }), 180)
  assert.equal(getBattleSpeed(charizard, { status: 'psn', ability: 'quick-feet' }), 180)
  assert.equal(getBattleSpeed(charizard, { ability: 'quick-feet' }), 120)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateChampionsDamage } from './championsDamage.js'
import { CHAMPIONS_MOVES } from './championsData.js'
import { findKoOptions, getOptimizerBaseline } from './championsOptimizer.js'

const stats = { hp: 200, atk: 120, def: 180, spa: 140, spd: 90, spe: 100 }
const attacker = { types: ['normal'], stats }
const defender = { types: ['normal'], stats: { ...stats, atk: 210, def: 100 } }
const calc = (move, a = {}, d = {}, field = {}) => calculateChampionsDamage({ attacker: { ...attacker, ...a }, defender: { ...defender, ...d }, move, field })

test('Body Press uses its own Defense and its Defense stage, including critical stage rules', () => {
  assert.equal(calc('Body Press', { boosts: { atk: 6, def: 1 } }).attack, 270)
  assert.equal(calc('Body Press', { boosts: { def: -2 } }, {}, { isCritical: true }).attack, 180)
})

test('Foul Play uses the target Attack and stage, ignoring its negative stage on critical hits', () => {
  assert.equal(calc('Foul Play', { boosts: { atk: 6 } }, { boosts: { atk: 1 } }).attack, 315)
  assert.equal(calc('Foul Play', {}, { boosts: { atk: -2 } }, { isCritical: true }).attack, 210)
})

test('Psyshock uses Defense, Light Screen and Fur Coat, and ignores Assault Vest', () => {
  const normal = calc('Psyshock')
  assert.equal(normal.attack, 140)
  assert.equal(normal.defense, 100)
  assert.equal(calc('Psyshock', {}, { item: 'assault-vest' }).defense, 100)
  assert.equal(calc('Psyshock', {}, { ability: 'fur-coat' }).defense, 200)
  assert.equal(calc('Psyshock', {}, {}, { defenderSide: { isLightScreen: true } }).finalMod, 2048)
  assert.equal(calc('Psyshock', {}, {}, { defenderSide: { isReflect: true } }).finalMod, 4096)
})

test('defense-ignoring moves discard both positive and negative defensive stages', () => {
  for (const move of ['Sacred Sword', 'Darkest Lariat']) {
    assert.equal(calc(move, {}, { boosts: { def: 6 } }).defense, 100)
    assert.equal(calc(move, {}, { boosts: { def: -6 } }).defense, 100)
  }
})

test('guaranteed critical moves use critical stage rules without the manual toggle', () => {
  for (const move of ['Flower Trick', 'Frost Breath', 'Storm Throw']) {
    assert.deepEqual(calc(move, { boosts: { atk: -6, spa: -6 } }, { boosts: { def: 6, spd: 6 } }).damage, calc(move).damage)
  }
})

test('the optimizer reads Defense investment for Body Press and target Attack for Foul Play', () => {
  const baseStats = { hp: 100, atk: 120, def: 100, spa: 120, spd: 100, spe: 100 }
  const context = {
    attacker: { baseStats, types: ['normal'], nature: 'serious', offenseSp: 10, sps: { def: 10 } },
    defender: { baseStats, types: ['normal'], nature: 'serious', hp: 1, hpSp: 0, defenseSp: 0, sps: { atk: 32 } },
    move: CHAMPIONS_MOVES['body-press'], field: {},
  }
  assert.equal(getOptimizerBaseline(context).attack, 130)
  context.move = CHAMPIONS_MOVES['foul-play']
  assert.equal(getOptimizerBaseline(context).attack, 172)
  const options = findKoOptions(context, { weather: [''] }).displayed
  assert.ok(options.length > 0)
  assert.ok(options.every((option) => option.attacker.offenseSp === 0))
})

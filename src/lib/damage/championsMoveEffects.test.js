import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CHAMPIONS_MOVES } from './championsData.js'
import { calculateChampionsDamage } from './championsDamage.js'

const pokemon = (changes = {}) => ({ level: 50, types: ['grass'], ability: '', item: '', stats: { hp: 1000, atk: 120, def: 100, spa: 120, spd: 100, spe: 100 }, weightkg: 100, ...changes })
const run = (id, conditions = {}, attacker = {}, defender = {}, field = {}) => calculateChampionsDamage({ attacker: pokemon(attacker), defender: pokemon(defender), move: { ...CHAMPIONS_MOVES[id], conditions }, field })

test('Aura Wheel requires Morpeko and follows its exact form', () => {
  assert.equal(run('aura-wheel').max, 0)
  assert.equal(run('aura-wheel', {}, { showdownId: 'morpeko' }).move.type, 'electric')
  assert.equal(run('aura-wheel', {}, { showdownId: 'morpekohangry' }).move.type, 'dark')
})

test('Beat Up uses each eligible member’s base Attack and refuses missing contributors', () => {
  assert.throws(() => run('beat-up'), /Beat Up/)
  const result = run('beat-up', { partyAttack: '100, 130' })
  const hit = (basePower) => calculateChampionsDamage({ attacker: pokemon(), defender: pokemon(), move: { name: 'Fixture', type: 'dark', category: 'physical', basePower } })
  assert.equal(result.hits, 2)
  assert.equal(result.min, hit(15).min + hit(18).min)
  assert.equal(result.max, hit(15).max + hit(18).max)
  assert.throws(() => run('beat-up', { partyAttack: '100,invalid' }), /Beat Up/)
})

test('prerequisite moves fail until the corresponding explicit condition is selected', () => {
  for (const [id, condition] of [['belch', 'ateBerry'], ['last-resort', 'otherMovesUsed'], ['upper-hand', 'targetPriority']]) {
    assert.equal(run(id).max, 0, id)
    assert.ok(run(id, { [condition]: true }).max > 0, id)
  }
  assert.equal(run('snore').max, 0)
  assert.ok(run('snore', {}, { status: 'slp' }).max > 0)
  assert.equal(run('spit-up').max, 0)
  assert.equal(run('spit-up', { stockpiles: 3 }).move.basePower, 300)
})

test('Last Respects and Rage Fist use their explicit counters with the verified cap', () => {
  assert.equal(run('last-respects', { alliesFainted: 5 }).move.basePower, 300)
  assert.equal(run('rage-fist', { hitsTaken: 6 }).move.basePower, 350)
  assert.equal(run('rage-fist').move.basePower, 50)
  assert.throws(() => run('rage-fist', { hitsTaken: 7 }), RangeError)
})

test('Counter and Mirror Coat validate the received category and retain type immunity', () => {
  assert.equal(run('counter', { receivedDamage: 40, receivedCategory: 'physical' }).min, 80)
  assert.equal(run('counter', { receivedDamage: 40, receivedCategory: 'special' }).max, 0)
  assert.equal(run('mirror-coat', { receivedDamage: 40, receivedCategory: 'special' }).min, 80)
  assert.equal(run('mirror-coat', { receivedDamage: 40, receivedCategory: 'physical' }).max, 0)
  assert.equal(run('mirror-coat', { receivedDamage: 40 }, {}, { types: ['dark'] }).max, 0)
  for (const id of ['comeuppance', 'metal-burst']) {
    assert.equal(run(id, { receivedDamage: 41 }).min, 61)
    assert.equal(run(id).max, 0)
  }
})

test('fixed damage follows current HP and ignores ordinary damage modifiers', () => {
  assert.equal(run('super-fang', {}, {}, { currentHp: 301 }).min, 150)
  assert.equal(run('endeavor', {}, { currentHp: 30 }, { currentHp: 301 }).min, 271)
  assert.equal(run('endeavor', {}, { currentHp: 500 }, { currentHp: 301 }).max, 0)
  assert.equal(run('final-gambit', {}, { currentHp: 73 }).min, 73)
  for (const id of ['seismic-toss', 'night-shade']) assert.equal(run(id, {}, { item: 'life-orb' }, { item: 'assault-vest' }, { isCritical: true, weather: 'Sun' }).min, 50)
  assert.equal(run('night-shade', {}, {}, { types: ['normal'] }).max, 0)
})

test('OHKO results are conditional on hitting and preserve Sturdy and Ice immunities', () => {
  for (const id of ['fissure', 'guillotine', 'horn-drill', 'sheer-cold']) {
    const result = run(id, {}, {}, { currentHp: 301 })
    assert.equal(result.min, 301, id)
    assert.equal(result.accuracyDependentKO, true, id)
    assert.equal(run(id, {}, {}, { ability: 'sturdy' }).max, 0, id)
  }
  assert.equal(run('sheer-cold', {}, {}, { types: ['ice'] }).max, 0)
  assert.equal(run('fissure', {}, {}, { types: ['flying'] }).max, 0)
  assert.equal(run('horn-drill', {}, {}, { types: ['ghost'] }).max, 0)
})

test('HP power boundaries and weight thresholds are evaluated with verified inputs', () => {
  assert.equal(run('eruption', {}, { currentHp: 500 }).move.basePower, 75)
  assert.equal(run('flail', {}, { currentHp: 1 }).move.basePower, 200)
  assert.equal(run('flail').move.basePower, 20)
  assert.equal(run('grass-knot', {}, {}, { weightkg: 99.9 }).move.basePower, 80)
  assert.equal(run('grass-knot', {}, {}, { weightkg: 100 }).move.basePower, 100)
  assert.equal(run('grass-knot', {}, {}, { weightkg: 100, ability: 'heavy-metal' }).move.basePower, 120)
  assert.throws(() => run('grass-knot', {}, {}, { weightkg: undefined }), /peso/)
})

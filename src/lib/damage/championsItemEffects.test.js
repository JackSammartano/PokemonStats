import assert from 'node:assert/strict'
import { test } from 'node:test'
import { activateHeldBerry, consumeItem } from './championsItemEffects.js'
import { calculateChampionsDamage } from './championsDamage.js'
import { CHAMPIONS_MOVES } from './championsData.js'
import { runDamageSequence } from './championsMultiHit.js'

const pokemon = (changes = {}) => ({ types: ['grass'], ability: '', item: '', currentHp: 1000, stats: { hp: 1000, atk: 120, def: 100, spa: 120, spd: 100, spe: 100 }, ...changes })
const damage = (move, attacker = {}, defender = {}, field = {}) => calculateChampionsDamage({ move, attacker: pokemon(attacker), defender: pokemon(defender), field })

test('Ripen multiplies Sitrus healing before rounding, including odd max HP', () => {
  const p = pokemon({ ability: 'ripen', item: 'sitrus-berry', currentHp: 80, stats: { hp: 175 } })
  activateHeldBerry(p, pokemon())
  assert.equal(p.currentHp, 167)
  assert.equal(p.item, '')
})

test('healing berries activate at half HP, respect Unnerve, and activate Unburden', () => {
  const p = pokemon({ ability: 'unburden', item: 'oran-berry', currentHp: 500 })
  activateHeldBerry(p, pokemon({ ability: 'unnerve' }))
  assert.equal(p.currentHp, 500)
  assert.equal(p.item, 'oran-berry')
  activateHeldBerry(p, pokemon())
  assert.equal(p.currentHp, 510)
  assert.equal(p.unburdenActive, true)
  const q = pokemon({ item: 'sitrus-berry', currentHp: 501 })
  activateHeldBerry(q, pokemon())
  assert.equal(q.item, 'sitrus-berry')
})

test('status berries cure only matching states and Lum cures every major status', () => {
  const items = { 'cheri-berry': 'par', 'chesto-berry': 'slp', 'pecha-berry': 'tox', 'rawst-berry': 'brn', 'aspear-berry': 'frz' }
  for (const [item, status] of Object.entries(items)) {
    const p = pokemon({ item, status })
    activateHeldBerry(p, pokemon())
    assert.equal(p.status, '', item)
    assert.equal(p.item, '', item)
  }
  const p = pokemon({ item: 'rawst-berry', status: 'par' })
  activateHeldBerry(p, pokemon())
  assert.equal(p.status, 'par')
  for (const status of ['par', 'slp', 'psn', 'tox', 'brn', 'frz']) {
    const q = pokemon({ item: 'lum-berry', status })
    activateHeldBerry(q, pokemon())
    assert.equal(q.status, '')
  }
})

test('Cheek Pouch heals when a resist berry is eaten before damage', () => {
  const result = damage({ name: 'Fixture', type: 'normal', category: 'physical', basePower: 100 }, {}, { ability: 'cheek-pouch', currentHp: 20, item: 'chilan-berry' })
  assert.ok(result.min > 20)
  assert.equal(result.guaranteedSurvival, true)
  assert.equal(result.remainingHp.min, 20 + 333 - result.max)
})

test('initial berry healing is reflected in single-hit KO guarantees', () => {
  const result = damage({ name: 'Fixture', type: 'normal', category: 'physical', basePower: 100 }, {}, { currentHp: 20, item: 'sitrus-berry' })
  assert.ok(result.min > 20)
  assert.equal(result.effectiveDefender.currentHp, 270)
  assert.equal(result.guaranteedKO, false)
  assert.equal(result.guaranteedSurvival, true)
})

test('White Herb does not undo Gooey between the hits of a single move', () => {
  const move = { ...CHAMPIONS_MOVES['gyro-ball'], multihit: 2 }
  assert.deepEqual(damage(move, { item: 'white-herb' }, { ability: 'gooey' }).damage, damage(move, {}, { ability: 'gooey' }).damage)
})

test('an item remains physically held under Magic Room for Acrobatics and Knock Off', () => {
  const held = damage('Acrobatics', { item: 'life-orb' }, {}, { isMagicRoom: true })
  const empty = damage('Acrobatics', {}, {}, { isMagicRoom: true })
  assert.equal(held.move.basePower, 55)
  assert.equal(empty.move.basePower, 110)
  const move = { ...CHAMPIONS_MOVES['knock-off'], multihit: 2 }
  const result = damage(move, {}, { item: 'life-orb' }, { isMagicRoom: true })
  const first = damage('Knock Off', {}, { item: 'life-orb' }, { isMagicRoom: true })
  const second = damage('Knock Off', {}, {}, { isMagicRoom: true })
  assert.equal(result.min, first.min + second.min)
  assert.equal(result.max, first.max + second.max)
})

test('Iron Ball and Gravity ground Levitate but cannot bypass Earth Eater', () => {
  assert.ok(damage('Earthquake', {}, { ability: 'levitate', item: 'iron-ball' }).min > 0)
  assert.ok(damage('Earthquake', {}, { ability: 'levitate' }, { isGravity: true }).min > 0)
  assert.equal(damage('Earthquake', {}, { ability: 'earth-eater' }, { isGravity: true }).max, 0)
})

test('consuming an item records its loss without changing other fields', () => {
  const p = pokemon({ ability: 'unburden', item: 'electric-seed', heldItem: 'electric-seed', status: 'par' })
  consumeItem(p)
  assert.equal(p.item, '')
  assert.equal(p.heldItem, '')
  assert.equal(p.unburdenActive, true)
  assert.equal(p.status, 'par')
})

test('drain heals before contact damage and rounds halves upward', () => {
  const move = { name: 'Fixture', category: 'physical', type: 'normal', flags: { contact: 1 }, drain: [1, 2] }
  const result = runDamageSequence({ attacker: pokemon({ currentHp: 1, stats: { hp: 12 } }), defender: pokemon({ item: 'rocky-helmet' }), field: {}, move, hits: 2,
    evaluate: () => ({ move, damage: [3], effectiveness: 1 }) })
  assert.equal(result.min, 6)
  assert.equal(result.max, 6)
})

test('ordinary recoil cannot interrupt the hits of its own move', () => {
  const move = { ...CHAMPIONS_MOVES['double-edge'], multihit: 2 }
  const result = damage(move, { currentHp: 1 })
  const single = damage('Double-Edge', { currentHp: 1 })
  assert.equal(result.min, single.min * 2)
  assert.equal(result.max, single.max * 2)
})

test('Fling uses pinned item powers and rejects Klutz, Magic Room and matching Mega stones', () => {
  assert.equal(damage('Fling', { item: 'iron-ball' }).move.basePower, 130)
  assert.equal(damage('Fling', { item: 'metronome', consecutiveUses: 3 }).move.basePower, 30)
  assert.equal(damage('Fling', { item: 'light-ball' }).move.basePower, 30)
  assert.equal(damage('Fling', { item: 'iron-ball', ability: 'klutz' }).max, 0)
  assert.equal(damage('Fling', { item: 'iron-ball' }, {}, { isMagicRoom: true }).max, 0)
  assert.equal(damage('Fling', { item: 'charizardite-x', showdownId: 'charizard' }).max, 0)
})

test('Normal Gem applies once to the move and stays active for every selected hit', () => {
  const move = { ...CHAMPIONS_MOVES['double-hit'] }
  const result = damage(move, { item: 'normal-gem' })
  const hit = damage({ name: 'Fixture', type: 'normal', category: 'physical', basePower: 46 })
  assert.equal(result.min, hit.min * 2)
  assert.equal(result.max, hit.max * 2)
  assert.equal(result.effectiveAttacker.item, '')
  assert.equal(result.effectiveAttacker.gemActive, true)
  const converted = damage(move, { item: 'normal-gem', ability: 'pixilate' })
  assert.equal(converted.effectiveAttacker.item, 'normal-gem')
})

test('Thief transfers a damage item before the next hit and respects Sticky Hold', () => {
  const move = { ...CHAMPIONS_MOVES.thief, multihit: 2 }
  const result = damage(move, {}, { item: 'choice-band' })
  const first = damage('Thief', {}, { item: 'choice-band' })
  const second = damage('Thief', { item: 'choice-band' })
  assert.equal(result.min, first.min + second.min)
  assert.equal(result.max, first.max + second.max)
  const protectedItem = damage(move, {}, { item: 'choice-band', ability: 'sticky-hold' })
  assert.equal(protectedItem.max, first.max * 2)
})

test('Bug Bite eats a berry before the contact reaction, not after it', () => {
  const move = { ...CHAMPIONS_MOVES['bug-bite'], multihit: 2 }
  const a = { status: 'brn' }
  const cured = damage(move, a, { item: 'rawst-berry' })
  const burned = damage(move, a)
  assert.ok(cured.min > burned.min)
  assert.deepEqual(damage(move, a, { item: 'rawst-berry', ability: 'flame-body', reactionAfterHit: 1 }).damage, burned.damage)
})

test('Sheer Force suppression survives losing the ability to Mummy', () => {
  const move = { name: 'Fixture', type: 'normal', category: 'physical', basePower: 40, flags: { contact: 1 }, multihit: 2, hasSecondary: true, secondaries: [{ chance: 100, boosts: { def: -1 } }] }
  const first = damage({ ...move, multihit: undefined }, { ability: 'sheer-force' }, { ability: 'mummy' })
  const second = damage({ ...move, multihit: undefined }, { ability: 'mummy' }, { ability: 'mummy' })
  const result = damage(move, { ability: 'sheer-force' }, { ability: 'mummy' })
  assert.equal(result.min, first.min + second.min)
  assert.equal(result.max, first.max + second.max)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateChampionsDamage } from './championsDamage.js'
import { getMoveConditionFields, getMoveConditions } from './championsMoveConditions.js'
import { CHAMPIONS_MOVES } from './championsData.js'
import { calculateMoveRows, createDamageBuild, createOptimizerContext } from './championsMatchup.js'
import { getOptimizerBaseline } from './championsOptimizer.js'

const pokemon = (changes = {}) => ({ types: ['normal'], ability: '', item: '', stats: { hp: 1000, atk: 120, def: 100, spa: 120, spd: 100, spe: 100 }, ...changes })
const damage = (attacker = {}, defender = {}, move = {}, field = {}) => calculateChampionsDamage({ attacker: pokemon(attacker), defender: pokemon(defender), move: { ...CHAMPIONS_MOVES['double-hit'], ...move }, field })

test('chosen contact activation affects subsequent hits, never the hit that triggered it', () => {
  const inactive = damage({}, { ability: 'flame-body' })
  const first = damage({}, { ability: 'flame-body', reactionAfterHit: 1 })
  const last = damage({}, { ability: 'flame-body', reactionAfterHit: 2 })
  assert.ok(first.min < inactive.min)
  assert.ok(first.max < inactive.max)
  assert.equal(last.min, inactive.min)
  assert.equal(last.max, inactive.max)
  assert.deepEqual(damage({}, { ability: 'flame-body', reactionAfterHit: 0 }).damage, inactive.damage)
})

test('Long Reach and burn immunity prevent the selected Flame Body reaction', () => {
  const normal = damage({ ability: 'long-reach' }, { ability: 'flame-body' })
  assert.deepEqual(damage({ ability: 'long-reach' }, { ability: 'flame-body', reactionAfterHit: 1 }).damage, normal.damage)
  const fire = damage({ types: ['fire'] }, { ability: 'flame-body' })
  assert.deepEqual(damage({ types: ['fire'] }, { ability: 'flame-body', reactionAfterHit: 1 }).damage, fire.damage)
})

test('Misty Terrain prevents a grounded contact status but not an airborne one', () => {
  const field = { terrain: 'Misty' }
  assert.deepEqual(damage({}, { ability: 'flame-body', reactionAfterHit: 1 }, {}, field).damage, damage({}, { ability: 'flame-body' }, {}, field).damage)
  assert.ok(damage({ types: ['flying'] }, { ability: 'flame-body', reactionAfterHit: 1 }, {}, field).max < damage({ types: ['flying'] }, { ability: 'flame-body' }, {}, field).max)
})

test('Rawst Berry cures the chosen burn before the next hit and leaves the inputs untouched', () => {
  const attacker = pokemon({ item: 'rawst-berry' }), defender = pokemon({ ability: 'flame-body', reactionAfterHit: 1 })
  const original = structuredClone({ attacker, defender })
  const result = calculateChampionsDamage({ attacker, defender, move: 'Double Hit' })
  assert.deepEqual(result.damage, damage({}, { ability: 'flame-body' }).damage)
  assert.deepEqual({ attacker, defender }, original)
})

test('Stamina changes Defense between hits', () => {
  assert.ok(damage({}, { ability: 'stamina' }).max < damage().max)
})

test('a resist berry is consumed by the first matching hit only', () => {
  const move = { ...CHAMPIONS_MOVES['double-hit'], type: 'fighting' }
  const plain = damage({}, {}, move)
  const berry = damage({}, { item: 'chople-berry' }, move)
  assert.ok(berry.max < plain.max)
  assert.ok(berry.max > plain.max / 2)
})

test('a surviving attacker can break Focus Sash on the first hit and KO on the next', () => {
  const result = damage({ stats: { hp: 1000, atk: 999, def: 100, spa: 120, spd: 100, spe: 100 } }, { stats: { hp: 100, atk: 100, def: 10, spa: 100, spd: 100, spe: 100 }, item: 'focus-sash' })
  assert.equal(result.guaranteedKO, true)
  assert.equal(result.remainingHp.max, 0)
})

test('Sturdy is bypassed by Mold Breaker, while Ability Shield preserves it', () => {
  const a = { ability: 'mold-breaker', stats: { hp: 1000, atk: 999, def: 100, spa: 120, spd: 100, spe: 100 } }
  const d = { ability: 'sturdy', stats: { hp: 100, atk: 100, def: 10, spa: 100, spd: 100, spe: 100 } }
  const move = { ...CHAMPIONS_MOVES['close-combat'], multihit: undefined }
  assert.equal(damage(a, d, move).guaranteedKO, true)
  assert.equal(damage(a, { ...d, item: 'ability-shield' }, move).guaranteedSurvival, true)
})

test('contact recoil can stop the attacker before the selected number of hits', () => {
  const a = { currentHp: 1 }
  const first = damage(a, { item: 'rocky-helmet' })
  const both = damage(a)
  assert.ok(first.max < both.min)
})

test('Skill Link forces the maximum and ordinary hit counts are validated', () => {
  const move = { ...CHAMPIONS_MOVES['rock-blast'], conditions: { hits: 2 } }
  assert.equal(damage({}, {}, move).hits, 2)
  assert.equal(damage({ ability: 'skill-link' }, {}, move).hits, 5)
  assert.throws(() => damage({}, {}, { ...move, conditions: { hits: 6 } }), RangeError)
})

test('random secondary status choice is explicit and validated', () => {
  const move = { ...CHAMPIONS_MOVES['tri-attack'], conditions: { secondaryAfterHit: 1, secondaryStatus: 'frz' } }
  assert.ok(getMoveConditionFields(move).some((field) => field.key === 'secondaryStatus'))
  assert.equal(getMoveConditions(move).secondaryStatus, 'frz')
  assert.throws(() => getMoveConditions({ ...move, conditions: { secondaryStatus: 'tox' } }), RangeError)
})

test('UI rows and optimizer baseline preserve the same chosen activation', () => {
  const rosterPokemon = { displayName: 'Fixture', types: ['normal'], stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((name) => ({ name, value: 100 })) }
  const a = createDamageBuild(), d = { ...createDamageBuild(), ability: 'flame-body', reactionAfterHit: 1 }
  const row = calculateMoveRows(rosterPokemon, rosterPokemon, a, d, ['double-hit'], {})[0]
  assert.ok(row.result)
  const context = createOptimizerContext(rosterPokemon, rosterPokemon, a, d, row.move, {})
  assert.equal(context.defender.reactionAfterHit, 1)
  assert.deepEqual(getOptimizerBaseline(context).damage, row.result.damage)
})

test('Effect Spore respects powder immunity and selected status', () => {
  const move = { ...CHAMPIONS_MOVES['gyro-ball'], multihit: 2 }
  const d = { ability: 'effect-spore', reactionAfterHit: 1, reactionStatus: 'par' }
  assert.ok(damage({}, d, move).max > damage({}, { ...d, reactionAfterHit: 0 }, move).max)
  assert.deepEqual(damage({ types: ['grass'] }, d, move).damage, damage({ types: ['grass'] }, { ...d, reactionAfterHit: 0 }, move).damage)
})

test('Poison Touch cannot bypass Shield Dust and can affect the next hit through Hex', () => {
  const move = { ...CHAMPIONS_MOVES.hex, multihit: 2, flags: { contact: 1 } }
  const a = { ability: 'poison-touch', reactionAfterHit: 1 }
  const d = { types: ['grass'] }
  assert.ok(damage(a, d, move).max > damage({ ...a, reactionAfterHit: 0 }, d, move).max)
  assert.deepEqual(damage(a, { ...d, ability: 'shield-dust' }, move).damage, damage({ ...a, reactionAfterHit: 0 }, { ...d, ability: 'shield-dust' }, move).damage)
})

test('reaction controls reject values outside the supported hit range', () => {
  const p = { displayName: 'Fixture', types: ['normal'], stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((name) => ({ name, value: 100 })) }
  const a = createDamageBuild(), d = { ...createDamageBuild(), ability: 'flame-body', reactionAfterHit: 11 }
  const row = calculateMoveRows(p, p, a, d, ['double-hit'], {})[0]
  assert.equal(row.result, null)
  assert.match(row.reason, /Valore non valido/)
  assert.equal(createOptimizerContext(p, p, a, d, row.move, {}), null)
})

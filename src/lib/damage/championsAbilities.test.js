import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateChampionsDamage } from './championsDamage.js'
import { calculateMoveRows, createDamageBuild } from './championsMatchup.js'
import { getAbilityBasePowerMods, resolveAbilityWeather } from './championsAbilities.js'
import { REGULATION_ABILITY_MECHANICS } from '../regulation.js'
import { CHAMPIONS_MOVES } from './championsData.js'

const attacker = { level: 50, types: ['normal'], stats: { hp: 150, atk: 120, def: 100, spa: 120, spd: 100, spe: 100 } }
const defender = { types: ['normal'], stats: { hp: 150, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 } }
const damage = (move, attacking = {}, defending = {}, field = {}) => calculateChampionsDamage({ attacker: { ...attacker, ...attacking }, defender: { ...defender, ...defending }, move, field })

test('Aura Guard applies the verified contact modifier to all 16 damage rolls', () => {
  assert.deepEqual(damage('Close Combat', {}, { ability: 'aura-guard' }).damage, [55, 55, 56, 57, 57, 58, 59, 59, 60, 61, 61, 62, 63, 63, 64, 65])
  assert.deepEqual(damage('Thunderbolt', {}, { ability: 'aura-guard' }).damage, damage('Thunderbolt').damage)
  const contactSpecial = { name: 'Contact Special', type: 'normal', category: 'special', basePower: 90, flags: { contact: 1 } }
  assert.equal(damage(contactSpecial, {}, { ability: 'aura-guard' }).finalMod, 2048)
  assert.equal(damage('Earthquake', {}, { ability: 'aura-guard' }).finalMod, 4096)
})

test('Long Reach removes contact and Mold Breaker bypasses breakable defensive abilities without mutations', () => {
  const original = structuredClone(defender)
  assert.deepEqual(damage('Close Combat', { ability: 'long-reach' }, { ability: 'aura-guard' }).damage, damage('Close Combat').damage)
  assert.deepEqual(damage('Close Combat', { ability: 'mold-breaker' }, { ability: 'aura-guard' }).damage, damage('Close Combat').damage)
  assert.equal(damage('Close Combat', { ability: 'mold-breaker' }, { ability: 'aura-guard', item: 'ability-shield' }).finalMod, 2048)
  assert.deepEqual(defender, original)
})

test('offensive ability modifiers use move flags and Technician includes 60 BP but excludes 61 BP', () => {
  for (const [ability, flag, modifier] of [['tough-claws', 'contact', 5325], ['sharpness', 'slicing', 6144], ['iron-fist', 'punch', 4915], ['strong-jaw', 'bite', 6144], ['mega-launcher', 'pulse', 6144]]) {
    assert.deepEqual(getAbilityBasePowerMods({ attacker: { ability }, move: { basePower: 80, flags: { [flag]: 1 } } }), [modifier])
    assert.deepEqual(getAbilityBasePowerMods({ attacker: { ability }, move: { basePower: 80, flags: {} } }), [])
  }
  assert.equal(damage({ name: 'Boundary', type: 'normal', category: 'physical', basePower: 60 }, { ability: 'technician' }).basePower, 90)
  assert.equal(damage({ name: 'Boundary', type: 'normal', category: 'physical', basePower: 61 }, { ability: 'technician' }).basePower, 61)
})

test('Fluffy combines contact resistance and Fire weakness; Fur Coat modifies physical defense; Sniper requires a critical hit', () => {
  const fireContact = { name: 'Contact Fire', type: 'fire', category: 'physical', basePower: 80, flags: { contact: 1 } }
  assert.equal(damage(fireContact, {}, { ability: 'fluffy' }).finalMod, 4096)
  assert.equal(damage('Flamethrower', {}, { ability: 'fluffy' }).finalMod, 8192)
  assert.equal(damage('Close Combat', {}, { ability: 'fur-coat' }).defense, 200)
  assert.equal(damage('Thunderbolt', {}, { ability: 'fur-coat' }).defense, 100)
  assert.equal(damage('Thunderbolt', { ability: 'sniper' }).finalMod, 4096)
  assert.equal(damage('Thunderbolt', { ability: 'sniper' }, {}, { isCritical: true }).finalMod, 6144)
})

test('the UI matchup receives the verified contact flags in both directions', () => {
  const pokemon = { types: ['normal'], stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((name) => ({ name, value: 100 })) }
  const a = createDamageBuild(), b = { ...createDamageBuild(), ability: 'aura-guard' }
  const result = calculateMoveRows(pokemon, pokemon, a, b, ['close-combat'], {})[0].result
  if (REGULATION_ABILITY_MECHANICS['aura-guard']) {
    assert.equal(result.finalMod, 2048)
    assert.equal(calculateMoveRows(pokemon, pokemon, b, a, ['close-combat'], {})[0].result.finalMod, 4096)
  } else {
    assert.equal(result, null)
    assert.equal(calculateMoveRows(pokemon, pokemon, b, a, ['close-combat'], {})[0].result, null)
  }
})

test('HP-dependent boosts use the exact one-third boundary and Flash Fire requires activation', () => {
  assert.equal(damage('Flamethrower', { ability: 'blaze', currentHp: 50 }).attack, 180)
  assert.equal(damage('Flamethrower', { ability: 'blaze', currentHp: 51 }).attack, 120)
  assert.equal(damage('Thunderbolt', { ability: 'blaze', currentHp: 1 }).attack, 120)
  assert.equal(damage('Flamethrower', { ability: 'flash-fire', abilityOn: false }).attack, 120)
  assert.equal(damage('Flamethrower', { ability: 'flash-fire', abilityOn: true }).attack, 180)
})

test('Guts replaces the burn damage penalty; Water Bubble boosts Water and resists Fire', () => {
  assert.equal(damage('Close Combat', { ability: 'guts', status: 'brn' }).attack, 180)
  assert.ok(damage('Close Combat', { ability: 'guts', status: 'brn' }).min > damage('Close Combat').min)
  assert.equal(damage('Surf', { ability: 'water-bubble' }).attack, 240)
  assert.equal(damage('Flamethrower', {}, { ability: 'water-bubble' }).attack, 60)
})

test('Sand and Snow apply their defensive bonus to the matching type and damage category', () => {
  assert.equal(damage('Thunderbolt', {}, { types: ['rock'] }, { weather: 'Sand' }).defense, 150)
  assert.equal(damage('Close Combat', {}, { types: ['rock'] }, { weather: 'Sand' }).defense, 100)
  assert.equal(damage('Close Combat', {}, { types: ['ice'] }, { weather: 'Snow' }).defense, 150)
  assert.equal(damage('Thunderbolt', {}, { types: ['ice'] }, { weather: 'Snow' }).defense, 100)
  assert.ok(damage('Solar Beam', {}, {}, { weather: 'Rain' }).max < damage('Solar Beam').max)
})

test('conflicting weather abilities require a choice and produce the same effective weather in reverse', () => {
  assert.equal(resolveAbilityWeather({ attackerAbility: 'drought', defenderAbility: 'drizzle' }).requiresChoice, true)
  assert.equal(resolveAbilityWeather({ attackerAbility: 'drought', defenderAbility: 'drizzle', selectedWeather: 'Rain' }).weather, 'Rain')
  assert.equal(resolveAbilityWeather({ attackerAbility: 'drizzle', defenderAbility: 'drought', selectedWeather: 'Rain' }).weather, 'Rain')
  assert.throws(() => damage('Flamethrower', { ability: 'drought' }, { ability: 'drizzle' }), /meteo effettivo/)
})

test('Showdown-only sound, special-defense and resisted-hit effects use their verified modifiers', () => {
  const sound = { name: 'Sound Test', type: 'normal', category: 'special', basePower: 90, flags: { sound: 1 } }
  assert.equal(damage(sound, { ability: 'punk-rock' }).basePower, 117)
  assert.equal(damage(sound, {}, { ability: 'punk-rock' }).finalMod, 2048)
  assert.equal(damage('Thunderbolt', {}, { ability: 'punk-rock' }).finalMod, 4096)
  assert.equal(damage('Thunderbolt', {}, { ability: 'ice-scales' }).finalMod, 2048)
  assert.equal(damage('Close Combat', {}, { ability: 'ice-scales' }).finalMod, 4096)
  assert.equal(damage('Flamethrower', { ability: 'tinted-lens' }, { types: ['water'] }).finalMod, 8192)
  assert.equal(damage('Flamethrower', { ability: 'tinted-lens' }).finalMod, 4096)
})

test('Sand Force requires Sand and Hustle rounds separately before Choice Band', () => {
  assert.equal(damage('Earthquake', { ability: 'sand-force' }, {}, { weather: 'Sand' }).basePower, 130)
  assert.equal(damage('Earthquake', { ability: 'sand-force' }).basePower, 100)
  assert.equal(damage('Close Combat', { ability: 'hustle', item: 'choice-band', stats: { ...attacker.stats, atk: 121 } }).attack, 271)
})

test('registered moves carry the same flags when passed by name or by object', () => {
  const move = CHAMPIONS_MOVES['close-combat']
  const before = structuredClone(move)
  assert.deepEqual(damage(move, { ability: 'tough-claws' }, { ability: 'aura-guard' }).damage, damage('Close Combat', { ability: 'tough-claws' }, { ability: 'aura-guard' }).damage)
  assert.deepEqual(move, before)
})

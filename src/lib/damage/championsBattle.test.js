import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateChampionsDamage } from './championsDamage.js'
import { applyStatChanges, getEffectiveAbility } from './championsBattle.js'
import { getOptimizerStatDependencies } from './championsOptimizer.js'
import { calculateChampionsStats } from './championsMath.js'
import { REGULATION_ROSTER } from '../regulation.js'
import { CHAMPIONS_MOVES } from './championsData.js'

const pokemon = (changes = {}) => ({ types: ['normal'], ability: '', item: '', boosts: {}, stats: { hp: 1000, atk: 120, def: 100, spa: 120, spd: 100, spe: 100 }, ...changes })
const damage = (move = 'Body Slam', attacker = {}, defender = {}, field = {}) => calculateChampionsDamage({ attacker: pokemon(attacker), defender: pokemon(defender), move, field })

test('Intimidate respects entry selection, prevention, reflection and triggered stat changes', () => {
  assert.equal(damage('Body Slam', {}, { ability: 'intimidate' }).attack, 80)
  assert.equal(damage('Body Slam', {}, { ability: 'intimidate', entryAbilityActive: false }).attack, 120)
  for (const ability of ['contrary', 'defiant', 'guard-dog']) assert.equal(damage('Body Slam', { ability }, { ability: 'intimidate' }).attack, 180, ability)
  for (const ability of ['clear-body', 'white-smoke', 'hyper-cutter', 'inner-focus', 'own-tempo', 'oblivious', 'scrappy']) assert.equal(damage('Body Slam', { ability }, { ability: 'intimidate' }).attack, 120, ability)
  assert.equal(damage('Body Slam', { ability: 'intimidate' }, { ability: 'mirror-armor' }).attack, 80)
  assert.equal(damage('Thunderbolt', { ability: 'competitive' }, { ability: 'intimidate' }).attack, 240)
  assert.equal(damage('Gyro Ball', { ability: 'rattled' }, { ability: 'intimidate' }).basePower, 17)
})

test('ally modifiers require Doubles and priority guards respect Mold Breaker', () => {
  for (const ability of ['plus', 'minus']) {
    assert.equal(damage('Thunderbolt', { ability, abilityOn: true }, {}, { gameType: 'Doubles' }).attack, 180)
    assert.equal(damage('Thunderbolt', { ability, abilityOn: true }).attack, 120)
  }
  const guarded = { gameType: 'Doubles', defenderSide: { isFriendGuard: true } }
  assert.equal(damage('Body Slam', {}, {}, guarded).finalMod, 3072)
  assert.equal(damage('Body Slam', { ability: 'mold-breaker' }, {}, guarded).finalMod, 4096)
  assert.equal(damage('Body Slam', {}, {}, { ...guarded, gameType: 'Singles' }).finalMod, 4096)
  assert.equal(damage('Body Slam', {}, { ability: 'friend-guard' }).finalMod, 4096)
  const priority = { gameType: 'Doubles', defenderSide: { isPriorityGuard: true } }
  assert.equal(damage('Fake Out', {}, {}, priority).max, 0)
  assert.ok(damage('Fake Out', { ability: 'mold-breaker' }, {}, priority).max > 0)
  assert.ok(damage('Fake Out', {}, {}, { ...priority, gameType: 'Singles' }).max > 0)
})

test('move immunities use source flags and Mold Breaker cannot bypass Ability Shield', () => {
  for (const [ability, move] of [['soundproof', 'Hyper Voice'], ['bulletproof', 'Aura Sphere'], ['lightning-rod', 'Thunderbolt'], ['motor-drive', 'Thunderbolt'], ['earth-eater', 'Earthquake'], ['eelevate', 'Earthquake'], ['dry-skin', 'Surf'], ['armor-tail', 'Fake Out'], ['queenly-majesty', 'Fake Out'], ['damp', 'Explosion']]) {
    assert.equal(damage(move, {}, { ability }).max, 0, ability)
    assert.ok(damage(move, { ability: 'mold-breaker' }, { ability }).max > 0, ability)
    assert.equal(damage(move, { ability: 'mold-breaker' }, { ability, item: 'ability-shield' }).max, 0, ability)
  }
  assert.equal(damage('Explosion', {}, {}, { gameType: 'Doubles', isDamp: true }).max, 0)
  assert.ok(damage('Explosion', { ability: 'mold-breaker' }, {}, { gameType: 'Doubles', isDamp: true }).max > 0)
})

test('conditional Defense and critical prevention use the effective ability', () => {
  assert.equal(damage('Body Slam', {}, { ability: 'grass-pelt' }, { terrain: 'Grassy' }).defense, 150)
  assert.equal(damage('Body Slam', {}, { ability: 'grass-pelt' }).defense, 100)
  assert.equal(damage('Body Slam', {}, { ability: 'marvel-scale', status: 'psn' }).defense, 150)
  assert.equal(damage('Body Slam', { ability: 'mold-breaker' }, { ability: 'marvel-scale', status: 'psn' }).defense, 100)
  for (const ability of ['battle-armor', 'shell-armor']) {
    assert.equal(damage('Flower Trick', {}, { ability }).isCritical, false)
    assert.equal(damage('Flower Trick', { ability: 'mold-breaker' }, { ability }).isCritical, true)
    assert.equal(damage('Body Slam', { ability: 'merciless' }, { ability, status: 'psn' }).isCritical, false)
  }
})

test('Sheer Force supports Electro Shot while Charge boosts Electric power independently', () => {
  const shot = damage('Electro Shot', { ability: 'sheer-force' })
  assert.equal(shot.basePower, 169)
  assert.equal(shot.attack, 180)
  assert.equal(damage('Electro Shot', { charged: true }).basePower, 260)
  assert.equal(damage('Raging Bull', { ability: 'pixilate' }).move.type, 'fairy')
  const blaze = damage('Raging Bull', { showdownId: 'taurospaldeablaze', ability: 'pixilate' })
  assert.equal(blaze.move.type, 'fire')
  assert.equal(blaze.basePower, 90)
})

test('entry boosts include terrain seeds, Opportunist and Supersweet Syrup', () => {
  assert.equal(damage('Body Press', { ability: 'opportunist' }, { item: 'electric-seed' }, { terrain: 'Electric' }).attack, 150)
  assert.equal(damage('Stored Power', { ability: 'contrary' }, { ability: 'supersweet-syrup' }).basePower, 40)
  assert.equal(damage('Stored Power', { ability: 'contrary' }, { ability: 'supersweet-syrup', entryAbilityActive: false }).basePower, 20)
})

test('status curing differs from preventing a new status and end-turn effects do not run between hits', () => {
  for (const [ability, status] of [['immunity', 'psn'], ['insomnia', 'slp'], ['vital-spirit', 'slp'], ['limber', 'par'], ['magma-armor', 'frz'], ['water-bubble', 'brn'], ['thermal-exchange', 'brn']]) {
    assert.equal(damage('Hex', {}, { ability, status }).effectiveDefender.status, '', ability)
  }
  assert.equal(damage('Hex', {}, { ability: 'purifying-salt', status: 'psn' }).effectiveDefender.status, 'psn')
  const move = { name: 'Hex', type: 'ghost', category: 'special', basePower: 65, multihit: 2 }
  assert.deepEqual(damage(move, {}, { ability: 'hydration', status: 'psn' }, { weather: 'Rain' }).damage, damage(move, {}, { status: 'psn' }, { weather: 'Rain' }).damage)
})

test('weather suppression keeps the actual weather available when Cloud Nine is lost between hits', () => {
  assert.equal(damage('Weather Ball', { ability: 'drought', entryAbilityActive: false }, {}, { weather: 'Rain' }).move.type, 'water')
  assert.equal(damage('Weather Ball', { ability: 'cloud-nine' }, {}, { weather: 'Sun' }).move.type, 'normal')
  const move = { name: 'Fire Punch', type: 'fire', category: 'physical', basePower: 75, flags: { contact: 1 }, multihit: 2 }
  const first = damage({ ...move, multihit: undefined }, { ability: 'cloud-nine' }, { ability: 'mummy' }, { weather: 'Sun' })
  const second = damage({ ...move, multihit: undefined }, { ability: 'mummy' }, { ability: 'mummy' }, { weather: 'Sun' })
  const sequence = damage(move, { ability: 'cloud-nine' }, { ability: 'mummy' }, { weather: 'Sun' })
  assert.equal(sequence.min, first.min + second.min)
  assert.equal(sequence.max, first.max + second.max)
})

test('Weather Ball type and power are fixed at move modification before Sand Spit', () => {
  const move = { name: 'Weather Ball', type: 'normal', category: 'special', basePower: 50, multihit: 2 }
  assert.deepEqual(damage(move, {}, { ability: 'sand-spit' }).damage, damage(move).damage)
  const pulse = { name: 'Terrain Pulse', type: 'normal', category: 'special', basePower: 50, multihit: 2 }
  assert.deepEqual(damage(pulse, {}, { ability: 'seed-sower' }).damage, damage(pulse).damage)
})

test('Forecast, Mimicry and ability copying preserve species restrictions', () => {
  assert.deepEqual(damage('Body Slam', { showdownId: 'castform', ability: 'forecast' }, {}, { weather: 'Rain' }).effectiveAttacker.types, ['water'])
  assert.deepEqual(damage('Body Slam', { showdownId: 'other', ability: 'forecast' }, {}, { weather: 'Rain' }).effectiveAttacker.types, ['normal'])
  assert.deepEqual(damage('Body Slam', { ability: 'mimicry' }, {}, { terrain: 'Psychic' }).effectiveAttacker.types, ['psychic'])
  assert.equal(damage('Body Slam', { ability: 'trace' }, { ability: 'huge-power' }).attack, 240)
  assert.equal(damage('Body Slam', { ability: 'trace', copiedAbility: 'pure-power' }).attack, 240)
  assert.equal(damage('Body Slam', { ability: 'receiver', copiedAbility: 'huge-power' }).attack, 240)
  assert.equal(getEffectiveAbility({ ability: 'trace', item: 'ability-shield' }, { ability: 'huge-power' }), 'trace')
  assert.equal(getEffectiveAbility({ ability: 'trace', item: 'ability-shield' }, { ability: 'huge-power' }, { isMagicRoom: true }), 'huge-power')
  assert.throws(() => damage('Body Slam', { ability: 'trace', copiedAbility: 'imposter' }), /Trace/)
  assert.throws(() => damage('Body Slam', { ability: 'receiver', copiedAbility: 'imposter' }), /Receiver/)
})

test('Imposter copies non-HP statistics after the target Power Trick without mutating inputs', () => {
  const attacker = pokemon({ ability: 'imposter', transformActive: true })
  const defender = pokemon({ ability: 'huge-power', powerTrick: true, types: ['water'], stats: { hp: 800, atk: 200, def: 80, spa: 90, spd: 110, spe: 60 }, boosts: { atk: 1 } })
  const before = structuredClone({ attacker, defender })
  const result = calculateChampionsDamage({ attacker, defender, move: 'Body Slam' })
  assert.equal(result.effectiveAttacker.stats.hp, 1000)
  assert.equal(result.effectiveAttacker.stats.atk, 80)
  assert.equal(result.attack, 240)
  assert.deepEqual(result.effectiveAttacker.types, ['water'])
  assert.deepEqual({ attacker, defender }, before)
  const dependencies = getOptimizerStatDependencies({ attacker, defender, move: { name: 'Body Slam', category: 'physical' }, field: {} })
  assert.ok(dependencies.defender.includes('def'))
  assert.equal(dependencies.offenseStat, 'def')
  assert.equal(dependencies.defenseStat, 'atk')
})

test('current Palafin form is resolved before Imposter and Stance Change affects only the attacker', () => {
  const build = (id, ability, extra = {}) => {
    const entry = REGULATION_ROSTER.find((row) => row.showdownId === id)
    assert.ok(entry)
    const p = { showdownId: id, baseStats: entry.baseStats, types: entry.types, nature: 'serious', sps: {}, ability, ...extra }
    return { ...p, stats: calculateChampionsStats(p) }
  }
  const hero = build('palafinhero', 'zero-to-hero')
  const result = damage('Body Slam', { ability: 'imposter', transformActive: true }, build('palafin', 'zero-to-hero', { abilityOn: true }))
  assert.equal(result.effectiveAttacker.stats.atk, hero.stats.atk)
  const aegislash = build('aegislash', 'stance-change')
  assert.equal(damage('Body Slam', aegislash).effectiveAttacker.showdownId, 'aegislashblade')
  assert.equal(damage('Body Slam', {}, aegislash).effectiveDefender.showdownId, 'aegislash')
})

test('Unaware preserves SpD stages used by Body Press under Wonder Room', () => {
  assert.equal(damage('Body Press', { boosts: { spd: 1 } }, { ability: 'unaware' }, { isWonderRoom: true }).attack, 150)
  assert.equal(damage('Body Press', { boosts: { def: 1 } }, { ability: 'unaware' }).attack, 100)
})

test('selected Effect Spore sleep interrupts following hits unless a berry cures it', () => {
  const move = { ...CHAMPIONS_MOVES['double-hit'] }
  const defender = { ability: 'effect-spore', reactionAfterHit: 1, reactionStatus: 'slp' }
  const first = damage({ ...move, multihit: undefined }, {}, defender)
  assert.equal(damage(move, {}, defender).max, first.max)
  assert.equal(damage(move, { item: 'chesto-berry' }, defender).max, first.max * 2)
  assert.equal(damage(move, { ability: 'overcoat' }, defender).max, first.max * 2)
})

test('Disguise still triggers contact damage and secondary effects before the next hit', () => {
  const move = { ...CHAMPIONS_MOVES['double-hit'] }
  const defender = { showdownId: 'mimikyu', types: ['fairy'], ability: 'disguise', item: 'rocky-helmet' }
  const result = damage(move, { currentHp: 1 }, defender)
  assert.equal(result.max, 0)
  assert.equal(result.remainingHp.min, 875)
  assert.equal(result.guaranteedKO, false)
  assert.ok(damage(move, { currentHp: 1, ability: 'magic-guard' }, defender).min > 0)
})

test('copying or losing Klutz updates item suppression before the next hit', () => {
  const move = { ...CHAMPIONS_MOVES['double-hit'] }
  assert.ok(damage(move, { ability: 'klutz', item: 'choice-band' }, { ability: 'mummy' }).max > damage(move, { ability: 'klutz' }, { ability: 'mummy' }).max)
  assert.ok(damage(move, { ability: 'huge-power' }, { ability: 'mummy' }).max < damage(move, { ability: 'huge-power' }).max)
  assert.ok(damage(move, { ability: 'huge-power' }, { ability: 'wandering-spirit' }).max < damage(move, { ability: 'huge-power' }).max)
})

test('stat reactions and prevention change only subsequent hits', () => {
  const crunch = { ...CHAMPIONS_MOVES.crunch, multihit: 2, conditions: { secondaryAfterHit: 1 } }
  const baseline = damage({ ...crunch, conditions: { secondaryAfterHit: 0 } })
  for (const ability of ['big-pecks', 'clear-body', 'white-smoke', 'shield-dust']) assert.equal(damage(crunch, {}, { ability }).max, baseline.max, ability)
  assert.ok(damage(crunch).max > baseline.max)
  assert.ok(damage(crunch, { ability: 'mold-breaker' }, { ability: 'big-pecks' }).max > baseline.max)
  assert.equal(damage(crunch, {}, { ability: 'mirror-armor' }).max, baseline.max)
  const source = pokemon({ currentHp: 1000 }), mirror = pokemon({ ability: 'mirror-armor' })
  applyStatChanges(mirror, { def: -1 }, true, { source })
  assert.equal(source.boosts.def, -1)
  assert.equal(mirror.boosts.def, undefined)
  assert.ok(damage({ ...CHAMPIONS_MOVES['foul-play'], multihit: 2 }, {}, { ability: 'justified' }).max > damage({ ...CHAMPIONS_MOVES['foul-play'], multihit: 2 }).max)
  const gyro = { ...CHAMPIONS_MOVES['gyro-ball'], multihit: 2 }
  assert.ok(damage(gyro, {}, { ability: 'gooey' }).max > damage(gyro).max)
  assert.ok(damage(crunch, {}, { ability: 'weak-armor' }).max > damage(crunch).max)
})

test('protection piercing, infiltration and copied priority use the verified attack flags', () => {
  const field = { defenderSide: { isProtected: true } }
  assert.equal(damage('Close Combat', {}, {}, field).max, 0)
  for (const ability of ['unseen-fist', 'piercing-drill']) {
    const result = damage('Close Combat', { ability }, {}, field)
    assert.ok(result.max > 0 && result.max < damage('Close Combat', { ability }).max)
    assert.equal(damage('Thunderbolt', { ability }, {}, field).max, 0)
  }
  assert.deepEqual(damage('Body Slam', { ability: 'infiltrator' }, {}, { defenderSide: { isReflect: true } }).damage, damage('Body Slam').damage)
  assert.equal(damage('Air Slash', { ability: 'gale-wings' }, { ability: 'armor-tail' }).max, 0)
  assert.ok(damage('Air Slash', { ability: 'gale-wings', currentHp: 999 }, { ability: 'armor-tail' }).max > 0)
})

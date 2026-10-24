import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateChampionsDamage } from './championsDamage.js'
import { calculateChampionsStats, STAT_IDS } from './championsMath.js'
import { CHAMPIONS_MOVES } from './championsData.js'
import { findKoOptions, findSurvivalOptions, getOptimizerBaseline, getOptimizerStatDependencies } from './championsOptimizer.js'

const emptySps = () => Object.fromEntries(STAT_IDS.map((stat) => [stat, 0]))
const pokemon = (changes = {}) => ({ baseStats: { hp: 80, atk: 100, def: 100, spa: 100, spd: 100, spe: 80 }, types: ['normal'], nature: 'serious', sps: emptySps(), ...changes })
const context = (move, attacker = {}, defender = {}, field = {}) => ({ attacker: pokemon({ offenseSp: 0, ...attacker }), defender: pokemon({ hp: 155, hpSp: 0, defenseSp: 0, ...defender }), move: { ...CHAMPIONS_MOVES[move] }, field })

// Independent finite enumeration: materialize every configured spread, call the
// public damage engine, then remove dominated successful spreads in a separate
// pass. This does not use the optimizer's enumeration, grouping or pruning.
function exhaustive(ctx, role, ranges, natures, practical = false) {
  let spreads = [{ ...ctx[role].sps }]
  for (const [stat, values] of Object.entries(ranges)) spreads = spreads.flatMap((sps) => values.map((value) => ({ ...sps, [stat]: value })))
  const successful = []
  for (const nature of natures) for (const sps of spreads) {
    if (Object.values(sps).reduce((sum, sp) => sum + sp, 0) > 66) continue
    const a = { ...ctx.attacker, ...(role === 'attacker' ? { sps, nature } : {}) }
    const d = { ...ctx.defender, ...(role === 'defender' ? { sps, nature } : {}) }
    a.stats = calculateChampionsStats(a)
    d.stats = calculateChampionsStats(d)
    a.currentHp = Math.min(a.currentHp ?? a.stats.hp, a.stats.hp)
    d.currentHp = Math.min(d.currentHp ?? (role === 'attacker' ? d.hp : d.stats.hp), d.stats.hp)
    const result = calculateChampionsDamage({ attacker: a, defender: d, move: ctx.move, field: { ...ctx.field, weather: '', gameType: 'Singles' } })
    if (role === 'attacker' ? result.guaranteedKO : result.guaranteedSurvival) successful.push({ nature, sps, min: result.min, max: result.max })
  }
  return successful.filter((candidate) => !successful.some((other) => other !== candidate && other.nature === candidate.nature
    && STAT_IDS.every((stat) => practical ? other.sps[stat] >= candidate.sps[stat] : other.sps[stat] <= candidate.sps[stat])
    && STAT_IDS.some((stat) => other.sps[stat] !== candidate.sps[stat])
    && (!practical || (role === 'attacker' ? other.min >= candidate.min : other.max <= candidate.max))))
}

const signature = ({ nature, sps }) => `${nature}:${STAT_IDS.map((stat) => sps[stat]).join(',')}`
function assertComplete(ctx, role, ranges, natures, rankingMode = 'minimum') {
  const expected = exhaustive(ctx, role, ranges, natures, rankingMode === 'practical').map(signature).sort()
  const search = role === 'attacker' ? findKoOptions : findSurvivalOptions
  const result = search(ctx, { [`${role}SpByStat`]: ranges, [`${role}Natures`]: natures, weather: [''], screens: [''], attackerBurned: [false], internalLimit: 10000, limit: 10000, rankingMode })
  const actual = result.displayed.flatMap((option) => (option[role].natureGroup?.natures ?? [option[role].nature]).map((nature) => signature({ nature, sps: option[role].sps }))).sort()
  assert.ok(expected.length, 'Fixture must contain successful spreads')
  assert.deepEqual(actual, expected)
  return result
}

test('Electro Ball KO search enumerates both SpA and Speed and preserves other investments', () => {
  const ctx = context('electro-ball', { baseStats: { hp: 80, atk: 100, def: 100, spa: 100, spd: 100, spe: 70 }, sps: { ...emptySps(), hp: 24, def: 8 } }, { currentHp: 27, hp: 27 })
  const original = structuredClone(ctx)
  const result = assertComplete(ctx, 'attacker', { spa: [0, 16, 32], spe: [0, 16, 32] }, ['serious', 'modest', 'quiet', 'timid'])
  assert.ok(result.displayed.some((option) => option.attacker.sps.spe > 0))
  assert.ok(result.displayed.every((option) => option.attacker.sps.hp === 24 && option.attacker.sps.def === 8))
  assert.ok(result.displayed.every((option) => Object.values(option.attacker.sps).reduce((sum, sp) => sum + sp, 0) <= 66))
  assert.deepEqual(ctx, original)
})

test('Gyro Ball does not group natures with different Speed effects', () => {
  const ctx = context('gyro-ball', { baseStats: { hp: 80, atk: 100, def: 100, spa: 100, spd: 100, spe: 40 } }, { baseStats: { hp: 80, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 }, currentHp: 24, hp: 24 })
  const result = assertComplete(ctx, 'attacker', { atk: [0, 8, 16], spe: [0, 8, 16] }, ['adamant', 'brave'])
  assert.ok(result.displayed.every((option) => !option.attacker.natureGroup?.natures.includes('adamant') || !option.attacker.natureGroup.natures.includes('brave')))
})

test('Shell Side Arm KO search covers physical and special investment routes', () => {
  const ctx = context('shell-side-arm', { baseStats: { hp: 80, atk: 90, def: 100, spa: 100, spd: 100, spe: 80 }, sps: { ...emptySps(), hp: 8 } }, { currentHp: 41, hp: 41 })
  const result = assertComplete(ctx, 'attacker', { atk: [0, 16, 32], spa: [0, 16, 32] }, ['serious', 'adamant', 'modest'])
  assert.ok(result.displayed.some((option) => option.damage.category === 'physical'))
  assert.ok(result.displayed.some((option) => option.damage.category === 'special'))
  assert.deepEqual(getOptimizerStatDependencies(ctx).attacker, ['atk', 'spa'])
})

test('Shell Side Arm survival enumerates HP, Defense and SpD across category changes', () => {
  const ctx = context('shell-side-arm', { baseStats: { hp: 80, atk: 250, def: 100, spa: 240, spd: 100, spe: 80 } }, { baseStats: { hp: 25, atk: 100, def: 80, spa: 100, spd: 80, spe: 80 }, hp: 100, sps: { ...emptySps(), spe: 8 } })
  const result = assertComplete(ctx, 'defender', { hp: [0, 16, 32], def: [0, 16, 32], spd: [0, 16, 32] }, ['serious', 'bold', 'calm', 'relaxed'])
  assert.ok(result.displayed.some((option) => option.defender.sps.def > 0 && option.defender.sps.spd > 0))
})

test('Imposter dependencies follow the owner of copied statistics and preserve own HP', () => {
  const attacking = context('electro-ball', { ability: 'imposter', transformActive: true })
  assert.deepEqual(getOptimizerStatDependencies(attacking).attacker, [])
  const defending = context('earthquake', {}, { ability: 'imposter', transformActive: true })
  assert.deepEqual(getOptimizerStatDependencies(defending).attacker, ['atk', 'def'])
  assert.deepEqual(getOptimizerStatDependencies(defending).defender, ['hp'])
  const result = assertComplete({ ...defending, defender: { ...defending.defender, currentHp: 1, hp: 1 } }, 'attacker', { atk: [0, 16], def: [0, 16] }, ['serious', 'adamant', 'lonely'])
  assert.ok(result.displayed.every((option) => option.attacker.investmentStats.includes('def')))
})

test('Wonder Room and Power Trick search the invested source statistic', () => {
  const ctx = context('body-press', { powerTrick: true }, {}, { isWonderRoom: true })
  assert.deepEqual(getOptimizerStatDependencies(ctx).attacker, ['atk'])
  assert.deepEqual(getOptimizerStatDependencies(ctx).defender, ['hp', 'spd'])
})

test('Foul Play survival can reduce the target Attack instead of buying irrelevant attacker SP', () => {
  const ctx = context('foul-play', {}, { sps: { ...emptySps(), atk: 16 } })
  assert.deepEqual(getOptimizerStatDependencies(ctx).defender, ['hp', 'atk', 'def'])
  assertComplete(ctx, 'defender', { hp: [0, 16], atk: [0, 16], def: [0, 16] }, ['serious', 'bold', 'impish'])
})

test('KO searches preserve both screens when Shell Side Arm changes category', () => {
  const ctx = context('shell-side-arm', {}, {}, { screen: 'Light Screen', defenderSide: { isReflect: true, isLightScreen: true } })
  const result = getOptimizerBaseline(ctx)
  const bare = getOptimizerBaseline({ ...ctx, field: {} })
  assert.ok(result.max < bare.max)
  ctx.attacker.sps.atk = 32
  assert.equal(getOptimizerBaseline(ctx).move.category, 'physical')
  assert.ok(getOptimizerBaseline(ctx).max < getOptimizerBaseline({ ...ctx, field: {} }).max)
})

test('Payback ties exclude only unresolved candidates and report their number', () => {
  const ctx = context('payback', {}, { currentHp: 1, hp: 1 })
  const result = findKoOptions(ctx, { attackerNatures: ['serious'], attackerSpByStat: { atk: [0], spe: [0, 1] }, weather: [''] })
  assert.equal(result.excludedCandidates, 1)
  assert.equal(result.displayed.length, 1)
  assert.equal(result.displayed[0].attacker.sps.spe, 1)
})

test('both rankings and their bounded retained sets agree with the complete frontier', () => {
  const ctx = context('shell-side-arm', { baseStats: { hp: 80, atk: 250, def: 100, spa: 240, spd: 100, spe: 80 } }, { baseStats: { hp: 25, atk: 100, def: 80, spa: 100, spd: 80, spe: 80 }, hp: 100 })
  const ranges = { hp: [0, 16, 32], def: [0, 16, 32], spd: [0, 16, 32] }
  const natures = ['serious', 'bold', 'calm']
  for (const rankingMode of ['minimum', 'practical']) {
    const complete = assertComplete(ctx, 'defender', ranges, natures, rankingMode)
    const bounded = findSurvivalOptions(ctx, { defenderSpByStat: ranges, defenderNatures: natures, weather: [''], screens: [''], attackerBurned: [false], rankingMode, limit: 2, internalLimit: 2 })
    assert.deepEqual(bounded.displayed, complete.displayed.slice(0, 2))
  }
})

test('HP-dependent offensive damage is not assumed to improve as HP investment increases', () => {
  const ctx = context('eruption', { currentHp: 30 }, { currentHp: 8, hp: 8 })
  assertComplete(ctx, 'attacker', { hp: [0, 16, 32], spa: [0, 16, 32] }, ['serious', 'modest'], 'practical')
})

test('Shell Side Arm never reuses HP-independent damage across Multiscale thresholds', () => {
  const ctx = context('shell-side-arm', { baseStats: { hp: 80, atk: 250, def: 100, spa: 240, spd: 100, spe: 80 } }, { baseStats: { hp: 45, atk: 100, def: 80, spa: 100, spd: 80, spe: 80 }, currentHp: 120, hp: 120, ability: 'multiscale' })
  const result = assertComplete(ctx, 'defender', { hp: [0, 16, 32], def: [0], spd: [0] }, ['serious'], 'practical')
  assert.equal(result.total, 2)
})

test('Shell Side Arm recalculates Focus Sash when max HP investment changes full-HP eligibility', () => {
  const ctx = context('shell-side-arm', { baseStats: { hp: 80, atk: 400, def: 100, spa: 400, spd: 100, spe: 80 } }, { baseStats: { hp: 45, atk: 100, def: 80, spa: 100, spd: 80, spe: 80 }, currentHp: 120, hp: 120, item: 'focus-sash' })
  const result = assertComplete(ctx, 'defender', { hp: [0, 16, 32], def: [0], spd: [0] }, ['serious'])
  assert.ok(result.displayed.every((option) => option.defender.sps.hp === 0))
})

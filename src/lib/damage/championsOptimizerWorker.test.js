import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runOptimizerJob } from './championsOptimizer.worker.js'
import { calculateMoveRows, createDamageBuild, createOptimizerContext } from './championsMatchup.js'

const pokemon = { displayName: 'Fixture', types: ['normal'], stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((name) => ({ name, value: 100 })) }

test('the worker job keeps the selected reaction and uses sequence survival guarantees', () => {
  const a = createDamageBuild(), d = { ...createDamageBuild(), ability: 'flame-body', reactionAfterHit: 1 }
  const row = calculateMoveRows(pokemon, pokemon, a, d, ['double-hit'], {})[0]
  const context = createOptimizerContext(pokemon, pokemon, a, d, row.move, {})
  const original = structuredClone(context)
  const result = runOptimizerJob({ mode: 'survival', context, rankingMode: 'minimum' })
  assert.equal(result.alreadySatisfied, true)
  assert.equal(result.min, row.result.min)
  assert.equal(result.max, row.result.max)
  assert.deepEqual(context, original)
})

test('the worker job rejects an unknown mode', () => {
  assert.throws(() => runOptimizerJob({ mode: 'unknown' }), /Modalità/)
})

test('the worker search returns transferable complete spreads with related Speed investment', () => {
  const a = createDamageBuild(), d = { ...createDamageBuild(), currentHp: 30 }
  const row = calculateMoveRows(pokemon, pokemon, a, d, ['electro-ball'], {})[0]
  const context = structuredClone(createOptimizerContext(pokemon, pokemon, a, d, row.move, {}))
  const original = structuredClone(context)
  const result = structuredClone(runOptimizerJob({ mode: 'ko', context, rankingMode: 'minimum' }))
  assert.ok(result.displayed.length)
  assert.deepEqual(result.displayed[0].attacker.investmentStats, ['spa', 'spe'])
  assert.ok(result.displayed.every((option) => option.damage.guaranteedKO && Object.values(option.attacker.sps).reduce((sum, sp) => sum + sp, 0) <= 66))
  assert.deepEqual(context, original)
})

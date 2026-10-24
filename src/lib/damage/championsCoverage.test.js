import assert from 'node:assert/strict'
import { test } from 'node:test'
import mc from '../../data/regulations/mc.js'
import mb from '../../data/regulations/mb.js'
import { getAbilityCoverage, getAbilityCoverageNote, getBattleAbilityCoverageNotes } from './championsCoverage.js'
import { calculateMoveRows, createDamageBuild, createOptimizerContext } from './championsMatchup.js'

test('reviewed behavior is reusable across regulations while new or changed effects require review', () => {
  assert.equal(getAbilityCoverage('Tough Claws', mc.abilityMechanics), 'implemented')
  assert.equal(getAbilityCoverage('Tough Claws', mb.abilityMechanics), 'implemented')
  assert.equal(getAbilityCoverage('New Ability', { 'new-ability': { fingerprint: 'new' } }), 'unknown')
  assert.equal(getAbilityCoverage('Tough Claws', { 'tough-claws': { fingerprint: 'changed' } }), 'changed')
  assert.equal(getAbilityCoverage('Tough Claws', {}), 'changed')
  assert.match(getAbilityCoverageNote('tough-claws', 'Tough Claws', { 'tough-claws': { fingerprint: 'changed' } }), /nuova verifica/)
})

test('reviewed non-damage effects are distinguished from unimplemented abilities', () => {
  assert.equal(getAbilityCoverage('Frisk', mc.abilityMechanics), 'no-direct-effect')
  assert.equal(getAbilityCoverageNote('Frisk', 'Frisk', mc.abilityMechanics), '')
  assert.equal(getAbilityCoverage('Flash Fire', mc.abilityMechanics), 'implemented')
  assert.equal(getAbilityCoverage('Unimplemented Ability', mc.abilityMechanics), 'unknown')
})

test('an unknown ability cannot produce numeric UI damage or optimizer guarantees', () => {
  const pokemon = { types: ['normal'], stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((name) => ({ name, value: 100 })) }
  const a = { ...createDamageBuild(), ability: 'new-ability', abilityName: 'New Ability' }, b = createDamageBuild()
  const [row] = calculateMoveRows(pokemon, pokemon, a, b, ['thunderbolt'], {})
  assert.equal(row.result, null)
  assert.match(row.reason, /New Ability/)
  assert.equal(createOptimizerContext(pokemon, pokemon, a, b, row.move, {}), null)
  const [reverse] = calculateMoveRows(pokemon, pokemon, b, a, ['thunderbolt'], {})
  assert.equal(reverse.result, null)
})

test('an unreviewed item cannot silently produce UI damage or optimizer guarantees', () => {
  const pokemon = { types: ['normal'], stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((name) => ({ name, value: 100 })) }
  const a = { ...createDamageBuild(), item: 'new-item', itemName: 'New Item' }, b = createDamageBuild()
  const row = calculateMoveRows(pokemon, pokemon, a, b, ['thunderbolt'], {})[0]
  assert.equal(row.result, null)
  assert.match(row.reason, /New Item/)
  assert.equal(createOptimizerContext(pokemon, pokemon, a, b, row.move, {}), null)
})

test('a reviewed copying ability cannot bypass review of the copied behavior', () => {
  for (const ability of ['trace', 'receiver']) {
    const build = { ...createDamageBuild(), ability, copiedAbility: 'new-ability' }
    assert.ok(getBattleAbilityCoverageNotes(build, createDamageBuild()).some((note) => note.includes('new-ability')))
    const pokemon = { types: ['normal'], stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((name) => ({ name, value: 100 })) }
    const [row] = calculateMoveRows(pokemon, pokemon, build, createDamageBuild(), ['thunderbolt'], {})
    assert.equal(row.result, null)
    assert.equal(createOptimizerContext(pokemon, pokemon, build, createDamageBuild(), row.move, {}), null)
  }
})

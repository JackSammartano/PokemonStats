import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildRoster, SHOWDOWN_COMMIT } from './import-regulation-mc.mjs'
import { REGULATION_MC_ROSTER, REGULATION_MC_SOURCE } from '../src/data/regulationMc.js'

const byId = new Map(REGULATION_MC_ROSTER.map((entry) => [entry.showdownId, entry]))

test('M-C includes the new species, genders, regional forms and all six announced Megas', () => {
  for (const id of [
    'rillaboom', 'cinderace', 'inteleon', 'baxcalibur', 'golisopod', 'salamence',
    'indeedee', 'indeedeef', 'persianalola', 'toxtricitylowkey', 'pawmot',
    'arboliva', 'mabosstiff', 'watchog', 'floetteeternal', 'meowsticf', 'palafinhero',
    'absolmegaz', 'salamencemega', 'garchompmegaz', 'lucariomegaz', 'golisopodmega', 'baxcaliburmega',
  ]) assert.ok(byId.has(id), `Missing ${id}`)
  for (const id of ['patrat', 'floette', 'bulbasaur', 'mewtwo', 'charizardgmax', 'vivillonpolar']) {
    assert.equal(byId.has(id), false, `Unexpected ${id}`)
  }
})

test('snapshot has unique identities, complete stats and the pinned source', () => {
  assert.equal(REGULATION_MC_SOURCE.commit, SHOWDOWN_COMMIT)
  assert.equal(new Set(REGULATION_MC_ROSTER.map((entry) => entry.displayName)).size, REGULATION_MC_ROSTER.length)
  assert.equal(byId.size, REGULATION_MC_ROSTER.length)
  for (const entry of REGULATION_MC_ROSTER) {
    assert.equal(Object.keys(entry.baseStats).length, 6)
    assert.ok(Object.values(entry.baseStats).every((value) => Number.isInteger(value) && value > 0))
    assert.ok(entry.types.length > 0 && entry.abilities.length > 0)
    assert.ok(entry.abilities.every((ability) => ability.description))
    assert.ok(['base', 'form', 'mega'].includes(entry.category))
  }
})

test('Mega Z identities keep their distinct typing, stats and abilities', () => {
  assert.deepEqual(byId.get('absolmegaz').types, ['dark', 'ghost'])
  assert.equal(byId.get('absolmegaz').baseStats.atk, 154)
  assert.deepEqual(byId.get('garchompmegaz').types, ['dragon'])
  assert.equal(byId.get('garchompmegaz').abilities[0].id, 'levitate')
  assert.notEqual(byId.get('garchompmega').apiName, byId.get('garchompmegaz').apiName)
  assert.equal(byId.get('maushold').apiName, 'maushold-family-of-three')
  assert.equal(byId.get('mausholdfour').apiName, 'maushold-family-of-four')
})

test('import inherits legal form tiers without importing illegal or cosmetic forms', () => {
  const species = { num: 1, name: 'Example', types: ['Grass'], baseStats: { hp: 50 }, abilities: { 0: 'Overgrow' }, cosmeticFormes: ['Example-Pretty'] }
  const pokedex = {
    example: species,
    exampleform: { ...species, name: 'Example-Form', baseSpecies: 'Example', forme: 'Form' },
    examplepretty: { ...species, name: 'Example-Pretty', baseSpecies: 'Example', forme: 'Pretty' },
    examplepast: { ...species, name: 'Example-Past', baseSpecies: 'Example', forme: 'Past' },
    unrelated: { ...species, name: 'Unrelated' },
  }
  const roster = buildRoster(pokedex, { example: { tier: 'UU' }, examplepast: { isNonstandard: 'Past' } }, {})
  assert.deepEqual(roster.map((entry) => entry.showdownId), ['example', 'exampleform'])
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildMegaEvolutionLinks, buildRoster, getLearnedMoves, mergeLearnsets, SHOWDOWN_COMMIT } from './import-regulation-mc.mjs'
import { REGULATION_MC_ROSTER, REGULATION_MC_SOURCE } from '../src/data/regulationMc.js'

const byId = new Map(REGULATION_MC_ROSTER.map((entry) => [entry.showdownId, entry]))

test('Mega mapping uses item form pairs rather than guessing from species or stone names', () => {
  const roster = ['meowstic', 'meowsticf', 'meowsticmmega', 'meowsticfmega'].map((id) => byId.get(id))
  const items = { meowsticite: { name: 'Meowsticite', megaStone: { Meowstic: 'Meowstic-M-Mega', 'Meowstic-F': 'Meowstic-F-Mega' } } }
  const links = buildMegaEvolutionLinks(roster, items)
  assert.equal(links.length, 2)
  assert.equal(links.find((link) => link.megaId === 'meowsticfmega').baseId, 'meowsticf')
  assert.throws(() => buildMegaEvolutionLinks(roster, {}), /Missing or ambiguous/)
})

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
  assert.equal(byId.has('mausholdfour'), false)
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
  const roster = buildRoster(pokedex, { example: { tier: 'UU' }, examplepast: { isNonstandard: 'Past' } }, {}, {
    example: { learnset: { tackle: ['9M'] } }, exampleform: { learnset: { growl: ['9M'] } },
  })
  assert.deepEqual(roster.map((entry) => entry.showdownId), ['example', 'exampleform'])
})

test('equivalent forms are excluded while stat, ability, type and move differences stay distinct', () => {
  const base = { num: 1, name: 'Example', types: ['Grass'], baseStats: { hp: 50 }, abilities: { 0: 'Overgrow' } }
  const form = (name, changes = {}) => ({ ...base, name: `Example-${name}`, baseSpecies: 'Example', forme: name, ...changes })
  const dex = {
    example: base, examplepretty: form('Pretty'),
    examplestats: form('Stats', { baseStats: { hp: 60 } }),
    exampleability: form('Ability', { abilities: { 0: 'Chlorophyll' } }),
    exampletype: form('Type', { types: ['Fire'] }),
    examplemoves: form('Moves'),
  }
  const rows = buildRoster(dex, { example: { tier: 'UU' } }, {}, {
    example: { learnset: { tackle: ['9M'] } },
    examplemoves: { learnset: { tackle: ['9M'], growl: ['9M'] } },
  })
  assert.deepEqual(new Set(rows.map((entry) => entry.showdownId)), new Set([
    'example', 'examplestats', 'exampleability', 'exampletype', 'examplemoves',
  ]))
})

test('roster excludes cosmetic duplicates and preserves functional forms and battle states', () => {
  for (const id of ['polteageistantique', 'sinistchamasterpiece', 'vivillonfancy', 'vivillonpokeball', 'mausholdfour', 'squawkabillyblue', 'squawkabillywhite']) {
    assert.equal(byId.has(id), false, id)
  }
  for (const id of ['polteageist', 'sinistcha', 'vivillon', 'maushold', 'squawkabilly', 'squawkabillyyellow', 'toxtricitylowkey', 'meowsticf', 'morpekohangry', 'mimikyubusted']) {
    assert.ok(byId.has(id), id)
  }
  assert.notDeepEqual(byId.get('squawkabilly').abilities, byId.get('squawkabillyyellow').abilities)
})

test('missing or cyclic learnsets fail the import rather than treating unknown moves as identical', () => {
  assert.throws(() => getLearnedMoves('missing', {}, {}), /Missing Champions learnset/)
  assert.throws(() => getLearnedMoves('a', { a: { baseSpecies: 'B' }, b: { baseSpecies: 'A' } }, {}), /Circular/)
})

test('Champions learnsets replace inherited move tables instead of adding obsolete base moves', () => {
  const result = mergeLearnsets({
    example: { eventData: ['event'], learnset: { oldmove: ['7M'] } },
    removed: { learnset: { tackle: ['9M'] } },
  }, {
    example: { inherit: true, learnset: { newmove: ['9M'] } }, removed: null,
  })
  assert.deepEqual(result.example.learnset, { newmove: ['9M'] })
  assert.deepEqual(result.example.eventData, ['event'])
  assert.equal(result.removed, undefined)
})

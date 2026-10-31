import assert from 'node:assert/strict'
import { test } from 'node:test'
import mc from '../data/regulations/mc.js'
import { createCompetitiveDescriptions } from './competitive/descriptions.js'

const describe = createCompetitiveDescriptions({ moves: mc.moves, items: mc.items, roster: mc.roster })

test('historical M-C competitive descriptions resolve names and IDs using the source text', () => {
  assert.deepEqual(describe('items', 'ejectbutton'), describe('items', 'Eject Button'))
  assert.equal(describe('items', 'Eject Button').description, mc.items.find((item) => item.id === 'eject-button').description)
  assert.equal(describe('moves', 'Fake Out').description, mc.moves['fake-out'].presentation.shortDesc)
  assert.equal(describe('moves', 'Fake Out').facts.find((fact) => fact.label === 'Potenza base').value, '40')
  assert.equal(describe('moves', 'Protect').facts.find((fact) => fact.label === 'Categoria').value, 'Stato')
  assert.equal(describe('moves', 'Protect').facts.find((fact) => fact.label === 'Potenza base').value, '—')
  assert.equal(describe('abilities', 'Grassy Surge').description, mc.roster.find((pokemon) => pokemon.showdownId === 'rillaboom').abilities.find((ability) => ability.id === 'grassysurge').description)
  assert.equal(describe('abilities', 'grassysurge').lang, 'en')
})

test('nature descriptions derive positive, negative and neutral effects without inferring a spread', () => {
  assert.equal(describe('natures', 'Adamant').description, 'Attacco +10%; Attacco Speciale −10%.')
  assert.equal(describe('natures', 'Timid').description, 'Velocità +10%; Attacco −10%.')
  for (const neutral of ['Serious', 'Bashful', 'Docile', 'Hardy', 'Quirky']) assert.equal(describe('natures', neutral).description, 'Non modifica le statistiche.')
  assert.equal(describe('natures', 'Adamant').lang, 'it')
  assert.deepEqual(describe('natures', 'Adamant').facts, [])
})

test('unrecognized values have an explicit missing description and empty items are distinct', () => {
  for (const kind of ['moves', 'items', 'abilities', 'natures']) {
    const data = describe(kind, 'Unknown Value')
    assert.equal(data.name, 'Unknown Value')
    assert.match(data.description, /non disponibile/)
    assert.equal(data.lang, 'it')
  }
  assert.equal(describe('items', '').description, 'Non è assegnato alcuno strumento.')
  assert.equal(describe('teammates', 'Rillaboom'), null)
})

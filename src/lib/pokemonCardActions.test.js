import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getPokemonCardActions } from './pokemonCardActions.js'

const emptyTeams = { attacker: [], defender: [] }
const compareIds = (actions) => actions.filter((action) => action.id.startsWith('compare-')).map((action) => action.id)

test('comparison actions use the first free slot, including a freed first slot', () => {
  assert.deepEqual(compareIds(getPokemonCardActions('Charizard', emptyTeams, '', '')), ['compare-1'])
  assert.deepEqual(compareIds(getPokemonCardActions('Venusaur', emptyTeams, 'Charizard', '')), ['compare-2'])
  assert.deepEqual(compareIds(getPokemonCardActions('Blastoise', emptyTeams, '', 'Venusaur')), ['compare-1'])
})

test('full comparisons require an explicit replacement target and existing Pokemon are not duplicated', () => {
  const full = getPokemonCardActions('Blastoise', emptyTeams, 'Charizard', 'Venusaur')
  assert.deepEqual(compareIds(full), ['compare-1', 'compare-2'])
  assert.equal(full.find((action) => action.id === 'compare-1').description, 'Sostituisci Charizard')
  const existing = getPokemonCardActions('Venusaur', emptyTeams, 'Charizard', 'Venusaur')
  assert.deepEqual(compareIds(existing), ['compare-2'])
  assert.equal(existing.find((action) => action.id === 'compare-2').selected, true)
})

test('a full squad only disables its own addition and still permits removal', () => {
  const teams = { attacker: ['A', 'B', 'C', 'D', 'E', 'F'], defender: [] }
  const newcomer = getPokemonCardActions('Charizard', teams, '', '')
  assert.equal(newcomer[0].disabled, true)
  assert.equal(newcomer[1].disabled, false)
  assert.equal(newcomer[2].disabled, false)
  const present = getPokemonCardActions('A', teams, '', '')
  assert.equal(present[0].disabled, false)
  assert.equal(present[0].selected, true)
})

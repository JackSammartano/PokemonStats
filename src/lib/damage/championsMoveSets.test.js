import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getPokemonMoveSlots, moveSetKey, resolveMoveSlots, updatePokemonMoveSlot } from './championsMoveSets.js'

const pokemon = { displayName: 'Test', moves: ['flamethrower', 'earthquake', 'surf', 'thunderbolt', 'ice-beam'].map((id) => ({ id })) }

test('four slots preserve order and empty slots without inserting arbitrary replacement moves', () => {
  const moves = ['surf', '', 'flamethrower', 'ice-beam']
  assert.deepEqual(resolveMoveSlots(pokemon, moves), moves)
  assert.deepEqual(resolveMoveSlots(pokemon, ['', '', '', '']), ['', '', '', ''])
  assert.deepEqual(resolveMoveSlots(pokemon, ['surf', 'unknown', 'surf', 'earthquake', 'thunderbolt']), ['surf', '', '', 'earthquake'])
})

test('move edits persist per Pokemon and side, including mirror matches', () => {
  let state = updatePokemonMoveSlot({}, 'attacker', pokemon, 0, 'surf')
  state = updatePokemonMoveSlot(state, 'defender', pokemon, 0, 'ice-beam')
  assert.equal(getPokemonMoveSlots(state, 'attacker', pokemon)[0], 'surf')
  assert.equal(getPokemonMoveSlots(state, 'defender', pokemon)[0], 'ice-beam')
  const another = { ...pokemon, displayName: 'Another' }
  state = updatePokemonMoveSlot(state, 'attacker', another, 0, 'thunderbolt')
  assert.equal(getPokemonMoveSlots(state, 'attacker', pokemon)[0], 'surf')
  assert.equal(getPokemonMoveSlots(state, 'attacker', another)[0], 'thunderbolt')
})

test('changing a slot cannot mutate an existing set or retain an unlearned move', () => {
  const saved = { [moveSetKey('attacker', pokemon.displayName)]: ['surf', '', '', ''] }
  const edited = updatePokemonMoveSlot(saved, 'attacker', pokemon, 1, 'thunderbolt')
  assert.deepEqual(saved[moveSetKey('attacker', pokemon.displayName)], ['surf', '', '', ''])
  assert.deepEqual(edited[moveSetKey('attacker', pokemon.displayName)], ['surf', 'thunderbolt', '', ''])
  const limited = { ...pokemon, moves: [{ id: 'surf' }] }
  assert.deepEqual(getPokemonMoveSlots(edited, 'attacker', limited), ['surf', '', '', ''])
})

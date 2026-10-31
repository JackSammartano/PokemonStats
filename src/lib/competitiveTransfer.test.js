import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { applyCompetitiveTransfer, previewCompetitiveTransfer } from './competitiveTransfer.js'
import { createTeamWorkspace } from './teamWorkspace.js'
import { createDamageBuild } from './damage/championsMatchup.js'
import { getTeamMoveOptions } from './teamData.js'
import { REGULATION_ROSTER } from './regulation.js'
import { parseChampionsSpread } from './competitive/normalize.js'

const manifest = JSON.parse(readFileSync(new URL('../data/competitive/manifest.json', import.meta.url)))
const snapshot = JSON.parse(readFileSync(new URL(`../data/competitive/${manifest.snapshots[0].file}`, import.meta.url)))
const entry = snapshot.pokemon[0]
const pokemon = REGULATION_ROSTER.find((pokemon) => pokemon.showdownId === entry.showdownId)
const legal = new Set(getTeamMoveOptions(pokemon).options.map((move) => move.value))
const selectedMoves = entry.distributions.moves.entries.filter((row) => legal.has(row.key)).slice(0, 4).map((row) => row.key)
const request = (kind) => ({ kind, snapshot, entry })
const workspace = () => ({ ...createTeamWorkspace(), teams: { attacker: [pokemon.displayName], defender: ['Charizard'] }, builds: { [`attacker:${pokemon.displayName}`]: { ...createDamageBuild(), item: 'leftovers', ability: 'grassysurge', boosts: { atk: 2, def: 0, spa: 0, spd: 0, spe: 0 } } }, moveSets: { [`attacker:${pokemon.displayName}`]: ['', '', '', ''], 'defender:Charizard': ['protect', '', '', ''] } })

test('competitive move transfer applies only explicitly selected moves in order and preserves builds and the other squad', () => {
  const current = workspace(), before = JSON.stringify(current)
  const result = applyCompetitiveTransfer(current, 'attacker', request('moves'), { moves: selectedMoves.slice(0, 2).reverse() })
  assert.deepEqual(result.moveSets[`attacker:${pokemon.displayName}`], [...selectedMoves.slice(0, 2).reverse(), '', ''])
  assert.deepEqual(result.builds, current.builds)
  assert.deepEqual(result.teams.defender, current.teams.defender)
  assert.deepEqual(result.moveSets['defender:Charizard'], current.moveSets['defender:Charizard'])
  assert.equal(JSON.stringify(current), before)
})
test('competitive spread transfer uses an observed nature/SP pair without replacing item, ability, boosts or moves', () => {
  const current = workspace(), key = entry.distributions.spreads.entries[0].key
  const result = applyCompetitiveTransfer(current, 'attacker', request('spread'), { spreadKey: key })
  const expected = parseChampionsSpread(key), build = result.builds[`attacker:${pokemon.displayName}`]
  assert.equal(build.nature, expected.nature.toLowerCase())
  assert.deepEqual(Object.values(build.sps), expected.points)
  assert.equal(build.item, 'leftovers')
  assert.equal(build.ability, 'grassysurge')
  assert.equal(build.boosts.atk, 2)
  assert.deepEqual(result.moveSets, current.moveSets)
})
test('competitive transfer adds the exact form to either destination with empty unset slots for a spread-only addition', () => {
  const key = entry.distributions.spreads.entries[0].key
  for (const side of ['attacker', 'defender']) {
    const result = applyCompetitiveTransfer(createTeamWorkspace(), side, request('spread'), { spreadKey: key })
    assert.deepEqual(result.teams[side], [pokemon.displayName])
    assert.deepEqual(result.moveSets[`${side}:${pokemon.displayName}`], ['', '', '', ''])
    assert.equal(result.builds[`${side}:${pokemon.displayName}`].ability, '')
  }
})
test('competitive transfer blocks a full destination only when the exact Pokémon is not already present', () => {
  const current = workspace()
  current.teams.attacker = [pokemon.displayName, 'Charizard', 'Venusaur', 'Gengar', 'Garchomp', 'Pelipper']
  assert.equal(previewCompetitiveTransfer(current, 'attacker', request('moves'), { moves: selectedMoves }).exists, true)
  current.teams.attacker[0] = 'Dragonite'
  assert.throws(() => applyCompetitiveTransfer(current, 'attacker', request('moves'), { moves: selectedMoves }), /completa/)
})
test('competitive transfer rejects incompatible snapshots, invented spread keys, repeated/unobserved moves and wrong sides', () => {
  const current = workspace(), before = JSON.stringify(current)
  for (const changes of [{ format: 'different' }, { mechanicsReference: 'wrong' }, { provider: 'limitless' }, { statSystem: 'evs' }]) assert.throws(() => applyCompetitiveTransfer(current, 'attacker', { ...request('moves'), snapshot: { ...snapshot, ...changes } }, { moves: selectedMoves }), /compatibili/)
  for (const moves of [[], Array(5).fill(selectedMoves[0]), [selectedMoves[0], selectedMoves[0]], ['inventedmove']]) assert.throws(() => applyCompetitiveTransfer(current, 'attacker', request('moves'), { moves }))
  assert.throws(() => applyCompetitiveTransfer(current, 'attacker', request('spread'), { spreadKey: 'Adamant:252/0/0/0/0/0' }))
  assert.throws(() => applyCompetitiveTransfer(current, 'other', request('moves'), { moves: selectedMoves }))
  assert.equal(JSON.stringify(current), before)
})

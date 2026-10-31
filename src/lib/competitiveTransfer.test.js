import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { applyCompetitiveTransfer, competitiveTransferMoves, competitiveTransferOptions, createNativeBuildTransfer, createNativeMovesTransfer, emptyCompetitiveSelection, previewCompetitiveTransfer } from './competitiveTransfer.js'
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

// Synthetic normalized provider rows: percentages are test values, not real statistics.
const nativeData = (changes = {}) => ({ showdownId: 'rillaboom', name: 'Rillaboom', season: 'Current', format: 'Doubles', date: null,
  source: 'pokemon_champions_assets/battle_data/synthetic/Rillaboom.csv', groups: {
    move: ['Fake Out', 'Protect', 'Water Spout', 'Unknown Native Move', 'fake-out'].map((name, index) => ({ rank: index + 1, name, percentage: index === 0 ? null : 10, points: null })),
    stat_points: [{ rank: 1, points: [32, 32, 2, 0, 0, 0], percentage: 10 }], stat_alignment: [{ rank: 1, name: 'Modest', percentage: 10 }],
  }, ...changes })

test('native transfers map exact move names/IDs to catalogue kebab IDs, deduplicate aliases and keep unknown choices explicitly unmapped', () => {
  const data = nativeData(), before = JSON.stringify(data)
  const request = createNativeMovesTransfer(data), choices = competitiveTransferMoves(request)
  assert.deepEqual(choices.map((row) => row.key), ['fake-out', 'protect', 'water-spout', 'unmapped:4'])
  assert.equal(choices[3].sourceName, 'Unknown Native Move')
  assert.equal(request.snapshot, undefined)
  assert.equal(request.provider, 'champions-battle-data')
  assert.equal(JSON.stringify(data), before)
})
test('native move transfer respects explicit order and leaves all existing set fields and the opposite squad intact', () => {
  const current = workspace(), name = 'attacker:Rillaboom'
  current.builds[name] = { ...current.builds[name], nature: 'adamant', sps: { hp: 4, atk: 32, def: 0, spa: 0, spd: 0, spe: 30 } }
  const before = JSON.stringify(current)
  const result = applyCompetitiveTransfer(current, 'attacker', createNativeMovesTransfer(nativeData()), { moves: ['protect', 'fake-out'] })
  assert.deepEqual(result.moveSets[name], ['protect', 'fake-out', '', ''])
  assert.deepEqual(result.builds, current.builds)
  assert.deepEqual(result.teams.defender, current.teams.defender)
  assert.deepEqual(result.moveSets['defender:Charizard'], current.moveSets['defender:Charizard'])
  assert.equal(JSON.stringify(current), before)
})
test('native moves can add a catalogued Pokémon to either squad without copying nature, SP or other marginal choices', () => {
  for (const side of ['attacker', 'defender']) {
    const result = applyCompetitiveTransfer(createTeamWorkspace(), side, createNativeMovesTransfer(nativeData()), { moves: ['fake-out'] })
    assert.deepEqual(result.teams[side], ['Rillaboom'])
    assert.deepEqual(result.moveSets[`${side}:Rillaboom`], ['fake-out', '', '', ''])
    assert.equal(result.builds[`${side}:Rillaboom`].nature, 'serious')
    assert.equal(result.builds[`${side}:Rillaboom`].item, '')
    assert.deepEqual(Object.values(result.builds[`${side}:Rillaboom`].sps), [0, 0, 0, 0, 0, 0])
  }
})
test('native transfers reject unknown, unavailable, duplicate or unobserved moves and empty selections atomically', () => {
  const current = workspace(), before = JSON.stringify(current), request = createNativeMovesTransfer(nativeData())
  for (const moves of [[], ['water-spout'], ['unmapped:4'], ['grassy-glide'], ['fake-out', 'fake-out'], Array(5).fill('protect')]) assert.throws(() => applyCompetitiveTransfer(current, 'attacker', request, { moves }))
  assert.equal(JSON.stringify(current), before)
})
test('native transfers reject implicit legacy spread requests and mismatched catalogue/identity/season references', () => {
  const request = createNativeMovesTransfer(nativeData())
  assert.throws(() => applyCompetitiveTransfer(workspace(), 'attacker', { ...request, kind: 'spread' }, { spreadKey: 'Modest:32/32/2/0/0/0' }), /selezioni ranked/)
  for (const changes of [{ id: 'mb' }, { commit: 'wrong' }, { format: 'wrong' }, { mechanics: 'sv' }]) assert.throws(() => applyCompetitiveTransfer(workspace(), 'attacker', { ...request, catalogReference: { ...request.catalogReference, ...changes } }, { moves: ['protect'] }), /catalogo/)
  for (const changes of [{ season: 'bad' }, { format: 'Singles' }, { source: 'unknown' }, { date: 'bad' }]) assert.throws(() => createNativeMovesTransfer(nativeData(changes)), /Identità/)
  assert.throws(() => applyCompetitiveTransfer(workspace(), 'attacker', { ...request, entry: { ...request.entry, showdownId: 'charizard' } }, { moves: ['protect'] }), /Identità/)
})
test('native transfer keeps historical season identity and missing shares/dates without claiming regulation equivalence', () => {
  for (const season of ['Current', 'M7', 'M1']) {
    const request = createNativeMovesTransfer(nativeData({ season }))
    assert.equal(request.data.season, season)
    assert.equal(request.data.date, null)
    assert.equal(request.data.groups.move[0].percentage, null)
    assert.equal(request.snapshot, undefined)
    assert.equal(previewCompetitiveTransfer(workspace(), 'attacker', request, { moves: ['fake-out'] }).pokemon.showdownId, 'rillaboom')
  }
})
test('native transfer rejects unrecognized forms and full squads without substituting a base species', () => {
  assert.throws(() => createNativeMovesTransfer(nativeData({ showdownId: 'mausholdfour', name: 'Maushold-Four' })), /forma/)
  const current = workspace()
  current.teams.defender = ['Charizard', 'Venusaur', 'Gengar', 'Garchomp', 'Pelipper', 'Dragonite']
  assert.throws(() => applyCompetitiveTransfer(current, 'defender', createNativeMovesTransfer(nativeData()), { moves: ['protect'] }), /completa/)
})

const buildRequest = () => request('build')
const firstChoice = (request, category) => competitiveTransferOptions(request, category).find((option) => !option.disabledReason)
const nativeBuildData = () => {
  const data = nativeData()
  data.groups.held_item = [{ rank: 1, name: 'Leftovers' }, { rank: 2, name: 'Unknown Item' }]
  data.groups.ability = [{ rank: 1, name: 'Grassy Surge' }, { rank: 2, name: 'Blaze' }]
  data.groups.stat_alignment = [{ rank: 1, name: 'Modest' }, { rank: 2, name: 'Adamant' }]
  return data
}
test('a combined Showdown export applies every explicitly chosen category with canonical IDs and no cross-squad changes', () => {
  const current = workspace(), req = buildRequest(), selected = emptyCompetitiveSelection()
  const choices = Object.fromEntries(['moves', 'items', 'abilities', 'natures', 'spreads'].map((category) => [category, firstChoice(req, category)]))
  selected.moves = [choices.moves.key]
  for (const category of ['items', 'abilities', 'natures', 'spreads']) selected[category] = choices[category].key
  const result = applyCompetitiveTransfer(current, 'attacker', req, selected), build = result.builds[`attacker:${pokemon.displayName}`]
  assert.equal(build.item, choices.items.id)
  assert.equal(build.itemName, choices.items.label)
  assert.equal(build.ability, choices.abilities.id)
  assert.equal(build.nature, choices.natures.id)
  assert.deepEqual(Object.values(build.sps), choices.spreads.points)
  assert.deepEqual(result.moveSets[`attacker:${pokemon.displayName}`], [choices.moves.id, '', '', ''])
  assert.deepEqual(result.teams.defender, current.teams.defender)
  assert.equal(build.boosts.atk, 2)
})
test('selecting only a tool, ability, nature or SP preserves every other build field and all moves', () => {
  for (const category of ['items', 'abilities', 'natures', 'spreads']) {
    const current = workspace(), req = buildRequest(), selection = emptyCompetitiveSelection(), option = firstChoice(req, category)
    selection[category] = option.key
    const result = applyCompetitiveTransfer(current, 'attacker', req, selection)
    assert.deepEqual(result.moveSets, current.moveSets)
    const previous = current.builds[`attacker:${pokemon.displayName}`], build = result.builds[`attacker:${pokemon.displayName}`]
    for (const key of ['nature', 'sps', 'item', 'ability', 'boosts']) {
      if ({ items: 'item', abilities: 'ability', natures: 'nature', spreads: 'sps' }[category] !== key) assert.deepEqual(build[key], previous[key], `${category} changed ${key}`)
    }
    if (category === 'spreads') assert.equal(previewCompetitiveTransfer(current, 'attacker', req, selection).associatedNature, parseChampionsSpread(option.key).nature)
  }
})
test('a native combined build exports independent nature and SP choices and preserves missing shares', () => {
  const data = nativeBuildData(), req = createNativeBuildTransfer(data)
  const selection = { ...emptyCompetitiveSelection(), moves: ['1', '2'], items: '1', abilities: '1', natures: '2', spreads: '1' }
  const result = applyCompetitiveTransfer(createTeamWorkspace(), 'defender', req, selection), build = result.builds['defender:Rillaboom']
  assert.equal(build.nature, 'adamant')
  assert.deepEqual(Object.values(build.sps), data.groups.stat_points[0].points)
  assert.deepEqual(result.moveSets['defender:Rillaboom'], ['fake-out', 'protect', '', ''])
  assert.equal(build.itemName, 'Leftovers')
  assert.equal(build.abilityName, 'Grassy Surge')
  assert.equal(data.groups.move[0].percentage, null)
  assert.equal(previewCompetitiveTransfer(createTeamWorkspace(), 'defender', req, selection).associatedNature, null)
})
test('empty, multiple-single-choice, unavailable and forged build selections are rejected without mutations', () => {
  const current = workspace(), before = JSON.stringify(current), req = createNativeBuildTransfer(nativeBuildData())
  const invalid = [emptyCompetitiveSelection(), { ...emptyCompetitiveSelection(), items: ['1', '2'] },
    { ...emptyCompetitiveSelection(), items: '2' }, { ...emptyCompetitiveSelection(), abilities: '2' },
    { ...emptyCompetitiveSelection(), spreads: '99' }, { ...emptyCompetitiveSelection(), moves: ['1', '5'] },
    { ...emptyCompetitiveSelection(), moves: ['1', '1'] }, { ...emptyCompetitiveSelection(), moves: ['1', '2', '3', '4', '5'] }]
  for (const selection of invalid) assert.throws(() => applyCompetitiveTransfer(current, 'attacker', req, selection))
  assert.equal(JSON.stringify(current), before)
  assert.ok(competitiveTransferOptions(req, 'items')[1].disabledReason)
  assert.ok(competitiveTransferOptions(req, 'abilities')[1].disabledReason)
})
test('item-only additions leave moves empty and do not manufacture a nature/SP pair', () => {
  const req = createNativeBuildTransfer(nativeBuildData()), selection = { ...emptyCompetitiveSelection(), items: '1' }
  const result = applyCompetitiveTransfer(createTeamWorkspace(), 'attacker', req, selection)
  assert.deepEqual(result.moveSets['attacker:Rillaboom'], ['', '', '', ''])
  assert.equal(result.builds['attacker:Rillaboom'].nature, 'serious')
  assert.deepEqual(Object.values(result.builds['attacker:Rillaboom'].sps), [0, 0, 0, 0, 0, 0])
})

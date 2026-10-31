import test from 'node:test'
import assert from 'node:assert/strict'
import { createSavedTeam, emptyTeamLibrary, isSavedTeamCompatible, loadSavedTeam, parseTeamLibrary, putSavedTeam, readTeamLibrary, serializeTeamLibrary, TEAM_LIBRARY_KEY, validateSavedTeam } from './teamLibrary.js'
import { createTeamWorkspace } from './teamWorkspace.js'
import { createDamageBuild } from './damage/championsMatchup.js'
import { REGULATION_MOVES, REGULATION_ROSTER } from './regulation.js'

const options = { id: 'synthetic-team', now: '2026-10-31T10:00:00Z' }
const workspace = () => ({ ...createTeamWorkspace(), teams: { attacker: ['Charizard', 'Venusaur'], defender: ['Charizard'] },
  builds: { 'attacker:Charizard': { ...createDamageBuild(), level: 50, gender: 'F', item: 'leftovers', itemName: 'Leftovers', ability: 'blaze', abilityName: 'Blaze', nature: 'modest', sps: { hp: 32, atk: 0, def: 2, spa: 32, spd: 0, spe: 0 }, boosts: { atk: 4, def: 0, spa: 0, spd: 0, spe: 0 }, status: 'brn', extraLines: ['Shiny: Yes'] } },
  moveSets: { 'attacker:Charizard': ['protect', '', 'flamethrower', ''], 'attacker:Venusaur': ['', '', '', ''], 'defender:Charizard': ['protect', '', '', ''] } })
const saved = () => createSavedTeam(workspace(), 'attacker', 'Rain M-C', options)

test('team library snapshots preserve full set choices, ordered blank move slots and stable species IDs', () => {
  const team = saved()
  assert.deepEqual(team.members.map((member) => member.pokemonId), ['charizard', 'venusaur'])
  assert.deepEqual(team.members[0].moves, ['protect', '', 'flamethrower', ''])
  assert.deepEqual(team.members[1].moves, ['', '', '', ''])
  assert.equal(team.members[0].build.nature, 'modest')
  assert.equal(team.members[0].build.itemName, 'Leftovers')
  assert.equal(team.members[0].build.abilityName, 'Blaze')
  assert.equal(team.members[0].build.gender, 'F')
  assert.equal(team.members[0].build.sps.spa, 32)
  assert.deepEqual(team.members[0].build.extraLines, ['Shiny: Yes'])
  assert.equal(team.members[0].build.boosts, undefined)
  assert.equal(team.members[0].build.status, undefined)
  assert.equal(isSavedTeamCompatible(team), true)
})
test('loading an archive into either side preserves the other squad, resets battle conditions and removes only destination stale builds', () => {
  for (const side of ['attacker', 'defender']) {
    const original = workspace(), before = JSON.stringify(original), other = side === 'attacker' ? 'defender' : 'attacker'
    original.builds[`${side}:Gengar`] = createDamageBuild()
    const result = loadSavedTeam(original, side, saved())
    assert.deepEqual(result.teams[side], ['Charizard', 'Venusaur'])
    assert.deepEqual(result.teams[other], original.teams[other])
    assert.deepEqual(result.moveSets[`${other}:Charizard`], original.moveSets[`${other}:Charizard`])
    assert.equal(result.builds[`${side}:Charizard`].nature, 'modest')
    assert.equal(result.builds[`${side}:Charizard`].status, '')
    assert.equal(result.builds[`${side}:Charizard`].boosts.atk, 0)
    assert.equal(result.builds[`${side}:Gengar`], undefined)
    delete original.builds[`${side}:Gengar`]
    assert.equal(JSON.stringify(original), before)
  }
})
test('backup round-trip is lossless for sets, metadata and incompatible historical teams', () => {
  const historical = { ...saved(), id: 'old-team', regulation: { ...saved().regulation, id: 'mb', label: 'M-B', format: 'gen9championsvgc2026regmb' } }
  const library = putSavedTeam(putSavedTeam(emptyTeamLibrary(), saved()), historical)
  assert.deepEqual(parseTeamLibrary(serializeTeamLibrary(library)), library)
  assert.equal(isSavedTeamCompatible(historical), false)
  assert.throws(() => loadSavedTeam(workspace(), 'attacker', historical), /diversa/)
  const revision = { ...saved(), regulation: { ...saved().regulation, commit: 'a'.repeat(40) } }
  assert.equal(isSavedTeamCompatible(revision), false)
})
test('archive updates keep stable IDs and creation dates while unrelated saves remain intact', () => {
  const first = saved()
  const second = { ...first, id: 'other-team', name: 'Other' }
  const library = putSavedTeam(putSavedTeam(emptyTeamLibrary(), first), second)
  const update = createSavedTeam(workspace(), 'defender', first.name, { previous: first, now: '2026-11-01T10:00:00Z' })
  const result = putSavedTeam(library, update)
  assert.equal(result.teams.length, 2)
  assert.equal(result.teams.find((team) => team.id === first.id).createdAt, first.createdAt)
  assert.equal(result.teams.find((team) => team.id === first.id).members.length, 1)
  assert.deepEqual(result.teams.find((team) => team.id === second.id), second)
})
test('archive validators reject duplicate members, bad SP totals, unknown natures, invalid moves and empty names', () => {
  const team = saved()
  const invalid = [
    { ...team, name: '   ' }, { ...team, members: [] }, { ...team, members: [team.members[0], team.members[0]] },
    { ...team, members: [{ ...team.members[0], moves: ['protect', 'protect', '', ''] }] },
    { ...team, members: [{ ...team.members[0], moves: ['unknown id!', '', '', ''] }] },
    { ...team, members: [{ ...team.members[0], build: { ...team.members[0].build, nature: 'invented' } }] },
    { ...team, members: [{ ...team.members[0], build: { ...team.members[0].build, nature: ['modest'] } }] },
    { ...team, regulation: { ...team.regulation, commit: [team.regulation.commit] } },
    { ...team, members: [{ ...team.members[0], build: { ...team.members[0].build, sps: { hp: 32, atk: 32, def: 32, spa: 0, spd: 0, spe: 0 } } }] },
    { ...team, updatedAt: 'invalid' },
  ]
  for (const candidate of invalid) assert.throws(() => validateSavedTeam(candidate))
  assert.throws(() => createSavedTeam({ ...workspace(), teams: { attacker: [], defender: [] } }, 'attacker', 'Empty', options))
  assert.throws(() => createSavedTeam(workspace(), 'other', 'Invalid', options))
})
test('invalid or unsupported backups fail completely and never replace valid workspace data', () => {
  const original = workspace(), before = JSON.stringify(original)
  for (const text of ['not json', JSON.stringify({ version: 3, teams: [] }), JSON.stringify({ version: 1, teams: [saved(), saved()] }), ' '.repeat(2_000_001)]) assert.throws(() => parseTeamLibrary(text))
  const unknown = { ...saved(), members: [{ ...saved().members[0], pokemonId: 'missingform' }] }
  assert.throws(() => loadSavedTeam(original, 'attacker', unknown), /non è disponibile/)
  const unknownMove = { ...saved(), members: [{ ...saved().members[0], moves: ['inventedmove', '', '', ''] }] }
  assert.throws(() => loadSavedTeam(original, 'attacker', unknownMove), /non è disponibile/)
  assert.throws(() => loadSavedTeam(original, 'other', saved()))
  assert.equal(JSON.stringify(original), before)
})
test('reading library handles absent, malformed and unavailable storage without overwriting anything', () => {
  assert.deepEqual(readTeamLibrary({ getItem: () => null }), { library: emptyTeamLibrary(), error: '' })
  const raw = serializeTeamLibrary(putSavedTeam(emptyTeamLibrary(), saved()))
  const storage = { getItem: (key) => key === TEAM_LIBRARY_KEY ? raw : null }
  assert.equal(readTeamLibrary(storage).library.teams[0].name, 'Rain M-C')
  for (const storage of [{ getItem: () => '{broken' }, { getItem: () => { throw new Error('denied') } }]) {
    const result = readTeamLibrary(storage)
    assert.ok(result.error)
    assert.deepEqual(result.library, emptyTeamLibrary())
  }
})
test('untrusted extra backup properties cannot inject build configuration or prototype keys', () => {
  const team = saved()
  team.members[0].build.currentHp = -100
  team.members[0].build.nickname = 'Not part of the set'
  const json = serializeTeamLibrary({ version: 1, teams: [team] })
  const result = parseTeamLibrary(json)
  assert.equal(result.teams[0].members[0].build.currentHp, undefined)
  assert.equal(result.teams[0].members[0].build.nickname, undefined)
  const hostile = JSON.parse(JSON.stringify(team).replace('"level":50', '"__proto__":{"polluted":true},"level":50'))
  const normalized = validateSavedTeam(hostile)
  assert.equal(Object.hasOwn(normalized.members[0].build, '__proto__'), false)
  assert.equal({}.polluted, undefined)
})

test('saving and loading accepts actual catalogue move IDs including all hyphenated multiword moves', () => {
  const team = saved()
  // Every dataset key must be serializable: do not maintain a separate alphabet of valid IDs.
  for (const id of Object.keys(REGULATION_MOVES)) {
    const candidate = { ...team, members: [{ ...team.members[0], moves: [id, '', '', ''] }] }
    assert.equal(parseTeamLibrary(serializeTeamLibrary({ version: 1, teams: [candidate] })).teams[0].members[0].moves[0], id)
  }
  const current = workspace()
  current.moveSets['attacker:Charizard'] = ['air-slash', 'heat-wave', 'protect', '']
  const snapshot = createSavedTeam(current, 'attacker', 'Multiword', options)
  assert.deepEqual(snapshot.members[0].moves, ['air-slash', 'heat-wave', 'protect', ''])
  assert.deepEqual(loadSavedTeam(current, 'defender', snapshot).moveSets['defender:Charizard'], snapshot.members[0].moves)
})
test('an unconfigured catalogue team can be archived without rejecting its default visible moves', () => {
  for (const pokemon of REGULATION_ROSTER) {
    const current = { ...createTeamWorkspace(), teams: { attacker: [pokemon.displayName], defender: [] } }
    assert.equal(createSavedTeam(current, 'attacker', 'Catalogue defaults', options).members[0].pokemonId, pokemon.showdownId)
  }
})
test('move errors identify the Pokémon, slot and correction without silently removing duplicates or invalid raw workspace values', () => {
  const current = workspace(), before = JSON.stringify(current)
  const withMoves = (moves) => ({ ...saved(), members: [{ ...saved().members[0], moves }] })
  assert.throws(() => validateSavedTeam(withMoves(['air-slash', 'protect', 'air-slash', ''])), /Charizard: Air Slash è ripetuta negli slot 1 e 3.*lascia uno slot vuoto/)
  assert.throws(() => validateSavedTeam(withMoves(['protect', 'unknown-id', '', ''])), /Charizard:.*unknown-id.*slot 2.*Configura/)
  assert.throws(() => validateSavedTeam(withMoves(['protect', null, '', ''])), /Charizard:.*slot 2.*non leggibile/)
  assert.throws(() => validateSavedTeam(withMoves(['protect'])), /Charizard: trovati 1 slot.*quattro, anche vuoti/)
  assert.throws(() => createSavedTeam({ ...current, moveSets: { ...current.moveSets, 'attacker:Charizard': ['air-slash', 'air-slash', '', ''] } }, 'attacker', 'Invalid', options), /Charizard: Air Slash è ripetuta negli slot 1 e 2/)
  assert.throws(() => createSavedTeam({ ...current, moveSets: { ...current.moveSets, 'attacker:Charizard': ['missing-move', '', '', ''] } }, 'attacker', 'Invalid', options), /Charizard:.*slot 1.*Configura/)
  assert.equal(JSON.stringify(current), before)
})
test('historical archives retain syntactically valid unknown move IDs without assuming current data availability', () => {
  const team = saved()
  team.regulation = { ...team.regulation, id: 'mb', label: 'M-B', format: 'gen9championsvgc2026regmb' }
  team.members[0].moves = ['historical-move', '', '', '']
  assert.equal(parseTeamLibrary(serializeTeamLibrary({ version: 1, teams: [team] })).teams[0].members[0].moves[0], 'historical-move')
  assert.equal(isSavedTeamCompatible(team), false)
})
test('library v1 backups migrate losslessly to v2 while preserving the stored original on read', () => {
  const team = saved(), raw = JSON.stringify({ version: 1, teams: [team] })
  const storage = { getItem: () => raw }
  const result = readTeamLibrary(storage)
  assert.equal(result.error, '')
  assert.equal(result.library.version, 2)
  assert.deepEqual(result.library.teams, [team])
  assert.equal(storage.getItem(TEAM_LIBRARY_KEY), raw)
  assert.equal(parseTeamLibrary(raw).version, 2)
})
test('invalid incompleteness metadata is rejected rather than losing markers during backup restore', () => {
  const team = saved()
  for (const fields of [['invented'], ['sps', 'sps'], 'sps', null]) {
    const bad = { ...team, members: [{ ...team.members[0], build: { ...team.members[0].build, missingFields: fields } }] }
    assert.throws(() => validateSavedTeam(bad), /metadati/)
  }
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { createTournamentTransfer, previewTournamentTransfer, applyTournamentTransfer } from './tournamentTransfer.js'
import { normalizeTournamentDetails, normalizeTournamentStandings } from './competitive/limitless.js'
import { createTeamWorkspace, getWorkspaceBuild, updateWorkspaceBuild } from './teamWorkspace.js'
import { createDamageBuild, calculateMoveRows, createOptimizerContext, getBuildStats } from './damage/championsMatchup.js'
import { createSavedTeam, parseTeamLibrary, serializeTeamLibrary, TEAM_LIBRARY_VERSION } from './teamLibrary.js'
import { missingSetFields } from './teamCompleteness.js'
import { POKEMON_DATASET } from './pokemonDataset.js'
import { exportShowdownTeam } from './showdownExport.js'
import { getTeamMove } from './teamData.js'

// Synthetic events and players; no real participant/team-sheet archive.
const charizard = { id: 'charizard', name: 'Charizard', item: 'Sitrus Berry', ability: 'Blaze', nature: 'Modest', attacks: ['Protect', 'Flamethrower', 'Air Slash', 'Dragon Pulse'] }
function request(members = [charizard]) {
  const details = normalizeTournamentDetails({ id: 'synthetic-event', name: 'Synthetic tournament', game: 'VGC', format: 'M-C', date: '2026-10-31T10:00:00Z', players: 1, isPublic: true, isOnline: true, decklists: true, platform: null, phases: [] }, { id: 'synthetic-event', format: 'M-C' })
  const standings = normalizeTournamentStandings([{ player: 'synthetic-player', name: 'Synthetic player', placing: null, record: {}, decklist: members }], details.id)
  return createTournamentTransfer({ details, standings, retrievedAt: 1 }, standings[0])
}
const workspace = () => ({ ...createTeamWorkspace(), teams: { attacker: ['Gengar'], defender: ['Venusaur'] }, builds: { 'attacker:Gengar': createDamageBuild(), 'defender:Venusaur': { ...createDamageBuild(), nature: 'bold' } }, moveSets: { 'attacker:Gengar': ['protect', '', '', ''], 'defender:Venusaur': ['', '', '', ''] } })

test('tournament export copies published fields and exact forms, marking unavailable SP instead of inventing a spread', () => {
  const req = request(), preview = previewTournamentTransfer(req)
  assert.deepEqual(preview.issues, [])
  assert.equal(preview.members[0].pokemon.showdownId, 'charizard')
  assert.equal(preview.members[0].build.item, 'sitrus-berry')
  assert.equal(preview.members[0].build.abilityName, 'Blaze')
  assert.equal(preview.members[0].build.nature, 'modest')
  assert.deepEqual(preview.members[0].moves, ['protect', 'flamethrower', 'air-slash', 'dragon-pulse'])
  assert.deepEqual(preview.members[0].build.missingFields, ['sps'])
  assert.equal(getBuildStats(preview.members[0].pokemon, preview.members[0].build), null)
})
test('team transfer replaces only the chosen side including stale configurations and preserves order and the other team', () => {
  for (const side of ['attacker', 'defender']) {
    const current = workspace(), before = JSON.stringify(current), other = side === 'attacker' ? 'defender' : 'attacker'
    const result = applyTournamentTransfer(current, side, request([charizard, { id: 'rillaboom', name: 'Rillaboom' }]))
    assert.deepEqual(result.teams[side], ['Charizard', 'Rillaboom'])
    assert.deepEqual(result.teams[other], current.teams[other])
    assert.deepEqual(result.builds[`${other}:${current.teams[other][0]}`], current.builds[`${other}:${current.teams[other][0]}`])
    assert.equal(result.builds[`${side}:${current.teams[side][0]}`], undefined)
    assert.equal(JSON.stringify(current), before)
  }
})
test('partial team sheets preserve missing item/ability/nature/moves as unresolved and do not fill move slots from the catalogue', () => {
  const req = request([{ id: 'rillaboom', name: 'Rillaboom' }]), result = applyTournamentTransfer(workspace(), 'attacker', req)
  const build = result.builds['attacker:Rillaboom']
  assert.deepEqual(new Set(build.missingFields), new Set(['sps', 'item', 'ability', 'nature', 'moves']))
  assert.deepEqual(result.moveSets['attacker:Rillaboom'], ['', '', '', ''])
  assert.equal(build.item, '')
  assert.equal(getBuildStats(POKEMON_DATASET.find((pokemon) => pokemon.showdownId === 'rillaboom'), build), null)
})
test('unknown forms, values, duplicates and mismatched event/format/publication block the whole export atomically', () => {
  const invalid = [request([{ id: 'missing-form', name: 'Missing Form' }]), request([{ ...charizard, item: 'Unknown Item' }]), request([{ ...charizard, ability: 'Unknown Ability' }]), request([{ ...charizard, nature: 'Unknown Nature' }]), request([{ ...charizard, attacks: ['Unknown Move'] }]), request([charizard, charizard]), request([{ ...charizard, attacks: ['Protect', 'Protect'] }]), request([])]
  const wrongFormat = request(); wrongFormat.event.details.format = 'M-B'; invalid.push(wrongFormat)
  const privateEvent = request(); privateEvent.event.details.isPublic = false; invalid.push(privateEvent)
  const wrongRevision = request(); wrongRevision.catalogReference.commit = 'wrong'; invalid.push(wrongRevision)
  const wrongPlayer = request(); wrongPlayer.standing = { ...wrongPlayer.standing }; invalid.push(wrongPlayer)
  const current = workspace(), before = JSON.stringify(current)
  for (const req of invalid) { assert.ok(previewTournamentTransfer(req).issues.length); assert.throws(() => applyTournamentTransfer(current, 'attacker', req)) }
  assert.equal(JSON.stringify(current), before)
  assert.throws(() => applyTournamentTransfer(current, 'other', request()))
})
test('published Mega stones do not change species and recognized but non-base abilities are retained with an explicit warning', () => {
  const preview = previewTournamentTransfer(request([{ id: 'floette', name: 'Floette', item: 'Floettite', ability: 'Fairy Aura', nature: 'Modest', attacks: ['Moonblast'] }]))
  assert.deepEqual(preview.issues, [])
  assert.equal(preview.members[0].pokemon.showdownId, 'floetteeternal')
  assert.equal(preview.members[0].build.abilityName, 'Fairy Aura')
  assert.ok(preview.warnings.some((warning) => warning.includes('non è un’abilità base')))
  assert.ok(preview.warnings.some((warning) => warning.includes('eccezione Limitless')))
})
test('incomplete set metadata survives workspace reload helpers, library v2 save/load and backup round-trip', () => {
  const current = applyTournamentTransfer(workspace(), 'attacker', request())
  assert.deepEqual(getWorkspaceBuild(current.builds, 'attacker', 'Charizard').missingFields, ['sps'])
  const team = createSavedTeam(current, 'attacker', 'Tournament draft', { id: 'draft', now: '2026-10-31T11:00:00Z' })
  const library = parseTeamLibrary(serializeTeamLibrary({ version: TEAM_LIBRARY_VERSION, teams: [team] }))
  assert.equal(library.version, 2)
  assert.deepEqual(library.teams[0].members[0].build.missingFields, ['sps'])
  assert.throws(() => exportShowdownTeam({ side: 'attacker', team: [POKEMON_DATASET.find((pokemon) => pokemon.showdownId === 'charizard')], builds: current.builds, moveSets: current.moveSets }), /completa SP/)
})
test('confirming one field clears only that unresolved field and allows damage/optimizer only after required values are resolved', () => {
  const current = applyTournamentTransfer(workspace(), 'attacker', request())
  const attacker = POKEMON_DATASET.find((pokemon) => pokemon.showdownId === 'charizard'), defender = POKEMON_DATASET.find((pokemon) => pokemon.showdownId === 'venusaur')
  const a = current.builds['attacker:Charizard'], b = current.builds['defender:Venusaur'], field = { weather: '', gameType: 'Doubles', critical: false }
  assert.equal(calculateMoveRows(attacker, defender, a, b, ['flamethrower'], field)[0].result, null)
  assert.match(calculateMoveRows(attacker, defender, a, b, ['flamethrower'], field)[0].reason, /completa SP/)
  assert.equal(createOptimizerContext(attacker, defender, a, b, getTeamMove('flamethrower'), field), null)
  const builds = updateWorkspaceBuild(current.builds, 'attacker', 'Charizard', { sps: { ...a.sps } })
  assert.deepEqual(builds['attacker:Charizard'].missingFields, [])
  assert.ok(calculateMoveRows(attacker, defender, builds['attacker:Charizard'], b, ['flamethrower'], field)[0].result)
  const incomplete = { ...a, missingFields: ['nature', 'sps', 'moves'] }
  const updated = updateWorkspaceBuild({ 'attacker:Charizard': incomplete }, 'attacker', 'Charizard', { nature: 'modest' })
  assert.deepEqual(missingSetFields(updated['attacker:Charizard']), ['sps', 'moves'])
})

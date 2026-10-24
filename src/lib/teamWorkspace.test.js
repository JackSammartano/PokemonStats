import assert from 'node:assert/strict'
import { test } from 'node:test'
import { REGULATION } from './regulation.js'
import { createTeamWorkspace, LEGACY_TEAM_STORAGE_KEY, readTeamWorkspace, TEAM_STORAGE_KEY } from './teamWorkspace.js'

test('workspace storage is isolated by regulation and keeps both squad sides', () => {
  assert.equal(TEAM_STORAGE_KEY, `pokemonstats.team-workspace.v1.${REGULATION.id}`)
  const saved = { ...createTeamWorkspace(), teams: { attacker: ['Charizard'], defender: ['Venusaur'] } }
  const storage = new Map([[TEAM_STORAGE_KEY, JSON.stringify(saved)]])
  assert.deepEqual(readTeamWorkspace({ getItem: (key) => storage.get(key) ?? null }), saved)
})

test('M-C migrates legacy saves only when the scoped save is absent, preserving the legacy original', () => {
  const legacy = { version: 1, teams: { attacker: ['Charizard'], defender: [] }, builds: {}, moveSets: {} }
  const values = new Map([[LEGACY_TEAM_STORAGE_KEY, JSON.stringify(legacy)]])
  const storage = { getItem: (key) => values.get(key) ?? null }
  const restored = readTeamWorkspace(storage)
  assert.deepEqual(restored.teams.attacker, REGULATION.id === 'mc' ? ['Charizard'] : [])
  assert.equal(values.get(LEGACY_TEAM_STORAGE_KEY), JSON.stringify(legacy))
  values.set(TEAM_STORAGE_KEY, JSON.stringify(createTeamWorkspace()))
  assert.deepEqual(readTeamWorkspace(storage).teams.attacker, [])
})

test('a save explicitly belonging to a different regulation is never loaded', () => {
  const saved = { ...createTeamWorkspace(), regulation: 'foreign', teams: { attacker: ['Charizard'], defender: [] } }
  assert.deepEqual(readTeamWorkspace({ getItem: () => JSON.stringify(saved) }), createTeamWorkspace())
})

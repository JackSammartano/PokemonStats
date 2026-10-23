import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readWorkspaceLocation } from './workspaceNavigation.js'

test('workspace routes support direct links and fall back to the catalog', () => {
  assert.deepEqual(readWorkspaceLocation('#/team'), { view: 'team', fromTeam: false })
  assert.deepEqual(readWorkspaceLocation('#/damage-calculator'), { view: 'damage', fromTeam: false })
  assert.deepEqual(readWorkspaceLocation('#/unknown'), { view: 'catalog', fromTeam: false })
})

test('the return-to-team action is contextual to the calculator history entry', () => {
  const state = { pokemonStats: { fromTeam: true } }
  assert.equal(readWorkspaceLocation('#/damage-calculator', state).fromTeam, true)
  assert.equal(readWorkspaceLocation('#/catalogo', state).fromTeam, false)
  assert.equal(readWorkspaceLocation('#/team', state).fromTeam, false)
  assert.equal(readWorkspaceLocation('#/damage-calculator', { fromTeam: true }).fromTeam, false)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { REGULATION_MC_ROSTER } from '../data/regulationMc.js'
import { MEGA_EVOLUTIONS } from '../data/megaEvolutions.js'
import { getMegaAction, toggleMegaEvolution } from './megaEvolution.js'
import { createTeamWorkspace, getWorkspaceBuild, readTeamWorkspace, updateWorkspaceBuild } from './teamWorkspace.js'

const byId = new Map(REGULATION_MC_ROSTER.map((entry) => [entry.showdownId, entry]))
const nameOf = (id) => byId.get(id).displayName
const workspaceFor = (id, item, side = 'attacker') => {
  const name = nameOf(id)
  const workspace = createTeamWorkspace()
  workspace.teams[side] = [name, 'Ditto']
  workspace.builds[`${side}:${name}`] = { item, nature: 'jolly', ability: id === 'garchomp' ? 'rough-skin' : '', abilityName: 'Rough Skin', gender: 'F', level: 50, sps: { hp: 10, spe: 32 }, boosts: { spe: 1 }, burned: true }
  workspace.moveSets[`${side}:${name}`] = ['earthquake', 'dragon-claw', '', 'protect']
  return workspace
}

test('all 82 verified Megas have a correct stone action and a return to their exact base', () => {
  assert.equal(MEGA_EVOLUTIONS.length, REGULATION_MC_ROSTER.filter((entry) => entry.category === 'mega').length)
  for (const link of MEGA_EVOLUTIONS) {
    assert.equal(getMegaAction(byId.get(link.baseId), { item: link.itemId }).targetId, link.megaId)
    assert.equal(getMegaAction(byId.get(link.megaId), { item: '' }).targetId, link.baseId)
    const initial = workspaceFor(link.baseId, link.itemId)
    const evolved = toggleMegaEvolution(initial, 'attacker', nameOf(link.baseId))
    assert.equal(evolved.teams.attacker[0], nameOf(link.megaId))
    assert.equal(toggleMegaEvolution(evolved, 'attacker', nameOf(link.megaId)).teams.attacker[0], nameOf(link.baseId))
  }
})

test('stone selects the exact X/Y/Z form and does not work on unrelated Pokemon', () => {
  assert.equal(getMegaAction(byId.get('charizard'), { item: 'charizardite-x' }).targetId, 'charizardmegax')
  assert.equal(getMegaAction(byId.get('charizard'), { item: 'charizardite-y' }).targetId, 'charizardmegay')
  assert.equal(getMegaAction(byId.get('garchomp'), { item: 'garchompite' }).targetId, 'garchompmega')
  assert.equal(getMegaAction(byId.get('garchomp'), { item: 'garchompite-z' }).targetId, 'garchompmegaz')
  assert.equal(getMegaAction(byId.get('garchomp'), { item: 'charizardite-x' }), null)
  assert.equal(getMegaAction(byId.get('garchomp'), { item: 'leftovers' }), null)
  assert.equal(getMegaAction(byId.get('ditto'), { item: 'garchompite-z' }), null)
})

test('shared Meowstic stone preserves gender-specific form and Floette preserves Eternal base', () => {
  assert.equal(getMegaAction(byId.get('meowstic'), { item: 'meowsticite' }).targetId, 'meowsticmmega')
  assert.equal(getMegaAction(byId.get('meowsticf'), { item: 'meowsticite' }).targetId, 'meowsticfmega')
  assert.equal(getMegaAction(byId.get('meowsticfmega'), {}).targetId, 'meowsticf')
  assert.equal(getMegaAction(byId.get('floettemega'), {}).targetId, 'floetteeternal')
})

test('Mega Z round trip preserves slot, current build edits and all four moves while restoring base ability', () => {
  const initial = workspaceFor('garchomp', 'garchompite-z')
  const snapshot = structuredClone(initial)
  const mega = toggleMegaEvolution(initial, 'attacker', 'Garchomp')
  assert.deepEqual(initial, snapshot)
  assert.deepEqual(mega.teams.attacker, ['Mega Garchomp Z', 'Ditto'])
  const build = getWorkspaceBuild(mega.builds, 'attacker', 'Mega Garchomp Z')
  assert.equal(build.ability, 'levitate')
  assert.equal(build.item, 'garchompite-z')
  assert.equal(build.sps.spe, 32)
  assert.equal(build.boosts.spe, 1)
  assert.equal(build.burned, true)
  assert.equal(build.gender, 'F')
  assert.deepEqual(mega.moveSets['attacker:Mega Garchomp Z'], ['earthquake', 'dragon-claw', '', 'protect'])
  const edited = { ...mega, builds: updateWorkspaceBuild(mega.builds, 'attacker', 'Mega Garchomp Z', { nature: 'timid', sps: { spe: 31 } }), moveSets: { ...mega.moveSets, 'attacker:Mega Garchomp Z': ['draco-meteor', 'dragon-pulse', '', 'protect'] } }
  const restored = readTeamWorkspace({ getItem: () => JSON.stringify(edited) })
  const base = toggleMegaEvolution(restored, 'attacker', 'Mega Garchomp Z')
  assert.deepEqual(base.teams.attacker, ['Garchomp', 'Ditto'])
  const baseBuild = getWorkspaceBuild(base.builds, 'attacker', 'Garchomp')
  assert.equal(baseBuild.ability, 'rough-skin')
  assert.equal(baseBuild.nature, 'timid')
  assert.equal(baseBuild.sps.spe, 31)
  assert.deepEqual(base.moveSets['attacker:Garchomp'], edited.moveSets['attacker:Mega Garchomp Z'])
})

test('opponent changes are isolated and duplicate destinations cannot merge two members', () => {
  const initial = workspaceFor('garchomp', 'garchompite-z', 'defender')
  initial.teams.attacker = ['Garchomp']
  const next = toggleMegaEvolution(initial, 'defender', 'Garchomp')
  assert.deepEqual(next.teams.attacker, ['Garchomp'])
  assert.deepEqual(next.teams.defender, ['Mega Garchomp Z', 'Ditto'])
  const duplicate = workspaceFor('garchomp', 'garchompite-z')
  duplicate.teams.attacker.push('Mega Garchomp Z')
  assert.equal(getMegaAction(byId.get('garchomp'), { item: 'garchompite-z' }, duplicate.teams.attacker).disabled, true)
  assert.equal(toggleMegaEvolution(duplicate, 'attacker', 'Garchomp'), duplicate)
  assert.equal(toggleMegaEvolution(duplicate, 'attacker', 'Mega Garchomp Z'), duplicate)
  assert.equal(toggleMegaEvolution(initial, 'attacker', 'Ditto'), initial)
})

test('an imported Mega can revert without a previously saved base build', () => {
  const initial = workspaceFor('garchompmegaz', 'garchompite-z')
  const reverted = toggleMegaEvolution(initial, 'attacker', 'Mega Garchomp Z')
  assert.equal(getWorkspaceBuild(reverted.builds, 'attacker', 'Garchomp').ability, 'sand-veil')
  assert.equal(reverted.teams.attacker[0], 'Garchomp')
})

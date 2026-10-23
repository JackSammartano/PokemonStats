import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parseShowdownTeam } from './showdownImport.js'
import { applyImportedTeam, createTeamWorkspace, getWorkspaceBuild, readTeamWorkspace, TEAM_STORAGE_KEY, updateWorkspaceBuild } from './teamWorkspace.js'
import { getPokemonMoveSlots, moveSetKey } from './damage/championsMoveSets.js'
import { REGULATION_MC_ROSTER } from '../data/regulationMc.js'

const example = readFileSync(new URL('./fixtures/showdown-team.txt', import.meta.url), 'utf8')

test('imports the exact six-Pokemon example without losing status moves or SP values', () => {
  const imported = parseShowdownTeam(example)
  assert.equal(imported.members.length, 6)
  const garchomp = imported.members[0]
  assert.equal(garchomp.name, 'Mega Garchomp Z')
  assert.equal(garchomp.build.item, 'garchompite-z')
  assert.equal(garchomp.build.ability, 'levitate')
  assert.equal(garchomp.build.level, 50)
  assert.deepEqual(garchomp.build.sps, { hp: 32, atk: 0, def: 1, spa: 32, spd: 1, spe: 0 })
  assert.equal(garchomp.build.nature, 'modest')
  assert.deepEqual(garchomp.moves, ['draco-meteor', 'dragon-pulse', 'earth-power', 'protect'])
  assert.equal(imported.members[3].build.gender, 'M')
  assert.equal(imported.members[4].build.gender, 'F')
  assert.deepEqual(imported.members[2].moves, ['transform', '', '', ''])
  assert.equal(imported.members[5].name, 'Persian Alola')
  assert.equal(imported.members[5].build.ability, 'fur-coat')
  assert.equal(imported.members[5].moves[3], 'foul-play')
})

test('both squads retain independent builds, full move sets and later manual edits', () => {
  const imported = parseShowdownTeam(example)
  const mine = applyImportedTeam(createTeamWorkspace(), 'attacker', imported)
  const both = applyImportedTeam(mine, 'defender', imported)
  const name = imported.members[0].name
  const edited = { ...both, builds: updateWorkspaceBuild(both.builds, 'defender', name, { nature: 'timid', sps: { spa: 31, spe: 1 } }) }
  assert.equal(getWorkspaceBuild(edited.builds, 'attacker', name).nature, 'modest')
  assert.equal(getWorkspaceBuild(edited.builds, 'defender', name).nature, 'timid')
  assert.equal(getWorkspaceBuild(edited.builds, 'defender', name).sps.hp, 32)
  assert.equal(getWorkspaceBuild(edited.builds, 'defender', name).item, 'garchompite-z')
  const restored = readTeamWorkspace({ getItem: (key) => key === TEAM_STORAGE_KEY ? JSON.stringify(edited) : null })
  assert.deepEqual(restored.teams, both.teams)
  assert.equal(restored.builds[moveSetKey('defender', name)].nature, 'timid')
  const pokemon = REGULATION_MC_ROSTER.find((entry) => entry.displayName === name)
  assert.deepEqual(getPokemonMoveSlots(restored.moveSets, 'attacker', pokemon), imported.members[0].moves)
  assert.equal(getPokemonMoveSlots(restored.moveSets, 'attacker', pokemon)[3], 'protect')
})

test('nickname, gender, level and additional fields are preserved while irrelevant IVs are ignored', () => {
  const imported = parseShowdownTeam('Chomp (Garchomp-Mega-Z) (M) @ Garchompite Z\r\nAbility: Levitate\r\nLevel: 50\r\nIVs: 0 Atk\r\nModest Nature\r\nShiny: Yes\r\n- Protect')
  assert.equal(imported.members[0].build.nickname, 'Chomp')
  assert.equal(imported.members[0].build.gender, 'M')
  assert.equal(imported.members[0].build.ivs, undefined)
  assert.deepEqual(imported.members[0].build.extraLines, ['Shiny: Yes'])
})

test('invalid exports fail before replacing any team data', () => {
  for (const text of ['', 'Missingmon\n- Protect', 'Ditto\nEVs: 252 HP\n- Transform', 'Ditto\nEVs: 32 HP / 32 Def / 32 SpD\n- Transform', 'Ditto\n- Made Up Move', `${example}\n\nDitto\n- Transform`]) {
    assert.throws(() => parseShowdownTeam(text))
  }
  assert.deepEqual(readTeamWorkspace({ getItem: () => 'broken json' }), createTeamWorkspace())
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parseShowdownTeam } from './showdownImport.js'
import { applyImportedTeam, createTeamWorkspace, getWorkspaceBuild, readTeamWorkspace, TEAM_STORAGE_KEY, updateWorkspaceBuild } from './teamWorkspace.js'
import { getPokemonMoveSlots, moveSetKey } from './damage/championsMoveSets.js'
import { REGULATION_ROSTER } from './regulation.js'

const hasMegaZ = REGULATION_ROSTER.some((entry) => entry.showdownId === 'garchompmegaz')
const hasPersian = REGULATION_ROSTER.some((entry) => entry.showdownId === 'persianalola')
const originalExample = readFileSync(new URL('./fixtures/showdown-team.txt', import.meta.url), 'utf8')
const example = (hasMegaZ ? originalExample : originalExample.replace('Garchomp-Mega-Z @ Garchompite Z', 'Garchomp-Mega @ Garchompite').replace('Ability: Levitate', 'Ability: Sand Force'))
  .replace('Persian-Alola', hasPersian ? 'Persian-Alola' : 'Incineroar')
  .replace('Ability: Fur Coat', hasPersian ? 'Ability: Fur Coat' : 'Ability: Intimidate')
const megaName = hasMegaZ ? 'Mega Garchomp Z' : 'Mega Garchomp'
const megaItem = hasMegaZ ? 'garchompite-z' : 'garchompite'

test('imports the exact six-Pokemon example without losing status moves or SP values', () => {
  const imported = parseShowdownTeam(example)
  assert.equal(imported.members.length, 6)
  const garchomp = imported.members[0]
  assert.equal(garchomp.name, megaName)
  assert.equal(garchomp.build.item, megaItem)
  assert.equal(garchomp.build.ability, hasMegaZ ? 'levitate' : 'sand-force')
  assert.equal(garchomp.build.level, 50)
  assert.deepEqual(garchomp.build.sps, { hp: 32, atk: 0, def: 1, spa: 32, spd: 1, spe: 0 })
  assert.equal(garchomp.build.nature, 'modest')
  assert.deepEqual(garchomp.moves, ['draco-meteor', 'dragon-pulse', 'earth-power', 'protect'])
  assert.equal(imported.members[3].build.gender, 'M')
  assert.equal(imported.members[4].build.gender, 'F')
  assert.deepEqual(imported.members[2].moves, ['transform', '', '', ''])
  assert.equal(imported.members[5].name, hasPersian ? 'Persian Alola' : 'Incineroar')
  assert.equal(imported.members[5].build.ability, hasPersian ? 'fur-coat' : 'intimidate')
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
  assert.equal(getWorkspaceBuild(edited.builds, 'defender', name).item, megaItem)
  const restored = readTeamWorkspace({ getItem: (key) => key === TEAM_STORAGE_KEY ? JSON.stringify(edited) : null })
  assert.deepEqual(restored.teams, both.teams)
  assert.equal(restored.builds[moveSetKey('defender', name)].nature, 'timid')
  const pokemon = REGULATION_ROSTER.find((entry) => entry.displayName === name)
  assert.deepEqual(getPokemonMoveSlots(restored.moveSets, 'attacker', pokemon), imported.members[0].moves)
  assert.equal(getPokemonMoveSlots(restored.moveSets, 'attacker', pokemon)[3], 'protect')
})

test('nicknames are discarded while species, gender, level and additional fields are preserved', () => {
  const species = hasMegaZ ? 'Garchomp-Mega-Z' : 'Garchomp-Mega'
  const imported = parseShowdownTeam(`Chomp (${species}) (M) @ Garchompite\r\nLevel: 50\r\nIVs: 0 Atk\r\nModest Nature\r\nShiny: Yes\r\n- Protect`)
  assert.equal(imported.members[0].name, megaName)
  assert.equal(imported.members[0].build.nickname, undefined)
  assert.equal(imported.members[0].build.sourceText.includes('Chomp'), false)
  assert.equal(imported.members[0].build.gender, 'M')
  assert.equal(imported.members[0].build.ivs, undefined)
  assert.deepEqual(imported.members[0].build.extraLines, ['Shiny: Yes'])
})

test('legacy saved nicknames cannot replace species names or reappear after edits', () => {
  const builds = { 'attacker:Charizard': { nickname: 'Flame', nature: 'timid', sps: { spe: 32 } } }
  assert.equal(getWorkspaceBuild(builds, 'attacker', 'Charizard').nickname, undefined)
  const updated = updateWorkspaceBuild(builds, 'attacker', 'Charizard', { nickname: 'Another name', sps: { spe: 31 } })
  assert.equal(updated['attacker:Charizard'].nickname, undefined)
  assert.equal(updated['attacker:Charizard'].nature, 'timid')
  assert.equal(updated['attacker:Charizard'].sps.spe, 31)
  const restored = readTeamWorkspace({ getItem: () => JSON.stringify({ version: 1, teams: { attacker: ['Charizard'], defender: [] }, builds, moveSets: {} }) })
  assert.equal(restored.builds['attacker:Charizard'].nickname, undefined)
  assert.deepEqual(restored.teams.attacker, ['Charizard'])
})

test('invalid exports fail before replacing any team data', () => {
  for (const text of ['', 'Missingmon\n- Protect', 'Ditto\nEVs: 252 HP\n- Transform', 'Ditto\nEVs: 32 HP / 32 Def / 32 SpD\n- Transform', 'Ditto\n- Made Up Move', `${example}\n\nDitto\n- Transform`]) {
    assert.throws(() => parseShowdownTeam(text))
  }
  assert.deepEqual(readTeamWorkspace({ getItem: () => 'broken json' }), createTeamWorkspace())
})

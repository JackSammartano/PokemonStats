import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { exportShowdownTeam } from './showdownExport.js'
import { parseShowdownTeam } from './showdownImport.js'
import { applyImportedTeam, createTeamWorkspace, getWorkspaceBuild, updateWorkspaceBuild } from './teamWorkspace.js'
import { moveSetKey, updatePokemonMoveSlot } from './damage/championsMoveSets.js'
import { REGULATION_ROSTER } from './regulation.js'
import { toggleMegaEvolution } from './megaEvolution.js'

const roster = new Map(REGULATION_ROSTER.map((pokemon) => [pokemon.displayName, pokemon]))
const hasMegaZ = REGULATION_ROSTER.some((pokemon) => pokemon.showdownId === 'garchompmegaz')
const hasPersian = REGULATION_ROSTER.some((pokemon) => pokemon.showdownId === 'persianalola')
const original = readFileSync(new URL('./fixtures/showdown-team.txt', import.meta.url), 'utf8')
const example = (hasMegaZ ? original : original.replace('Garchomp-Mega-Z @ Garchompite Z', 'Garchomp-Mega @ Garchompite').replace('Ability: Levitate', 'Ability: Sand Force'))
  .replace('Persian-Alola', hasPersian ? 'Persian-Alola' : 'Incineroar')
  .replace('Ability: Fur Coat', hasPersian ? 'Ability: Fur Coat' : 'Ability: Intimidate')
const imported = parseShowdownTeam(example)
const workspace = () => applyImportedTeam(createTeamWorkspace(), 'attacker', imported)
const exported = (state, side = 'attacker') => exportShowdownTeam({ side, team: state.teams[side].map((name) => roster.get(name)), builds: state.builds, moveSets: state.moveSets })
const setFields = ({ name, moves, build }) => ({ name, moves, item: build.item, ability: build.ability, gender: build.gender, level: build.level, nature: build.nature, sps: build.sps })

test('the six-Pokemon Showdown example round trips without losing set fields or status moves', () => {
  const state = workspace()
  const before = structuredClone(state)
  const text = exported(state)
  assert.match(text, /EVs: 32 HP \/ 1 Def \/ 32 SpA \/ 1 SpD/)
  assert.match(text, /- Protect/)
  assert.match(text, /- Transform/)
  assert.deepEqual(parseShowdownTeam(text).members.map(setFields), imported.members.map(setFields))
  assert.deepEqual(state, before)
})

test('export uses the current calculator build and moves rather than stale import text or labels', () => {
  let state = workspace()
  const name = 'Toxapex'
  state.builds = updateWorkspaceBuild(state.builds, 'attacker', name, {
    ability: 'merciless', abilityName: 'Regenerator', item: 'sitrus-berry', itemName: 'Leftovers',
    nature: 'bold', gender: 'F', level: 51,
    sps: { hp: 32, atk: 0, def: 32, spa: 0, spd: 2, spe: 0 },
    currentHp: 1, boosts: { atk: -1 }, status: 'brn', tailwind: true, copiedAbility: 'huge-power',
  })
  state.moveSets = updatePokemonMoveSlot(state.moveSets, 'attacker', roster.get(name), 1, 'protect')
  const result = parseShowdownTeam(exported(state)).members[1]
  assert.equal(result.build.abilityName, 'Merciless')
  assert.equal(result.build.itemName, 'Sitrus Berry')
  assert.equal(result.build.nature, 'bold')
  assert.equal(result.build.gender, 'F')
  assert.equal(result.build.level, 51)
  assert.deepEqual(result.build.sps, { hp: 32, atk: 0, def: 32, spa: 0, spd: 2, spe: 0 })
  assert.equal(result.moves[1], 'protect')
  assert.equal(result.build.currentHp, null)
  assert.equal(result.build.status, '')
  assert.equal(result.build.boosts.atk, 0)
  assert.equal(result.build.tailwind, false)
  assert.equal(result.build.copiedAbility, '')
})

test('both sides preserve their independent calculator edits and member order', () => {
  const state = applyImportedTeam(workspace(), 'defender', imported)
  const name = imported.members[0].name
  state.builds = updateWorkspaceBuild(state.builds, 'defender', name, { nature: 'timid' })
  state.teams.defender.reverse()
  const mine = parseShowdownTeam(exported(state))
  const theirs = parseShowdownTeam(exported(state, 'defender'))
  assert.deepEqual(theirs.members.map((member) => member.name), state.teams.defender)
  assert.equal(mine.members[0].build.nature, 'modest')
  assert.equal(theirs.members.at(-1).build.nature, 'timid')
})

test('Mega toggles export the current form and ability rather than the original imported form', () => {
  const name = imported.members[0].name
  const state = toggleMegaEvolution(workspace(), 'attacker', name)
  const current = state.teams.attacker[0]
  const result = parseShowdownTeam(exported(state)).members[0]
  assert.equal(current, 'Garchomp')
  assert.equal(result.name, current)
  assert.equal(result.build.ability, getWorkspaceBuild(state.builds, 'attacker', current).ability)
  assert.deepEqual(result.moves, imported.members[0].moves)
})

test('empty slots are omitted without inventing moves, items or abilities', () => {
  const state = workspace()
  state.teams.attacker = ['Ditto']
  state.builds = updateWorkspaceBuild(state.builds, 'attacker', 'Ditto', { ability: '', item: '', nature: 'serious', sps: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } })
  state.moveSets[moveSetKey('attacker', 'Ditto')] = ['', '', 'transform', '']
  assert.equal(exported(state), 'Ditto\nLevel: 50\nSerious Nature\n- Transform\n')
  state.moveSets[moveSetKey('attacker', 'Ditto')] = ['', '', '', '']
  assert.deepEqual(parseShowdownTeam(exported(state)).members[0].moves, ['', '', '', ''])
})

test('known imported set extras survive while raw notes, nicknames and IVs are not emitted', () => {
  const state = applyImportedTeam(createTeamWorkspace(), 'attacker', parseShowdownTeam('Nickname (Ditto)\nShiny: Yes\nHappiness: 0\nUnknown: note\nIVs: 0 Atk\n- Transform'))
  const text = exported(state)
  assert.match(text, /^Ditto\n/)
  assert.match(text, /Shiny: Yes\nHappiness: 0/)
  assert.doesNotMatch(text, /Unknown:|Nickname|IVs:/)
})

test('invalid spreads and unresolved data stop export without changing the workspace', () => {
  const state = workspace()
  assert.throws(() => exported({ ...state, teams: { ...state.teams, attacker: [] } }), /da 1 a 6/)
  assert.throws(() => exported({ ...state, teams: { ...state.teams, attacker: [...state.teams.attacker, 'Ditto'] } }), /da 1 a 6/)
  for (const changes of [{ sps: { hp: 33 } }, { sps: { hp: 32, def: 32, spd: 32 } }, { item: 'unknown-item' }, { ability: 'unknown-ability' }, { nature: 'unknown' }, { level: 0 }]) {
    const invalid = { ...state, builds: updateWorkspaceBuild(state.builds, 'attacker', 'Ditto', changes) }
    const before = structuredClone(invalid)
    assert.throws(() => exported(invalid))
    assert.deepEqual(invalid, before)
  }
})

import { MEGA_EVOLUTIONS } from '../data/megaEvolutions.js'
import { REGULATION_MC_ROSTER } from '../data/regulationMc.js'
import { toId } from './damage/championsMath.js'
import { getPokemonMoveSlots, moveSetKey } from './damage/championsMoveSets.js'
import { getWorkspaceBuild } from './teamWorkspace.js'
import { normalizeShowdownId } from './teamData.js'

const byId = new Map(REGULATION_MC_ROSTER.map((entry) => [entry.showdownId, entry]))
const byName = new Map(REGULATION_MC_ROSTER.map((entry) => [entry.displayName, entry]))
const byMegaId = new Map(MEGA_EVOLUTIONS.map((link) => [link.megaId, link]))
const byBaseAndStone = new Map(MEGA_EVOLUTIONS.map((link) => [`${link.baseId}:${normalizeShowdownId(link.itemId)}`, link]))

export function getMegaAction(pokemon, build, memberNames = []) {
  if (!pokemon) return null
  const reverse = byMegaId.get(pokemon.showdownId)
  const forward = reverse ? null : byBaseAndStone.get(`${pokemon.showdownId}:${normalizeShowdownId(build.item)}`)
  const link = reverse ?? forward
  if (!link) return null
  const target = byId.get(reverse ? link.baseId : link.megaId)
  if (!target) return null
  const disabled = memberNames.includes(target.displayName)
  return {
    targetName: target.displayName, targetId: target.showdownId, evolving: !reverse, disabled,
    label: disabled ? `${target.displayName} è già in questa squadra` : reverse ? `Torna a ${target.displayName}` : `Megaevolvi in ${target.displayName}`,
  }
}

export function toggleMegaEvolution(workspace, side, name) {
  if (!['attacker', 'defender'].includes(side) || !workspace.teams[side].includes(name)) return workspace
  const source = byName.get(name)
  const build = getWorkspaceBuild(workspace.builds, side, name)
  const action = getMegaAction(source, build, workspace.teams[side])
  if (!action || action.disabled) return workspace
  const target = byId.get(action.targetId)
  const sourceKey = moveSetKey(side, name), targetKey = moveSetKey(side, target.displayName)
  const previousAbility = !action.evolving && workspace.builds[targetKey]?.ability
  const ability = target.abilities.find((candidate) => toId(candidate.name) === previousAbility) ?? target.abilities[0]
  const nextBuild = { ...build, sps: { ...build.sps }, boosts: { ...build.boosts }, ability: toId(ability.name), abilityName: ability.name }
  const moves = getPokemonMoveSlots(workspace.moveSets, side, source)
  return {
    ...workspace,
    teams: { ...workspace.teams, [side]: workspace.teams[side].map((entry) => entry === name ? target.displayName : entry) },
    builds: { ...workspace.builds, [sourceKey]: build, [targetKey]: nextBuild },
    moveSets: { ...workspace.moveSets, [sourceKey]: [...moves], [targetKey]: [...moves] },
  }
}

import { useEffect, useState } from 'react'
import { createDamageBuild } from './damage/championsMatchup.js'
import { moveSetKey } from './damage/championsMoveSets.js'
import { REGULATION_MC_POKEMON } from '../data/regulationMc.js'

export const TEAM_STORAGE_KEY = 'pokemonstats.team-workspace.v1'
const knownNames = new Set(REGULATION_MC_POKEMON)
export const createTeamWorkspace = () => ({ version: 1, teams: { attacker: [], defender: [] }, builds: {}, moveSets: {} })

export function getWorkspaceBuild(builds, side, name) {
  const defaults = createDamageBuild()
  const saved = builds[moveSetKey(side, name)] ?? {}
  return { ...defaults, ...saved, sps: { ...defaults.sps, ...saved.sps }, boosts: { ...defaults.boosts, ...saved.boosts }, ivs: { ...defaults.ivs, ...saved.ivs } }
}

export function updateWorkspaceBuild(builds, side, name, changes) {
  if (!knownNames.has(name)) return builds
  const current = getWorkspaceBuild(builds, side, name)
  return { ...builds, [moveSetKey(side, name)]: {
    ...current, ...changes,
    sps: { ...current.sps, ...changes.sps }, boosts: { ...current.boosts, ...changes.boosts }, ivs: { ...current.ivs, ...changes.ivs },
  } }
}

export function applyImportedTeam(workspace, side, imported) {
  if (!['attacker', 'defender'].includes(side)) throw new Error('Squadra non valida.')
  const next = { ...workspace, teams: { ...workspace.teams, [side]: imported.members.map((member) => member.name) }, builds: { ...workspace.builds }, moveSets: { ...workspace.moveSets } }
  for (const member of imported.members) {
    next.builds[moveSetKey(side, member.name)] = member.build
    next.moveSets[moveSetKey(side, member.name)] = [...member.moves]
  }
  return next
}

export function readTeamWorkspace(storage) {
  try {
    const saved = JSON.parse(storage.getItem(TEAM_STORAGE_KEY))
    if (saved?.version !== 1) return createTeamWorkspace()
    const result = createTeamWorkspace()
    for (const side of ['attacker', 'defender']) {
      result.teams[side] = [...new Set((saved.teams?.[side] ?? []).filter((name) => knownNames.has(name)))].slice(0, 6)
      for (const name of knownNames) {
        const key = moveSetKey(side, name)
        if (saved.builds?.[key] && typeof saved.builds[key] === 'object') {
          const build = getWorkspaceBuild(saved.builds, side, name)
          if (Object.values(build.sps).every((value) => Number.isInteger(value) && value >= 0 && value <= 32)
            && Object.values(build.boosts).every((value) => Number.isInteger(value) && value >= -6 && value <= 6)) result.builds[key] = build
        }
        if (Array.isArray(saved.moveSets?.[key])) result.moveSets[key] = Array.from({ length: 4 }, (_, index) => typeof saved.moveSets[key][index] === 'string' ? saved.moveSets[key][index] : '')
      }
    }
    return result
  } catch { return createTeamWorkspace() }
}

export function useTeamWorkspace() {
  const [workspace, setWorkspace] = useState(() => {
    try { return readTeamWorkspace(window.localStorage) } catch { return createTeamWorkspace() }
  })
  const [saveError, setSaveError] = useState('')
  useEffect(() => {
    try { window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(workspace)); setSaveError('') }
    catch { setSaveError('Salvataggio locale non disponibile: i dati restano attivi in questa pagina.') }
  }, [workspace])
  return { workspace, setWorkspace, saveError }
}

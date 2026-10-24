import { useEffect, useState } from 'react'
import { createDamageBuild } from './damage/championsMatchup.js'
import { moveSetKey } from './damage/championsMoveSets.js'
import { REGULATION, REGULATION_POKEMON } from './regulation.js'

export const LEGACY_TEAM_STORAGE_KEY = 'pokemonstats.team-workspace.v1'
export const TEAM_STORAGE_KEY = `pokemonstats.team-workspace.v1.${REGULATION.id}`
const knownNames = new Set(REGULATION_POKEMON)
export const createTeamWorkspace = () => ({ version: 1, regulation: REGULATION.id, teams: { attacker: [], defender: [] }, builds: {}, moveSets: {} })

export function getWorkspaceBuild(builds, side, name) {
  const defaults = createDamageBuild()
  const saved = builds[moveSetKey(side, name)] ?? {}
  const build = { ...defaults, ...saved, sps: { ...defaults.sps, ...saved.sps }, boosts: { ...defaults.boosts, ...saved.boosts } }
  delete build.ivs
  delete build.nickname
  return build
}

export function updateWorkspaceBuild(builds, side, name, changes) {
  if (!knownNames.has(name)) return builds
  const current = getWorkspaceBuild(builds, side, name)
  const build = {
    ...current, ...changes,
    sps: { ...current.sps, ...changes.sps }, boosts: { ...current.boosts, ...changes.boosts },
  }
  delete build.ivs
  delete build.nickname
  return { ...builds, [moveSetKey(side, name)]: build }
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
    const raw = storage.getItem(TEAM_STORAGE_KEY)
    const saved = JSON.parse(raw ?? (REGULATION.id === 'mc' ? storage.getItem(LEGACY_TEAM_STORAGE_KEY) : null))
    if (saved?.version !== 1) return createTeamWorkspace()
    if (saved.regulation && saved.regulation !== REGULATION.id) return createTeamWorkspace()
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

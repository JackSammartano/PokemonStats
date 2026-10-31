import { useRef, useState } from 'react'
import { REGULATION, REGULATION_ROSTER } from './regulation.js'
import { CHAMPIONS_NATURES } from './damage/championsData.js'
import { createDamageBuild } from './damage/championsMatchup.js'
import { getPokemonMoveSlots, moveSetKey } from './damage/championsMoveSets.js'
import { getTeamMove } from './teamData.js'
import { getWorkspaceBuild } from './teamWorkspace.js'
import { missingSetFields, TEAM_SET_FIELDS } from './teamCompleteness.js'

export const TEAM_LIBRARY_KEY = 'pokemonstats.saved-teams.v1'
export const TEAM_LIBRARY_VERSION = 2
export const MAX_TEAM_BACKUP_BYTES = 2_000_000
const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']
const byName = new Map(REGULATION_ROSTER.map((pokemon) => [pokemon.displayName, pokemon]))
const byId = new Map(REGULATION_ROSTER.map((pokemon) => [pokemon.showdownId, pokemon]))
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const string = (value, max = 500) => typeof value === 'string' && value.length <= max
const fail = (message) => { throw new Error(message) }
const date = (value) => string(value, 40) && Number.isFinite(Date.parse(value))
const token = (value) => string(value, 100) && /^[a-zA-Z0-9_-]+$/.test(value)
export const emptyTeamLibrary = () => ({ version: TEAM_LIBRARY_VERSION, teams: [] })
export const isSavedTeamCompatible = (team) => team.regulation.id === REGULATION.id && team.regulation.format === REGULATION.format && team.regulation.commit === REGULATION.commit && team.regulation.mechanics === REGULATION.mechanics

function validateSavedMoves(moves, pokemonId, compatible) {
  const label = byId.get(pokemonId)?.displayName ?? pokemonId
  if (!Array.isArray(moves)) fail(`${label}: gli slot mosse non sono leggibili. Apri Configura e impostali di nuovo.`)
  if (moves.length !== 4) fail(`${label}: trovati ${moves.length} slot mosse; devono essere quattro, anche vuoti. Controlla Configura o il backup.`)
  const seen = new Map()
  for (const [index, move] of moves.entries()) {
    if (!string(move, 100)) fail(`${label}: lo slot ${index + 1} contiene un valore mossa non leggibile. Controlla Configura o il backup.`)
    if (move === '') continue
    if (compatible && !getTeamMove(move)) fail(`${label}: la mossa “${move}” nello slot ${index + 1} non è disponibile nel dataset ${REGULATION.label}. Scegli una mossa valida in Configura o correggi il backup.`)
    if (!compatible && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(move)) fail(`${label}: identificativo della mossa nello slot ${index + 1} non valido. Controlla il backup della regulation originale.`)
    if (seen.has(move)) fail(`${label}: ${getTeamMove(move)?.name ?? move} è ripetuta negli slot ${seen.get(move)} e ${index + 1}. Scegli una mossa diversa o lascia uno slot vuoto.`)
    seen.set(move, index + 1)
  }
}

export function validateSavedTeam(team) {
  if (!object(team) || !token(team.id) || !string(team.name, 80) || !team.name.trim() || !date(team.createdAt) || !date(team.updatedAt) || Date.parse(team.updatedAt) < Date.parse(team.createdAt)) fail('Nome, identificativo o date della squadra non validi.')
  const regulation = team.regulation
  if (!object(regulation) || !token(regulation.id) || !token(regulation.format) || !string(regulation.label, 80) || !regulation.label || !string(regulation.commit, 40) || !/^[a-f0-9]{40}$/.test(regulation.commit) || regulation.mechanics !== 'champions') fail('Regulation del salvataggio non riconosciuta.')
  if (!Array.isArray(team.members) || team.members.length < 1 || team.members.length > 6) fail('Una squadra salvata deve contenere da 1 a 6 Pokémon.')
  const seen = new Set()
  const members = team.members.map((member) => {
    if (!object(member) || !token(member.pokemonId) || seen.has(member.pokemonId)) fail('Pokémon mancanti o duplicati nel salvataggio.')
    seen.add(member.pokemonId)
    const label = byId.get(member.pokemonId)?.displayName ?? member.pokemonId
    const build = member.build
    if (!object(build)) fail(`${label}: configurazione non leggibile. Controlla il backup.`)
    if (!Number.isInteger(build.level) || build.level < 1 || build.level > 100) fail(`${label}: il livello deve essere un intero da 1 a 100. Controlla Configura.`)
    if (!['', 'M', 'F'].includes(build.gender)) fail(`${label}: genere non riconosciuto. Controlla Configura o il backup.`)
    if (typeof build.nature !== 'string' || !Object.hasOwn(CHAMPIONS_NATURES, build.nature)) fail(`${label}: natura non riconosciuta. Scegli una natura valida in Configura.`)
    for (const field of ['item', 'itemName', 'ability', 'abilityName']) if (!string(build[field])) fail(`${label}: strumento o abilità non leggibili. Controlla Configura o il backup.`)
    if (!object(build.sps)) fail(`${label}: distribuzione SP non leggibile. Controlla Configura.`)
    const invalidStat = stats.find((stat) => !Number.isInteger(build.sps[stat]) || build.sps[stat] < 0 || build.sps[stat] > 32)
    if (invalidStat) fail(`${label}: SP ${invalidStat.toUpperCase()} non validi. Inserisci un intero da 0 a 32 in Configura.`)
    const total = stats.reduce((sum, stat) => sum + build.sps[stat], 0)
    if (total > 66) fail(`${label}: ${total} SP totali, massimo consentito 66. Riduci la distribuzione in Configura.`)
    validateSavedMoves(member.moves, member.pokemonId, isSavedTeamCompatible(team))
    const extraLines = build.extraLines ?? []
    if (!Array.isArray(extraLines) || extraLines.length > 40 || extraLines.some((line) => !string(line, 1000))) fail('Informazioni aggiuntive del salvataggio non valide.')
    if (build.missingFields !== undefined && (!Array.isArray(build.missingFields) || build.missingFields.some((field) => !TEAM_SET_FIELDS.includes(field)) || new Set(build.missingFields).size !== build.missingFields.length)) fail(`${label}: metadati dei campi da completare non validi.`)
    return { pokemonId: member.pokemonId, build: { level: build.level, gender: build.gender, nature: build.nature,
      item: build.item, itemName: build.itemName, ability: build.ability, abilityName: build.abilityName,
      sps: Object.fromEntries(stats.map((stat) => [stat, build.sps[stat]])), extraLines: [...extraLines], ...(build.missingFields?.length ? { missingFields: [...build.missingFields] } : {}) }, moves: [...member.moves] }
  })
  return { id: team.id, name: team.name.trim(), createdAt: team.createdAt, updatedAt: team.updatedAt,
    regulation: { id: regulation.id, label: regulation.label, format: regulation.format, commit: regulation.commit, mechanics: regulation.mechanics }, members }
}

export function validateTeamLibrary(library) {
  if (!object(library) || ![1, TEAM_LIBRARY_VERSION].includes(library.version) || !Array.isArray(library.teams) || library.teams.length > 100) fail('Archivio non valido o versione non supportata (massimo 100 squadre).')
  const teams = library.teams.map(validateSavedTeam)
  if (new Set(teams.map((team) => team.id)).size !== teams.length) fail('L’archivio contiene identificativi duplicati.')
  return { version: TEAM_LIBRARY_VERSION, teams }
}
export function parseTeamLibrary(text) {
  if (!string(text, MAX_TEAM_BACKUP_BYTES) || new TextEncoder().encode(text).length > MAX_TEAM_BACKUP_BYTES) fail('Il backup supera il limite di 2 MB.')
  let payload
  try { payload = JSON.parse(text) } catch { fail('Il file non contiene un archivio JSON valido.') }
  return validateTeamLibrary(payload)
}
export function serializeTeamLibrary(library) {
  const text = JSON.stringify(validateTeamLibrary(library), null, 2)
  if (new TextEncoder().encode(text).length > MAX_TEAM_BACKUP_BYTES) fail('L’archivio supera il limite di 2 MB.')
  return text
}

export function createSavedTeam(workspace, side, name, { id = crypto.randomUUID(), now = new Date().toISOString(), previous } = {}) {
  if (!['attacker', 'defender'].includes(side)) fail('Squadra di origine non valida.')
  const members = workspace.teams[side].map((name) => {
    const pokemon = byName.get(name)
    if (!pokemon) fail('Un Pokémon non è disponibile nella regulation attiva.')
    const build = getWorkspaceBuild(workspace.builds, side, name)
    const rawMoves = workspace.moveSets[moveSetKey(side, name)]
    const moves = rawMoves === undefined ? getPokemonMoveSlots(workspace.moveSets, side, pokemon) : rawMoves
    return { pokemonId: pokemon.showdownId, build: { level: build.level, gender: build.gender, nature: build.nature,
      item: build.item, itemName: build.itemName ?? '', ability: build.ability, abilityName: build.abilityName ?? '',
      sps: { ...build.sps }, extraLines: [...(build.extraLines ?? [])], ...(missingSetFields(build).length ? { missingFields: missingSetFields(build) } : {}) }, moves }
  })
  return validateSavedTeam({ id: previous?.id ?? id, name, createdAt: previous?.createdAt ?? now, updatedAt: now, regulation: REGULATION, members })
}
export function putSavedTeam(library, team) {
  const normalized = validateSavedTeam(team)
  const index = library.teams.findIndex((entry) => entry.id === normalized.id)
  const teams = [...library.teams]
  if (index === -1) teams.unshift(normalized)
  else teams[index] = normalized
  return validateTeamLibrary({ version: TEAM_LIBRARY_VERSION, teams })
}
export function loadSavedTeam(workspace, side, saved) {
  if (!['attacker', 'defender'].includes(side)) fail('Squadra di destinazione non valida.')
  const team = validateSavedTeam(saved)
  if (!isSavedTeamCompatible(team)) fail('Questa squadra appartiene a una regulation o revisione diversa. Il salvataggio rimane nell’archivio.')
  const next = { ...workspace, teams: { ...workspace.teams, [side]: [] }, builds: { ...workspace.builds }, moveSets: { ...workspace.moveSets } }
  // Remove only the destination side, including stale configurations of removed members.
  for (const map of [next.builds, next.moveSets]) for (const key of Object.keys(map)) if (key.startsWith(`${side}:`)) delete map[key]
  for (const member of team.members) {
    const pokemon = byId.get(member.pokemonId)
    if (!pokemon || member.moves.some((move) => move && !getTeamMove(move))) fail('Un Pokémon o una mossa del salvataggio non è disponibile nel dataset attivo.')
    const key = moveSetKey(side, pokemon.displayName)
    next.teams[side].push(pokemon.displayName)
    next.builds[key] = { ...createDamageBuild(), ...member.build, sps: { ...member.build.sps }, extraLines: [...member.build.extraLines] }
    next.moveSets[key] = [...member.moves]
  }
  return next
}

export function readTeamLibrary(storage) {
  try {
    const raw = storage.getItem(TEAM_LIBRARY_KEY)
    return { library: raw === null ? emptyTeamLibrary() : parseTeamLibrary(raw), error: '' }
  } catch { return { library: emptyTeamLibrary(), error: 'Impossibile leggere le squadre salvate. I dati esistenti non sono stati modificati; puoi ripristinare un backup.' } }
}
export function useTeamLibrary() {
  const [state, setState] = useState(() => { try { return readTeamLibrary(window.localStorage) } catch { return { library: emptyTeamLibrary(), error: 'Salvataggio locale non disponibile.' } } })
  const current = useRef(state)
  function update(change, { restore = false } = {}) {
    if (current.current.error && !restore) throw new Error(current.current.error)
    if (!restore) {
      const latest = readTeamLibrary(window.localStorage)
      if (latest.error) throw new Error(latest.error)
      if (serializeTeamLibrary(latest.library) !== serializeTeamLibrary(current.current.library)) {
        current.current = latest
        setState(latest)
        throw new Error('L’archivio è cambiato in un’altra scheda. È stato aggiornato: controlla le squadre e riprova.')
      }
    }
    const library = validateTeamLibrary(change(current.current.library))
    const text = serializeTeamLibrary(library)
    try { window.localStorage.setItem(TEAM_LIBRARY_KEY, text) }
    catch { throw new Error('Salvataggio non riuscito: memoria del browser piena o non disponibile. L’archivio precedente è invariato.') }
    current.current = { library, error: '' }
    setState(current.current)
  }
  return { ...state, update }
}

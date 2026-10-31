import { REGULATION, REGULATION_ITEMS, REGULATION_MOVES, REGULATION_ROSTER } from './regulation.js'
import { CHAMPIONS_NATURES } from './damage/championsData.js'
import { parseChampionsSpread } from './competitive/normalize.js'
import { createDamageBuild } from './damage/championsMatchup.js'
import { moveSetKey, getPokemonMoveSlots } from './damage/championsMoveSets.js'
import { getTeamMoveOptions, normalizeShowdownId } from './teamData.js'
import { getWorkspaceBuild, updateWorkspaceBuild } from './teamWorkspace.js'
import { missingSetFields } from './teamCompleteness.js'

const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']
export const TRANSFER_CATEGORIES = ['moves', 'items', 'abilities', 'natures', 'spreads']
export const emptyCompetitiveSelection = () => ({ moves: [], items: null, abilities: null, natures: null, spreads: null })
const nativeCategories = { moves: 'move', items: 'held_item', abilities: 'ability', natures: 'stat_alignment', spreads: 'stat_points' }
export const NATIVE_TRANSFER_CATEGORIES = Object.fromEntries(Object.entries(nativeCategories).map(([category, native]) => [native, category]))
function indexChoices(entries) {
  const result = new Map()
  for (const entry of entries) for (const name of [entry.id, entry.name]) {
    const key = normalizeShowdownId(name)
    if (!result.has(key)) result.set(key, entry)
    else if (result.get(key)?.id !== entry.id) result.set(key, null)
  }
  return result
}
const itemChoices = indexChoices(REGULATION_ITEMS)
const abilityChoices = indexChoices(REGULATION_ROSTER.flatMap((pokemon) => pokemon.abilities))
const nativeMoveIds = new Map()
for (const [id, move] of Object.entries(REGULATION_MOVES)) {
  for (const name of [id, move.name]) {
    const key = normalizeShowdownId(name)
    if (!nativeMoveIds.has(key)) nativeMoveIds.set(key, id)
    else if (nativeMoveIds.get(key) !== id) nativeMoveIds.set(key, null)
  }
}

export function createNativeMovesTransfer(data) {
  const request = { provider: 'champions-battle-data', kind: 'moves', data,
    entry: { showdownId: data.showdownId, sourceName: data.name },
    catalogReference: { id: REGULATION.id, format: REGULATION.format, commit: REGULATION.commit, mechanics: REGULATION.mechanics } }
  competitiveTransferPokemon(request)
  return request
}
export function createNativeBuildTransfer(data) {
  const request = createNativeMovesTransfer(data)
  request.kind = 'build'
  competitiveTransferPokemon(request)
  return request
}
export function competitiveTransferOptions(request, category) {
  const pokemon = competitiveTransferPokemon(request)
  const native = request.provider === 'champions-battle-data'
  const rows = native ? request.data.groups[nativeCategories[category]] : request.entry.distributions[category]?.entries ?? []
  const legalMoves = new Set(getTeamMoveOptions(pokemon).options.map((option) => option.value))
  const legalAbilities = new Set(pokemon.abilities.map((ability) => normalizeShowdownId(ability.id)))
  const seenMoves = new Set()
  return rows.map((row) => {
    const key = native ? String(row.rank) : row.key
    const sourceName = native ? row.name : row.key
    let id = null, label = sourceName, points = null, associatedNature = null, disabledReason = ''
    if (category === 'spreads') {
      if (native) { points = row.points; label = `Spread ${row.rank}` }
      else { const spread = parseChampionsSpread(row.key); points = spread.points; associatedNature = spread.nature; label = spread.nature }
      if (!Array.isArray(points) || points.length !== 6 || points.some((point) => !Number.isInteger(point) || point < 0 || point > 32) || points.reduce((sum, point) => sum + point, 0) > 66) disabledReason = 'Distribuzione SP non compatibile: massimo 32 per statistica e 66 totali.'
    } else if (category === 'moves') {
      id = nativeMoveIds.get(normalizeShowdownId(sourceName)) ?? null
      label = id ? REGULATION_MOVES[id].name : sourceName
      if (!id) disabledReason = 'Nome della fonte non riconciliato con il catalogo mosse.'
      else if (!legalMoves.has(id)) disabledReason = 'Non disponibile nel learnset verificato.'
      else if (seenMoves.has(id)) disabledReason = 'Questa mossa è già presente nell’elenco.'
      if (id) seenMoves.add(id)
    } else if (category === 'items') {
      const item = itemChoices.get(normalizeShowdownId(sourceName))
      if (!native && sourceName === '') { id = ''; label = 'Nessuno strumento' }
      else if (item) { id = item.id; label = item.name }
      else disabledReason = 'Strumento non riconciliato con il catalogo attivo.'
    } else if (category === 'abilities') {
      const ability = abilityChoices.get(normalizeShowdownId(sourceName))
      if (ability) { id = ability.id; label = ability.name }
      if (!ability) disabledReason = 'Abilità non riconciliata con il catalogo attivo.'
      else if (!legalAbilities.has(normalizeShowdownId(ability.id))) disabledReason = 'Abilità non disponibile per questa forma nel catalogo attivo.'
    } else if (category === 'natures') {
      const nature = normalizeShowdownId(sourceName)
      if (Object.hasOwn(CHAMPIONS_NATURES, nature)) { id = nature; label = nature[0].toUpperCase() + nature.slice(1) }
      else disabledReason = 'Natura non riconosciuta.'
    }
    return { key, id, label, points, associatedNature, disabledReason }
  })
}
export function competitiveTransferMoves(request) {
  if (request.provider !== 'champions-battle-data') return request.entry.distributions.moves?.entries ?? []
  const seen = new Set()
  return request.data.groups.move.flatMap((row) => {
    const id = nativeMoveIds.get(normalizeShowdownId(row.name))
    if (id && seen.has(id)) return []
    if (id) seen.add(id)
    return [{ key: id ?? `unmapped:${row.rank}`, sourceName: row.name }]
  })
}
export function competitiveTransferPokemon(request) {
  const { snapshot, entry, kind } = request
  if (request.provider === 'champions-battle-data') {
    const { data, catalogReference: reference } = request
    if (!['moves', 'build'].includes(kind)) throw new Error('Le selezioni ranked devono essere esplicite: gli SP non hanno una natura associata.')
    if (REGULATION.mechanics !== 'champions' || reference?.id !== REGULATION.id || reference.format !== REGULATION.format || reference.commit !== REGULATION.commit || reference.mechanics !== REGULATION.mechanics) throw new Error('Il catalogo di destinazione non è compatibile con questa selezione.')
    if (!data || data.format !== 'Doubles' || typeof data.season !== 'string' || !/^(Current|M[1-9]\d*)$/.test(data.season) || data.showdownId !== entry?.showdownId || data.name !== entry?.sourceName || typeof data.source !== 'string' || !data.source.startsWith('pokemon_champions_assets/battle_data/') || !Array.isArray(data.groups?.move) || (data.date !== null && (typeof data.date !== 'string' || !Number.isFinite(Date.parse(data.date))))) throw new Error('Identità, stagione o provenienza dei dettagli ranked non valide.')
    if (kind === 'build' && Object.values(nativeCategories).some((category) => !Array.isArray(data.groups[category]))) throw new Error('Categorie ranked mancanti nella selezione della build.')
  } else {
    if ((request.provider && request.provider !== 'smogon') || snapshot?.provider !== 'smogon' || snapshot.regulationId !== REGULATION.id || snapshot.format !== REGULATION.format || snapshot.mechanicsReference !== REGULATION.commit || snapshot.statSystem !== 'champions-sp') throw new Error('Le statistiche non sono compatibili con la regulation attiva.')
    if (!['moves', 'spread', 'build'].includes(kind) || !snapshot.pokemon?.includes(entry)) throw new Error('Selezione competitiva non valida.')
  }
  const pokemon = REGULATION_ROSTER.find((pokemon) => pokemon.showdownId === entry.showdownId)
  if (!pokemon) throw new Error('Questa forma non è disponibile nel catalogo attivo.')
  return pokemon
}
export function previewCompetitiveTransfer(workspace, side, request, selection) {
  if (!['attacker', 'defender'].includes(side)) throw new Error('Squadra di destinazione non valida.')
  const pokemon = competitiveTransferPokemon(request)
  const exists = workspace.teams[side].includes(pokemon.displayName)
  if (!exists && workspace.teams[side].length >= 6) throw new Error('Squadra completa. Libera uno slot prima di aggiungere questo Pokémon.')
  const previous = exists ? getWorkspaceBuild(workspace.builds, side, pokemon.displayName) : createDamageBuild()
  const previousMoves = exists ? getPokemonMoveSlots(workspace.moveSets, side, pokemon) : ['', '', '', '']
  if (request.kind === 'build') {
    if (!selection || !Array.isArray(selection.moves) || selection.moves.length > 4 || new Set(selection.moves).size !== selection.moves.length || TRANSFER_CATEGORIES.slice(1).some((category) => selection[category] !== null && typeof selection[category] !== 'string')) throw new Error('Selezione della build non valida.')
    const chosen = {}
    for (const category of TRANSFER_CATEGORIES) {
      const keys = category === 'moves' ? selection.moves : selection[category] === null ? [] : [selection[category]]
      const options = competitiveTransferOptions(request, category)
      chosen[category] = keys.map((key) => {
        const option = options.find((option) => option.key === key)
        if (!option || option.disabledReason) throw new Error(`${option?.label ?? category}: ${option?.disabledReason || 'voce non presente nelle statistiche selezionate.'}`)
        return option
      })
    }
    if (!Object.values(chosen).some((rows) => rows.length)) throw new Error('Seleziona almeno una voce dagli elenchi prima di esportare.')
    const changes = {}
    if (chosen.items.length) { changes.item = chosen.items[0].id; changes.itemName = changes.item ? chosen.items[0].label : '' }
    if (chosen.abilities.length) { changes.ability = chosen.abilities[0].id; changes.abilityName = chosen.abilities[0].label }
    if (chosen.natures.length) changes.nature = chosen.natures[0].id
    if (chosen.spreads.length) changes.sps = Object.fromEntries(stats.map((stat, index) => [stat, chosen.spreads[0].points[index]]))
    const selectedMoves = chosen.moves.map((move) => move.id)
    if (new Set(selectedMoves).size !== selectedMoves.length) throw new Error('Non puoi selezionare due volte la stessa mossa.')
    return { pokemon, exists, previous, previousMoves, changes: Object.keys(changes).length ? changes : null,
      moves: selectedMoves.length ? Array.from({ length: 4 }, (_, index) => selectedMoves[index] ?? '') : null,
      associatedNature: chosen.spreads[0]?.associatedNature ?? null }
  }
  if (request.kind === 'moves') {
    const moves = selection.moves
    const available = new Set(competitiveTransferMoves(request).map((row) => row.key))
    const legal = new Set(getTeamMoveOptions(pokemon).options.map((option) => option.value))
    if (!Array.isArray(moves) || moves.length < 1 || moves.length > 4 || new Set(moves).size !== moves.length || moves.some((id) => !available.has(id) || !legal.has(id))) throw new Error('Scegli da una a quattro mosse distinte disponibili nel learnset verificato.')
    return { pokemon, exists, previous, previousMoves, changes: null, moves: Array.from({ length: 4 }, (_, index) => moves[index] ?? '') }
  }
  const key = selection.spreadKey
  if (!request.entry.distributions.spreads?.entries.some((row) => row.key === key)) throw new Error('Lo spread non è presente nelle statistiche selezionate.')
  const spread = parseChampionsSpread(key)
  return { pokemon, exists, previous, previousMoves, moves: null, changes: { nature: spread.nature.toLowerCase(), sps: Object.fromEntries(stats.map((stat, index) => [stat, spread.points[index]])) } }
}
export function applyCompetitiveTransfer(workspace, side, request, selection) {
  const preview = previewCompetitiveTransfer(workspace, side, request, selection)
  const key = moveSetKey(side, preview.pokemon.displayName)
  let builds = preview.exists ? workspace.builds : { ...workspace.builds, [key]: createDamageBuild() }
  const missing = missingSetFields(builds[key])
  if (preview.moves && missing.includes('moves')) builds = updateWorkspaceBuild(builds, side, preview.pokemon.displayName, { missingFields: missing.filter((field) => field !== 'moves') })
  return { ...workspace, teams: { ...workspace.teams, [side]: preview.exists ? [...workspace.teams[side]] : [...workspace.teams[side], preview.pokemon.displayName] },
    builds: preview.changes ? updateWorkspaceBuild(builds, side, preview.pokemon.displayName, preview.changes) : builds,
    moveSets: preview.moves ? { ...workspace.moveSets, [key]: preview.moves } : preview.exists ? workspace.moveSets : { ...workspace.moveSets, [key]: ['', '', '', ''] } }
}

import { REGULATION, REGULATION_ROSTER } from './regulation.js'
import { parseChampionsSpread } from './competitive/normalize.js'
import { createDamageBuild } from './damage/championsMatchup.js'
import { moveSetKey, getPokemonMoveSlots } from './damage/championsMoveSets.js'
import { getTeamMoveOptions } from './teamData.js'
import { getWorkspaceBuild, updateWorkspaceBuild } from './teamWorkspace.js'

const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']
export function competitiveTransferPokemon(request) {
  const { snapshot, entry, kind } = request
  if (snapshot?.provider !== 'smogon' || snapshot.regulationId !== REGULATION.id || snapshot.format !== REGULATION.format || snapshot.mechanicsReference !== REGULATION.commit || snapshot.statSystem !== 'champions-sp') throw new Error('Le statistiche non sono compatibili con la regulation attiva.')
  if (!['moves', 'spread'].includes(kind) || !snapshot.pokemon?.includes(entry)) throw new Error('Selezione competitiva non valida.')
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
  if (request.kind === 'moves') {
    const moves = selection.moves
    const available = new Set(request.entry.distributions.moves?.entries.map((row) => row.key))
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
  const builds = preview.exists ? workspace.builds : { ...workspace.builds, [key]: createDamageBuild() }
  return { ...workspace, teams: { ...workspace.teams, [side]: preview.exists ? [...workspace.teams[side]] : [...workspace.teams[side], preview.pokemon.displayName] },
    builds: preview.changes ? updateWorkspaceBuild(builds, side, preview.pokemon.displayName, preview.changes) : builds,
    moveSets: preview.moves ? { ...workspace.moveSets, [key]: preview.moves } : preview.exists ? workspace.moveSets : { ...workspace.moveSets, [key]: ['', '', '', ''] } }
}

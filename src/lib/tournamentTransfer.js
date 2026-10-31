import { REGULATION, REGULATION_ITEMS, REGULATION_MOVES, REGULATION_ROSTER } from './regulation.js'
import { CHAMPIONS_NATURES } from './damage/championsData.js'
import { createDamageBuild } from './damage/championsMatchup.js'
import { moveSetKey } from './damage/championsMoveSets.js'
import { getTeamMoveOptions, normalizeShowdownId } from './teamData.js'
import { TEAM_SET_LABELS } from './teamCompleteness.js'

const byId = new Map(REGULATION_ROSTER.map((pokemon) => [pokemon.showdownId, pokemon]))
function index(entries) {
  const result = new Map()
  for (const entry of entries) for (const key of [entry.id, entry.name]) {
    const id = normalizeShowdownId(key)
    if (!result.has(id)) result.set(id, entry)
    else if (result.get(id)?.id !== entry.id) result.set(id, null)
  }
  return result
}
const moves = index(Object.entries(REGULATION_MOVES).map(([id, move]) => ({ ...move, id })))
const items = index(REGULATION_ITEMS)
const abilities = index(REGULATION_ROSTER.flatMap((pokemon) => pokemon.abilities))

export function createTournamentTransfer(event, standing) {
  return { event, standing, catalogReference: { id: REGULATION.id, format: REGULATION.format, commit: REGULATION.commit } }
}
export function previewTournamentTransfer(request) {
  const { event, standing, catalogReference: reference } = request
  const issues = [], warnings = [], members = []
  if (REGULATION.mechanics !== 'champions' || reference?.id !== REGULATION.id || reference.format !== REGULATION.format || reference.commit !== REGULATION.commit || event?.details?.game !== 'VGC' || event.details.isPublic !== true || event.details.format !== REGULATION.label || !event.standings?.includes(standing) || standing?.id !== `${event.details.id}:${standing?.player}`) {
    return { members, issues: ['Torneo, giocatore o regulation non corrispondono ai dati selezionati.'], warnings }
  }
  if (!Array.isArray(standing.team) || standing.team.length < 1 || standing.team.length > 6) return { members, issues: ['La fonte non pubblica un team esportabile (da 1 a 6 Pokémon).'], warnings }
  const seen = new Set()
  for (const source of standing.team) {
    const name = source.sourceName ?? source.sourceId ?? 'Pokémon non identificato'
    const pokemon = byId.get(source.showdownId)
    if (!pokemon || source.identity === 'conflict') { issues.push(`${name}: forma non associata in modo univoco al catalogo ${REGULATION.label}.`); continue }
    if (seen.has(pokemon.showdownId)) { issues.push(`${name}: Pokémon duplicato, non posso creare due configurazioni con la stessa identità.`); continue }
    seen.add(pokemon.showdownId)
    const build = createDamageBuild(), missingFields = ['sps'], memberMoves = []
    for (const [field, lookup] of [['item', items], ['ability', abilities]]) {
      if (!source[field]) { missingFields.push(field); continue }
      const resolved = lookup.get(normalizeShowdownId(source[field]))
      if (!resolved) { issues.push(`${name}: ${TEAM_SET_LABELS[field]} “${source[field]}” non riconosciuto nel catalogo attivo.`); continue }
      build[field] = resolved.id; build[`${field}Name`] = resolved.name
      if (field === 'ability' && !pokemon.abilities.some((ability) => normalizeShowdownId(ability.id) === normalizeShowdownId(resolved.id))) warnings.push(`${pokemon.displayName}: ${resolved.name} è pubblicata dalla fonte ma non è un’abilità base di questa forma. La specie resta quella pubblicata, senza dedurre una Mega.`)
    }
    if (source.nature) {
      const nature = normalizeShowdownId(source.nature)
      if (!Object.hasOwn(CHAMPIONS_NATURES, nature)) issues.push(`${name}: natura “${source.nature}” non riconosciuta.`)
      else build.nature = nature
    } else missingFields.push('nature')
    if (!Array.isArray(source.moves) || source.moves.length === 0) missingFields.push('moves')
    else if (source.moves.length > 4) issues.push(`${name}: la fonte pubblica più di quattro mosse.`)
    else {
      const legal = new Set(getTeamMoveOptions(pokemon).options.map((option) => option.value))
      for (const moveName of source.moves) {
        const move = moves.get(normalizeShowdownId(moveName))
        if (!move) issues.push(`${name}: mossa “${moveName}” non riconosciuta.`)
        else if (memberMoves.includes(move.id)) issues.push(`${name}: mossa ${move.name} duplicata.`)
        else { memberMoves.push(move.id); if (!legal.has(move.id)) warnings.push(`${pokemon.displayName}: ${move.name} è fuori dal learnset verificato; la mossa pubblicata viene conservata come nell’import Showdown.`) }
      }
      if (source.moves.length < 4) missingFields.push('moves')
    }
    if (source.tera) warnings.push(`${pokemon.displayName}: teratipo “${source.tera}” pubblicato, non applicabile al calcolatore Champions.`)
    if (source.identity === 'regulation-alias') warnings.push(`${name}: collegato a ${pokemon.displayName} tramite l’eccezione Limitless ${REGULATION.label}.`)
    build.missingFields = missingFields
    members.push({ pokemon, build, moves: Array.from({ length: 4 }, (_, slot) => memberMoves[slot] ?? ''), sourceName: name })
  }
  return { members, issues, warnings }
}
export function applyTournamentTransfer(workspace, side, request) {
  if (!['attacker', 'defender'].includes(side)) throw new Error('Squadra di destinazione non valida.')
  const preview = previewTournamentTransfer(request)
  if (preview.issues.length) throw new Error(preview.issues.join(' '))
  const next = { ...workspace, teams: { ...workspace.teams, [side]: preview.members.map((member) => member.pokemon.displayName) }, builds: { ...workspace.builds }, moveSets: { ...workspace.moveSets } }
  for (const map of [next.builds, next.moveSets]) for (const key of Object.keys(map)) if (key.startsWith(`${side}:`)) delete map[key]
  for (const member of preview.members) {
    const key = moveSetKey(side, member.pokemon.displayName)
    next.builds[key] = member.build; next.moveSets[key] = member.moves
  }
  return next
}

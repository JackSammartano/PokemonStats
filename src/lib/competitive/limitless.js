import { showdownId } from './normalize.js'
import { REGULATION_ROSTER } from '../regulation.js'

export const LIMITLESS_ORIGIN = 'https://play.limitlesstcg.com'
export const TOURNAMENT_PAGE_SIZE = 20
const idPattern = /^[a-zA-Z0-9_-]{1,100}$/
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const text = (value) => typeof value === 'string' && value.trim().length > 0 && value.length <= 500
const count = (value) => Number.isInteger(value) && value >= 0
const fail = (message) => { throw new Error(`La risposta di Limitless non è compatibile: ${message}.`) }
const optionalText = (value) => {
  if (value == null || value === '') return null
  if (!text(value)) fail('testo non valido')
  return value
}
export const tournamentUrl = (id) => `${LIMITLESS_ORIGIN}/tournament/${encodeURIComponent(id)}`

// Provider spellings observed on 2026-10-31. Targets are stable species IDs,
// never copied catalogue labels or guesses based on an item/ability/moveset.
const speciesAliases = {
  eternalflowerfloette: 'floetteeternal',
  alolanninetales: 'ninetalesalola', hisuianarcanine: 'arcaninehisui',
  hisuiandecidueye: 'decidueyehisui', hisuiansamurott: 'samurotthisui',
  hisuianzoroark: 'zoroarkhisui', hisuiantyphlosion: 'typhlosionhisui',
  paldeantaurosaquabreed: 'taurospaldeaaqua',
  washrotom: 'rotomwash', heatrotom: 'rotomheat',
}
const speciesNameId = (name) => showdownId(String(name ?? '').replaceAll('♀', 'f').replaceAll('♂', 'm'))

export function createLimitlessPokemonResolver(roster) {
  const ids = new Set(roster.map((pokemon) => pokemon.showdownId)), names = new Map()
  function addName(name, id) {
    const key = speciesNameId(name)
    if (!key || !ids.has(id)) return
    if (!names.has(key)) names.set(key, new Set())
    names.get(key).add(id)
  }
  for (const pokemon of roster) {
    for (const name of [pokemon.showdownId, pokemon.showdownName, pokemon.displayName, pokemon.apiName]) addName(name, pokemon.showdownId)
  }
  for (const [name, id] of Object.entries(speciesAliases)) addName(name, id)
  return (sourceId, sourceName) => {
    const candidates = names.get(speciesNameId(sourceName)) ?? new Set()
    const id = sourceId ? showdownId(sourceId) : null
    // An explicit unknown ID is not overridden by a more convenient name.
    if (sourceId && !ids.has(id)) return { showdownId: null, identity: 'unknown-id' }
    if (candidates.size > 1 || (id && candidates.size === 1 && !candidates.has(id))) return { showdownId: null, identity: 'conflict' }
    if (id) return { showdownId: id, identity: 'id' }
    if (candidates.size === 1) return { showdownId: [...candidates][0], identity: 'name' }
    return { showdownId: null, identity: 'unknown-name' }
  }
}
const resolvePokemon = createLimitlessPokemonResolver(REGULATION_ROSTER)

export function normalizeLimitlessGames(payload) {
  if (!Array.isArray(payload)) fail('elenco giochi non valido')
  const matches = payload.filter((game) => game?.id === 'VGC')
  const game = matches[0]
  if (matches.length !== 1 || !object(game.formats) || !object(game.platforms)) fail('registro VGC mancante')
  for (const map of [game.formats, game.platforms]) {
    if (Object.entries(map).some(([id, name]) => !idPattern.test(id) || !text(name))) fail('registro formati o piattaforme non valido')
  }
  return { formats: { ...game.formats }, platforms: { ...game.platforms } }
}

export function getLimitlessFormat(registry, regulation) {
  // Match an explicit provider ID, never the latest format or a similar display name.
  return regulation.mechanics === 'champions' && Object.hasOwn(registry.formats, regulation.label) ? regulation.label : null
}

function normalizeTournament(row, format) {
  if (!object(row) || typeof row.id !== 'string' || !idPattern.test(row.id) || row.game !== 'VGC' || row.format !== format || !text(row.name) || typeof row.date !== 'string' || !Number.isFinite(Date.parse(row.date)) || !count(row.players)) fail('torneo, formato o data non validi')
  return { id: row.id, game: row.game, format, name: row.name, date: row.date, players: row.players }
}

export function normalizeTournamentList(payload, format) {
  if (!Array.isArray(payload) || payload.length > TOURNAMENT_PAGE_SIZE) fail('pagina tornei non valida')
  const seen = new Set()
  return payload.map((row) => {
    const tournament = normalizeTournament(row, format)
    if (seen.has(tournament.id)) fail('torneo duplicato')
    seen.add(tournament.id)
    return tournament
  })
}

export function normalizeTournamentDetails(payload, { id, format }) {
  const tournament = normalizeTournament(payload, format)
  if (tournament.id !== id || typeof payload.isPublic !== 'boolean' || typeof payload.isOnline !== 'boolean' || typeof payload.decklists !== 'boolean') fail('identità o visibilità del torneo non valide')
  if (!payload.isPublic) throw new Error('Questo torneo non è pubblicamente elencato. Consulta la fonte originale.')
  if (payload.platform != null && !text(payload.platform)) fail('piattaforma del torneo non valida')
  if (!Array.isArray(payload.phases)) fail('struttura del torneo non valida')
  const phases = payload.phases.map((phase) => {
    if (!object(phase) || !Number.isInteger(phase.phase) || phase.phase < 1 || !text(phase.type) || !count(phase.rounds) || !text(phase.mode)) fail('fase del torneo non valida')
    return { phase: phase.phase, type: phase.type, rounds: phase.rounds, mode: phase.mode }
  })
  const specialRules = payload.specialRules ?? []
  if (!Array.isArray(specialRules) || specialRules.some((rule) => !text(rule))) fail('regole aggiuntive non riconosciute')
  return { ...tournament, platform: payload.platform ?? null, isOnline: payload.isOnline, decklists: payload.decklists,
    organizer: optionalText(payload.organizer?.name), phases, specialRules,
    hasCustomBans: Array.isArray(payload.bannedCards) && payload.bannedCards.length > 0 }
}

function normalizeTeamMember(member) {
  if (!object(member)) fail('membro del team non valido')
  const sourceId = optionalText(member.id), sourceName = optionalText(member.name)
  let moves = null
  if (member.attacks != null) {
    if (!Array.isArray(member.attacks) || member.attacks.length > 4 || member.attacks.some((move) => !text(move))) fail('mosse del team non valide')
    moves = [...member.attacks]
  }
  return { sourceId, sourceName, ...resolvePokemon(sourceId, sourceName), item: optionalText(member.item), ability: optionalText(member.ability), nature: optionalText(member.nature), tera: optionalText(member.tera), moves }
}

export function normalizeTournamentStandings(payload, tournamentId) {
  if (!Array.isArray(payload)) fail('classifica non valida')
  const seen = new Set()
  const rows = payload.map((row) => {
    if (!object(row) || !text(row.player) || seen.has(row.player)) fail('giocatore mancante o duplicato')
    seen.add(row.player)
    const placing = row.placing ?? null
    if (placing !== null && (!Number.isInteger(placing) || placing < 1)) fail('piazzamento non valido')
    const record = {}
    if (row.record != null && !object(row.record)) fail('record non valido')
    for (const field of ['wins', 'losses', 'ties']) {
      const value = row.record?.[field] ?? null
      if (value !== null && !count(value)) fail('record non valido')
      record[field] = value
    }
    const drop = row.drop ?? null
    if (drop !== null && !count(drop)) fail('ritiro non valido')
    let team = null
    if (row.decklist != null) {
      if (!Array.isArray(row.decklist) || row.decklist.length > 6) fail('team sheet VGC non riconosciuto')
      team = row.decklist.map(normalizeTeamMember)
    }
    return { id: `${tournamentId}:${row.player}`, player: row.player, name: optionalText(row.name) ?? row.player,
      placing, record, drop, team }
  })
  return rows.sort((a, b) => (a.placing ?? Infinity) - (b.placing ?? Infinity) || a.name.localeCompare(b.name, 'en'))
}

export function createLimitlessClient({ fetchImpl = fetch, now = Date.now, maxEntries = 16 } = {}) {
  const cache = new Map()
  let blockedUntil = 0, recent = []
  async function request(path, normalize, { signal } = {}) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const time = now()
    for (const [key, entry] of cache) if (entry.expires <= time) cache.delete(key)
    const stored = cache.get(path)
    if (stored) return { data: stored.data, retrievedAt: stored.retrievedAt }
    recent = recent.filter((stamp) => stamp > time - 300000)
    if (blockedUntil > time || recent.length >= 40) throw new Error('Limite temporaneo delle richieste a Limitless. Attendi prima di riprovare.')
    // Local conservative budget; provider limits are read when CORS makes their headers available.
    recent.push(time)
    const response = await fetchImpl(`${LIMITLESS_ORIGIN}/api/${path}`, {
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
      credentials: 'omit', cache: 'no-store',
    })
    const rate = response.headers.get('ratelimit') ?? ''
    const remaining = /\br=(\d+)/.exec(rate), reset = /\bt=(\d+)/.exec(rate)
    if (remaining && Number(remaining[1]) === 0 && reset) blockedUntil = now() + Math.max(1000, Number(reset[1]) * 1000)
    if (!response.ok) {
      if (response.status === 429 || response.status === 503) {
        const retry = response.headers.get('retry-after')
        const duration = retry ? (/^\d+$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry) - now()) : 300000
        blockedUntil = Math.max(blockedUntil, now() + (Number.isFinite(duration) ? Math.max(1000, duration) : 300000))
      }
      throw new Error(response.status === 404 ? 'Il torneo o i suoi dati non sono disponibili su Limitless.' : `Limitless non disponibile (HTTP ${response.status}). Riprova più tardi.`)
    }
    if (!/application\/json/i.test(response.headers.get('content-type') ?? '')) fail('risposta non JSON')
    const data = normalize(await response.json())
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const retrievedAt = now(), policy = response.headers.get('cache-control') ?? ''
    const maxAge = /(?:^|,)\s*max-age=(\d+)/i.exec(policy)
    const ttl = /no-store|no-cache/i.test(policy) ? 0 : Math.min(120000, maxAge ? Number(maxAge[1]) * 1000 : 120000)
    if (ttl > 0) {
      cache.set(path, { data, retrievedAt, expires: retrievedAt + ttl })
      while (cache.size > maxEntries) cache.delete(cache.keys().next().value)
    }
    return { data, retrievedAt }
  }
  return {
    games(options) { return request('games', normalizeLimitlessGames, options) },
    tournaments(format, page, options) {
      if (typeof format !== 'string' || !idPattern.test(format) || !Number.isInteger(page) || page < 1) throw new Error('Formato o pagina non validi')
      return request(`tournaments?game=VGC&format=${encodeURIComponent(format)}&limit=${TOURNAMENT_PAGE_SIZE}&page=${page}`, (data) => normalizeTournamentList(data, format), options)
    },
    async event(id, format, options) {
      if (typeof id !== 'string' || typeof format !== 'string' || !idPattern.test(id) || !idPattern.test(format)) throw new Error('Identificativo o formato non validi')
      const details = await request(`tournaments/${id}/details`, (data) => normalizeTournamentDetails(data, { id, format }), options)
      if (details.data.format !== format) fail('formato del torneo in cache non corrispondente')
      const standings = await request(`tournaments/${id}/standings`, (data) => normalizeTournamentStandings(data, id), options)
      return { details: details.data, standings: standings.data, retrievedAt: standings.retrievedAt }
    },
  }
}

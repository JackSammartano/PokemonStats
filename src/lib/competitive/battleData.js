import { showdownId } from './normalize.js'

export const BATTLE_DATA_ORIGIN = 'https://championsbattledata.com'
export const BATTLE_DATA_GROUPS = {
  move: 'Mosse più usate', held_item: 'Strumenti', ability: 'Abilità',
  stat_alignment: 'Nature', stat_points: 'Distribuzioni SP', teammate: 'Compagni frequenti',
}
const POINT_FIELDS = ['hp_points', 'attack_points', 'defense_points', 'sp_atk_points', 'sp_def_points', 'speed_points']
const seasonPattern = /^(Current|M[1-9]\d*)$/
const idPattern = /^[a-z0-9]+$/
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const text = (value) => typeof value === 'string' && value.trim().length > 0 && value.length <= 200
const positiveInteger = (value) => Number.isInteger(value) && value > 0
const fail = (message) => { throw new Error(`La risposta di Champions Battle Data non è compatibile: ${message}.`) }

export function parseNativeDate(value) {
  if (value === null) return null
  const match = /^(\d{2})_(\d{2})_(\d{4})$/.exec(value ?? '')
  if (!match) fail('data non riconosciuta')
  const [, day, month, year] = match
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`)
  if (!Number.isFinite(date.getTime()) || date.getUTCDate() !== Number(day) || date.getUTCMonth() + 1 !== Number(month)) fail('data non valida')
  return date.toISOString()
}

export function normalizeNativeRankings(payload, season) {
  if (!object(payload) || payload.format !== 'Doubles' || payload.season !== season || !seasonPattern.test(season)) fail('formato o stagione diversi dalla richiesta')
  if (!text(payload.dataVersion) || !Number.isFinite(Date.parse(payload.generatedAt))) fail('provenienza mancante')
  if (!Array.isArray(payload.seasons) || !payload.seasons.length || payload.seasons.some((value) => !seasonPattern.test(value)) || new Set(payload.seasons).size !== payload.seasons.length || !payload.seasons.includes(season)) fail('elenco stagioni non valido')
  if (!Array.isArray(payload.rankings) || !Number.isInteger(payload.total) || payload.total < 0 || payload.offset !== 0 || payload.count !== payload.rankings.length || payload.count !== payload.total) fail('classifica incompleta')
  const seen = new Set()
  const rankings = payload.rankings.map((row, index) => {
    if (!object(row) || row.position !== index + 1 || typeof row.showdownId !== 'string' || !idPattern.test(row.showdownId) || !text(row.name) || !text(row.battleName) || showdownId(row.battleName) !== row.showdownId || seen.has(row.showdownId)) fail('identità o posizione non valida')
    seen.add(row.showdownId)
    return { position: row.position, showdownId: row.showdownId, name: row.name, battleName: row.battleName }
  })
  return { season, format: 'Doubles', generatedAt: payload.generatedAt, dataVersion: payload.dataVersion, seasons: [...payload.seasons], total: payload.total, rankings }
}

export function normalizeNativeBattle(payload, { season, id }) {
  if (!object(payload) || payload.format !== 'Doubles' || payload.season !== season || payload.showdownId !== id || !text(payload.pokemon) || showdownId(payload.pokemon) !== id) fail('Pokémon, formato o stagione diversi dalla richiesta')
  if (!Array.isArray(payload.rows) || !text(payload.source) || !payload.source.startsWith('pokemon_champions_assets/battle_data/')) fail('dettagli o provenienza mancanti')
  const date = parseNativeDate(payload.date)
  const groups = Object.fromEntries(Object.keys(BATTLE_DATA_GROUPS).map((key) => [key, []]))
  const seen = new Set()
  for (const row of payload.rows) {
    if (!object(row) || !Object.hasOwn(groups, row.category) || !positiveInteger(row.rank) || !positiveInteger(row.column_position) || !text(row.pokemon) || showdownId(row.pokemon) !== id || typeof row.name !== 'string') fail('categoria o riga non riconosciuta')
    const key = `${row.category}:${row.rank}`
    if (seen.has(key)) fail('riga duplicata')
    seen.add(key)
    const pct = row.percentage_value
    const missing = pct === null && row.percentage === ''
    if (!missing && (typeof pct !== 'number' || !Number.isFinite(pct) || pct < 0 || pct > 100 || typeof row.percentage !== 'string' || !/^\d+(\.\d+)?%$/.test(row.percentage) || Math.abs(Number.parseFloat(row.percentage) - pct) > 1e-8)) fail('percentuale non valida')
    let points = null
    if (row.category === 'stat_points') {
      points = POINT_FIELDS.map((field) => row[field])
      if (points.some((value) => !Number.isInteger(value) || value < 0 || value > 32) || points.reduce((sum, value) => sum + value, 0) > 66) fail('spread non compatibile con gli SP Champions')
    } else if (!text(row.name)) fail('nome mancante')
    groups[row.category].push({ rank: row.rank, name: row.name, percentage: pct, points })
  }
  for (const rows of Object.values(groups)) rows.sort((a, b) => a.rank - b.rank)
  return { showdownId: id, name: payload.pokemon, season, format: 'Doubles', date, source: payload.source, groups }
}

export function createBattleDataClient({ fetchImpl = fetch, now = Date.now, maxEntries = 24 } = {}) {
  const cache = new Map()
  let blockedUntil = 0
  async function request(path, normalize, { signal } = {}) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const time = now()
    for (const [key, entry] of cache) if (entry.expires <= time) cache.delete(key)
    if (blockedUntil > time) throw new Error('Il servizio ha limitato temporaneamente le richieste. Attendi prima di riprovare.')
    const cached = cache.get(path)
    if (cached) return { data: cached.data, retrievedAt: cached.retrievedAt }
    const response = await fetchImpl(`${BATTLE_DATA_ORIGIN}/api/${path}`, {
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
      cache: 'no-store', credentials: 'omit',
    })
    if (!response.ok) {
      if (response.status === 429 || response.status === 503) {
        const retry = response.headers.get('retry-after')
        const duration = retry ? (/^\d+$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry) - now()) : 60000
        blockedUntil = now() + (Number.isFinite(duration) ? Math.max(1000, duration) : 60000)
      }
      throw new Error(response.status === 404 ? 'Dati non disponibili per questo Pokémon e questa stagione.' : `Champions Battle Data non disponibile (HTTP ${response.status}). Riprova più tardi.`)
    }
    if (!/application\/json/i.test(response.headers.get('content-type') ?? '')) fail('il servizio non ha restituito JSON')
    const data = normalize(await response.json())
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const retrievedAt = now()
    const policy = response.headers.get('cache-control') ?? ''
    const maxAge = /(?:^|,)\s*max-age=(\d+)/i.exec(policy)
    const ttl = /no-store|no-cache/i.test(policy) ? 0 : Math.min(120000, maxAge ? Number(maxAge[1]) * 1000 : 120000)
    if (ttl > 0) {
      cache.delete(path)
      cache.set(path, { data, retrievedAt, expires: retrievedAt + ttl })
      while (cache.size > maxEntries) cache.delete(cache.keys().next().value)
    }
    return { data, retrievedAt }
  }
  return {
    rankings(season = 'Current', options) {
      if (!seasonPattern.test(season)) throw new Error('Stagione non riconosciuta')
      return request(`rankings?format=Doubles&season=${season}`, (payload) => normalizeNativeRankings(payload, season), options)
    },
    battle(id, season, options) {
      if (!seasonPattern.test(season) || typeof id !== 'string' || !idPattern.test(id)) throw new Error('Identificativo o stagione non riconosciuti')
      return request(`battle/Doubles/${id}?season=${season}`, (payload) => normalizeNativeBattle(payload, { season, id }), options)
    },
  }
}

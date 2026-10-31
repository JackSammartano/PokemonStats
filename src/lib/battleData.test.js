import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createBattleDataClient, normalizeNativeBattle, normalizeNativeRankings, parseNativeDate } from './competitive/battleData.js'

// Synthetic payloads matching the documented provider shape; never real API data or public statistics.
const rankings = (season = 'Current') => ({
  format: 'Doubles', season, seasons: ['Current', 'M7', 'M1'], generatedAt: '2026-10-31T10:00:00Z', dataVersion: 'synthetic-v1',
  total: 2, count: 2, offset: 0,
  rankings: [
    { position: 1, name: 'Garchomp', battleName: 'Garchomp', showdownId: 'garchomp' },
    { position: 2, name: 'Maushold-Four', battleName: 'Maushold-Four', showdownId: 'mausholdfour' },
  ],
})
const points = { hp_points: 2, attack_points: 32, defense_points: 0, sp_atk_points: 0, sp_def_points: 0, speed_points: 32 }
function battle(id = 'garchomp', season = 'Current') {
  const pokemon = id === 'garchomp' ? 'Garchomp' : 'Raichu-Alola'
  const row = (category, name, pct) => ({ pokemon, category, rank: 1, column_position: 1, name, percentage: pct === null ? '' : `${pct}%`, percentage_value: pct })
  return {
    showdownId: id, pokemon, season, format: 'Doubles', date: season === 'Current' ? null : '31_10_2026',
    source: `pokemon_champions_assets/battle_data/${season}/Doubles/${pokemon}.csv`,
    rows: [row('move', 'Protect', 80), row('held_item', 'Garchompite Z', 35), row('teammate', 'Charizard', null), row('stat_alignment', 'Adamant', 40), { ...row('stat_points', '', 30), ...points }, row('ability', 'Rough Skin', 90)],
  }
}
const response = (payload, policy = 'public, max-age=120') => new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json', 'cache-control': policy } })

test('native rankings retain source positions and unreconciled forms without manufacturing usage or Megas', () => {
  const result = normalizeNativeRankings(rankings(), 'Current')
  assert.equal(result.total, 2)
  assert.equal(result.rankings[1].showdownId, 'mausholdfour')
  assert.equal(Object.hasOwn(result.rankings[0], 'usage'), false)
  assert.equal(result.rankings.some((row) => row.showdownId === 'garchompmegaz'), false)
  for (const mutate of [
    (p) => { p.season = 'M1' }, (p) => { p.format = 'Singles' },
    (p) => { p.count = 1 }, (p) => { p.rankings[1].position = 1 },
    (p) => { p.rankings[1] = { ...p.rankings[0], position: 2 } },
    (p) => { p.rankings[0].showdownId = 'garchompmegaz' },
  ]) {
    const payload = rankings(); mutate(payload)
    assert.throws(() => normalizeNativeRankings(payload, 'Current'), /non è compatibile/)
  }
})

test('native details preserve original percentages, missing shares and SP without associating natures', () => {
  const data = normalizeNativeBattle(battle(), { season: 'Current', id: 'garchomp' })
  assert.equal(data.groups.move[0].percentage, 80)
  assert.equal(data.groups.teammate[0].percentage, null)
  assert.deepEqual(data.groups.stat_points[0].points, [2, 32, 0, 0, 0, 32])
  assert.equal(Object.hasOwn(data.groups.stat_points[0], 'nature'), false)
  assert.equal(data.date, null)
  assert.equal(parseNativeDate('31_10_2026'), '2026-10-31T00:00:00.000Z')
  assert.throws(() => parseNativeDate('31_02_2026'), /data non valida/)
  assert.throws(() => parseNativeDate('2026-10-31'), /data non riconosciuta/)
  for (const mutate of [
    (p) => { p.showdownId = 'garchompmegaz' }, (p) => { p.season = 'M1' },
    (p) => { p.rows[0].percentage_value = null }, (p) => { p.rows[0].percentage_value = 0.8 },
    (p) => { p.rows[0].percentage_value = 101 }, (p) => { p.rows[0].category = 'unknown_category' },
    (p) => { p.rows.push({ ...p.rows[0] }) }, (p) => { p.rows[4].attack_points = 252 },
    (p) => { p.rows[4].hp_points = 32 },
  ]) {
    const payload = battle(); mutate(payload)
    assert.throws(() => normalizeNativeBattle(payload, { season: 'Current', id: 'garchomp' }), /non è compatibile/)
  }
})

test('native memory cache is separated by season and species, expires and never uses persistent browser caching', async () => {
  let time = 1000
  const calls = []
  const client = createBattleDataClient({ now: () => time, fetchImpl: async (url, options) => {
    calls.push({ url, options })
    const parsed = new URL(url), season = parsed.searchParams.get('season')
    return response(parsed.pathname.includes('/rankings') ? rankings(season) : battle(parsed.pathname.split('/').at(-1), season))
  } })
  const first = await client.rankings()
  await client.rankings()
  assert.equal(calls.length, 1)
  assert.equal(calls[0].options.cache, 'no-store')
  assert.equal(calls[0].options.credentials, 'omit')
  assert.equal(first.retrievedAt, 1000)
  await client.rankings('M1')
  await client.battle('garchomp', 'Current')
  await client.battle('raichualola', 'Current')
  await client.battle('garchomp', 'M1')
  assert.equal(calls.length, 5)
  time = 121001
  await client.rankings()
  assert.equal(calls.length, 6)
  assert.throws(() => client.battle('../garchomp', 'M7'), /non riconosciuti/)
  assert.throws(() => client.battle(undefined, 'M7'), /non riconosciuti/)
})

test('native cache obeys shorter or forbidden caching and evicts old entries', async () => {
  let time = 0, calls = 0, policy = 'max-age=1'
  const client = createBattleDataClient({ now: () => time, maxEntries: 1, fetchImpl: async (url) => {
    calls++
    return response(rankings(new URL(url).searchParams.get('season')), policy)
  } })
  await client.rankings();time = 1001;await client.rankings()
  assert.equal(calls, 2)
  await client.rankings('M1');await client.rankings()
  assert.equal(calls, 4)
  time = 3000;policy = 'no-store';await client.rankings();await client.rankings()
  assert.equal(calls, 6)
})

test('native errors never retry automatically or substitute expired data and enforce Retry-After', async () => {
  let time = 0, calls = 0, limited = false
  const client = createBattleDataClient({ now: () => time, fetchImpl: async () => {
    calls++
    return limited ? new Response('', { status: 429, headers: { 'retry-after': '180' } }) : response(rankings())
  } })
  await client.rankings();time = 121000;limited = true
  await assert.rejects(client.rankings(), /HTTP 429/)
  assert.equal(calls, 2)
  await assert.rejects(client.rankings(), /limitato temporaneamente/)
  assert.equal(calls, 2)
  time = 301001;limited = false
  await client.rankings();assert.equal(calls, 3)
  const missing = createBattleDataClient({ fetchImpl: async () => new Response('', { status: 404 }) })
  await assert.rejects(missing.battle('garchompmegaz', 'M7'), /Dati non disponibili/)
  const bad = createBattleDataClient({ fetchImpl: async () => new Response('<html>not JSON</html>') })
  await assert.rejects(bad.rankings(), /non ha restituito JSON/)
})

test('aborted native requests cannot populate the cache or update a later selection', async () => {
  let release, calls = 0
  const client = createBattleDataClient({ fetchImpl: () => {
    calls++
    return new Promise((done) => { release = done })
  } })
  const controller = new AbortController()
  const pending = client.rankings('Current', { signal: controller.signal })
  controller.abort();release(response(rankings()))
  await assert.rejects(pending, { name: 'AbortError' })
  const next = client.rankings();release(response(rankings()));await next
  assert.equal(calls, 2)
})

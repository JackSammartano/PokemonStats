import test from 'node:test'
import assert from 'node:assert/strict'
import { createLimitlessClient, createLimitlessPokemonResolver, getLimitlessFormat, normalizeLimitlessGames, normalizeTournamentList, normalizeTournamentDetails, normalizeTournamentStandings } from './competitive/limitless.js'
import { REGULATION_ROSTER } from './regulation.js'

// Synthetic contracts: no participant data or third-party team sheet is archived here.
const tournament = (overrides = {}) => ({ id: 'event-1', name: 'Synthetic event', game: 'VGC', format: 'M-C', date: '2026-10-01T10:00:00Z', players: 10, ...overrides })
const details = (overrides = {}) => ({ ...tournament(), isPublic: true, isOnline: true, decklists: true, platform: 'SWITCH', organizer: { name: 'Synthetic organizer' }, phases: [{ phase: 1, type: 'SWISS', rounds: 4, mode: 'BO3' }], ...overrides })
const standing = (overrides = {}) => ({ player: 'synthetic-player', name: 'Synthetic player', placing: 1, record: { wins: 4, losses: 0, ties: 0 }, decklist: [{ id: 'charizard', name: 'Charizard', item: 'Charizardite Y', ability: 'Blaze', nature: 'Modest', attacks: ['Protect'] }], ...overrides })
const games = [{ id: 'VGC', formats: { 'M-C': 'Regulation M-C', 'M-B': 'Regulation M-B' }, platforms: { SWITCH: 'Nintendo Switch', SIM: 'Simulator' } }]
const response = (payload, status = 200, headers = {}) => new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json', ...headers } })

test('Limitless maps only an explicit Champions regulation from the live registry', () => {
  const registry = normalizeLimitlessGames(games)
  assert.equal(getLimitlessFormat(registry, { label: 'M-C', mechanics: 'champions' }), 'M-C')
  assert.equal(getLimitlessFormat(registry, { label: 'M-D', mechanics: 'champions' }), null)
  assert.equal(getLimitlessFormat(registry, { label: 'M-C', mechanics: 'sv' }), null)
  assert.throws(() => normalizeLimitlessGames([]))
  assert.throws(() => normalizeLimitlessGames([...games, ...games]))
})
test('Limitless rejects duplicate tournaments, wrong format, invalid dates and oversized pages', () => {
  assert.equal(normalizeTournamentList([tournament()], 'M-C')[0].players, 10)
  for (const payload of [[tournament(), tournament()], [tournament({ format: 'M-B' })], [tournament({ date: 'invalid' })], Array(21).fill(tournament())]) assert.throws(() => normalizeTournamentList(payload, 'M-C'))
  assert.throws(() => normalizeTournamentDetails(details({ id: 'different' }), { id: 'event-1', format: 'M-C' }))
  assert.throws(() => normalizeTournamentDetails(details({ isPublic: false }), { id: 'event-1', format: 'M-C' }), /pubblicamente/)
})
test('Limitless keeps missing placing, record and partial sets without guessing or Mega conversion', () => {
  const rows = normalizeTournamentStandings([standing({ placing: null, record: { wins: 1 }, drop: 2, decklist: [{ id: 'charizard', name: 'Charizard', item: 'Charizardite Y' }, { id: 'future-form', name: 'Future Form', attacks: [] }] })], 'event-1')
  assert.equal(rows[0].placing, null)
  assert.deepEqual(rows[0].record, { wins: 1, losses: null, ties: null })
  assert.equal(rows[0].drop, 2)
  assert.equal(rows[0].team[0].showdownId, 'charizard')
  assert.equal(rows[0].team[0].nature, null)
  assert.equal(rows[0].team[0].moves, null)
  assert.equal(rows[0].team[1].showdownId, null)
  assert.equal(rows[0].team[1].sourceId, 'future-form')
  assert.deepEqual(rows[0].team[1].moves, [])
  assert.equal(normalizeTournamentStandings([standing({ decklist: null })], 'event-1')[0].team, null)
})
test('Limitless preserves unknown names and refuses ambiguous form reconciliation', () => {
  const row = normalizeTournamentStandings([standing({ decklist: [{ id: 'charizard', name: 'Charizard-Mega-Y' }, { name: 'Unknown' }] })], 'event-1')[0]
  assert.equal(row.team[0].showdownId, null)
  assert.equal(row.team[0].sourceName, 'Charizard-Mega-Y')
  assert.equal(row.team[0].identity, 'conflict')
  assert.equal(row.team[1].showdownId, null)
})

const observedSpecies = [
  ['floette-eternal', 'Eternal Flower Floette', 'floetteeternal'],
  ['indeedee-f', 'Indeedee ♀', 'indeedeef'],
  ['basculegion-f', 'Basculegion ♀', 'basculegionf'],
  ['meowstic-f', 'Meowstic ♀', 'meowsticf'],
  ['ninetales-alola', 'Alolan Ninetales', 'ninetalesalola'],
  ['arcanine-hisui', 'Hisuian Arcanine', 'arcaninehisui'],
  ['decidueye-hisui', 'Hisuian Decidueye', 'decidueyehisui'],
  ['samurott-hisui', 'Hisuian Samurott', 'samurotthisui'],
  ['zoroark-hisui', 'Hisuian Zoroark', 'zoroarkhisui'],
  ['typhlosion-hisui', 'Hisuian Typhlosion', 'typhlosionhisui'],
  ['tauros-paldea-aqua', 'Paldean Tauros Aqua Breed', 'taurospaldeaaqua'],
  ['rotom-wash', 'Wash Rotom', 'rotomwash'],
  ['rotom-heat', 'Heat Rotom', 'rotomheat'],
]
test('Limitless connects all 13 observed alternate spellings through exact catalogue IDs and preserves source names', () => {
  for (const [id, name, target] of observedSpecies) {
    const member = normalizeTournamentStandings([standing({ decklist: [{ id, name }] })], 'event-1')[0].team[0]
    assert.equal(member.showdownId, target, name)
    assert.equal(member.identity, 'id')
    assert.equal(member.sourceId, id)
    assert.equal(member.sourceName, name)
  }
})
test('Limitless uses catalogue names and verified provider aliases only when a source ID is absent', () => {
  const resolve = createLimitlessPokemonResolver(REGULATION_ROSTER)
  for (const [, name, target] of observedSpecies) assert.deepEqual(resolve(null, name), { showdownId: target, identity: 'name' })
  assert.equal(resolve(null, 'Floette Eternal').showdownId, 'floetteeternal')
  assert.equal(resolve('floette', 'Eternal Flower Floette').showdownId, null)
  assert.equal(resolve('charizard', null).showdownId, 'charizard')
  assert.equal(resolve('charizard', 'Alternate spelling absent from the catalogue').showdownId, 'charizard')
  assert.equal(resolve(null, 'Eternal Flower Floet').showdownId, null)
})
test('Limitless never upgrades ordinary Floette, an unknown form or a Mega stone to a different species', () => {
  const member = normalizeTournamentStandings([standing({ decklist: [{ id: 'floette', name: 'Floette', item: 'Floettite' }] })], 'event-1')[0].team[0]
  assert.equal(member.showdownId, null)
  assert.equal(member.identity, 'unknown-id')
  assert.equal(member.sourceName, 'Floette')
  const resolve = createLimitlessPokemonResolver(REGULATION_ROSTER)
  assert.equal(resolve(null, 'Floette').showdownId, null)
  assert.equal(resolve('charizard', 'Alolan Ninetales').identity, 'conflict')
  assert.equal(resolve('indeedee', 'Indeedee ♀').identity, 'conflict')
  assert.equal(resolve('rotom-heat', 'Wash Rotom').identity, 'conflict')
})
test('Limitless resolver follows the supplied regulation roster and refuses ambiguous name collisions', () => {
  const smallRoster = [{ showdownId: 'floetteeternal', displayName: 'Floette Eternal' }]
  const resolve = createLimitlessPokemonResolver(smallRoster)
  assert.equal(resolve(null, 'Eternal Flower Floette').showdownId, 'floetteeternal')
  assert.equal(resolve('ninetales-alola', 'Alolan Ninetales').showdownId, null)
  assert.equal(resolve(null, 'Alolan Ninetales').showdownId, null)
  const conflicting = createLimitlessPokemonResolver([{ showdownId: 'one', displayName: 'Shared' }, { showdownId: 'two', displayName: 'Shared' }])
  assert.equal(conflicting(null, 'Shared').identity, 'conflict')
  assert.equal(conflicting('one', 'Shared').identity, 'conflict')
  const gender = createLimitlessPokemonResolver([{ showdownId: 'meowstic', displayName: 'Meowstic Male' }])
  assert.equal(gender('meowstic', 'Meowstic ♂').showdownId, 'meowstic')
})
test('Limitless accepts null or omitted platforms while keeping tournament structure validation strict', () => {
  const omitted = details({ isOnline: false }); delete omitted.platform
  for (const payload of [details({ platform: null, isOnline: false }), omitted]) {
    const result = normalizeTournamentDetails(payload, { id: 'event-1', format: 'M-C' })
    assert.equal(result.platform, null)
    assert.equal(result.isOnline, false)
    assert.equal(result.phases[0].mode, 'BO3')
  }
  for (const platform of ['', {}, 42, false]) assert.throws(() => normalizeTournamentDetails(details({ platform }), { id: 'event-1', format: 'M-C' }), /piattaforma del torneo/)
  for (const phases of [null, {}, undefined]) assert.throws(() => normalizeTournamentDetails(details({ phases }), { id: 'event-1', format: 'M-C' }), /struttura del torneo/)
})
test('Limitless still loads standings and team sheets when platform is unknown', async () => {
  for (const missing of [false, true]) {
    const payload = details({ platform: null, isOnline: false })
    if (missing) delete payload.platform
    const calls = []
    const client = createLimitlessClient({ fetchImpl: async (url) => { calls.push(url); return response(url.endsWith('/details') ? payload : [standing()]) } })
    const event = await client.event('event-1', 'M-C')
    assert.equal(calls.length, 2)
    assert.equal(event.details.platform, null)
    assert.equal(event.standings[0].team[0].showdownId, 'charizard')
  }
})
test('Limitless handles ties, missing positions and published order without inferring final standings', () => {
  const rows = normalizeTournamentStandings([standing({ player: 'missing', placing: null }), standing({ player: 'b', placing: 3 }), standing({ player: 'a', placing: 3 })], 'event-1')
  assert.deepEqual(rows.map((row) => row.placing), [3, 3, null])
  for (const payload of [[standing(), standing()], [standing({ placing: 0 })], [standing({ record: { wins: -1 } })], [standing({ decklist: Array(7).fill({}) })], [standing({ decklist: [{ attacks: Array(5).fill('Protect') }] })]]) assert.throws(() => normalizeTournamentStandings(payload, 'event-1'))
})
test('Limitless fetches one page and only explicitly selected event details followed by standings', async () => {
  const calls = []
  const client = createLimitlessClient({ fetchImpl: async (url, options) => { calls.push({ url, options }); return response(url.includes('/details') ? details() : url.includes('/standings') ? [standing()] : [tournament()]) } })
  await client.tournaments('M-C', 2)
  assert.match(calls[0].url, /game=VGC&format=M-C&limit=20&page=2$/)
  assert.equal(calls.length, 1)
  const event = await client.event('event-1', 'M-C')
  assert.equal(event.standings.length, 1)
  assert.match(calls[1].url, /event-1\/details$/)
  assert.match(calls[2].url, /event-1\/standings$/)
  assert.equal(calls[0].options.credentials, 'omit')
  assert.equal(calls[0].options.cache, 'no-store')
  assert.ok(calls[0].options.signal instanceof AbortSignal)
  await assert.rejects(() => client.event(undefined, 'M-C'))
  assert.throws(() => client.tournaments(undefined, 1))
  assert.throws(() => client.tournaments('M-C', 0))
})
test('Limitless never requests standings for private or mismatched events', async () => {
  for (const payload of [details({ isPublic: false }), details({ format: 'M-B' })]) {
    let calls = 0
    const client = createLimitlessClient({ fetchImpl: async () => { calls++; return response(payload) } })
    await assert.rejects(() => client.event('event-1', 'M-C'))
    assert.equal(calls, 1)
  }
})
test('Limitless checks the format even when event details are cached', async () => {
  let calls = 0
  const client = createLimitlessClient({ fetchImpl: async (url) => { calls++; return response(url.endsWith('/details') ? details() : []) } })
  await client.event('event-1', 'M-C')
  await assert.rejects(() => client.event('event-1', 'M-B'), /cache/)
  assert.equal(calls, 2)
})
test('Limitless memory cache expires after two minutes, honors lower TTL and no-store', async () => {
  for (const [policy, ttl] of [['public, max-age=30', 30000], ['', 120000], ['no-store', 0], ['no-cache', 0]]) {
    let time = 1, calls = 0
    const client = createLimitlessClient({ now: () => time, fetchImpl: async () => { calls++; return response(games, 200, { 'cache-control': policy }) } })
    await client.games(); await client.games()
    assert.equal(calls, ttl ? 1 : 2)
    time += ttl || 1
    await client.games()
    assert.equal(calls, ttl ? 2 : 3)
  }
})
test('Limitless bounds memory and does not serve expired data after a failure', async () => {
  let calls = 0, time = 1, fail = false
  const client = createLimitlessClient({ maxEntries: 1, now: () => time, fetchImpl: async (url) => { calls++; return response(fail ? {} : url.endsWith('games') ? games : [], fail ? 500 : 200) } })
  await client.games(); await client.tournaments('M-C', 1); await client.games()
  assert.equal(calls, 3)
  time += 120000; fail = true
  await assert.rejects(() => client.games(), /HTTP 500/)
})
test('Limitless respects Retry-After and readable rate headers without automatic retries', async () => {
  let calls = 0, time = 1
  const client = createLimitlessClient({ now: () => time, fetchImpl: async () => { calls++; return calls === 1 ? response({}, 429, { 'retry-after': '10' }) : response(games) } })
  await assert.rejects(() => client.games(), /HTTP 429/)
  await assert.rejects(() => client.games(), /Attendi/)
  assert.equal(calls, 1)
  time += 10000
  await client.games()
  const exhausted = createLimitlessClient({ fetchImpl: async () => response(games, 200, { ratelimit: '"50-in-5min"; r=0; t=60' }) })
  await exhausted.games()
  await exhausted.games() // Already cached values remain readable during a pause.
  await assert.rejects(() => exhausted.tournaments('M-C', 1), /Attendi/)
})
test('Limitless applies a conservative per-tab budget even when CORS hides rate headers', async () => {
  let calls = 0, time = 1
  const client = createLimitlessClient({ now: () => time, fetchImpl: async () => { calls++; return response([], 200, { 'cache-control': 'no-store' }) } })
  for (let page = 1; page <= 40; page++) await client.tournaments('M-C', page)
  await assert.rejects(() => client.tournaments('M-C', 41), /Attendi/)
  assert.equal(calls, 40)
  time += 300000
  await client.tournaments('M-C', 41)
  assert.equal(calls, 41)
})
test('Limitless pauses on 503 without exposed headers and honors HTTP-date Retry-After', async () => {
  for (const [headers, duration] of [[{}, 300000], [{ 'retry-after': 'Thu, 01 Oct 2026 00:00:10 GMT' }, 10000]]) {
    let time = Date.parse('2026-10-01T00:00:00Z'), calls = 0
    const client = createLimitlessClient({ now: () => time, fetchImpl: async () => { calls++; return calls === 1 ? response({}, 503, headers) : response(games) } })
    await assert.rejects(() => client.games(), /HTTP 503/)
    time += duration - 1
    await assert.rejects(() => client.games(), /Attendi/)
    assert.equal(calls, 1)
    time++
    await client.games()
    assert.equal(calls, 2)
  }
})
test('Limitless rejects non-JSON and does not cache a response after cancellation', async () => {
  const malformed = createLimitlessClient({ fetchImpl: async () => new Response('<html>down</html>', { headers: { 'content-type': 'text/html' } }) })
  await assert.rejects(() => malformed.games(), /JSON/)
  const controller = new AbortController()
  let calls = 0
  const client = createLimitlessClient({ fetchImpl: async () => { calls++; if (calls === 1) controller.abort(); return response(games) } })
  await assert.rejects(() => client.games({ signal: controller.signal }), { name: 'AbortError' })
  await client.games()
  assert.equal(calls, 2)
  await assert.rejects(() => client.games({ signal: controller.signal }), { name: 'AbortError' })
})

import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import { assertCompleteMonth, fetchChaos, importCompetitive } from './import-competitive.mjs'
import { checkCompetitive } from './check-competitive.mjs'

const fixture = await readFile(new URL('./fixtures/competitive-chaos.json', import.meta.url), 'utf8')
const now = new Date('2026-10-31T12:00:00Z')
const jsonResponse = (body) => new Response(body, { headers: { 'content-type': 'application/json' } })

test('imports are idempotent offline, retain historical M-C metadata and preserve the last valid snapshot on failure', async () => {
  const path = await mkdtemp(join(tmpdir(), 'pokemonstats-competitive-'))
  const directory = pathToFileURL(`${path}/`)
  const manifestPath = new URL('src/data/competitive/manifest.json', directory)
  const options = { directory, regulationId: 'mc', period: '2026-09', cutoff: 1760, now }
  let requests = 0
  try {
    const first = await importCompetitive({ ...options, fetchImpl: async () => { requests++; return jsonResponse(fixture) } })
    assert.equal(first.changed, true)
    const before = await readFile(manifestPath, 'utf8')
    const second = await importCompetitive({ ...options, offline: true, now: new Date('2026-11-01T00:00:00Z'), fetchImpl: () => { throw Error('offline called network') } })
    assert.equal(second.changed, false)
    assert.equal(requests, 1)
    assert.equal(await readFile(manifestPath, 'utf8'), before)
    assert.equal(second.snapshot.importedAt, first.snapshot.importedAt)
    await checkCompetitive(directory)
    await assert.rejects(importCompetitive({ ...options, refresh: true, fetchImpl: async () => jsonResponse('{broken') }))
    assert.equal(await readFile(manifestPath, 'utf8'), before)
    await assert.rejects(importCompetitive({ ...options, period: '2026-08', offline: true }), /No cached source/)
    assert.equal(await readFile(manifestPath, 'utf8'), before)
    const entry = JSON.parse(before).snapshots[0]
    const asset = new URL(`src/data/competitive/${entry.file}`, directory)
    const content = await readFile(asset, 'utf8')
    await writeFile(asset, content.replace(/\n/g, '\r\n'))
    await checkCompetitive(directory)
    const corrupted = JSON.parse(content)
    corrupted.battles++
    await writeFile(asset, JSON.stringify(corrupted))
    await assert.rejects(checkCompetitive(directory), /integrity mismatch/)
  } finally { await rm(path, { recursive: true, force: true }) }
})

test('provider retry respects Retry-After, stops on long waits and never retries 404 or non-JSON success', async () => {
  const waits = [], responses = [new Response('', { status: 429, headers: { 'retry-after': '2' } }), jsonResponse(fixture)]
  const result = await fetchChaos('https://www.smogon.com/stats/test', { fetchImpl: async () => responses.shift(), sleep: async (ms) => waits.push(ms) })
  assert.equal(result, fixture)
  assert.deepEqual(waits, [2000])
  let calls = 0
  await assert.rejects(fetchChaos('test', { fetchImpl: async () => { calls++; return new Response('', { status: 404 }) } }), /HTTP 404/)
  assert.equal(calls, 1)
  await assert.rejects(fetchChaos('test', { fetchImpl: async () => new Response('', { status: 429, headers: { 'retry-after': '120' } }), sleep: () => { throw Error('must not wait') } }), /later retry/)
  await assert.rejects(fetchChaos('test', { fetchImpl: async () => new Response('<html>error</html>') }), /non-JSON/)
  calls = 0
  await assert.rejects(fetchChaos('test', { fetchImpl: async () => { calls++; throw Error('network unavailable') }, sleep: async () => {} }), /network unavailable/)
  assert.equal(calls, 3)
})

test('month selection is explicit, valid and never silently substitutes current or future statistics', () => {
  assert.doesNotThrow(() => assertCompleteMonth('2026-09', now))
  for (const month of [undefined, '2026-10', '2026-11', '2026-00', '2026-13', '../2026-09']) assert.throws(() => assertCompleteMonth(month, now), /complete past month/)
})

test('versioned competitive snapshots and manifest validate offline for their own regulation', async () => {
  const manifest = await checkCompetitive()
  assert.ok(manifest.snapshots.length > 0)
})

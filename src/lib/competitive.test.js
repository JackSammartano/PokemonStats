import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import mc from '../data/regulations/mc.js'
import { DETAIL_LIMIT, normalizeChaos, parseChampionsSpread, percentage, validateCompetitiveSnapshot } from './competitive/normalize.js'
import { createCompetitiveLabels, formatShare, formatUsage, getCompatibleSnapshots } from './competitive/presentation.js'

// Historical M-C identities; fixture weights are intentionally synthetic, never public statistics.
const fixture = JSON.parse(readFileSync(new URL('../../scripts/fixtures/competitive-chaos.json', import.meta.url), 'utf8'))
const descriptor = {
  id: '2026-09-gen9championsvgc2026regmc-1760', provider: 'smogon', period: '2026-09', cutoff: 1760,
  format: mc.source.format, formatLabel: mc.source.formatName, regulationId: 'mc', regulationLabel: 'M-C',
  statSystem: 'champions-sp', battleStyle: 'doubles', mechanicsReference: mc.source.commit,
  sourceHash: 'a'.repeat(64), importedAt: '2026-10-31T00:00:00.000Z',
  sourceUrl: 'https://www.smogon.com/stats/2026-09/chaos/gen9championsvgc2026regmc-1760.json',
}
const normalize = (payload = structuredClone(fixture)) => normalizeChaos(payload, descriptor, mc.roster)

test('historical M-C normalizes usage fractions without dividing moves or teammates by their sums', () => {
  const snapshot = normalize(), row = snapshot.pokemon[0]
  validateCompetitiveSnapshot(snapshot, mc.roster)
  assert.equal(formatUsage(row.usage * 100), '60%')
  assert.equal(formatShare(row.distributions.moves.entries[0].weight, row.weightedCount), '90%')
  assert.equal(formatShare(row.distributions.teammates.entries[0].weight, row.weightedCount), '70%')
  assert.equal(row.distributions.moves.emptySlotWeight, 200)
  assert.equal(row.distributions.moves.entries.length, 3)
  assert.equal(snapshot.pokemon[1].distributions.teammates, null)
  assert.equal(percentage(10, 0), null)
  assert.equal(formatUsage(null), 'Non disponibile')
  assert.equal(formatUsage(0.001), '<0,1%')
})

test('natures use every source spread, rather than the most common individual spread', () => {
  const row = normalize().pokemon[0]
  assert.equal(row.distributions.spreads.entries[0].key, 'Jolly:2/32/0/0/0/32')
  assert.deepEqual(row.distributions.natures.entries[0], { key: 'Adamant', weight: 50 })
  assert.deepEqual(parseChampionsSpread('Jolly:2/32/0/0/0/32'), { nature: 'Jolly', points: [2, 32, 0, 0, 0, 32] })
  assert.throws(() => parseChampionsSpread('Jolly:4/252/0/0/0/252'), /not Champions SP/)
  assert.throws(() => parseChampionsSpread('Jolly:32/32/32/0/0/0'), /not Champions SP/)
  assert.throws(() => parseChampionsSpread('Unknown:0/0/0/0/0/0'), /unrecognized/)
})

test('presentation limits retain the original denominator and account for omitted weights', () => {
  const payload = structuredClone(fixture)
  payload.data.Rillaboom.Spreads = Object.fromEntries(Array.from({ length: 25 }, (_, index) => [`Adamant:${index}/0/0/0/0/0`, 1]))
  const row = normalize(payload).pokemon[0]
  assert.equal(row.distributions.spreads.totalEntries, 25)
  assert.equal(row.distributions.spreads.entries.length, DETAIL_LIMIT)
  assert.equal(row.distributions.spreads.omittedWeight, 5)
  assert.equal(row.distributions.natures.entries[0].weight, 25)
  assert.equal(row.weightedCount, 100)
})

test('historical M-C keeps regional and Mega Z identities distinct and rejects guessed mappings', () => {
  const payload = structuredClone(fixture)
  payload.data['Garchomp'] = structuredClone(payload.data['Garchomp-Mega-Z'])
  payload.data['Raichu-Alola'] = structuredClone(payload.data['Garchomp-Mega-Z'])
  const ids = normalize(payload).pokemon.map((entry) => entry.showdownId)
  assert.ok(ids.includes('garchomp') && ids.includes('garchompmegaz') && ids.includes('raichualola'))
  payload.data['Garchomp Mega Z'] = structuredClone(payload.data['Garchomp-Mega-Z'])
  assert.throws(() => normalize(payload), /duplicate species/)
  delete payload.data['Garchomp Mega Z']
  payload.data['Imaginary Form'] = structuredClone(payload.data.Garchomp)
  assert.throws(() => normalize(payload), /outside regulation roster/)
})

test('changed source formats, invalid weights, missing denominators and malformed snapshots fail explicitly', () => {
  for (const mutate of [
    (p) => { p.info.metagame = 'gen9ou' },
    (p) => { p.info.cutoff = 0 },
    (p) => { p.info['number of battles'] = -1 },
    (p) => { p.info['cutoff deviation'] = 10 },
    (p) => { p.data.Rillaboom.usage = 60 },
    (p) => { p.data.Rillaboom.Items.miracleseed = -1 },
    (p) => { p.data.Rillaboom.Items.miracleseed = 101 },
    (p) => { delete p.data.Rillaboom.Abilities },
  ]) {
    const payload = structuredClone(fixture); mutate(payload)
    assert.throws(() => normalize(payload), /Competitive data/)
  }
  const snapshot = normalize()
  snapshot.pokemon[0].weightedCount++
  assert.throws(() => validateCompetitiveSnapshot(snapshot, mc.roster), /denominator/)
})

test('labels come from historical M-C data and empty items stay distinct from missing distributions', () => {
  const label = createCompetitiveLabels({ roster: mc.roster, moves: mc.moves, items: mc.items })
  assert.equal(label('moves', 'fakeout'), 'Fake Out')
  assert.equal(label('items', 'miracleseed'), 'Miracle Seed')
  assert.equal(label('items', ''), 'Nessuno strumento')
  assert.match(label('teammates', 'Garchomp-Mega-Z'), /Garchomp/)
  assert.match(label('moves', 'unknown-move'), /non riconciliato/)
  const entry = { regulationId: 'mc', format: mc.source.format, mechanicsReference: mc.source.commit }
  assert.deepEqual(getCompatibleSnapshots({ snapshots: [entry] }, mc.source), [entry])
  assert.deepEqual(getCompatibleSnapshots({ snapshots: [entry] }, { ...mc.source, id: 'mb' }), [])
  assert.deepEqual(getCompatibleSnapshots({ snapshots: [entry] }, { ...mc.source, commit: '0'.repeat(40) }), [])
})

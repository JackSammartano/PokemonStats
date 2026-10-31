import { CHAMPIONS_NATURES } from '../damage/championsData.js'

export const COMPETITIVE_SCHEMA = 1
export const DETAIL_LIMIT = 20
export const DISTRIBUTIONS = ['abilities', 'items', 'moves', 'teammates', 'spreads', 'natures']
const SOURCE_FIELDS = { abilities: 'Abilities', items: 'Items', moves: 'Moves', teammates: 'Teammates', spreads: 'Spreads' }
const NATURES = new Set(Object.keys(CHAMPIONS_NATURES))

export const showdownId = (name) => String(name).toLowerCase().replace(/[^a-z0-9]/g, '')
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const finite = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0
const fail = (message) => { throw new Error(`Competitive data: ${message}`) }
export const percentage = (weight, denominator) => denominator > 0 ? weight / denominator * 100 : null

export function parseChampionsSpread(key) {
  const match = /^([A-Za-z]+):(\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)$/.exec(key)
  if (!match || !NATURES.has(match[1].toLowerCase())) fail(`unrecognized spread ${key}`)
  const points = match.slice(2).map(Number)
  if (points.some((value) => value > 32) || points.reduce((sum, value) => sum + value, 0) > 66) fail(`not Champions SP: ${key}`)
  return { nature: match[1], points }
}

function readWeights(value, label) {
  if (!object(value)) fail(`missing or invalid ${label}`)
  const entries = Object.entries(value).map(([key, weight]) => {
    if (!finite(weight)) fail(`invalid weight in ${label}: ${key}`)
    return { key, weight }
  })
  return entries.sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key, 'en'))
}

function summarize(entries, kind) {
  // Keep the original weights. In particular, moves and teammates do not sum to 100%.
  const positive = entries.filter((entry) => entry.weight > 0 && (kind !== 'moves' || entry.key !== ''))
  return {
    entries: positive.slice(0, DETAIL_LIMIT), totalEntries: positive.length,
    omittedWeight: positive.slice(DETAIL_LIMIT).reduce((sum, entry) => sum + entry.weight, 0),
    emptySlotWeight: kind === 'moves' ? entries.find((entry) => entry.key === '')?.weight ?? 0 : 0,
  }
}

export function normalizeChaos(payload, descriptor, roster) {
  const { info, data } = payload ?? {}
  if (!object(info) || !object(data) || !Object.keys(data).length) fail('empty or invalid chaos payload')
  if (info.metagame !== descriptor.format || info.cutoff !== descriptor.cutoff) fail('format or cutoff mismatch')
  if (!Number.isInteger(info['number of battles']) || info['number of battles'] <= 0) fail('invalid battle count')
  if (info['cutoff deviation'] !== 0 || info['team type'] !== null) fail('unsupported weighting metadata')
  if (descriptor.statSystem !== 'champions-sp') fail('unsupported stat system')
  const known = new Set(roster.map((entry) => entry.showdownId))
  const seen = new Set()
  const pokemon = Object.entries(data).map(([sourceName, source]) => {
    const id = showdownId(sourceName)
    if (!known.has(id)) fail(`species outside regulation roster: ${sourceName}`)
    if (seen.has(id)) fail(`duplicate species: ${sourceName}`)
    seen.add(id)
    if (!object(source) || !finite(source.usage) || source.usage > 1 || !Number.isInteger(source['Raw count']) || source['Raw count'] < 0) fail(`invalid usage/count for ${sourceName}`)
    const weights = Object.fromEntries(Object.entries(SOURCE_FIELDS).map(([key, field]) => [key, source[field] == null ? null : readWeights(source[field], `${sourceName}.${field}`)]))
    if (!weights.abilities) fail(`missing denominator: ${sourceName}.Abilities`)
    const weightedCount = weights.abilities.reduce((sum, entry) => sum + entry.weight, 0)
    if (!finite(weightedCount) || (source.usage > 0 && weightedCount === 0)) fail(`invalid denominator for ${sourceName}`)
    // Sum ALL spreads before limiting presentation. Nature shares are not inferred from the top spreads.
    const natures = new Map()
    for (const entry of weights.spreads ?? []) {
      const { nature } = parseChampionsSpread(entry.key)
      natures.set(nature, (natures.get(nature) ?? 0) + entry.weight)
    }
    weights.natures = weights.spreads === null ? null : [...natures].map(([key, weight]) => ({ key, weight })).sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key, 'en'))
    for (const [kind, entries] of Object.entries(weights)) {
      for (const entry of entries ?? []) {
        if (kind === 'moves' && entry.key === '') {
          if (entry.weight > 4 * weightedCount + 1e-8) fail(`invalid empty move slots: ${sourceName}`)
          continue
        }
        if (entry.weight > weightedCount + Math.max(1, weightedCount) * 1e-8) fail(`weight exceeds denominator: ${sourceName}.${kind}.${entry.key}`)
      }
    }
    return {
      showdownId: id, sourceName, usage: source.usage, rawCount: source['Raw count'], weightedCount,
      distributions: Object.fromEntries(DISTRIBUTIONS.map((kind) => [kind, weights[kind] === null ? null : summarize(weights[kind], kind)])),
    }
  }).sort((a, b) => b.usage - a.usage || a.showdownId.localeCompare(b.showdownId, 'en'))
  return { schemaVersion: COMPETITIVE_SCHEMA, ...descriptor, battles: info['number of battles'], pokemon: pokemon.map((entry, index) => ({ rank: index + 1, ...entry })) }
}

export function validateCompetitiveSnapshot(snapshot, roster) {
  if (snapshot?.schemaVersion !== COMPETITIVE_SCHEMA || snapshot.provider !== 'smogon' || snapshot.statSystem !== 'champions-sp' || snapshot.battleStyle !== 'doubles') fail('unsupported snapshot schema/provider')
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(snapshot.period) || !/^[a-z0-9]+$/.test(snapshot.format) || !Number.isInteger(snapshot.cutoff) || snapshot.cutoff < 0) fail('invalid period/format/cutoff')
  if (!/^[a-f0-9]{64}$/.test(snapshot.sourceHash) || !Number.isFinite(Date.parse(snapshot.importedAt)) || !/^[a-f0-9]{40}$/.test(snapshot.mechanicsReference)) fail('missing provenance')
  if (new Date(snapshot.importedAt).toISOString().slice(0, 7) <= snapshot.period) fail('snapshot imported before the month completed')
  const url = `https://www.smogon.com/stats/${snapshot.period}/chaos/${snapshot.format}-${snapshot.cutoff}.json`
  if (snapshot.sourceUrl !== url || !Number.isInteger(snapshot.battles) || snapshot.battles <= 0 || !Array.isArray(snapshot.pokemon) || !snapshot.pokemon.length) fail('invalid source or empty snapshot')
  const known = new Set(roster.map((entry) => entry.showdownId)), seen = new Set()
  for (const [index, entry] of snapshot.pokemon.entries()) {
    if (!known.has(entry.showdownId) || seen.has(entry.showdownId) || showdownId(entry.sourceName) !== entry.showdownId) fail('unknown or duplicate identity')
    seen.add(entry.showdownId)
    if (entry.rank !== index + 1 || !finite(entry.usage) || entry.usage > 1 || (index && entry.usage > snapshot.pokemon[index - 1].usage)) fail('invalid ranking')
    if (!finite(entry.weightedCount) || (entry.usage > 0 && entry.weightedCount === 0) || !Number.isInteger(entry.rawCount) || entry.rawCount < 0) fail('invalid counts')
    for (const kind of DISTRIBUTIONS) {
      if (!Object.hasOwn(entry.distributions ?? {}, kind)) fail(`missing distribution ${kind}`)
      const distribution = entry.distributions[kind]
      if (distribution === null) continue
      if (!Array.isArray(distribution.entries) || !Number.isInteger(distribution.totalEntries) || distribution.totalEntries < distribution.entries.length || !finite(distribution.omittedWeight)) fail(`invalid distribution ${kind}`)
      if (!finite(distribution.emptySlotWeight) || distribution.emptySlotWeight > (kind === 'moves' ? 4 * entry.weightedCount + 1e-8 : 0)) fail(`invalid empty slots ${kind}`)
      if (distribution.entries.length !== Math.min(distribution.totalEntries, DETAIL_LIMIT) || (distribution.totalEntries <= DETAIL_LIMIT && distribution.omittedWeight !== 0)) fail(`invalid truncation ${kind}`)
      const keys = new Set()
      for (const [position, row] of distribution.entries.entries()) {
        if (typeof row.key !== 'string' || keys.has(row.key) || !finite(row.weight) || row.weight === 0 || row.weight > entry.weightedCount + Math.max(1, entry.weightedCount) * 1e-8 || (position && row.weight > distribution.entries[position - 1].weight)) fail(`invalid row ${kind}`)
        keys.add(row.key)
        if (kind === 'spreads') parseChampionsSpread(row.key)
        if (kind === 'natures' && !NATURES.has(row.key.toLowerCase())) fail('invalid nature')
      }
    }
    if (entry.distributions.abilities === null) fail('missing denominator')
    const abilities = entry.distributions.abilities
    const total = abilities.entries.reduce((sum, row) => sum + row.weight, abilities.omittedWeight)
    if (Math.abs(total - entry.weightedCount) > Math.max(1, total) * 1e-8) fail('denominator mismatch')
  }
  return snapshot
}

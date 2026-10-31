import { percentage, showdownId } from './normalize.js'

const percentFormat = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 })
export function formatUsage(value) {
  if (value === null || !Number.isFinite(value)) return 'Non disponibile'
  return value > 0 && value < 0.1 ? '<0,1%' : `${percentFormat.format(value)}%`
}
export const formatShare = (weight, denominator) => formatUsage(percentage(weight, denominator))
export function formatPeriod(period) {
  return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${period}-01T00:00:00Z`))
}

export function createCompetitiveLabels({ roster, moves, items }) {
  const maps = {
    moves: new Map(Object.values(moves).map((entry) => [showdownId(entry.name), entry.name])),
    items: new Map(items.map((entry) => [showdownId(entry.name), entry.name])),
    abilities: new Map(roster.flatMap((entry) => entry.abilities.map((ability) => [showdownId(ability.name), ability.name]))),
    teammates: new Map(roster.map((entry) => [entry.showdownId, entry.displayName])),
  }
  return (kind, key) => {
    if (!key) return kind === 'items' ? 'Nessuno strumento' : kind === 'abilities' ? 'Nessuna abilità indicata' : 'Non indicato'
    if (kind === 'natures') return key
    return maps[kind]?.get(showdownId(key)) ?? `${key} · nome della fonte non riconciliato`
  }
}

export function getCompatibleSnapshots(manifest, regulation) {
  return manifest.snapshots.filter((entry) => entry.regulationId === regulation.id && entry.format === regulation.format && entry.mechanicsReference === regulation.commit)
}

export function createCompetitiveMoveTypes(moves) {
  const types = new Map(Object.entries(moves).flatMap(([id, move]) => [
    [showdownId(id), move.type], [showdownId(move.name), move.type],
  ]))
  return (nameOrId) => types.get(showdownId(nameOrId)) ?? null
}

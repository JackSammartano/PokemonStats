export const TEAM_SET_FIELDS = ['moves', 'item', 'ability', 'nature', 'sps']
export const TEAM_SET_LABELS = { moves: 'mosse', item: 'strumento', ability: 'abilità', nature: 'natura', sps: 'SP' }

export function missingSetFields(build) {
  if (build?.missingFields === undefined) return []
  const fields = build.missingFields
  // Malformed local metadata must never make an incomplete set look complete.
  if (!Array.isArray(fields) || fields.some((field) => !TEAM_SET_FIELDS.includes(field))) return [...TEAM_SET_FIELDS]
  return [...new Set(fields)]
}
export function missingSetLabel(build) { return missingSetFields(build).map((field) => TEAM_SET_LABELS[field]).join(', ') }
export function resolvedSetFields(build, changes) {
  if (Object.hasOwn(changes, 'missingFields')) return missingSetFields(changes)
  return missingSetFields(build).filter((field) => !Object.hasOwn(changes, field))
}

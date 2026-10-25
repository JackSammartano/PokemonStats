import { toId } from './championsMath.js'

export function isMovePresentationComplete(move) {
  const data = move.presentation
  return (data?.accuracy === true || (Number.isFinite(data?.accuracy) && data.accuracy > 0 && data.accuracy <= 100))
    && typeof data?.shortDesc === 'string' && data.shortDesc.trim().length > 0
}

export function getMovePresentation(move) {
  if (!move) return null
  const id = toId(move.name)
  const data = move.presentation ?? {}
  const fixed = data.fixedDamage || move.ohko
  const variable = data.variablePower || ['weather-ball', 'terrain-pulse', 'beat-up', 'fling'].includes(id)
  const power = move.category === 'status' ? '—' : fixed ? 'Danno fisso' : !move.basePower ? 'Variabile' : `${move.basePower}${variable ? ' (variabile)' : ''}`
  const accuracy = data.accuracy === true ? 'Sempre a segno' : typeof data.accuracy === 'number' ? `${data.accuracy}%` : '—'
  const shortDesc = data.shortDesc?.trim() ?? ''
  // This is an explicit source marker, including variants that only add targets.
  const description = shortDesc.startsWith('No additional effect.') ? '' : shortDesc
  return { power, accuracy, description }
}

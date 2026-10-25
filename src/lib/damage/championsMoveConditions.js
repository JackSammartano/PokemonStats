import { toId } from './championsMath.js'

const boolean = (key, label, value = false) => ({ key, label, type: 'boolean', default: value })
const number = (key, label, max, value = 0) => ({ key, label, type: 'number', min: 0, max, default: value })
const turnOrder = { key: 'turnOrder', label: 'Ordine del colpo', type: 'select', default: 'auto', options: [['auto', 'Dalla Velocità'], ['first', 'Prima del bersaglio'], ['last', 'Dopo il bersaglio']] }
const receivedDamage = number('receivedDamage', 'Danno subito dal bersaglio in questo turno', 9999)

const fields = {
  assurance: [boolean('targetWasHit', 'Il bersaglio ha già subito danni in questo turno')],
  avalanche: [boolean('wasHit', 'Colpito dal bersaglio in questo turno')],
  belch: [boolean('ateBerry', 'Ha già mangiato una bacca')],
  'fickle-beam': [boolean('allOut', 'Attacco di tutte le teste')],
  'first-impression': [boolean('firstTurn', 'Prima azione dopo l’ingresso', true)],
  'fake-out': [boolean('firstTurn', 'Prima azione dopo l’ingresso', true)],
  'focus-punch': [boolean('wasHit', 'Ha perso la concentrazione per un attacco subito')],
  'lash-out': [boolean('statsLowered', 'Statistiche diminuite in questo turno')],
  'last-resort': [boolean('otherMovesUsed', 'Ha già usato tutte le altre mosse')],
  'last-respects': [number('alliesFainted', 'Numero totale di KO alleati', 100)],
  'rage-fist': [number('hitsTaken', 'Numero di colpi subiti', 6)],
  round: [boolean('allyUsedRound', 'Segue Round di un alleato')],
  'spit-up': [number('stockpiles', 'Accumuli di Stockpile', 3)],
  'stomping-tantrum': [boolean('failedLastTurn', 'La mossa del turno precedente è fallita')],
  'temper-flare': [boolean('failedLastTurn', 'La mossa del turno precedente è fallita')],
  'upper-hand': [boolean('targetPriority', 'Il bersaglio sta per usare un attacco con priorità positiva')],
  'sucker-punch': [boolean('targetAttacking', 'Il bersaglio sta per usare un attacco', true), boolean('targetHasActed', 'Il bersaglio ha già agito')],
  payback: [turnOrder],
  'metal-burst': [receivedDamage], comeuppance: [receivedDamage],
  counter: [receivedDamage, { key: 'receivedCategory', label: 'Categoria dell’attacco subito', type: 'select', default: 'physical', options: [['physical', 'Fisico'], ['special', 'Speciale']] }],
  'mirror-coat': [receivedDamage, { key: 'receivedCategory', label: 'Categoria dell’attacco subito', type: 'select', default: 'special', options: [['physical', 'Fisico'], ['special', 'Speciale']] }],
  'shell-side-arm': [{ key: 'category', label: 'Categoria in caso di parità', type: 'select', default: 'special', options: [['special', 'Speciale'], ['physical', 'Fisica']] }],
  'beat-up': [{ key: 'partyAttack', label: 'Attack base dei membri idonei, separati da virgola', type: 'text', default: '' }],
  'dragon-darts': [boolean('splitDarts', 'In Doubles, l’altro dardo colpisce un altro bersaglio')],
}

export function getMoveConditionFields(move) {
  if (!move) return []
  const result = [...(fields[toId(move.name)] ?? [])]
  if (move.multihit) {
    const [min, max] = Array.isArray(move.multihit) ? move.multihit : [move.multiaccuracy ? 1 : move.multihit, move.multihit]
    result.push({ key: 'hits', label: 'Colpi andati a segno sul bersaglio', type: 'number', min, max, default: Array.isArray(move.multihit) ? 3 : max })
  }
  return result
}

export function getMoveConditions(move) {
  const supplied = move.conditions ?? {}
  const result = {}
  for (const field of getMoveConditionFields(move)) {
    const value = supplied[field.key] ?? field.default
    if (field.type === 'boolean') {
      if (typeof value !== 'boolean') throw new RangeError(`Condizione non valida: ${field.label}`)
    } else if (field.type === 'number') {
      if (!Number.isInteger(value) || value < field.min || value > field.max) throw new RangeError(`Valore non valido: ${field.label} (${field.min}–${field.max})`)
    } else if (field.type === 'select' && !field.options.some(([id]) => id === value)) throw new RangeError(`Scelta non valida: ${field.label}`)
    else if (field.type === 'text' && typeof value !== 'string') throw new RangeError(`Valore non valido: ${field.label}`)
    result[field.key] = value
  }
  return result
}

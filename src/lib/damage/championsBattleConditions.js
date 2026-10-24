import { REGULATION_ABILITY_MECHANICS } from '../regulation.js'

const toggle = (key, label, extra = {}) => ({ key, label, type: 'boolean', default: false, ...extra })
const number = (key, label, max, extra = {}) => ({ key, label, type: 'number', min: 0, max, default: 0, ...extra })

export const BATTLE_CONDITION_FIELDS = [
  toggle('entryAbilityActive', 'Applica l’effetto d’ingresso dell’abilità', { default: true, abilities: ['intimidate', 'screen-cleaner', 'supersweet-syrup', 'drizzle', 'drought', 'sand-stream', 'snow-warning', 'electric-surge', 'grassy-surge', 'psychic-surge', 'misty-surge'] }),
  toggle('abilityOn', 'Effetto dell’abilità attivo', { abilities: ['flash-fire', 'plus', 'minus', 'analytic', 'unburden', 'zero-to-hero'] }),
  toggle('typeChangeAvailable', 'Cambio tipo ancora disponibile in questo ingresso', { default: true, abilities: ['protean', 'libero'] }),
  toggle('transformActive', 'Imposter attivo: copia il bersaglio selezionato', { abilities: ['imposter'] }),
  { key: 'copiedAbility', label: 'Abilità copiata o ereditata', type: 'select', default: '', abilities: ['trace', 'receiver'], options: [['', 'Nessuna ereditata / Trace dal bersaglio'], ...Object.entries(REGULATION_ABILITY_MECHANICS).map(([id, ability]) => [id, ability.name])] },
  number('alliesFainted', 'Alleati KO per Supreme Overlord', 5, { abilities: ['supreme-overlord'] }),
  number('reactionAfterHit', 'Effetto casuale dell’abilità: dopo quale colpo (0 = non attivo)', 10, { abilities: ['flame-body', 'static', 'poison-point', 'effect-spore', 'poison-touch'] }),
  { key: 'reactionStatus', label: 'Stato causato da Effect Spore', type: 'select', default: 'psn', abilities: ['effect-spore'], options: [['psn', 'Veleno'], ['par', 'Paralisi'], ['slp', 'Sonno']] },
  toggle('focusBandActive', 'Focus Band si attiva a ogni colpo letale', { items: ['focus-band'] }),
  number('consecutiveUses', 'Usi consecutivi precedenti per Metronome', 5, { items: ['metronome'] }),
  toggle('justSwitchedIn', 'Pokémon appena entrato (Stakeout avversario)'),
  toggle('charged', 'Attacco Elettrico caricato (Charge / Electromorphosis)'),
  toggle('tailwind', 'Tailwind sul proprio lato'),
  toggle('powerTrick', 'Power Trick attivo'),
  toggle('isProtected', 'Protezione attiva'),
  toggle('auroraVeil', 'Aurora Veil sul proprio lato'),
  toggle('helpingHand', 'Helping Hand da un alleato', { doublesOnly: true }),
  toggle('friendGuard', 'Friend Guard da un alleato', { doublesOnly: true }),
  toggle('steelySpirit', 'Steely Spirit da un alleato', { doublesOnly: true }),
  toggle('flowerVeil', 'Flower Veil da un alleato', { doublesOnly: true }),
  toggle('sweetVeil', 'Sweet Veil da un alleato', { doublesOnly: true }),
  toggle('priorityGuard', 'Armor Tail / Queenly Majesty da un alleato', { doublesOnly: true }),
  number('accuracyBoost', 'Stadio Precisione (Stored Power / Power Trip)', 6, { min: -6 }),
  number('evasionBoost', 'Stadio Elusione (Stored Power / Power Trip)', 6, { min: -6 }),
  toggle('isFainted', 'Pokémon KO (escluso dai contributori di Beat Up)'),
  { key: 'weightkg', label: 'Peso attuale in kg (vuoto = peso della specie)', type: 'number', min: 0.1, max: 10000, step: 0.1, default: null },
]

export function createBattleConditions() {
  return Object.fromEntries(BATTLE_CONDITION_FIELDS.map((field) => [field.key, field.default]))
}

export function getBattleConditions(build) {
  const result = {}
  for (const field of BATTLE_CONDITION_FIELDS) {
    const value = build[field.key] ?? field.default
    if (field.type === 'boolean' && typeof value !== 'boolean') throw new RangeError(`Condizione non valida: ${field.label}`)
    if (field.type === 'number' && value !== null && (!Number.isFinite(value) || value < field.min || value > field.max || (!field.step && !Number.isInteger(value)))) throw new RangeError(`Valore non valido: ${field.label}`)
    if (field.type === 'select' && !field.options.some(([id]) => id === value)) throw new RangeError(`Scelta non valida: ${field.label}`)
    result[field.key] = value
  }
  return result
}

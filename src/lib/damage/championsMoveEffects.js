import { calculateBaseDamage, getModifiedStat, toId } from './championsMath.js'
import { getEffectiveSpeed } from './championsSpeed.js'
import { getMoveConditions } from './championsMoveConditions.js'
import { REGULATION_ITEMS, REGULATION_MEGA_EVOLUTIONS } from '../regulation.js'

const items = new Map(REGULATION_ITEMS.map((item) => [item.id, item]))
const terrainTypes = { Electric: 'electric', Grassy: 'grass', Misty: 'fairy', Psychic: 'psychic' }
const weatherTypes = { Sun: 'fire', Rain: 'water', Sand: 'rock', Snow: 'ice' }
const hp = (pokemon) => Math.max(1, Math.min(pokemon.currentHp ?? pokemon.stats.hp, pokemon.stats.hp))
const stat = (pokemon, id) => getModifiedStat(pokemon.stats[id], pokemon.boosts?.[id] ?? 0)

export function isGrounded(pokemon, field = {}) {
  if (field.isGravity || toId(pokemon.item) === 'iron-ball') return true
  return !pokemon.types.includes('flying') && !['levitate', 'eelevate'].includes(toId(pokemon.ability)) && toId(pokemon.item) !== 'air-balloon'
}

export function isMatchingMegaStone(pokemon) {
  const id = toId(pokemon.showdownId ?? pokemon.name).replaceAll('-', '')
  return REGULATION_MEGA_EVOLUTIONS.some((link) => link.itemId === toId(pokemon.item || pokemon.heldItem) && (link.baseId === id || link.megaId === id))
}

function weight(pokemon) {
  if (!Number.isFinite(pokemon.weightkg) || pokemon.weightkg <= 0) throw new RangeError('Serve il peso verificato dei Pokémon per questa mossa.')
  const multiplier = toId(pokemon.ability) === 'heavy-metal' ? 2 : toId(pokemon.ability) === 'light-metal' ? 0.5 : 1
  return Math.max(0.1, Math.floor(pokemon.weightkg * 10 * multiplier) / 10)
}

export function prepareChampionsMove(original, attacker, defender, field) {
  const move = { ...original, flags: { ...original.flags }, powerMods: [...(original.powerMods ?? [])] }
  const conditions = getMoveConditions(move)
  const id = toId(move.name)
  const failed = (reason) => ({ ...move, basePower: 0, fixedDamage: 0, failureReason: reason })
  const speed = (pokemon) => getEffectiveSpeed(pokemon.stats.spe, { ...pokemon, terrain: field.terrain }, field.weather)
  if (id === 'payback' && conditions.turnOrder === 'auto' && (speed(attacker) === speed(defender) || [attacker, defender].some((pokemon) => ['quick-draw', 'stall'].includes(toId(pokemon.ability)) || toId(pokemon.item) === 'quick-claw'))) throw new RangeError('Per Payback seleziona l’ordine effettivo: parità o effetti di priorità non sono risolti dalla sola Velocità.')
  const later = conditions.turnOrder === 'last' || (conditions.turnOrder !== 'first' && speed(attacker) < speed(defender))
  const poisoned = ['psn', 'tox'].includes(defender.status)

  if (!move.sequenceLocked && ((id === 'poltergeist' && !(defender.item || defender.heldItem)) || (id === 'steel-roller' && !field.terrain))) return failed('La condizione richiesta dalla mossa non è presente.')
  if (field.isGravity && move.flags.gravity) return failed('La mossa non può essere usata con Gravity.')
  if (!move.sequenceLocked && id === 'snore' && attacker.status !== 'slp') return failed('Snore richiede che il Pokémon sia addormentato.')
  if (id === 'belch' && !conditions.ateBerry) return failed('Belch richiede una bacca già mangiata.')
  if (id === 'last-resort' && !conditions.otherMovesUsed) return failed('Last Resort richiede che le altre mosse siano già state usate.')
  if (['first-impression', 'fake-out'].includes(id) && !conditions.firstTurn) return failed('La mossa funziona solo alla prima azione dopo l’ingresso.')
  if (id === 'focus-punch' && conditions.wasHit) return failed('Il Pokémon ha perso la concentrazione.')
  if (id === 'upper-hand' && !conditions.targetPriority) return failed('Il bersaglio deve stare per usare un attacco con priorità positiva.')
  if ((id === 'burn-up' && !attacker.types.includes('fire')) || (id === 'double-shock' && !attacker.types.includes('electric'))) return failed('Il Pokémon non possiede più il tipo richiesto dalla mossa.')

  if (id === 'aura-wheel' && !move.sequenceLocked) {
    const species = toId(attacker.showdownId ?? attacker.name).replaceAll('-', '')
    if (!['morpeko', 'morpekohangry'].includes(species)) return failed('Aura Wheel può essere usata soltanto da Morpeko.')
    move.type = species === 'morpekohangry' ? 'dark' : 'electric'
  }
  if (id === 'weather-ball' && !move.sequenceLocked && weatherTypes[field.weather]) {
    move.type = weatherTypes[field.weather]
    move.basePower *= 2
  }
  if (id === 'terrain-pulse' && !move.sequenceLocked && field.terrain && isGrounded(attacker, field)) {
    move.type = terrainTypes[field.terrain]
    move.basePower *= 2
  }
  if (id === 'grassy-glide' && !move.sequenceLocked && field.terrain === 'Grassy' && isGrounded(attacker, field)) move.priority = (move.priority ?? 0) + 1
  if (field.terrain === 'Psychic' && isGrounded(defender, field) && move.priority > 0) return failed('Il terreno psichico protegge il bersaglio dagli attacchi con priorità positiva.')
  if (['brick-break', 'psychic-fangs', 'raging-bull'].includes(id)) move.breaksScreens = true
  if (id === 'raging-bull' && !move.sequenceLocked) {
    const formType = ({ taurospaldeacombat: 'fighting', taurospaldeablaze: 'fire', taurospaldeaaqua: 'water' })[attacker.showdownId] ?? 'normal'
    if (formType !== 'normal') { move.type = formType; delete move.ateAbility }
    else if (!move.ateAbility) move.type = 'normal'
  }
  if (id === 'expanding-force' && field.terrain === 'Psychic' && isGrounded(attacker, field)) { move.powerMods.push(6144); if (!move.sequenceLocked) move.target = 'allAdjacentFoes' }
  if (id === 'sucker-punch' && (!conditions.targetAttacking || conditions.targetHasActed)) return failed('Sucker Punch richiede un bersaglio che debba ancora usare un attacco.')
  if (['meteor-beam', 'electro-shot'].includes(id)) move.chargeBoost = true
  if (id === 'shell-side-arm' && !move.sequenceLocked) {
    const power = (attack, defense) => calculateBaseDamage({ attack, defense, basePower: 90, level: attacker.level ?? 50 })
    const physical = power(stat(attacker, 'atk'), stat(defender, 'def'))
    const special = power(stat(attacker, 'spa'), stat(defender, 'spd'))
    move.category = physical > special ? 'physical' : physical < special ? 'special' : conditions.category
    if (move.category === 'physical') move.flags.contact = 1
  }

  switch (id) {
    case 'acrobatics': move.basePower *= (attacker.item || attacker.heldItem) ? 1 : 2; break
    case 'assurance': move.basePower *= conditions.targetWasHit ? 2 : 1; break
    case 'avalanche': move.basePower *= conditions.wasHit ? 2 : 1; break
    case 'payback': move.basePower *= later ? 2 : 1; break
    case 'round': move.basePower *= conditions.allyUsedRound ? 2 : 1; break
    case 'stomping-tantrum': case 'temper-flare': move.basePower *= conditions.failedLastTurn ? 2 : 1; break
    case 'hex': case 'infernal-parade': move.basePower *= defender.status ? 2 : 1; break
    case 'eruption': case 'water-spout': move.basePower = Math.max(1, Math.floor(150 * hp(attacker) / attacker.stats.hp)); break
    case 'hard-press': move.basePower = Math.floor(Math.floor((10000 * Math.floor(hp(defender) * 4096 / defender.stats.hp) + 2047) / 4096) / 100) || 1; break
    case 'stored-power': case 'power-trip': move.basePower = 20 + 20 * Object.values(attacker.boosts ?? {}).reduce((sum, boost) => sum + Math.max(0, boost), 0); break
    case 'last-respects': move.basePower = 50 * (1 + conditions.alliesFainted); break
    case 'rage-fist': move.basePower = Math.min(350, 50 * (1 + conditions.hitsTaken)); break
    case 'spit-up': move.basePower = conditions.stockpiles * 100; if (!move.basePower) return failed('Spit Up richiede almeno un accumulo di Stockpile.'); break
    case 'flail': case 'reversal': {
      const ratio = Math.floor(48 * hp(attacker) / attacker.stats.hp)
      move.basePower = ratio <= 1 ? 200 : ratio <= 4 ? 150 : ratio <= 9 ? 100 : ratio <= 16 ? 80 : ratio <= 32 ? 40 : 20
      break
    }
    case 'grass-knot': case 'low-kick': {
      const kg = weight(defender)
      move.basePower = kg >= 200 ? 120 : kg >= 100 ? 100 : kg >= 50 ? 80 : kg >= 25 ? 60 : kg >= 10 ? 40 : 20
      break
    }
    case 'heavy-slam': case 'heat-crash': {
      const ratio = weight(attacker) / weight(defender)
      move.basePower = ratio >= 5 ? 120 : ratio >= 4 ? 100 : ratio >= 3 ? 80 : ratio >= 2 ? 60 : 40
      break
    }
    case 'gyro-ball': move.basePower = Math.min(150, Math.floor(25 * speed(defender) / speed(attacker)) + 1); break
    case 'electro-ball': {
      const ratio = Math.floor(speed(attacker) / speed(defender))
      move.basePower = ratio >= 4 ? 150 : ratio >= 3 ? 120 : ratio >= 2 ? 80 : ratio >= 1 ? 60 : 40
      break
    }
    case 'fling': {
      const item = items.get(toId(attacker.item))
      if (!item?.flingPower || isMatchingMegaStone(attacker) || toId(attacker.ability) === 'klutz' || field.isMagicRoom) return failed('L’oggetto selezionato non può essere lanciato.')
      move.basePower = item.flingPower
      move.fling = true
      break
    }
    case 'beat-up': {
      const contributors = conditions.partyAttack.trim() ? conditions.partyAttack.split(',').map((value) => Number(value.trim())) : attacker.partyAttack
      if (!contributors?.length || contributors.length > 6 || contributors.some((value) => !Number.isInteger(value) || value < 1 || value > 255)) throw new RangeError('Per Beat Up indica gli Attack base dei membri idonei (da 1 a 255, massimo sei).')
      move.hitPowers = contributors.map((attack) => 5 + Math.floor(attack / 10))
      move.basePower = move.hitPowers[0]
      break
    }
  }

  if ((id === 'facade' && ['brn', 'psn', 'tox', 'par'].includes(attacker.status))
    || (['venoshock', 'barb-barrage'].includes(id) && poisoned)
    || (id === 'lash-out' && conditions.statsLowered)
    || (id === 'fickle-beam' && conditions.allOut)) move.powerMods.push(8192)
  if ((id === 'grav-apple' && field.isGravity)
    || (id === 'misty-explosion' && field.terrain === 'Misty' && isGrounded(attacker, field))
    || (id === 'knock-off' && (defender.item || defender.heldItem) && !isMatchingMegaStone(defender))) move.powerMods.push(6144)
  if (id === 'rising-voltage' && field.terrain === 'Electric' && isGrounded(defender, field)) move.basePower *= 2

  if (['seismic-toss', 'night-shade'].includes(id)) move.fixedDamage = attacker.level ?? 50
  if (id === 'final-gambit') move.fixedDamage = hp(attacker)
  if (id === 'super-fang') move.fixedDamage = Math.max(1, Math.floor(hp(defender) / 2))
  if (id === 'endeavor') move.fixedDamage = Math.max(0, hp(defender) - hp(attacker))
  if (['counter', 'mirror-coat', 'metal-burst', 'comeuppance'].includes(id)) {
    const eligible = id === 'counter' ? conditions.receivedCategory === 'physical' : id === 'mirror-coat' ? conditions.receivedCategory === 'special' : true
    move.fixedDamage = eligible ? Math.floor(conditions.receivedDamage * (['counter', 'mirror-coat'].includes(id) ? 2 : 1.5)) : 0
    if (!move.fixedDamage) move.failureReason = 'Nessun danno idoneo subito dal bersaglio in questo turno.'
  }
  if (move.ohko) {
    move.fixedDamage = hp(defender)
    if (toId(defender.ability) === 'sturdy' || (move.ohko === 'Ice' && defender.types.includes('ice'))) return failed('Il bersaglio è immune a questa mossa KO in un colpo.')
    move.accuracyDependentKO = true
  }
  return move
}

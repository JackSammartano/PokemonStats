import { activateTerrainSeed, applyChangedAbilityWeather, applyStatChanges, clearAbilityStatus, refreshBattleEnvironment } from './championsBattle.js'
import { getItem } from './championsItems.js'
import { toId, pokeRound } from './championsMath.js'
import { REGULATION_ABILITY_MECHANICS, REGULATION_ITEMS } from '../regulation.js'
import { isGrounded, isMatchingMegaStone } from './championsMoveEffects.js'
import { activateHeldBerry, consumeItem as consume, eatBerry } from './championsItemEffects.js'

const clonePokemon = (pokemon) => ({ ...pokemon, stats: { ...pokemon.stats }, boosts: { ...pokemon.boosts }, types: [...pokemon.types], currentHp: pokemon.currentHp ?? pokemon.stats.hp })
const flags = (ability) => REGULATION_ABILITY_MECHANICS[toId(ability)]?.flags ?? {}
const berryIds = new Set(REGULATION_ITEMS.filter((item) => item.isBerry).map((item) => item.id))

function indirectDamage(pokemon, amount) {
  if (toId(pokemon.ability) !== 'magic-guard') pokemon.currentHp = Math.max(0, pokemon.currentHp - Math.max(1, Math.floor(amount)))
}

function status(pokemon, next, field, source, reflected = false) {
  if (pokemon.status || !pokemon.currentHp) return
  const ignored = toId(source?.ability) === 'mold-breaker' && pokemon.item !== 'ability-shield' && REGULATION_ABILITY_MECHANICS[toId(pokemon.ability)]?.breakable
  const ability = ignored ? '' : toId(pokemon.ability)
  if (isGrounded(pokemon, field) && field.terrain === 'Misty') return
  if ((next === 'brn' && (pokemon.types.includes('fire') || ['water-bubble', 'water-veil', 'thermal-exchange'].includes(ability)))
    || (next === 'par' && (pokemon.types.includes('electric') || ability === 'limber'))
    || (['psn', 'tox'].includes(next) && ((pokemon.types.some((type) => ['steel', 'poison'].includes(type)) && toId(source?.ability) !== 'corrosion') || ability === 'immunity'))
    || (next === 'slp' && (['insomnia', 'vital-spirit', 'sweet-veil'].includes(ability) || (pokemon.sweetVeil && toId(source?.ability) !== 'mold-breaker') || (field.terrain === 'Electric' && isGrounded(pokemon, field))))
    || (next === 'frz' && (pokemon.types.includes('ice') || ability === 'magma-armor'))
    || ability === 'purifying-salt' || (ability === 'leaf-guard' && field.weather === 'Sun') || ((ability === 'flower-veil' || (pokemon.flowerVeil && toId(source?.ability) !== 'mold-breaker')) && pokemon.types.includes('grass'))) return
  pokemon.status = next
  if (ability === 'synchronize' && source && !reflected && !['slp', 'frz'].includes(next)) status(source, next, field, pokemon, true)
}

function secondaryEffects(attacker, defender, move, field, index) {
  if (move.secondarySuppressed) return
  for (const effect of move.secondaries ?? []) {
    if (effect.chance !== 100 && move.conditions?.secondaryAfterHit !== index + 1) continue
    if (effect.self?.boosts) applyStatChanges(attacker, effect.self.boosts)
    if (toId(defender.ability) === 'shield-dust' && !move.abilityIgnored && !effect.self) continue
    if (effect.boosts) applyStatChanges(defender, effect.boosts, true, { source: attacker, ignoreAbility: move.abilityIgnored })
    if (effect.status) status(defender, effect.status, field, attacker)
    if (['tri-attack', 'dire-claw'].includes(move.id)) status(defender, move.conditions?.secondaryStatus ?? (move.id === 'tri-attack' ? 'brn' : 'psn'), field, attacker)
  }
}

function afterHit(attacker, defender, move, field, amount, index) {
  const attackingAbility = toId(attacker.ability), defendingAbility = toId(defender.ability)
  // Battle.damage resolves drain immediately after HP loss, before contact
  // callbacks. Recoil uses the total damage after the complete move instead.
  if (move.drain && amount > 0 && attacker.currentHp) {
    let recovery = Math.max(1, Math.round(Math.min(amount, move.hpBeforeHit) * move.drain[0] / move.drain[1]))
    if (defendingAbility === 'liquid-ooze') indirectDamage(attacker, recovery)
    else {
      if (attacker.item === 'big-root') recovery = pokeRound(recovery * 5324 / 4096)
      attacker.currentHp = Math.min(attacker.stats.hp, attacker.currentHp + recovery)
    }
  }
  const contact = Boolean(move.flags?.contact) && attackingAbility !== 'long-reach'
  const canTakeItem = () => (defender.item || defender.heldItem) && !move.protectedItem && (move.abilityIgnored || toId(defender.ability) !== 'sticky-hold')
  if (['bug-bite', 'pluck'].includes(move.id) && attacker.currentHp && canTakeItem()) {
    const item = defender.item || defender.heldItem
    if (berryIds.has(item)) { consume(defender); eatBerry(attacker, item) }
  }
  if (move.fling) {
    const item = attacker.item
    if (berryIds.has(item)) eatBerry(defender, item)
    if (item === 'light-ball') status(defender, 'par', field, attacker)
    if (item === 'white-herb') for (const stat of Object.keys(defender.boosts)) defender.boosts[stat] = Math.max(0, defender.boosts[stat])
  }
  if (move.id === 'clear-smog') for (const stat of Object.keys(defender.boosts)) defender.boosts[stat] = 0
  if (['ice-spinner', 'steel-roller'].includes(move.id)) field.terrain = ''
  if (defendingAbility === 'anger-point' && move.criticalHit && defender.currentHp) defender.boosts.atk = 6
  if (index === 0 && move.selfBoosts && !move.secondarySuppressed) applyStatChanges(attacker, move.selfBoosts)
  secondaryEffects(attacker, defender, move, field, index)
  if (contact && defendingAbility === 'rough-skin') indirectDamage(attacker, attacker.stats.hp / 8)
  if (contact && defender.item === 'rocky-helmet') indirectDamage(attacker, attacker.stats.hp / 6)
  if (contact && defendingAbility === 'gooey') applyStatChanges(attacker, { spe: -1 }, true, { source: defender })
  if (defendingAbility === 'stamina') applyStatChanges(defender, { def: 1 })
  if (defendingAbility === 'weak-armor' && move.category === 'physical') applyStatChanges(defender, { def: -1, spe: 2 })
  if (defendingAbility === 'justified' && move.type === 'dark') applyStatChanges(defender, { atk: 1 })
  if (defendingAbility === 'thermal-exchange' && move.type === 'fire') applyStatChanges(defender, { atk: 1 })
  if (defendingAbility === 'rattled' && ['bug', 'ghost', 'dark'].includes(move.type)) applyStatChanges(defender, { spe: 1 })
  if (defendingAbility === 'seed-sower') field.terrain = 'Grassy'
  if (defendingAbility === 'sand-spit') field.weatherState = 'Sand'
  if (defendingAbility === 'electromorphosis') defender.charged = true
  if (defendingAbility === 'spicy-spray') status(attacker, 'brn', field, defender)
  if (contact && defender.reactionAfterHit === index + 1) {
    const triggered = { 'flame-body': 'brn', static: 'par', 'poison-point': 'psn', 'effect-spore': defender.reactionStatus ?? 'psn' }[defendingAbility]
    const powderImmune = defendingAbility === 'effect-spore' && (attacker.types.includes('grass') || attackingAbility === 'overcoat' || attacker.item === 'safety-goggles')
    if (triggered && !powderImmune) status(attacker, triggered, field, defender)
  }
  if (contact && attackingAbility === 'poison-touch' && attacker.reactionAfterHit === index + 1 && defendingAbility !== 'shield-dust' && defender.item !== 'covert-cloak') status(defender, 'psn', field, attacker)
  if (contact && attacker.item !== 'ability-shield') {
    if (defendingAbility === 'mummy' && !flags(attacker.ability).cantsuppress) attacker.ability = 'mummy'
    if (defendingAbility === 'wandering-spirit' && defender.item !== 'ability-shield' && !flags(attacker.ability).failskillswap && !flags(defender.ability).failskillswap) [attacker.ability, defender.ability] = [defender.ability, attacker.ability]
  }
  if (move.id === 'knock-off' && attacker.currentHp && canTakeItem()) consume(defender)
  if (['thief', 'covet'].includes(move.id) && attacker.currentHp && !attacker.item && !attacker.heldItem && !attacker.gemActive && canTakeItem()) {
    const item = defender.item || defender.heldItem
    if (!isMatchingMegaStone({ ...attacker, item, heldItem: item })) {
      consume(defender)
      attacker.heldItem = item
      attacker.item = field.isMagicRoom || toId(attacker.ability) === 'klutz' ? '' : item
      attacker.unburdenActive = false
    }
  }
  if (defender.item === 'air-balloon') consume(defender)
  if (move.fling) consume(attacker)
  if (move.selfdestruct) attacker.currentHp = 0
  for (const pokemon of [attacker, defender]) pokemon.item = field.isMagicRoom || pokemon.ability === 'klutz' ? '' : pokemon.heldItem
  applyChangedAbilityWeather(attacker, attackingAbility, field)
  applyChangedAbilityWeather(defender, defendingAbility, field)
  refreshBattleEnvironment(attacker, defender, field)
  activateTerrainSeed(attacker, field)
  activateTerrainSeed(defender, field)
  clearAbilityStatus(attacker)
  clearAbilityStatus(defender)
  activateHeldBerry(attacker, defender)
  activateHeldBerry(defender, attacker)
}

function stateKey(state) {
  const compact = (pokemon) => [pokemon.currentHp, pokemon.item, pokemon.heldItem, pokemon.ability, pokemon.status, pokemon.boosts, pokemon.showdownId, pokemon.disguiseBusted, pokemon.unburdenActive, pokemon.types, pokemon.charged]
  return JSON.stringify([compact(state.attacker), compact(state.defender), state.field.weather, state.field.weatherState, state.field.terrain])
}

// Keep exact endpoint totals for each distinct battle state. Merging equal states
// avoids enumerating 16^hits roll histories without assuming independent items,
// HP thresholds, defensive boosts, or contact effects between hits.
export function runDamageSequence({ attacker, defender, field, move, hits, evaluate }) {
  let states = [{ attacker: clonePokemon(attacker), defender: clonePokemon(defender), field: { ...field }, min: 0, max: 0 }]
  let exemplar
  for (let index = 0; index < hits; index++) {
    const nextStates = new Map()
    const add = (state) => {
      const key = stateKey(state), existing = nextStates.get(key)
      if (existing) { existing.min = Math.min(existing.min, state.min); existing.max = Math.max(existing.max, state.max) }
      else nextStates.set(key, state)
    }
    for (const state of states) {
      if (!state.attacker.currentHp || !state.defender.currentHp || (index > 0 && state.attacker.status === 'slp' && !move.sleepUsable && move.id !== 'snore')) { add(state); continue }
      const result = evaluate(state.attacker, state.defender, state.field, index)
      exemplar ??= result
      for (const roll of new Set(result.damage)) {
        const a = clonePokemon(state.attacker), d = clonePokemon(state.defender), f = { ...state.field }
        const hitMove = { ...result.move, criticalHit: result.isCritical, hpBeforeHit: d.currentHp, abilityIgnored: result.abilityIgnored }
        let amount = roll
        const disguise = !result.abilityIgnored && toId(d.ability) === 'disguise' && ['mimikyu', 'mimikyutotem'].includes(d.showdownId) && !d.disguiseBusted && result.effectiveness > 0 && amount > 0
        if (disguise) {
          amount = 0; d.disguiseBusted = true; d.showdownId = 'mimikyubusted'
          afterHit(a, d, hitMove, f, 0, index)
          d.currentHp = Math.max(0, d.currentHp - Math.floor(d.stats.hp / 8))
          activateHeldBerry(d, a)
        } else {
          const resist = getItem(d.item).resistType
          if (amount > 0 && hitMove.fixedDamage === undefined && resist === hitMove.type && (result.effectiveness > 1 || hitMove.type === 'normal') && toId(a.ability) !== 'unnerve') {
            const berry = d.item
            consume(d)
            eatBerry(d, berry)
            hitMove.hpBeforeHit = d.currentHp
          }
          if (hitMove.noFaint) amount = Math.min(amount, Math.max(0, d.currentHp - 1))
          if (amount >= d.currentHp && ((d.currentHp === d.stats.hp && ((!result.abilityIgnored && toId(d.ability) === 'sturdy') || d.item === 'focus-sash')) || (d.item === 'focus-band' && d.focusBandActive))) {
            amount = d.currentHp - 1
            if (d.item === 'focus-sash' && (result.abilityIgnored || toId(d.ability) !== 'sturdy')) consume(d)
          }
          d.currentHp = Math.max(0, d.currentHp - amount)
          if (amount > 0) afterHit(a, d, hitMove, f, amount, index)
        }
        add({ attacker: a, defender: d, field: f, min: state.min + amount, max: state.max + amount })
      }
    }
    states = [...nextStates.values()]
  }
  const min = Math.min(...states.map((state) => state.min)), max = Math.max(...states.map((state) => state.max))
  return {
    ...exemplar, move, damage: [min, max], min, max, hits,
    guaranteedKO: states.every((state) => state.defender.currentHp === 0),
    guaranteedSurvival: states.every((state) => state.defender.currentHp > 0),
    remainingHp: { min: Math.min(...states.map((state) => state.defender.currentHp)), max: Math.max(...states.map((state) => state.defender.currentHp)) },
  }
}

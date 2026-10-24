import { calculateChampionsStats, toId } from './championsMath.js'
import { REGULATION_ABILITY_MECHANICS, REGULATION_ROSTER } from '../regulation.js'
import { getAbility, resolveAbilityWeather } from './championsAbilities.js'
import { activateHeldBerry, consumeItem } from './championsItemEffects.js'

const forms = new Map(REGULATION_ROSTER.map((pokemon) => [pokemon.showdownId, pokemon]))
const surges = { 'electric-surge': 'Electric', 'grassy-surge': 'Grassy', 'misty-surge': 'Misty', 'psychic-surge': 'Psychic' }
const flags = (ability) => REGULATION_ABILITY_MECHANICS[toId(ability)]?.flags ?? {}
const clone = (pokemon) => ({ ...pokemon, originalTypes: pokemon.originalTypes ?? [...pokemon.types], currentHp: pokemon.currentHp ?? pokemon.stats.hp, stats: { ...pokemon.stats }, types: [...pokemon.types], boosts: { ...pokemon.boosts }, originalSpeciesId: pokemon.originalSpeciesId ?? pokemon.showdownId, heldItem: pokemon.heldItem ?? pokemon.item })

export function applyStatChanges(pokemon, changes, fromOpponent = false, { source, ignoreAbility = false, reflected = false } = {}) {
  const ability = ignoreAbility ? '' : toId(pokemon.ability)
  let lowered = false
  for (const [stat, original] of Object.entries(changes)) {
    const amount = original * (ability === 'contrary' ? -1 : 1)
    const flowerVeil = ability === 'flower-veil' || (pokemon.flowerVeil && toId(source?.ability) !== 'mold-breaker')
    if (fromOpponent && amount < 0 && (['clear-body', 'white-smoke'].includes(ability) || (ability === 'hyper-cutter' && stat === 'atk') || (ability === 'big-pecks' && stat === 'def') || (!ignoreAbility && flowerVeil && pokemon.types.includes('grass')))) continue
    const current = pokemon.boosts[stat] ?? 0
    if (fromOpponent && amount < 0 && ability === 'mirror-armor' && source && current > -6 && !reflected) {
      if (source.currentHp > 0) applyStatChanges(source, { [stat]: amount }, true, { source: pokemon, reflected: true })
      continue
    }
    const next = Math.max(-6, Math.min(6, current + amount))
    pokemon.boosts[stat] = next
    if (next < current) lowered = true
  }
  if (fromOpponent && lowered && ability === 'defiant') applyStatChanges(pokemon, { atk: 2 })
  if (fromOpponent && lowered && ability === 'competitive') applyStatChanges(pokemon, { spa: 2 })
}

function intimidate(source, target) {
  if (toId(source.ability) !== 'intimidate' || source.entryAbilityActive === false) return
  const ability = toId(target.ability)
  if (['inner-focus', 'oblivious', 'own-tempo', 'scrappy'].includes(ability)) return
  if (ability === 'guard-dog') { applyStatChanges(target, { atk: 1 }); return }
  const previous = target.boosts.atk ?? 0
  applyStatChanges(target, { atk: -1 }, true, { source })
  if (ability === 'rattled' && target.boosts.atk !== previous) applyStatChanges(target, { spe: 1 })
}

export function clearAbilityStatus(pokemon) {
  const cured = { immunity: ['psn', 'tox'], insomnia: ['slp'], 'vital-spirit': ['slp'], limber: ['par'], 'magma-armor': ['frz'], 'water-bubble': ['brn'], 'thermal-exchange': ['brn'] }
  if (cured[toId(pokemon.ability)]?.includes(pokemon.status)) pokemon.status = ''
}

export function getEffectiveAbility(original, opponent, field = {}) {
  const ability = toId(original.ability)
  if (ability === 'imposter' && original.transformActive) return flags(opponent.ability).notransform ? '' : toId(opponent.ability)
  if (original.item === 'ability-shield' && !field.isMagicRoom) return ability
  const selected = toId(original.copiedAbility || (ability === 'trace' ? opponent.ability : ''))
  if ((ability === 'trace' && selected && !flags(selected).notrace) || (ability === 'receiver' && selected && !flags(selected).noreceiver)) return selected
  return ability
}

function copiedPokemon(original, opponent, field) {
  const pokemon = clone(original)
  if (toId(pokemon.ability) === 'trace' && pokemon.copiedAbility && flags(pokemon.copiedAbility).notrace) throw new RangeError('Trace non può copiare questa abilità.')
  if (toId(pokemon.ability) === 'receiver' && pokemon.copiedAbility && flags(pokemon.copiedAbility).noreceiver) throw new RangeError('Receiver non può ereditare questa abilità.')
  if (toId(pokemon.ability) === 'imposter' && pokemon.transformActive) {
    if (opponent.transformed || (toId(opponent.ability) === 'imposter' && opponent.transformActive)) throw new RangeError('Imposter non può copiare un Pokémon già trasformato.')
    pokemon.stats = { ...opponent.stats, hp: pokemon.stats.hp }
    if (opponent.powerTrick) [pokemon.stats.atk, pokemon.stats.def] = [pokemon.stats.def, pokemon.stats.atk]
    pokemon.types = [...opponent.types]
    pokemon.boosts = { ...opponent.boosts }
    pokemon.weightkg = opponent.weightkg
    pokemon.showdownId = opponent.showdownId
    pokemon.name = opponent.name
    pokemon.transformed = true
  }
  pokemon.ability = getEffectiveAbility(original, opponent, field)
  return pokemon
}

function form(pokemon, id) {
  const target = forms.get(id)
  if (pokemon.showdownId === id) return
  if (!target || !pokemon.baseStats) throw new RangeError('Servono le statistiche base verificate per il cambio di forma.')
  pokemon.stats = calculateChampionsStats({ baseStats: target.baseStats, nature: pokemon.nature, sps: pokemon.sps })
  pokemon.types = [...target.types]
  pokemon.weightkg = target.weightkg
  pokemon.showdownId = target.showdownId
  pokemon.name = target.showdownName
}

function initialItem(pokemon, opponent, field) {
  if (field.isMagicRoom || toId(pokemon.ability) === 'klutz') { pokemon.item = ''; return }
  activateHeldBerry(pokemon, opponent)
  if (pokemon.item === 'white-herb' && Object.values(pokemon.boosts).some((boost) => boost < 0)) {
    for (const stat of Object.keys(pokemon.boosts)) pokemon.boosts[stat] = Math.max(0, pokemon.boosts[stat])
    consumeItem(pokemon)
  }
  activateTerrainSeed(pokemon, field)
}

export function activateTerrainSeed(pokemon, field) {
  if (!(pokemon.currentHp > 0)) return
  const seed = { 'electric-seed': ['Electric', 'def'], 'grassy-seed': ['Grassy', 'def'], 'misty-seed': ['Misty', 'spd'], 'psychic-seed': ['Psychic', 'spd'] }[pokemon.item]
  if (seed && seed[0] === field.terrain) { applyStatChanges(pokemon, { [seed[1]]: 1 }); consumeItem(pokemon) }
}

export function prepareChampionsBattle(originalAttacker, originalDefender, originalField, move) {
  const currentForm = (original) => {
    const pokemon = clone(original)
    if (toId(pokemon.ability) === 'zero-to-hero' && pokemon.abilityOn && pokemon.showdownId === 'palafin') form(pokemon, 'palafinhero')
    return pokemon
  }
  originalAttacker = currentForm(originalAttacker)
  originalDefender = currentForm(originalDefender)
  const attacker = copiedPokemon(originalAttacker, originalDefender, originalField)
  const defender = copiedPokemon(originalDefender, originalAttacker, originalField)
  const field = { ...originalField, attackerSide: { ...originalField.attackerSide }, defenderSide: { ...originalField.defenderSide } }
  if (field.weatherResolved !== true) {
    const weather = resolveAbilityWeather({ attackerAbility: attacker.ability === 'cloud-nine' ? '' : attacker.ability, defenderAbility: defender.ability === 'cloud-nine' ? '' : defender.ability, selectedWeather: field.weather,
      attackerEntryActive: attacker.entryAbilityActive !== false, defenderEntryActive: defender.entryAbilityActive !== false })
    if (weather.requiresChoice) throw new RangeError('Seleziona il meteo effettivo tra le due abilità.')
    field.weather = weather.weather
    field.weatherState = weather.weather
    field.weatherResolved = true
  }
  const attackerTerrain = attacker.entryAbilityActive === false ? null : surges[toId(attacker.ability)]
  const defenderTerrain = defender.entryAbilityActive === false ? null : surges[toId(defender.ability)]
  if (attackerTerrain && defenderTerrain && attackerTerrain !== defenderTerrain) {
    if (![attackerTerrain, defenderTerrain].includes(field.terrain)) throw new RangeError('Seleziona il terreno effettivo tra le due abilità.')
  } else if (attackerTerrain || defenderTerrain) field.terrain = attackerTerrain || defenderTerrain

  if (field.gameType !== 'Doubles') {
    field.attackerSide.isHelpingHand = false; field.attackerSide.isSteelySpirit = false
    field.defenderSide.isFriendGuard = false; field.defenderSide.isPriorityGuard = false
  }

  if (toId(attacker.ability) === 'stance-change' && ['aegislash', 'aegislashblade'].includes(attacker.showdownId) && !attacker.transformed && move.category !== 'status') form(attacker, 'aegislashblade')
  for (const pokemon of [attacker, defender]) {
    pokemon.flowerVeil = pokemon.flowerVeil && field.gameType === 'Doubles'
    pokemon.sweetVeil = pokemon.sweetVeil && field.gameType === 'Doubles'
    if (toId(pokemon.ability) === 'zero-to-hero' && pokemon.abilityOn && pokemon.showdownId === 'palafin') form(pokemon, 'palafinhero')
    if (pokemon.powerTrick) [pokemon.stats.atk, pokemon.stats.def] = [pokemon.stats.def, pokemon.stats.atk]
    if (field.isWonderRoom) [pokemon.stats.def, pokemon.stats.spd] = [pokemon.stats.spd, pokemon.stats.def]
    clearAbilityStatus(pokemon)
  }
  refreshBattleEnvironment(attacker, defender, field)
  const before = [attacker, defender].map((pokemon) => ({ ...pokemon.boosts }))
  for (const [source, target] of [[attacker, defender], [defender, attacker]]) {
    if (source.ability === 'supersweet-syrup' && source.entryAbilityActive !== false) applyStatChanges(target, { evasion: -1 }, true, { source })
  }
  intimidate(attacker, defender)
  intimidate(defender, attacker)
  if ([attacker, defender].some((pokemon) => toId(pokemon.ability) === 'screen-cleaner' && pokemon.entryAbilityActive !== false)) {
    for (const side of [field.attackerSide, field.defenderSide]) {
      side.isReflect = false; side.isLightScreen = false; side.isAuroraVeil = false
    }
  }
  initialItem(attacker, defender, field)
  initialItem(defender, attacker, field)
  const gains = [attacker, defender].map((pokemon, index) => Object.fromEntries(Object.entries(pokemon.boosts).map(([stat, boost]) => [stat, Math.max(0, boost - (before[index][stat] ?? 0))])))
  if (attacker.ability === 'opportunist') applyStatChanges(attacker, gains[1])
  if (defender.ability === 'opportunist') applyStatChanges(defender, gains[0])
  return { attacker, defender, field }
}

export function refreshBattleEnvironment(attacker, defender, field) {
  const suppressed = [attacker, defender].some((pokemon) => toId(pokemon.ability) === 'cloud-nine') || (field.gameType === 'Doubles' && field.isCloudNine)
  field.weather = suppressed ? '' : field.weatherState ?? field.weather ?? ''
  for (const pokemon of [attacker, defender]) {
    if (pokemon.ability === 'forecast' && !pokemon.transformed && pokemon.showdownId?.startsWith('castform')) pokemon.types = [({ Sun: 'fire', Rain: 'water', Snow: 'ice' })[field.weather] ?? 'normal']
    if (pokemon.ability === 'mimicry') pokemon.types = field.terrain ? [({ Electric: 'electric', Grassy: 'grass', Misty: 'fairy', Psychic: 'psychic' })[field.terrain]] : [...pokemon.originalTypes]
  }
}

export function applyChangedAbilityWeather(pokemon, previousAbility, field) {
  if (pokemon.ability !== previousAbility && getAbility(pokemon.ability).weather) field.weatherState = getAbility(pokemon.ability).weather
}

export function transformAbilityMove(original, attacker) {
  const move = { ...original, flags: { ...original.flags }, powerMods: [...(original.powerMods ?? [])] }
  const ability = toId(attacker.ability)
  move.secondarySuppressed = ability === 'sheer-force' && move.hasSecondary
  move.scrappy = ability === 'scrappy'
  const conversion = { aerilate: 'flying', pixilate: 'fairy', refrigerate: 'ice', dragonize: 'dragon' }[ability]
  if (conversion && move.type === 'normal' && !['weather-ball', 'terrain-pulse'].includes(move.id)) { move.type = conversion; move.ateAbility = ability }
  if (ability === 'liquid-voice' && move.flags.sound) move.type = 'water'
  if (ability === 'long-reach') move.flags.contact = 0
  if (ability === 'gale-wings' && move.type === 'flying' && (attacker.currentHp ?? attacker.stats.hp) === attacker.stats.hp) move.priority = (move.priority ?? 0) + 1
  return move
}

import { toId } from './championsMath.js'
import { CHAMPIONS_ADDITIONAL_ABILITIES } from '../../data/championsAdditionalAbilities.js'

export const CHAMPIONS_ABILITIES = {
  '': {
    name: 'None',
  },
  adaptability: {
    name: 'Adaptability',
  },
  'aura-guard': { name: 'Aura Guard', breakable: true },
  'tough-claws': { name: 'Tough Claws' },
  sharpness: { name: 'Sharpness' },
  technician: { name: 'Technician' },
  'iron-fist': { name: 'Iron Fist' },
  'strong-jaw': { name: 'Strong Jaw' },
  'mega-launcher': { name: 'Mega Launcher' },
  'long-reach': { name: 'Long Reach' },
  'mold-breaker': { name: 'Mold Breaker' },
  'fur-coat': { name: 'Fur Coat' },
  fluffy: { name: 'Fluffy' },
  sniper: { name: 'Sniper' },
  unnerve: { name: 'Unnerve' },
  ripen: { name: 'Ripen' },
  blaze: { name: 'Blaze', boostType: 'fire' },
  overgrow: { name: 'Overgrow', boostType: 'grass' },
  torrent: { name: 'Torrent', boostType: 'water' },
  swarm: { name: 'Swarm', boostType: 'bug' },
  guts: { name: 'Guts' },
  hustle: { name: 'Hustle' },
  heatproof: { name: 'Heatproof' },
  'water-bubble': { name: 'Water Bubble' },
  'solar-power': { name: 'Solar Power' },
  'fire-mane': { name: 'Fire Mane' },
  'purifying-salt': { name: 'Purifying Salt' },
  'ice-scales': { name: 'Ice Scales' },
  'tinted-lens': { name: 'Tinted Lens' },
  'punk-rock': { name: 'Punk Rock' },
  'sand-force': { name: 'Sand Force' },
  drizzle: {
    name: 'Drizzle',
    weather: 'Rain',
  },
  drought: {
    name: 'Drought',
    weather: 'Sun',
  },
  filter: {
    name: 'Filter',
  },
  'flash-fire': {
    blockedTypes: ['fire'],
    name: 'Flash Fire',
  },
  'huge-power': {
    name: 'Huge Power',
  },
  levitate: {
    blockedTypes: ['ground'],
    name: 'Levitate',
  },
  multiscale: {
    name: 'Multiscale',
  },
  'pure-power': {
    name: 'Pure Power',
  },
  'sap-sipper': {
    blockedTypes: ['grass'],
    name: 'Sap Sipper',
  },
  'sand-stream': {
    name: 'Sand Stream',
    weather: 'Sand',
  },
  'solid-rock': {
    name: 'Solid Rock',
  },
  'snow-warning': {
    name: 'Snow Warning',
    weather: 'Snow',
  },
  'thick-fat': {
    name: 'Thick Fat',
  },
  'volt-absorb': {
    blockedTypes: ['electric'],
    name: 'Volt Absorb',
  },
  'water-absorb': {
    blockedTypes: ['water'],
    name: 'Water Absorb',
  },
}

Object.assign(CHAMPIONS_ABILITIES, CHAMPIONS_ADDITIONAL_ABILITIES)
for (const [id, type] of Object.entries({ 'dry-skin': 'water', 'earth-eater': 'ground', eelevate: 'ground', 'lightning-rod': 'electric', 'motor-drive': 'electric' })) CHAMPIONS_ABILITIES[id].blockedTypes = [type]

export function getAbility(ability) {
  return CHAMPIONS_ABILITIES[toId(ability)] ?? CHAMPIONS_ABILITIES['']
}

export function resolveAbilityWeather({ attackerAbility, defenderAbility, selectedWeather = '', attackerEntryActive = true, defenderEntryActive = true, weatherSuppressed = false }) {
  if (weatherSuppressed || [attackerAbility, defenderAbility].some((ability) => toId(ability) === 'cloud-nine')) return { weather: '', sourceAbility: 'Cloud Nine', sourceSide: '', isOverridden: Boolean(selectedWeather) }
  const attackerWeather = attackerEntryActive ? getAbility(attackerAbility).weather : undefined
  const defenderWeather = defenderEntryActive ? getAbility(defenderAbility).weather : undefined

  if (attackerWeather && defenderWeather && attackerWeather !== defenderWeather) {
    const selectedSide = selectedWeather === attackerWeather ? 'attacker' : selectedWeather === defenderWeather ? 'defender' : ''
    return {
      isOverridden: !selectedSide,
      sourceAbility: selectedSide ? getAbility(selectedSide === 'attacker' ? attackerAbility : defenderAbility).name : `${getAbility(attackerAbility).name} / ${getAbility(defenderAbility).name}`,
      sourceSide: selectedSide,
      weather: selectedSide ? selectedWeather : '',
      requiresChoice: !selectedSide,
    }
  }

  if (attackerWeather) {
    return {
      isOverridden: attackerWeather !== selectedWeather,
      sourceAbility: getAbility(attackerAbility).name,
      sourceSide: 'attacker',
      weather: attackerWeather,
    }
  }

  if (defenderWeather) {
    return {
      isOverridden: defenderWeather !== selectedWeather,
      sourceAbility: getAbility(defenderAbility).name,
      sourceSide: 'defender',
      weather: defenderWeather,
    }
  }

  return {
    isOverridden: false,
    sourceAbility: '',
    sourceSide: '',
    weather: selectedWeather,
  }
}

export function abilityBlocksMove({ attacker = {}, defender, field = {}, move }) {
  const ability = getAbility(defender.ability)
  const blockedTypes = ability.blockedTypes ?? []

  const id = toId(defender.ability)
  if (id === 'soundproof' && move.flags?.sound) return true
  if (id === 'bulletproof' && move.flags?.bullet) return true
  if (['armor-tail', 'queenly-majesty'].includes(id) && move.priority > 0) return true
  if (field.defenderSide?.isPriorityGuard && toId(attacker.ability) !== 'mold-breaker' && move.priority > 0) return true
  if ((id === 'damp' || toId(attacker.ability) === 'damp' || (field.isDamp && field.gameType === 'Doubles' && toId(attacker.ability) !== 'mold-breaker')) && move.selfdestruct === 'always') return true
  if (move.type === 'ground' && toId(defender.item) === 'air-balloon' && !field.isGravity) return true

  if (toId(move.type) === 'ground' && ['levitate', 'eelevate'].includes(id) && (field.isGravity || toId(defender.item) === 'iron-ball')) return false
  return blockedTypes.includes(toId(move.type))
}

export function getAbilityAttackMods({ attacker, defender, move, weather = '', field = {} }) {
  const mods = []
  const attackerAbility = toId(attacker.ability)
  const defenderAbility = toId(defender.ability)

  if (
    move.category === 'physical' &&
    (attackerAbility === 'huge-power' || attackerAbility === 'pure-power')
  ) {
    mods.push(8192)
  }

  if (defenderAbility === 'thick-fat' && ['fire', 'ice'].includes(toId(move.type))) {
    mods.push(2048)
  }

  const attackerHp = attacker.currentHp ?? attacker.stats?.hp
  if ((getAbility(attackerAbility).boostType === move.type && attackerHp <= attacker.stats?.hp / 3)
    || (attackerAbility === 'guts' && attacker.status && move.category === 'physical')
    || (attackerAbility === 'flash-fire' && attacker.abilityOn && move.type === 'fire')
    || (attackerAbility === 'solar-power' && weather === 'Sun' && move.category === 'special')
    || (attackerAbility === 'fire-mane' && move.type === 'fire')) mods.push(6144)
  if (attackerAbility === 'water-bubble' && move.type === 'water') mods.push(8192)
  if (['plus', 'minus'].includes(attackerAbility) && attacker.abilityOn && field.gameType === 'Doubles' && move.category === 'special') mods.push(6144)
  if (attackerAbility === 'stakeout' && defender.justSwitchedIn) mods.push(8192)
  if ((defenderAbility === 'heatproof' && move.type === 'fire')
    || (defenderAbility === 'water-bubble' && move.type === 'fire')
    || (defenderAbility === 'purifying-salt' && move.type === 'ghost')) mods.push(2048)

  return mods
}

export function getAbilityBasePowerMods({ attacker, defender = {}, move, field = {}, weather = '', basePower = move.basePower }) {
  const ability = toId(attacker.ability)
  const mods = []
  if (ability === 'tough-claws' && move.flags?.contact) mods.push(5325)
  if (move.ateAbility === ability) mods.push(4915)
  if (ability === 'sharpness' && move.flags?.slicing) mods.push(6144)
  if (ability === 'technician' && basePower <= 60) mods.push(6144)
  if (ability === 'iron-fist' && move.flags?.punch) mods.push(4915)
  if (ability === 'strong-jaw' && move.flags?.bite) mods.push(6144)
  if (ability === 'mega-launcher' && move.flags?.pulse) mods.push(6144)
  if (ability === 'punk-rock' && move.flags?.sound) mods.push(5325)
  if (ability === 'sand-force' && weather === 'Sand' && ['rock', 'ground', 'steel'].includes(move.type)) mods.push(5325)
  if (ability === 'sheer-force' && (move.hasSecondary || move.hasSheerForceBoost)) mods.push(5325)
  if (ability === 'analytic' && attacker.abilityOn) mods.push(5325)
  if (ability === 'reckless' && (move.recoil || move.hasCrashDamage)) mods.push(4915)
  if (ability === 'rivalry' && ['M', 'F'].includes(attacker.gender) && ['M', 'F'].includes(defender.gender)) mods.push(attacker.gender === defender.gender ? 5120 : 3072)
  if (ability === 'supreme-overlord') mods.push([4096, 4506, 4915, 5325, 5734, 6144][Math.min(5, attacker.alliesFainted ?? 0)])
  if (ability === 'steely-spirit' && move.type === 'steel') mods.push(6144)
  if (field.attackerSide?.isSteelySpirit && move.type === 'steel') mods.push(6144)
  if ((ability === 'fairy-aura' || toId(defender.ability) === 'fairy-aura' || field.isFairyAura) && move.type === 'fairy') mods.push(5448)
  if (toId(defender.ability) === 'dry-skin' && move.type === 'fire') mods.push(5120)
  return mods
}

export function getAbilityDefenseMods({ defender, move, field = {} }) {
  const physical = move.overrideDefensiveStat === 'def' || move.category === 'physical'
  if (!physical) return []
  if (toId(defender.ability) === 'fur-coat') return [8192]
  if ((toId(defender.ability) === 'marvel-scale' && defender.status) || (toId(defender.ability) === 'grass-pelt' && field.terrain === 'Grassy')) return [6144]
  return []
}

export function getAbilityFinalMods({ attacker = {}, defender, effectiveness, move = {}, isCritical = false }) {
  const mods = []
  const defenderAbility = toId(defender.ability)
  const defenderHp = defender.currentHp ?? defender.stats?.hp

  if (defenderAbility === 'multiscale' && defenderHp === defender.stats?.hp) {
    mods.push(2048)
  }

  if ((defenderAbility === 'filter' || defenderAbility === 'solid-rock') && effectiveness > 1) {
    mods.push(3072)
  }

  if (defenderAbility === 'aura-guard' && move.flags?.contact) mods.push(2048)
  if (defenderAbility === 'fluffy') {
    if (move.flags?.contact) mods.push(2048)
    if (move.type === 'fire') mods.push(8192)
  }
  if (toId(attacker.ability) === 'sniper' && isCritical) mods.push(6144)
  if (toId(attacker.ability) === 'tinted-lens' && effectiveness > 0 && effectiveness < 1) mods.push(8192)
  if ((defenderAbility === 'ice-scales' && move.category === 'special') || (defenderAbility === 'punk-rock' && move.flags?.sound)) mods.push(2048)

  return mods
}

export function getAbilityStabMod({ attacker, move, stabMod }) {
  const attackerTypes = attacker.types.map((type) => toId(type))

  if (toId(attacker.ability) === 'adaptability' && attackerTypes.includes(toId(move.type))) {
    return 8192
  }

  return stabMod
}

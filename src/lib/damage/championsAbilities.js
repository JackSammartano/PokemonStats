import { toId } from './championsMath.js'

export const CHAMPIONS_ABILITIES = {
  '': {
    name: 'None',
  },
  adaptability: {
    name: 'Adaptability',
  },
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

export function getAbility(ability) {
  return CHAMPIONS_ABILITIES[toId(ability)] ?? CHAMPIONS_ABILITIES['']
}

export function resolveAbilityWeather({ attackerAbility, defenderAbility, selectedWeather = '' }) {
  const attackerWeather = getAbility(attackerAbility).weather
  const defenderWeather = getAbility(defenderAbility).weather

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

export function abilityBlocksMove({ defender, field = {}, move }) {
  const ability = getAbility(defender.ability)
  const blockedTypes = ability.blockedTypes ?? []

  if (toId(move.type) === 'ground' && field.isGravity) return false

  return blockedTypes.includes(toId(move.type))
}

export function getAbilityAttackMods({ attacker, defender, move }) {
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

  return mods
}

export function getAbilityFinalMods({ defender, effectiveness }) {
  const mods = []
  const defenderAbility = toId(defender.ability)
  const defenderHp = defender.currentHp ?? defender.stats?.hp

  if (defenderAbility === 'multiscale' && defenderHp === defender.stats?.hp) {
    mods.push(2048)
  }

  if ((defenderAbility === 'filter' || defenderAbility === 'solid-rock') && effectiveness > 1) {
    mods.push(3072)
  }

  return mods
}

export function getAbilityStabMod({ attacker, move, stabMod }) {
  const attackerTypes = attacker.types.map((type) => toId(type))

  if (toId(attacker.ability) === 'adaptability' && attackerTypes.includes(toId(move.type))) {
    return 8192
  }

  return stabMod
}

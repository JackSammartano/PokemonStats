import { calculateChampionsDamage } from './championsDamage.js'
import { CHAMPIONS_NATURES } from './championsData.js'
import { calculateChampionsStats } from './championsMath.js'

export const OPTIMIZER_DISPLAY_LIMIT = 50
export const OPTIMIZER_INTERNAL_LIMIT = 200

const ALL_NATURES = Object.keys(CHAMPIONS_NATURES)
const ALL_SP = Array.from({ length: 33 }, (_, index) => index)
const DEFENSIVE_BOOSTS = [0, 1, 2, 3, 4, 5, 6]
const OFFENSIVE_BOOSTS = [0, 1, 2, 3, 4, 5, 6]
const WEATHER_OPTIONS = ['', 'Sun', 'Rain']

function getDefenseStat(moveCategory) {
  return moveCategory === 'physical' ? 'def' : 'spd'
}

function getOffenseStat(moveCategory) {
  return moveCategory === 'physical' ? 'atk' : 'spa'
}

function getScreenOptions(moveCategory) {
  return moveCategory === 'physical' ? ['', 'Reflect'] : ['', 'Light Screen']
}

function createBoosts(stat, boost) {
  return {
    atk: stat === 'atk' ? boost : 0,
    def: stat === 'def' ? boost : 0,
    hp: 0,
    spa: stat === 'spa' ? boost : 0,
    spd: stat === 'spd' ? boost : 0,
    spe: 0,
  }
}

function buildStats({ baseStats, defenseSp = 0, hpSp = 0, nature, offenseSp = 0, role, stat }) {
  const sps = {
    atk: 0,
    def: 0,
    hp: role === 'defender' ? hpSp : 0,
    spa: 0,
    spd: 0,
    spe: 0,
  }

  if (role === 'attacker') {
    sps[stat] = offenseSp
  } else {
    sps[stat] = defenseSp
  }

  return calculateChampionsStats({
    baseStats,
    nature,
    sps,
  })
}

function buildField({ critical = false, screen = '', weather = '' }) {
  return {
    defenderSide: {
      isLightScreen: screen === 'Light Screen',
      isReflect: screen === 'Reflect',
    },
    isCritical: critical,
    weather,
  }
}

function calculateOption(context, option) {
  const offenseStat = getOffenseStat(context.move.category)
  const defenseStat = getDefenseStat(context.move.category)
  const attackerStats = buildStats({
    baseStats: context.attacker.baseStats,
    nature: option.attacker.nature,
    offenseSp: option.attacker.offenseSp,
    role: 'attacker',
    stat: offenseStat,
  })
  const defenderStats = buildStats({
    baseStats: context.defender.baseStats,
    defenseSp: option.defender.defenseSp,
    hpSp: option.defender.hpSp,
    nature: option.defender.nature,
    role: 'defender',
    stat: defenseStat,
  })

  return calculateChampionsDamage({
    attacker: {
      ability: option.attacker.ability,
      boosts: createBoosts(offenseStat, option.attacker.boost),
      item: option.attacker.item,
      level: 50,
      stats: attackerStats,
      status: option.attacker.burned ? 'brn' : '',
      types: context.attacker.types,
    },
    defender: {
      ability: option.defender.ability,
      boosts: createBoosts(defenseStat, option.defender.boost),
      item: option.defender.item,
      level: 50,
      stats: defenderStats,
      types: context.defender.types,
    },
    field: buildField(option.field),
    move: context.move,
  })
}

function withDamage(context, kind, option) {
  const result = calculateOption(context, option)
  const defenderHp = result.defender?.stats?.hp ?? option.defender.hp

  return {
    ...option,
    damage: {
      max: result.max,
      min: result.min,
      rolls: result.damage,
    },
    defender: {
      ...option.defender,
      hp: defenderHp,
    },
    kind,
    score: scoreOption(option),
  }
}

function isNeutralNature(nature) {
  const [plus, minus] = CHAMPIONS_NATURES[nature] ?? []
  return !plus || plus === minus
}

export function scoreOption(option) {
  const attackerNatureCost = isNeutralNature(option.attacker.nature) ? 0 : 8
  const defenderNatureCost = isNeutralNature(option.defender.nature) ? 0 : 8
  const fieldCost =
    (option.field.weather ? 12 : 0) +
    (option.field.screen ? 18 : 0) +
    (option.field.critical ? 30 : 0)
  const conditionCost = option.attacker.burned ? 16 : 0

  return (
    attackerNatureCost +
    defenderNatureCost +
    option.attacker.offenseSp +
    option.defender.hpSp +
    option.defender.defenseSp +
    option.attacker.boost * 20 +
    option.defender.boost * 20 +
    fieldCost +
    conditionCost
  )
}

function sortOptions(first, second) {
  return (
    first.score - second.score ||
    first.damage.max - second.damage.max ||
    first.damage.min - second.damage.min ||
    first.attacker.offenseSp - second.attacker.offenseSp ||
    first.defender.hpSp - second.defender.hpSp ||
    first.defender.defenseSp - second.defender.defenseSp
  )
}

function hasSameSurvivalContext(first, second) {
  return (
    first.attacker.nature === second.attacker.nature &&
    first.attacker.ability === second.attacker.ability &&
    first.attacker.item === second.attacker.item &&
    first.attacker.offenseSp === second.attacker.offenseSp &&
    first.attacker.boost === second.attacker.boost &&
    first.attacker.burned === second.attacker.burned &&
    first.defender.nature === second.defender.nature &&
    first.defender.ability === second.defender.ability &&
    first.defender.item === second.defender.item &&
    first.defender.boost === second.defender.boost &&
    first.field.screen === second.field.screen &&
    first.field.weather === second.field.weather
  )
}

function hasSameKoContext(first, second) {
  return (
    first.attacker.nature === second.attacker.nature &&
    first.attacker.ability === second.attacker.ability &&
    first.attacker.item === second.attacker.item &&
    first.attacker.boost === second.attacker.boost &&
    first.defender.nature === second.defender.nature &&
    first.defender.ability === second.defender.ability &&
    first.defender.item === second.defender.item &&
    first.defender.hpSp === second.defender.hpSp &&
    first.defender.defenseSp === second.defender.defenseSp &&
    first.defender.boost === second.defender.boost &&
    first.field.critical === second.field.critical &&
    first.field.weather === second.field.weather
  )
}

function isDominated(candidate, accepted) {
  return accepted.some((option) => {
    if (candidate.kind !== option.kind) return false

    if (candidate.kind === 'survival') {
      return (
        hasSameSurvivalContext(candidate, option) &&
        option.defender.hpSp <= candidate.defender.hpSp &&
        option.defender.defenseSp <= candidate.defender.defenseSp &&
        option.score <= candidate.score
      )
    }

    return (
      hasSameKoContext(candidate, option) &&
      option.attacker.offenseSp <= candidate.attacker.offenseSp &&
      option.score <= candidate.score
    )
  })
}

function addIfUseful(options, candidate, internalLimit) {
  if (isDominated(candidate, options)) return false

  for (let index = options.length - 1; index >= 0; index -= 1) {
    if (isDominated(options[index], [candidate])) {
      options.splice(index, 1)
    }
  }

  options.push(candidate)
  options.sort(sortOptions)

  if (options.length > internalLimit) {
    options.length = internalLimit
  }

  return true
}

function limitOptions(options, limit) {
  const sorted = options.sort(sortOptions)

  return {
    displayed: sorted.slice(0, limit),
    total: sorted.length,
  }
}

export function findSurvivalOptions(context, config = {}) {
  const limit = config.limit ?? OPTIMIZER_DISPLAY_LIMIT
  const internalLimit = config.internalLimit ?? OPTIMIZER_INTERNAL_LIMIT
  const defenseStat = getDefenseStat(context.move.category)
  const options = []
  const burnOptions = context.move.category === 'physical' ? [false, true] : [false]

  for (const nature of config.defenderNatures ?? ALL_NATURES) {
    for (const hpSp of config.defenderHpSp ?? ALL_SP) {
      for (const defenseSp of config.defenderDefenseSp ?? ALL_SP) {
        const defenderStats = buildStats({
          baseStats: context.defender.baseStats,
          defenseSp,
          hpSp,
          nature,
          role: 'defender',
          stat: defenseStat,
        })

        for (const boost of config.defenderBoosts ?? DEFENSIVE_BOOSTS) {
          for (const screen of config.screens ?? getScreenOptions(context.move.category)) {
            for (const weather of config.weather ?? WEATHER_OPTIONS) {
              for (const burned of config.attackerBurned ?? burnOptions) {
                const option = {
                  attacker: {
                    ability: context.attacker.ability,
                    boost: context.attacker.boost,
                    burned,
                    item: context.attacker.item,
                    nature: context.attacker.nature,
                    offenseSp: context.attacker.offenseSp,
                  },
                  defender: {
                    ability: context.defender.ability,
                    boost,
                    defenseSp,
                    hp: defenderStats.hp,
                    hpSp,
                    item: context.defender.item,
                    nature,
                  },
                  field: {
                    critical: false,
                    screen,
                    weather,
                  },
                }
                const enriched = withDamage(context, 'survival', option)

                if (enriched.damage.max < enriched.defender.hp) {
                  addIfUseful(options, enriched, internalLimit)
                }
              }
            }
          }
        }
      }
    }
  }

  return limitOptions(options, limit)
}

export function findKoOptions(context, config = {}) {
  const limit = config.limit ?? OPTIMIZER_DISPLAY_LIMIT
  const internalLimit = config.internalLimit ?? OPTIMIZER_INTERNAL_LIMIT
  const offenseStat = getOffenseStat(context.move.category)
  const options = []

  for (const nature of config.attackerNatures ?? ALL_NATURES) {
    for (const offenseSp of config.attackerSp ?? ALL_SP) {
      for (const boost of config.attackerBoosts ?? OFFENSIVE_BOOSTS) {
        for (const weather of config.weather ?? WEATHER_OPTIONS) {
          for (const critical of config.critical ?? [false, true]) {
            const attackerStats = buildStats({
              baseStats: context.attacker.baseStats,
              nature,
              offenseSp,
              role: 'attacker',
              stat: offenseStat,
            })
            const option = {
              attacker: {
                ability: context.attacker.ability,
                boost,
                burned: false,
                item: context.attacker.item,
                nature,
                offenseSp,
              },
              defender: {
                ability: context.defender.ability,
                boost: context.defender.boost,
                defenseSp: context.defender.defenseSp,
                hp: context.defender.hp,
                hpSp: context.defender.hpSp,
                item: context.defender.item,
                nature: context.defender.nature,
              },
              field: {
                critical,
                screen: '',
                weather,
              },
              stats: {
                attacker: attackerStats,
              },
            }
            const enriched = withDamage(context, 'ko', option)

            if (enriched.damage.min >= enriched.defender.hp) {
              addIfUseful(options, enriched, internalLimit)
            }
          }
        }
      }
    }
  }

  return limitOptions(options, limit)
}

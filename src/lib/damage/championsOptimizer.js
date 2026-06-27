import { calculateChampionsDamage } from './championsDamage.js'
import { resolveAbilityWeather } from './championsAbilities.js'
import { CHAMPIONS_NATURES } from './championsData.js'
import { calculateChampionsStats } from './championsMath.js'

export const OPTIMIZER_DISPLAY_LIMIT = 50
export const OPTIMIZER_INTERNAL_LIMIT = 200
export const OPTIMIZER_RANKING_MODES = {
  minimum: 'minimum',
  practical: 'practical',
}

const ALL_NATURES = Object.keys(CHAMPIONS_NATURES)
const ALL_SP = Array.from({ length: 33 }, (_, index) => index)
const WEATHER_OPTIONS = ['', 'Sun', 'Rain']
const STAT_LABELS = {
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Spe',
}

function getDefenseStat(moveCategory) {
  return moveCategory === 'physical' ? 'def' : 'spd'
}

function getOffenseStat(moveCategory) {
  return moveCategory === 'physical' ? 'atk' : 'spa'
}

function getScreenOptions(moveCategory) {
  return moveCategory === 'physical' ? ['', 'Reflect'] : ['', 'Light Screen']
}

function createNeutralBoosts() {
  return {
    atk: 0,
    def: 0,
    hp: 0,
    spa: 0,
    spd: 0,
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

function buildField({ critical = false, gameType = 'Singles', screen = '', weather = '' }) {
  return {
    defenderSide: {
      isLightScreen: screen === 'Light Screen',
      isReflect: screen === 'Reflect',
    },
    gameType,
    isCritical: critical,
    weather,
  }
}

function getWeatherCandidates(context, configuredWeather) {
  const abilityWeather = resolveAbilityWeather({
    attackerAbility: context.attacker.ability,
    defenderAbility: context.defender.ability,
    selectedWeather: context.field?.weather ?? '',
  })

  if (abilityWeather.sourceAbility) {
    return [abilityWeather.weather]
  }

  return configuredWeather ?? WEATHER_OPTIONS
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
      boosts: createNeutralBoosts(),
      item: option.attacker.item,
      level: 50,
      stats: attackerStats,
      status: option.attacker.burned ? 'brn' : '',
      types: context.attacker.types,
    },
    defender: {
      ability: option.defender.ability,
      boosts: createNeutralBoosts(),
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

function getNaturePreference(nature, stat) {
  const [plus, minus] = CHAMPIONS_NATURES[nature] ?? []

  if (plus === stat && minus !== stat) return 2
  if (isNeutralNature(nature)) return 1
  return 0
}

function getNatureEffect(nature, stat) {
  const [plus, minus] = CHAMPIONS_NATURES[nature] ?? []

  if (plus === stat && minus !== stat) return 'plus'
  if (minus === stat && plus !== stat) return 'minus'
  return 'neutral'
}

function formatNatureGroupLabel(effect, stat) {
  if (effect === 'plus') return `Any +${STAT_LABELS[stat]} nature`
  if (effect === 'minus') return `Any -${STAT_LABELS[stat]} nature`
  return `No ${STAT_LABELS[stat]} modifier`
}

function getNatureCandidates(natures, stat) {
  const groups = new Map()

  for (const nature of natures) {
    const effect = getNatureEffect(nature, stat)
    const group = groups.get(effect) ?? []

    group.push(nature)
    groups.set(effect, group)
  }

  return Array.from(groups.entries()).map(([effect, group]) => {
    const representative = group.find((nature) => isNeutralNature(nature)) ?? group[0]

    return {
      nature: representative,
      natureGroup: group.length > 1
        ? {
            label: formatNatureGroupLabel(effect, stat),
            natures: group,
          }
        : null,
    }
  })
}

export function scoreOption(option) {
  const attackerNatureCost = isNeutralNature(option.attacker.nature) ? 0 : 8
  const defenderNatureCost = isNeutralNature(option.defender.nature) ? 0 : 8
  const fieldCost =
    (option.field.weather ? 12 : 0) +
    (option.field.screen ? 18 : 0)
  const conditionCost = option.attacker.burned ? 16 : 0

  return (
    attackerNatureCost +
    defenderNatureCost +
    option.attacker.offenseSp +
    option.defender.hpSp +
    option.defender.defenseSp +
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

function sortPracticalKoOptions(first, second) {
  return (
    second.attacker.offenseSp - first.attacker.offenseSp ||
    getNaturePreference(second.attacker.nature, second.sort.offenseStat) -
      getNaturePreference(first.attacker.nature, first.sort.offenseStat) ||
    Number(Boolean(first.field.weather)) - Number(Boolean(second.field.weather)) ||
    second.damage.min - first.damage.min ||
    second.damage.max - first.damage.max ||
    sortOptions(first, second)
  )
}

function sortPracticalSurvivalOptions(first, second) {
  return (
    second.defender.hpSp - first.defender.hpSp ||
    second.defender.defenseSp - first.defender.defenseSp ||
    getNaturePreference(second.defender.nature, second.sort.defenseStat) -
      getNaturePreference(first.defender.nature, first.sort.defenseStat) ||
    Number(Boolean(first.field.screen)) - Number(Boolean(second.field.screen)) ||
    Number(Boolean(first.field.weather)) - Number(Boolean(second.field.weather)) ||
    Number(first.attacker.burned) - Number(second.attacker.burned) ||
    first.damage.max - second.damage.max ||
    first.damage.min - second.damage.min ||
    sortOptions(first, second)
  )
}

function getOptionSorter(rankingMode) {
  if (rankingMode !== OPTIMIZER_RANKING_MODES.practical) {
    return sortOptions
  }

  return (first, second) => {
    if (first.kind === 'ko') return sortPracticalKoOptions(first, second)
    return sortPracticalSurvivalOptions(first, second)
  }
}

function hasSameSurvivalContext(first, second) {
  return (
    first.attacker.nature === second.attacker.nature &&
    first.attacker.ability === second.attacker.ability &&
    first.attacker.item === second.attacker.item &&
    first.attacker.offenseSp === second.attacker.offenseSp &&
    first.attacker.burned === second.attacker.burned &&
    first.defender.nature === second.defender.nature &&
    first.defender.ability === second.defender.ability &&
    first.defender.item === second.defender.item &&
    first.field.gameType === second.field.gameType &&
    first.field.screen === second.field.screen &&
    first.field.weather === second.field.weather
  )
}

function hasSameKoContext(first, second) {
  return (
    first.attacker.nature === second.attacker.nature &&
    first.attacker.ability === second.attacker.ability &&
    first.attacker.item === second.attacker.item &&
    first.defender.nature === second.defender.nature &&
    first.defender.ability === second.defender.ability &&
    first.defender.item === second.defender.item &&
    first.defender.hpSp === second.defender.hpSp &&
    first.defender.defenseSp === second.defender.defenseSp &&
    first.field.critical === second.field.critical &&
    first.field.gameType === second.field.gameType &&
    first.field.weather === second.field.weather
  )
}

function isDominated(candidate, accepted, rankingMode) {
  return accepted.some((option) => {
    if (candidate.kind !== option.kind) return false

    if (candidate.kind === 'survival') {
      if (rankingMode === OPTIMIZER_RANKING_MODES.practical) {
        return (
          hasSameSurvivalContext(candidate, option) &&
          option.defender.hpSp >= candidate.defender.hpSp &&
          option.defender.defenseSp >= candidate.defender.defenseSp &&
          option.damage.max <= candidate.damage.max
        )
      }

      return (
        hasSameSurvivalContext(candidate, option) &&
        option.defender.hpSp <= candidate.defender.hpSp &&
        option.defender.defenseSp <= candidate.defender.defenseSp &&
        option.score <= candidate.score
      )
    }

    if (rankingMode === OPTIMIZER_RANKING_MODES.practical) {
      return (
        hasSameKoContext(candidate, option) &&
        option.attacker.offenseSp >= candidate.attacker.offenseSp &&
        option.damage.min >= candidate.damage.min
      )
    }

    return (
      hasSameKoContext(candidate, option) &&
      option.attacker.offenseSp <= candidate.attacker.offenseSp &&
      option.score <= candidate.score
    )
  })
}

function addIfUseful(options, candidate, internalLimit, rankingMode) {
  if (isDominated(candidate, options, rankingMode)) return false

  for (let index = options.length - 1; index >= 0; index -= 1) {
    if (isDominated(options[index], [candidate], rankingMode)) {
      options.splice(index, 1)
    }
  }

  options.push(candidate)
  options.sort(getOptionSorter(rankingMode))

  if (options.length > internalLimit) {
    options.length = internalLimit
  }

  return true
}

function limitOptions(options, limit, rankingMode) {
  const sorted = options.sort(getOptionSorter(rankingMode))

  return {
    displayed: sorted.slice(0, limit),
    total: sorted.length,
  }
}

export function findSurvivalOptions(context, config = {}) {
  const limit = config.limit ?? OPTIMIZER_DISPLAY_LIMIT
  const internalLimit = config.internalLimit ?? OPTIMIZER_INTERNAL_LIMIT
  const rankingMode = config.rankingMode ?? OPTIMIZER_RANKING_MODES.minimum
  const defenseStat = getDefenseStat(context.move.category)
  const gameType = context.field?.gameType ?? 'Singles'
  const options = []
  const burnOptions = context.move.category === 'physical' ? [false, true] : [false]

  for (const natureCandidate of getNatureCandidates(config.defenderNatures ?? ALL_NATURES, defenseStat)) {
    const { nature, natureGroup } = natureCandidate
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

        for (const screen of config.screens ?? getScreenOptions(context.move.category)) {
          for (const weather of getWeatherCandidates(context, config.weather)) {
            for (const burned of config.attackerBurned ?? burnOptions) {
              const option = {
                attacker: {
                  ability: context.attacker.ability,
                  burned,
                  item: context.attacker.item,
                  nature: context.attacker.nature,
                  offenseSp: context.attacker.offenseSp,
                },
                defender: {
                  ability: context.defender.ability,
                  defenseSp,
                  hp: defenderStats.hp,
                  hpSp,
                  item: context.defender.item,
                  nature,
                  natureGroup,
                },
                field: {
                  critical: false,
                  gameType,
                  screen,
                  weather,
                },
              }
              const enriched = withDamage(context, 'survival', option)
              enriched.sort = {
                defenseStat,
              }

              if (enriched.damage.max < enriched.defender.hp) {
                addIfUseful(options, enriched, internalLimit, rankingMode)
              }
            }
          }
        }
      }
    }
  }

  return limitOptions(options, limit, rankingMode)
}

export function findKoOptions(context, config = {}) {
  const limit = config.limit ?? OPTIMIZER_DISPLAY_LIMIT
  const internalLimit = config.internalLimit ?? OPTIMIZER_INTERNAL_LIMIT
  const rankingMode = config.rankingMode ?? OPTIMIZER_RANKING_MODES.minimum
  const offenseStat = getOffenseStat(context.move.category)
  const gameType = context.field?.gameType ?? 'Singles'
  const options = []

  for (const natureCandidate of getNatureCandidates(config.attackerNatures ?? ALL_NATURES, offenseStat)) {
    const { nature, natureGroup } = natureCandidate
    for (const offenseSp of config.attackerSp ?? ALL_SP) {
      for (const weather of getWeatherCandidates(context, config.weather)) {
        for (const critical of config.critical ?? [false]) {
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
              burned: false,
              item: context.attacker.item,
              nature,
              natureGroup,
              offenseSp,
            },
            defender: {
              ability: context.defender.ability,
              defenseSp: context.defender.defenseSp,
              hp: context.defender.hp,
              hpSp: context.defender.hpSp,
              item: context.defender.item,
              nature: context.defender.nature,
            },
            field: {
              critical,
              gameType,
              screen: '',
              weather,
            },
            stats: {
              attacker: attackerStats,
            },
          }
          const enriched = withDamage(context, 'ko', option)
          enriched.sort = {
            offenseStat,
          }

          if (enriched.damage.min >= enriched.defender.hp) {
            addIfUseful(options, enriched, internalLimit, rankingMode)
          }
        }
      }
    }
  }

  return limitOptions(options, limit, rankingMode)
}

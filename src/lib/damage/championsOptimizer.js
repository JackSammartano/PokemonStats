import { calculateChampionsDamage } from './championsDamage.js'
import { resolveAbilityWeather } from './championsAbilities.js'
import { getEffectiveAbility } from './championsBattle.js'
import { CHAMPIONS_NATURES } from './championsData.js'
import { calculateChampionsStats, STAT_IDS, toId } from './championsMath.js'

export const OPTIMIZER_DISPLAY_LIMIT = 50
export const OPTIMIZER_INTERNAL_LIMIT = 200
export const OPTIMIZER_RANKING_MODES = {
  minimum: 'minimum',
  practical: 'practical',
}

const ALL_NATURES = Object.keys(CHAMPIONS_NATURES)
const ALL_SP = Array.from({ length: 33 }, (_, index) => index)
const WEATHER_OPTIONS = ['', 'Sun', 'Rain', 'Sand', 'Snow']
const STAT_LABELS = {
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Spe',
}

function getDefenseStat(move) {
  return move.overrideDefensiveStat ?? (move.category === 'physical' ? 'def' : 'spd')
}

function getOffenseStat(move) {
  return move.overrideOffensiveStat ?? (move.category === 'physical' ? 'atk' : 'spa')
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

function contextSps(context, role) {
  const pokemon = context[role]
  const legacy = role === 'attacker'
    ? { [getOffenseStat(context.move)]: pokemon.offenseSp ?? 0 }
    : { hp: pokemon.hpSp ?? 0, [getDefenseStat(context.move)]: pokemon.defenseSp ?? 0 }
  return { ...Object.fromEntries(STAT_IDS.map((stat) => [stat, 0])), ...legacy, ...pokemon.sps }
}

export function getOptimizerStatDependencies(context) {
  const id = toId(context.move.name)
  const attackingAbility = getEffectiveAbility(context.attacker, context.defender, context.field)
  const defendingAbility = getEffectiveAbility(context.defender, context.attacker, context.field)
  const stats = { attacker: new Set(), defender: new Set() }
  const mappedStat = (role, stat) => {
    const map = { atk: 'atk', def: 'def', spa: 'spa', spd: 'spd', spe: 'spe', hp: 'hp' }
    const opponent = context[role === 'attacker' ? 'defender' : 'attacker']
    if (toId(context[role].ability) === 'imposter' && context[role].transformActive && opponent.powerTrick) [map.atk, map.def] = [map.def, map.atk]
    if (context[role].powerTrick) [map.atk, map.def] = [map.def, map.atk]
    if (context.field?.isWonderRoom) [map.def, map.spd] = [map.spd, map.def]
    return map[stat]
  }
  const add = (role, stat) => {
    const owner = stat !== 'hp' && toId(context[role].ability) === 'imposter' && context[role].transformActive
      ? role === 'attacker' ? 'defender' : 'attacker' : role
    stats[owner].add(mappedStat(role, stat))
  }
  const offense = id === 'body-press' && context.field?.isWonderRoom ? 'spd' : getOffenseStat(context.move)
  const offenseRole = context.move.overrideOffensivePokemon === 'target' ? 'defender' : 'attacker'
  const fixedDamage = ['seismic-toss', 'night-shade', 'super-fang', 'endeavor', 'final-gambit', 'counter', 'mirror-coat', 'metal-burst', 'comeuppance'].includes(id) || context.move.ohko
  if (!fixedDamage) {
    if (id === 'shell-side-arm') {
      for (const stat of ['atk', 'spa']) add('attacker', stat)
      for (const stat of ['def', 'spd']) add('defender', stat)
    } else {
      add(offenseRole, offense)
      add('defender', getDefenseStat(context.move))
    }
  }
  add('defender', 'hp')
  if (['gyro-ball', 'electro-ball'].includes(id) || (id === 'payback' && (context.move.conditions?.turnOrder ?? 'auto') === 'auto')) {
    add('attacker', 'spe')
    add('defender', 'spe')
  }
  if (['eruption', 'water-spout', 'flail', 'reversal', 'endeavor', 'final-gambit'].includes(id)
    || ['blaze', 'overgrow', 'torrent', 'swarm', 'gale-wings'].includes(attackingAbility)) add('attacker', 'hp')
  const multipleHits = context.move.multihit || id === 'beat-up' || attackingAbility === 'parental-bond'
  if (multipleHits && ((context.move.flags?.contact && (toId(context.defender.item) === 'rocky-helmet' || defendingAbility === 'rough-skin'))
    || (context.move.drain && defendingAbility === 'liquid-ooze'))) add('attacker', 'hp')
  return {
    attacker: STAT_IDS.filter((stat) => stats.attacker.has(stat)),
    defender: STAT_IDS.filter((stat) => stats.defender.has(stat)),
    offenseStat: mappedStat(offenseRole, offense),
    defenseStat: mappedStat('defender', getDefenseStat(context.move)),
  }
}

function* getSpCandidates(fixed, stats, configured, index = 0, changes = {}) {
  if (index === stats.length) {
    const sps = { ...fixed, ...changes }
    if (withinSpBudget(sps, {})) yield sps
    return
  }
  const stat = stats[index]
  for (const value of configured[stat] ?? ALL_SP) {
    if (!Number.isInteger(value) || value < 0 || value > 32) throw new RangeError(`SP ${stat} non validi: ${value}`)
    const next = { ...changes, [stat]: value }
    const assigned = STAT_IDS.reduce((sum, key) => sum + (key in next ? next[key] : stats.includes(key) ? 0 : fixed[key]), 0)
    if (assigned <= 66) yield* getSpCandidates(fixed, stats, configured, index + 1, next)
  }
}

function buildField({ critical = false, gameType = 'Singles', screen = '', weather = '' }) {
  return {
    defenderSide: {
      isLightScreen: screen === 'Light Screen',
      isReflect: screen === 'Reflect',
      isAuroraVeil: screen === 'Aurora Veil',
    },
    gameType,
    isCritical: critical,
    weather,
  }
}

function getWeatherCandidates(context, configuredWeather) {
  const attackerAbility = getEffectiveAbility(context.attacker, context.defender, context.field)
  const defenderAbility = getEffectiveAbility(context.defender, context.attacker, context.field)
  const abilityWeather = resolveAbilityWeather({
    attackerAbility: attackerAbility === 'cloud-nine' ? '' : attackerAbility,
    defenderAbility: defenderAbility === 'cloud-nine' ? '' : defenderAbility,
    selectedWeather: context.field?.weather ?? '',
    attackerEntryActive: context.attacker.entryAbilityActive !== false,
    defenderEntryActive: context.defender.entryAbilityActive !== false,
  })

  if (abilityWeather.sourceAbility) {
    return [abilityWeather.weather]
  }

  return configuredWeather ?? WEATHER_OPTIONS
}

function calculateOption(context, option) {
  const attackerSps = option.attacker.sps ?? contextSps(context, 'attacker')
  const defenderSps = option.defender.sps ?? contextSps(context, 'defender')
  const attackerStats = calculateChampionsStats({ baseStats: context.attacker.baseStats, nature: option.attacker.nature, sps: attackerSps })
  const defenderStats = calculateChampionsStats({ baseStats: context.defender.baseStats, nature: option.defender.nature, sps: defenderSps })
  const selectedField = buildField(option.field)
  const screens = option.kind === 'survival' ? selectedField.defenderSide
    : { ...buildField(context.field ?? {}).defenderSide, ...context.field?.defenderSide }

  return calculateChampionsDamage({
    attacker: {
      ...context.attacker,
      ability: option.attacker.ability,
      name: context.attacker.name, showdownId: context.attacker.showdownId, weightkg: context.attacker.weightkg,
      boosts: createNeutralBoosts(),
      item: option.attacker.item,
      level: 50,
      stats: attackerStats,
      nature: option.attacker.nature, sps: attackerSps,
      currentHp: Math.min(context.attacker.currentHp ?? attackerStats.hp, attackerStats.hp),
      abilityOn: context.attacker.abilityOn,
      status: option.attacker.burned ? 'brn' : context.attacker.status === 'brn' ? '' : context.attacker.status ?? '',
      types: context.attacker.types,
    },
    defender: {
      ...context.defender,
      ability: option.defender.ability,
      name: context.defender.name, showdownId: context.defender.showdownId, weightkg: context.defender.weightkg, status: context.defender.status,
      boosts: createNeutralBoosts(),
      item: option.defender.item,
      level: 50,
      stats: defenderStats,
      nature: option.defender.nature, sps: defenderSps,
      currentHp: Math.min(context.defender.currentHp ?? option.defender.hp ?? defenderStats.hp, defenderStats.hp),
      abilityOn: context.defender.abilityOn,
      types: context.defender.types,
    },
    field: { ...context.field, ...selectedField, attackerSide: { ...context.field?.attackerSide }, defenderSide: { ...context.field?.defenderSide, ...screens } },
    move: context.move,
  })
}

export function getOptimizerBaseline(context) {
  return calculateOption(context, {
    attacker: { ...context.attacker, sps: contextSps(context, 'attacker'), burned: context.attacker.status === 'brn' },
    defender: { ...context.defender, sps: contextSps(context, 'defender') },
    field: { ...context.field, critical: false },
  })
}

function withinSpBudget(sps, changes) {
  return Object.values({ ...sps, ...changes }).reduce((sum, value) => sum + value, 0) <= 66
}

function withDamage(context, kind, option, cachedDamage) {
  let result
  try { if (!cachedDamage) result = calculateOption(context, { ...option, kind }) }
  catch (error) {
    if (error instanceof RangeError && toId(context.move.name) === 'payback' && (context.move.conditions?.turnOrder ?? 'auto') === 'auto') return null
    throw error
  }
  const defenderHp = result?.effectiveDefender?.currentHp ?? option.defender.hp

  return {
    ...option,
    damage: cachedDamage ? {
      ...cachedDamage,
      rolls: [...cachedDamage.rolls],
      guaranteedKO: cachedDamage.min >= defenderHp,
      guaranteedSurvival: cachedDamage.max < defenderHp,
    } : {
      max: result.max,
      min: result.min,
      rolls: result.damage,
      guaranteedKO: result.guaranteedKO,
      guaranteedSurvival: result.guaranteedSurvival,
      category: result.move.category,
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

function getNatureCandidates(natures, stats) {
  const groups = new Map()

  for (const nature of natures) {
    const effect = stats.map((stat) => getNatureEffect(nature, stat)).join(':')
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
            label: stats.map((stat, index) => formatNatureGroupLabel(effect.split(':')[index], stat)).join('; '),
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
    (option.attacker.sps ? Object.values(option.attacker.sps).reduce((sum, sp) => sum + sp, 0) : option.attacker.offenseSp) +
    (option.defender.sps ? Object.values(option.defender.sps).reduce((sum, sp) => sum + sp, 0) : option.defender.hpSp + option.defender.defenseSp) +
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
    variedInvestment(second.attacker) - variedInvestment(first.attacker) ||
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
    variedInvestment(second.defender) - variedInvestment(first.defender) ||
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

function variedInvestment(pokemon) {
  return pokemon.investmentStats?.reduce((sum, stat) => sum + pokemon.sps[stat], 0) ?? 0
}

function dominatesSpread(first, second, practical) {
  return STAT_IDS.every((stat) => practical ? first.sps[stat] >= second.sps[stat] : first.sps[stat] <= second.sps[stat])
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
          dominatesSpread(option.defender, candidate.defender, true) &&
          option.damage.max <= candidate.damage.max
        )
      }

      return (
        hasSameSurvivalContext(candidate, option) &&
        dominatesSpread(option.defender, candidate.defender, false) &&
        option.score <= candidate.score
      )
    }

    if (rankingMode === OPTIMIZER_RANKING_MODES.practical) {
      return (
        hasSameKoContext(candidate, option) &&
        dominatesSpread(option.attacker, candidate.attacker, true) &&
        option.damage.min >= candidate.damage.min
      )
    }

    return (
      hasSameKoContext(candidate, option) &&
      dominatesSpread(option.attacker, candidate.attacker, false) &&
      option.score <= candidate.score
    )
  })
}

function addIfUseful(options, groups, candidate, internalLimit, rankingMode) {
  const sorter = getOptionSorter(rankingMode)
  // Equivalent to inserting and truncating the sorted retained set. A spread
  // worse than its last entry cannot dominate a better-ranked spread under
  // either ordering (same context, componentwise investment comparison).
  if (options.length >= internalLimit && options.length && sorter(candidate, options.at(-1)) > 0) return false
  const group = groups.get(candidate.contextKey) ?? []
  if (isDominated(candidate, group, rankingMode)) return false

  for (let index = group.length - 1; index >= 0; index -= 1) {
    if (isDominated(group[index], [candidate], rankingMode)) {
      options.splice(options.indexOf(group[index]), 1)
      group.splice(index, 1)
    }
  }

  options.push(candidate)
  group.push(candidate)
  groups.set(candidate.contextKey, group)
  options.sort(sorter)

  for (const removed of options.splice(internalLimit)) {
    const peers = groups.get(removed.contextKey)
    peers.splice(peers.indexOf(removed), 1)
  }

  return true
}

function limitOptions(options, limit, rankingMode, excludedCandidates) {
  const sorted = options.sort(getOptionSorter(rankingMode))

  return {
    displayed: sorted.slice(0, limit).map(({ contextKey: _contextKey, ...option }) => option),
    total: sorted.length,
    excludedCandidates,
  }
}

function canReuseShellSideArmDamage(context, kind) {
  // Shell Side Arm's power/category use Atk, SpA, Def and SpD, not HP. With
  // one hit and no defensive item, copy or HP-based damage cap/modifier, only
  // the survival threshold changes when the defender's HP investment changes.
  return kind === 'survival' && toId(context.move.name) === 'shell-side-arm'
    && !context.move.multihit && toId(context.attacker.ability) !== 'parental-bond'
    && !context.attacker.item && !context.defender.item
    && ['', 'quick-draw', 'regenerator', 'own-tempo'].includes(toId(context.attacker.ability))
    && ['', 'battle-armor', 'shell-armor'].includes(toId(context.defender.ability))
}

function searchOptions(context, config, kind) {
  const limit = config.limit ?? OPTIMIZER_DISPLAY_LIMIT
  const internalLimit = config.internalLimit ?? OPTIMIZER_INTERNAL_LIMIT
  const rankingMode = config.rankingMode ?? OPTIMIZER_RANKING_MODES.minimum
  const role = kind === 'ko' ? 'attacker' : 'defender'
  const dependencies = getOptimizerStatDependencies(context)
  const variableStats = dependencies[role]
  const natureStats = variableStats.filter((stat) => stat !== 'hp')
  const fixed = { attacker: contextSps(context, 'attacker'), defender: contextSps(context, 'defender') }
  const ranges = role === 'attacker'
    ? { ...(config.attackerSp ? { [dependencies.offenseStat]: config.attackerSp } : {}), ...config.attackerSpByStat }
    : { ...(config.defenderHpSp ? { hp: config.defenderHpSp } : {}), ...(config.defenderDefenseSp ? { [dependencies.defenseStat]: config.defenderDefenseSp } : {}), ...config.defenderSpByStat }
  const practical = rankingMode === OPTIMIZER_RANKING_MODES.practical
  const orderedRanges = Object.fromEntries(variableStats.map((stat) => [stat, [...new Set(ranges[stat] ?? ALL_SP)].sort((first, second) => practical ? second - first : first - second)]))
  const configuredNatures = role === 'attacker' ? config.attackerNatures : config.defenderNatures
  const natures = natureStats.length ? configuredNatures ?? ALL_NATURES : [context[role].nature]
  const natureCandidates = getNatureCandidates(natures, natureStats)
  const shellSideArm = toId(context.move.name) === 'shell-side-arm'
  const screens = kind === 'ko' ? [context.field?.screen ?? ''] : config.screens ?? (shellSideArm ? ['', 'Reflect', 'Light Screen', 'Aurora Veil'] : getScreenOptions(context.move.category))
  const burnOptions = context.attacker.status ? [context.attacker.status === 'brn'] : context.move.category === 'physical' || shellSideArm ? [false, true] : [false]
  const burns = kind === 'ko' ? [context.attacker.status === 'brn'] : config.attackerBurned ?? burnOptions
  const criticals = kind === 'ko' ? config.critical ?? [false] : [false]
  const options = []
  const groups = new Map()
  const reuseHpDamage = canReuseShellSideArmDamage(context, kind)
  let excludedCandidates = 0

  for (const { nature, natureGroup } of natureCandidates) {
    const damageCache = new Map()
    const successfulSpreads = new Map()
    for (const sps of getSpCandidates(fixed[role], variableStats, orderedRanges)) {
      const worst = options.at(-1)
      const investment = variableStats.reduce((sum, stat) => sum + sps[stat], 0)
      // Practical ordering compares these SP fields before damage or field
      // conditions. They provide an exact bound once the retained set is full.
      if (practical && options.length >= internalLimit && worst) {
        if (kind === 'survival' && sps.hp < worst.defender.hpSp) continue
        if ((kind === 'ko' || sps.hp === worst.defender.hpSp) && investment < variedInvestment(worst[role])) continue
      }
      const attackerSps = role === 'attacker' ? sps : fixed.attacker
      const defenderSps = role === 'defender' ? sps : fixed.defender
      const attackerNature = role === 'attacker' ? nature : context.attacker.nature
      const defenderNature = role === 'defender' ? nature : context.defender.nature
      const defenderStats = calculateChampionsStats({ baseStats: context.defender.baseStats, nature: defenderNature, sps: defenderSps })
      const hp = Math.min(context.defender.currentHp ?? (kind === 'ko' ? context.defender.hp : undefined) ?? defenderStats.hp, defenderStats.hp)
      for (const screen of screens) {
        for (const weather of getWeatherCandidates(context, config.weather)) {
          for (const burned of burns) {
            for (const critical of criticals) {
              const contextKey = JSON.stringify([nature, screen, weather, burned, critical])
              const knownSpreads = successfulSpreads.get(contextKey) ?? []
              // This prunes only a spread already dominated by a successful
              // cheaper spread in the same conditions, without assuming damage
              // or survival is monotone in any stat.
              if (rankingMode !== OPTIMIZER_RANKING_MODES.practical && knownSpreads.some((known) => STAT_IDS.every((stat) => known[stat] <= sps[stat]))) continue
              const option = {
                contextKey,
                attacker: {
                  ability: context.attacker.ability, item: context.attacker.item,
                  nature: attackerNature, natureGroup: role === 'attacker' ? natureGroup : null,
                  sps: attackerSps, investmentStats: role === 'attacker' ? variableStats : [],
                  offenseSp: dependencies.attacker.includes(dependencies.offenseStat) ? attackerSps[dependencies.offenseStat] : 0,
                  burned,
                },
                defender: {
                  ability: context.defender.ability, item: context.defender.item,
                  nature: defenderNature, natureGroup: role === 'defender' ? natureGroup : null,
                  sps: defenderSps, investmentStats: role === 'defender' ? variableStats : [],
                  hp, hpSp: defenderSps.hp, defenseSp: defenderSps[dependencies.defenseStat],
                },
                field: { critical, gameType: context.field?.gameType ?? 'Singles', screen, weather },
              }
              const damageKey = reuseHpDamage ? JSON.stringify([variableStats.filter((stat) => stat !== 'hp').map((stat) => sps[stat]), screen, weather, burned, critical]) : null
              const enriched = withDamage(context, kind, option, damageCache.get(damageKey))
              if (!enriched) { excludedCandidates++; continue }
              if (reuseHpDamage && !damageCache.has(damageKey)) damageCache.set(damageKey, enriched.damage)
              enriched.sort = { offenseStat: dependencies.offenseStat, defenseStat: dependencies.defenseStat }
              if (kind === 'ko' ? enriched.damage.guaranteedKO ?? enriched.damage.min >= enriched.defender.hp : enriched.damage.guaranteedSurvival ?? enriched.damage.max < enriched.defender.hp) {
                if (rankingMode !== OPTIMIZER_RANKING_MODES.practical) successfulSpreads.set(contextKey, [...knownSpreads.filter((known) => !STAT_IDS.every((stat) => sps[stat] <= known[stat])), sps])
                addIfUseful(options, groups, enriched, internalLimit, rankingMode)
              }
            }
          }
        }
      }
    }
  }
  return limitOptions(options, limit, rankingMode, excludedCandidates)
}

export function findSurvivalOptions(context, config = {}) {
  return searchOptions(context, config, 'survival')
}

export function findKoOptions(context, config = {}) {
  return searchOptions(context, config, 'ko')
}

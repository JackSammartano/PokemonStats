import { CHAMPIONS_NATURES } from './championsData.js'

export const STAT_IDS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']
const BOOST_TABLE = [
  [2, 8],
  [2, 7],
  [2, 6],
  [2, 5],
  [2, 4],
  [2, 3],
  [2, 2],
  [3, 2],
  [4, 2],
  [5, 2],
  [6, 2],
  [7, 2],
  [8, 2],
]

export function toId(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function pokeRound(value) {
  return value % 1 > 0.5 ? Math.ceil(value) : Math.floor(value)
}

export function of16(value) {
  return value > 65535 ? value % 65536 : value
}

export function of32(value) {
  return value > 4294967295 ? value % 4294967296 : value
}

export function chainMods(mods, lowerBound, upperBound) {
  let modifier = 4096

  for (const mod of mods) {
    if (mod !== 4096) {
      modifier = (modifier * mod + 2048) >> 12
    }
  }

  return Math.max(Math.min(modifier, upperBound), lowerBound)
}

export function getModifiedStat(stat, boost = 0) {
  if (boost < -6 || boost > 6) {
    throw new RangeError(`Boost must be between -6 and 6, received ${boost}`)
  }

  const [numerator, denominator] = BOOST_TABLE[boost + 6]
  return Math.floor(of16(stat * numerator) / denominator)
}

export function calculateChampionsStat({
  base,
  nature = 'Serious',
  sp = 0,
  stat,
}) {
  if (!STAT_IDS.includes(stat)) {
    throw new Error(`Unknown stat "${stat}"`)
  }
  if (sp < 0 || sp > 32) {
    throw new RangeError(`Champions SP must be between 0 and 32, received ${sp}`)
  }
  if (stat === 'hp') {
    return base === 1 ? 1 : base + sp + 75
  }

  const [plus, minus] = CHAMPIONS_NATURES[toId(nature)] ?? []
  const natureMod = plus === stat && minus === stat ? 1 : plus === stat ? 1.1 : minus === stat ? 0.9 : 1

  return Math.floor(natureMod * (base + sp + 20))
}

export function calculateChampionsStats({ baseStats, nature = 'Serious', sps = {} }) {
  return Object.fromEntries(
    STAT_IDS.map((stat) => [
      stat,
      calculateChampionsStat({
        base: baseStats[stat],
        nature,
        sp: sps[stat] ?? 0,
        stat,
      }),
    ]),
  )
}

export function calculateBaseDamage({ attack, basePower, defense, level = 50 }) {
  return Math.floor(
    of32(
      Math.floor(
        of32(of32(Math.floor((2 * level) / 5 + 2) * basePower) * attack) / defense,
      ) /
        50 +
        2,
    ),
  )
}

export function calculateFinalDamage({
  baseDamage,
  burn = false,
  effectiveness = 1,
  finalMod = 4096,
  protect = false,
  roll,
  stabMod = 4096,
}) {
  let damage = Math.floor(of32(baseDamage * roll) / 100)

  if (stabMod !== 4096) {
    damage = of32(damage * stabMod) / 4096
  }

  damage = Math.floor(of32(pokeRound(damage) * effectiveness))

  if (burn) damage = Math.floor(damage / 2)
  if (protect) damage = pokeRound(of32(damage * 1024) / 4096)

  return of16(pokeRound(Math.max(1, of32(damage * finalMod) / 4096)))
}

export function calculateDamageRolls(options) {
  return Array.from({ length: 16 }, (_, index) =>
    calculateFinalDamage({
      ...options,
      roll: 85 + index,
    }),
  )
}

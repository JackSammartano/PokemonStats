import { calculateChampionsStat, getModifiedStat, pokeRound, toId } from './championsMath.js'

export function getBattleSpeed(pokemon, build, weather = '') {
  if (!pokemon || (build.level ?? 50) !== 50) return null
  const base = pokemon.stats.find((stat) => stat.name === 'speed')?.value
  if (!Number.isFinite(base)) return null
  const stat = calculateChampionsStat({ base, stat: 'spe', nature: build.nature, sp: build.sps?.spe ?? 0 })
  return getEffectiveSpeed(stat, build, weather)
}

export function getEffectiveSpeed(stat, build, weather = '') {
  const boosted = getModifiedStat(stat, build.boosts?.spe ?? 0)
  const item = toId(build.item)
  const ability = toId(build.ability)
  let modifier = item === 'choice-scarf' ? 1.5 : item === 'iron-ball' || item === 'macho-brace' || /^power-(anklet|band|belt|bracer|lens|weight)$/.test(item) ? 0.5 : 1
  if ((ability === 'chlorophyll' && weather === 'Sun')
    || (ability === 'swift-swim' && weather === 'Rain')
    || (ability === 'sand-rush' && weather === 'Sand')
    || (ability === 'slush-rush' && weather === 'Snow')) modifier *= 2
  const status = build.status || (build.burned ? 'brn' : '')
  if (ability === 'quick-feet' && status) modifier *= 1.5
  if (ability === 'unburden' && (build.abilityOn || build.unburdenActive) && !build.item && !build.heldItem) modifier *= 2
  if (ability === 'surge-surfer' && build.terrain === 'Electric') modifier *= 2
  if (build.tailwind) modifier *= 2
  let speed = Math.max(1, pokeRound(boosted * modifier))
  if (status === 'par' && ability !== 'quick-feet') speed = Math.max(1, Math.floor(speed / 2))
  return speed
}

export function getSpeedTableRow(pokemon, build, weather = '') {
  const base = pokemon?.stats.find((stat) => stat.name === 'speed')?.value
  const speed = (nature, sp, scarf = false) => getBattleSpeed(pokemon, { nature, sps: { spe: sp }, item: scarf ? 'choice-scarf' : '' })
  return {
    base: base ?? null,
    current: getBattleSpeed(pokemon, build, weather),
    max: speed('timid', 32),
    neutral32: speed('serious', 32),
    neutral0: speed('serious', 0),
    minus0: speed('brave', 0),
    maxScarf: speed('timid', 32, true),
    neutralScarf: speed('serious', 32, true),
  }
}

export function describeSpeedOrder(leftSpeed, rightSpeed) {
  if (leftSpeed === null || rightSpeed === null) return 'Confronto disponibile al livello 50.'
  if (leftSpeed === rightSpeed) return 'Parità di Velocità: speed tie.'
  return `Pokémon ${leftSpeed > rightSpeed ? '1' : '2'} più veloce di ${Math.abs(leftSpeed - rightSpeed)} punti.`
}

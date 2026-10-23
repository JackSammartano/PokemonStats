import { calculateChampionsStat, getModifiedStat, toId } from './championsMath.js'

export function getBattleSpeed(pokemon, build, weather = '') {
  if (!pokemon || (build.level ?? 50) !== 50) return null
  const base = pokemon.stats.find((stat) => stat.name === 'speed')?.value
  if (!Number.isFinite(base)) return null
  const stat = calculateChampionsStat({ base, stat: 'spe', nature: build.nature, sp: build.sps?.spe ?? 0 })
  const boosted = getModifiedStat(stat, build.boosts?.spe ?? 0)
  const item = toId(build.item)
  const ability = toId(build.ability)
  let modifier = item === 'choice-scarf' ? 1.5 : item === 'iron-ball' || item === 'macho-brace' || /^power-(anklet|band|belt|bracer|lens|weight)$/.test(item) ? 0.5 : 1
  if ((ability === 'chlorophyll' && weather === 'Sun')
    || (ability === 'swift-swim' && weather === 'Rain')
    || (ability === 'sand-rush' && weather === 'Sand')
    || (ability === 'slush-rush' && weather === 'Snow')) modifier *= 2
  return Math.max(1, Math.floor(boosted * modifier))
}

export function describeSpeedOrder(leftSpeed, rightSpeed) {
  if (leftSpeed === null || rightSpeed === null) return 'Confronto disponibile al livello 50.'
  if (leftSpeed === rightSpeed) return 'Parità di Velocità: speed tie.'
  return `Pokémon ${leftSpeed > rightSpeed ? '1' : '2'} più veloce di ${Math.abs(leftSpeed - rightSpeed)} punti.`
}

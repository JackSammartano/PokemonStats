import { REGULATION_ITEMS } from '../regulation.js'
import { toId } from './championsMath.js'

const berryIds = new Set(REGULATION_ITEMS.filter((item) => item.isBerry).map((item) => item.id))
const cures = { 'cheri-berry': ['par'], 'chesto-berry': ['slp'], 'pecha-berry': ['psn', 'tox'], 'rawst-berry': ['brn'], 'aspear-berry': ['frz'], 'lum-berry': ['brn', 'par', 'slp', 'psn', 'tox', 'frz'] }

export function consumeItem(pokemon) {
  pokemon.item = ''; pokemon.heldItem = ''; pokemon.itemConsumed = true
  if (toId(pokemon.ability) === 'unburden') pokemon.unburdenActive = true
}

export function eatBerry(pokemon, id) {
  if (!berryIds.has(id) || !(pokemon.currentHp > 0)) return false
  const ripen = toId(pokemon.ability) === 'ripen' ? 2 : 1
  if (id === 'sitrus-berry' || id === 'oran-berry') {
    const heal = Math.max(1, Math.floor((id === 'sitrus-berry' ? pokemon.stats.hp / 4 : 10) * ripen))
    pokemon.currentHp = Math.min(pokemon.stats.hp, pokemon.currentHp + heal)
  }
  if (cures[id]?.includes(pokemon.status)) pokemon.status = ''
  if (toId(pokemon.ability) === 'cheek-pouch') pokemon.currentHp = Math.min(pokemon.stats.hp, pokemon.currentHp + Math.floor(pokemon.stats.hp / 3))
  return true
}

export function activateHeldBerry(pokemon, opponent) {
  if (!(pokemon.currentHp > 0) || toId(opponent.ability) === 'unnerve') return
  const id = toId(pokemon.item)
  const canHeal = pokemon.currentHp <= pokemon.stats.hp / 2 && ['sitrus-berry', 'oran-berry'].includes(id)
  if (!canHeal && !cures[id]?.includes(pokemon.status)) return
  consumeItem(pokemon)
  eatBerry(pokemon, id)
}

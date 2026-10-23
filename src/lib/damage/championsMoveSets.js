import { getDamageMoveOptions } from './championsOptions.js'

export const MOVE_SLOT_COUNT = 4
export const moveSetKey = (side, pokemonName) => `${side}:${pokemonName}`

export function resolveMoveSlots(pokemon, selected) {
  if (!pokemon) return Array(MOVE_SLOT_COUNT).fill('')
  const options = getDamageMoveOptions(pokemon).options
  if (!Array.isArray(selected)) return Array.from({ length: MOVE_SLOT_COUNT }, (_, index) => options[index]?.value ?? '')
  const valid = new Set(options.map((entry) => entry.value))
  const seen = new Set()
  return Array.from({ length: MOVE_SLOT_COUNT }, (_, index) => {
    const id = selected[index]
    if (!valid.has(id) || seen.has(id)) return ''
    seen.add(id)
    return id
  })
}

export function getPokemonMoveSlots(moveSets, side, pokemon) {
  return resolveMoveSlots(pokemon, moveSets[moveSetKey(side, pokemon?.displayName)])
}

export function updatePokemonMoveSlot(moveSets, side, pokemon, slot, moveId) {
  if (!pokemon || slot < 0 || slot >= MOVE_SLOT_COUNT) return moveSets
  const slots = getPokemonMoveSlots(moveSets, side, pokemon)
  slots[slot] = moveId
  return { ...moveSets, [moveSetKey(side, pokemon.displayName)]: resolveMoveSlots(pokemon, slots) }
}

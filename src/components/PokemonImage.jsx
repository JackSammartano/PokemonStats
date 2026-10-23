import { POKEMON_IMAGE_FALLBACK } from '../lib/pokemonDataset.js'

export default function PokemonImage({ pokemon, size = 148, alt = '' }) {
  return <img src={pokemon.image || POKEMON_IMAGE_FALLBACK} alt={alt} width={size} height={size} loading="lazy" decoding="async" onError={(event) => {
    const image = event.currentTarget
    if (image.getAttribute('src') !== POKEMON_IMAGE_FALLBACK) image.src = POKEMON_IMAGE_FALLBACK
  }} />
}

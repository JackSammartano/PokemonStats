import { formatName } from '../lib/pokemonDataset'
import { formatTypeMultiplier } from '../lib/typeLabels'
import PokemonImage from './PokemonImage'

const STAT_LABELS = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
}

export default function PokemonDetails({ pokemon, headingLevel: Heading = 'h2' }) {
  const total = pokemon.stats.reduce((sum, stat) => sum + stat.value, 0)
  return <>
      <div className="pokemon-heading">
        <div>
          <Heading>{pokemon.displayName}</Heading>
          <div className="type-row">
            {pokemon.types.map((type) => (
              <span className={`type-badge type-${type}`} key={type}>
                {formatName(type)}
              </span>
            ))}
          </div>
        </div>
        <PokemonImage pokemon={pokemon} alt={pokemon.displayName} />
      </div>

      <div className="stats-block">
        <div className="section-title">
          <span>Base stats</span>
          <strong>{total}</strong>
        </div>
        {pokemon.stats.map((stat) => (
          <div className="stat-row" key={stat.name}>
            <span>{STAT_LABELS[stat.name] ?? formatName(stat.name)}</span>
            <meter min="0" max="255" value={stat.value} />
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>

      <div className="weakness-block">
        <div className="section-title">
          <span>Debolezze</span>
        </div>
        <div className="chip-row">
          {pokemon.weaknesses.length > 0 ? (
            pokemon.weaknesses.map((weakness) => (
              <span
                className={`weakness-chip type-${weakness.type}`}
                key={weakness.type}
              >
                {formatName(weakness.type)} {formatTypeMultiplier(weakness.multiplier)}
              </span>
            ))
          ) : (
            <span className="muted">Nessuna debolezza</span>
          )}
        </div>
      </div>

      <div className="weakness-block">
        <div className="section-title">
          <span>Resistenze</span>
        </div>
        <div className="chip-row">
          {pokemon.resistances.length > 0 ? (
            pokemon.resistances.map((resistance) => (
              <span
                className={`resistance-chip type-${resistance.type}`}
                key={resistance.type}
              >
                {formatName(resistance.type)}{' '}
                {formatTypeMultiplier(resistance.multiplier)}
              </span>
            ))
          ) : (
            <span className="muted">Nessuna resistenza</span>
          )}
        </div>
      </div>
  </>
}

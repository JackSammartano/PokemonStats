import { useDeferredValue, useEffect, useState } from 'react'
import './App.css'
import { REGULATION_MB_POKEMON } from './data/regulationMb'
import { formatName, loadPokemonDataset } from './lib/pokeapi'

const STAT_LABELS = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
}

const TYPE_OPTIONS = [
  'all',
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
]

function App() {
  const [pokemon, setPokemon] = useState([])
  const [loadedCount, setLoadedCount] = useState(0)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [showUnsupported, setShowUnsupported] = useState(true)
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        setStatus('loading')
        const dataset = await loadPokemonDataset(REGULATION_MB_POKEMON, (count) => {
          if (!ignore) setLoadedCount(count)
        })

        if (!ignore) {
          setPokemon(dataset)
          setStatus('ready')
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message)
          setStatus('error')
        }
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [])

  const supported = pokemon.filter((entry) => entry.status === 'ready')
  const unsupported = pokemon.filter((entry) => entry.status === 'unsupported')
  const filtered = pokemon.filter((entry) => {
    const matchesText = entry.displayName
      .toLowerCase()
      .includes(deferredQuery.trim().toLowerCase())
    const matchesType =
      selectedType === 'all' ||
      (entry.status === 'ready' && entry.types.includes(selectedType))
    const matchesSupport = showUnsupported || entry.status === 'ready'

    return matchesText && matchesType && matchesSupport
  })

  return (
    <main className="app-shell">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Regulation MB Worlds roster</p>
          <h1>Pokémon stats explorer</h1>
          <p className="hero-text">
            Lista locale da 224 Pokémon, dati live da PokéAPI, debolezze calcolate
            dalla type chart e abilità con descrizione quando disponibili.
          </p>
        </div>

        <div className="status-panel">
          <Metric label="Caricati" value={`${loadedCount}/${REGULATION_MB_POKEMON.length}`} />
          <Metric label="Supportati" value={supported.length} />
          <Metric label="Non risolti" value={unsupported.length} tone="warning" />
        </div>
      </section>

      <section className="toolbar" aria-label="Filtri">
        <label className="search-field">
          <span>Cerca Pokémon</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Es. Garchomp, Mega Raichu..."
          />
        </label>

        <label className="select-field">
          <span>Tipo</span>
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
          >
            {TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'Tutti i tipi' : formatName(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="toggle-field">
          <input
            type="checkbox"
            checked={showUnsupported}
            onChange={(event) => setShowUnsupported(event.target.checked)}
          />
          Mostra non risolti
        </label>
      </section>

      {status === 'error' && (
        <section className="notice error">
          <strong>Caricamento non riuscito.</strong>
          <span>{error}</span>
        </section>
      )}

      {status === 'loading' && (
        <section className="notice">
          <strong>Caricamento da PokéAPI in corso.</strong>
          <span>
            Le richieste sono a batch per evitare picchi inutili. Il browser deve poter
            raggiungere <code>pokeapi.co</code>.
          </span>
        </section>
      )}

      <section className="results-summary">
        <span>{filtered.length} risultati visibili</span>
        <span>{REGULATION_MB_POKEMON.length} Pokémon in lista Regulation MB</span>
      </section>

      <section className="pokemon-grid">
        {filtered.map((entry) =>
          entry.status === 'ready' ? (
            <PokemonCard key={entry.displayName} pokemon={entry} />
          ) : (
            <UnsupportedCard key={entry.displayName} pokemon={entry} />
          ),
        )}
      </section>
    </main>
  )
}

function Metric({ label, value, tone }) {
  return (
    <div className={`metric ${tone ?? ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function PokemonCard({ pokemon }) {
  const total = pokemon.stats.reduce((sum, stat) => sum + stat.value, 0)

  return (
    <article className="pokemon-card">
      <div className="card-topline">
        <span>#{String(pokemon.id).padStart(4, '0')}</span>
        {pokemon.apiName !== pokemon.displayName.toLowerCase() && (
          <span className="api-name">PokéAPI: {pokemon.apiName}</span>
        )}
      </div>

      <div className="pokemon-heading">
        <div>
          <h2>{pokemon.displayName}</h2>
          <div className="type-row">
            {pokemon.types.map((type) => (
              <span className={`type-badge type-${type}`} key={type}>
                {formatName(type)}
              </span>
            ))}
          </div>
        </div>
        {pokemon.image && <img src={pokemon.image} alt={pokemon.displayName} loading="lazy" />}
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
              <span className="weakness-chip" key={weakness.type}>
                {formatName(weakness.type)} x{weakness.multiplier}
              </span>
            ))
          ) : (
            <span className="muted">Nessuna debolezza sopra x1</span>
          )}
        </div>
      </div>

      <details className="abilities">
        <summary>Abilità disponibili</summary>
        <div className="ability-list">
          {pokemon.abilities.map((ability) => (
            <div className="ability" key={`${pokemon.displayName}-${ability.name}`}>
              <strong>
                {ability.name}
                {ability.isHidden && <span> Hidden</span>}
              </strong>
              <p>{ability.description}</p>
            </div>
          ))}
        </div>
      </details>
    </article>
  )
}

function UnsupportedCard({ pokemon }) {
  return (
    <article className="pokemon-card unsupported-card">
      <div className="card-topline">
        <span>Non risolto</span>
      </div>
      <h2>{pokemon.displayName}</h2>
      <p>
        PokéAPI non ha risposto per gli slug provati. Non mostro stats o tipi
        alternativi perché sarebbero dati non verificati.
      </p>
      {pokemon.isNewOrUnverifiedMega && (
        <p className="hint">
          Forma Mega recente o non ancora presente nel dataset PokéAPI pubblico.
        </p>
      )}
      <div className="slug-list">
        {pokemon.candidates.map((candidate) => (
          <code key={candidate}>{candidate}</code>
        ))}
      </div>
    </article>
  )
}

export default App

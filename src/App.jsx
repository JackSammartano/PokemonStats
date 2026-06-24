import { useDeferredValue, useEffect, useState } from 'react'
import './App.css'
import { REGULATION_MB_POKEMON } from './data/regulationMb'
import { TYPE_NAMES, formatName, loadPokemonDataset } from './lib/pokeapi'

const STAT_LABELS = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
}

const SORT_OPTIONS = [
  { label: 'Nome', value: 'name' },
  { label: 'HP', value: 'hp' },
  { label: 'Atk', value: 'attack' },
  { label: 'Def', value: 'defense' },
  { label: 'SpA', value: 'special-attack' },
  { label: 'SpD', value: 'special-defense' },
  { label: 'Spe', value: 'speed' },
]

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

const TEAM_SIZE = 6

function getEntryCategory(displayName) {
  if (displayName.startsWith('Mega ')) return 'mega'
  if (
    /\b(Alola|Galar|Hisui|Paldea|Male|Female)\b/.test(displayName) ||
    displayName.includes('Family Of')
  ) {
    return 'form'
  }
  return 'base'
}

function App() {
  const [pokemon, setPokemon] = useState([])
  const [teamNames, setTeamNames] = useState([])
  const [loadedCount, setLoadedCount] = useState(0)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
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
  const team = teamNames
    .map((name) => pokemon.find((entry) => entry.displayName === name))
    .filter(Boolean)
  const teamAnalysis = getTeamDefenseAnalysis(team)
  const baseCount = pokemon.filter((entry) => getEntryCategory(entry.displayName) === 'base').length
  const formCount = pokemon.filter((entry) => getEntryCategory(entry.displayName) === 'form').length
  const megaCount = pokemon.filter((entry) => getEntryCategory(entry.displayName) === 'mega').length
  const filtered = [
    ...pokemon.filter((entry) => {
      const matchesText = entry.displayName
        .toLowerCase()
        .includes(deferredQuery.trim().toLowerCase())
      const matchesType =
        selectedType === 'all' ||
        (entry.status === 'ready' && entry.types.includes(selectedType))
      const matchesCategory =
        selectedCategory === 'all' || getEntryCategory(entry.displayName) === selectedCategory

      return matchesText && matchesType && matchesCategory
    }),
  ].sort((first, second) => comparePokemon(first, second, sortBy, sortDirection))

  function toggleTeamMember(entry) {
    if (entry.status !== 'ready') return

    setTeamNames((currentTeam) => {
      if (currentTeam.includes(entry.displayName)) {
        return currentTeam.filter((name) => name !== entry.displayName)
      }

      if (currentTeam.length >= TEAM_SIZE) {
        return currentTeam
      }

      return [...currentTeam, entry.displayName]
    })
  }

  return (
    <main className="app-shell">
      <details className="debug-panel">
        <summary>Debug</summary>
        <div className="debug-grid">
          <Metric label="Caricati" value={`${loadedCount}/${REGULATION_MB_POKEMON.length}`} />
          <Metric label="Supportati" value={supported.length} />
          <Metric label="Non risolti" value={unsupported.length} tone="warning" />
          <Metric label="Base" value={baseCount} />
          <Metric label="Forme alternative" value={formCount} />
          <Metric label="Mega" value={megaCount} />
        </div>
      </details>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Regulation MB Worlds roster</p>
          <h1>Pokémon stats explorer</h1>
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

        <label className="select-field">
          <span>Categoria</span>
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            <option value="all">Tutte</option>
            <option value="base">Base</option>
            <option value="form">Forme alternative</option>
            <option value="mega">Mega</option>
          </select>
        </label>

        <label className="select-field">
          <span>Ordina per</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Direzione</span>
          <select
            value={sortDirection}
            onChange={(event) => setSortDirection(event.target.value)}
          >
            <option value="asc">Crescente</option>
            <option value="desc">Decrescente</option>
          </select>
        </label>

      </section>

      {status === 'error' && (
        <section className="notice error">
          <strong>Caricamento non riuscito.</strong>
          <span>{error}</span>
        </section>
      )}

      {status === 'loading' && (
        <section className="notice loading-notice">
          <div className="pokeball-spinner" aria-hidden="true"></div>
          <div>
            <strong>Caricamento da PokéAPI in corso.</strong>
            <span>
              {loadedCount}/{REGULATION_MB_POKEMON.length} Pokémon caricati
            </span>
          </div>
        </section>
      )}

      <section className="results-summary">
        <span>{filtered.length} risultati visibili</span>
      </section>

      <TeamBuilder
        analysis={teamAnalysis}
        onClear={() => setTeamNames([])}
        onRemove={(name) =>
          setTeamNames((currentTeam) => currentTeam.filter((entry) => entry !== name))
        }
        team={team}
      />

      <section className="pokemon-grid">
        {filtered.map((entry) =>
          entry.status === 'ready' ? (
            <PokemonCard
              isSelected={teamNames.includes(entry.displayName)}
              key={entry.displayName}
              onToggleTeam={() => toggleTeamMember(entry)}
              pokemon={entry}
              teamIsFull={teamNames.length >= TEAM_SIZE}
            />
          ) : (
            <UnsupportedCard key={entry.displayName} pokemon={entry} />
          ),
        )}
      </section>
    </main>
  )
}

function comparePokemon(first, second, sortBy, sortDirection) {
  const direction = sortDirection === 'asc' ? 1 : -1

  if (sortBy === 'name') {
    return first.displayName.localeCompare(second.displayName) * direction
  }

  const firstValue = getStatValue(first, sortBy)
  const secondValue = getStatValue(second, sortBy)

  if (firstValue === null && secondValue === null) {
    return first.displayName.localeCompare(second.displayName)
  }
  if (firstValue === null) return 1
  if (secondValue === null) return -1
  if (firstValue === secondValue) {
    return first.displayName.localeCompare(second.displayName)
  }

  return (firstValue - secondValue) * direction
}

function getStatValue(pokemon, statName) {
  if (pokemon.status !== 'ready') return null

  return pokemon.stats.find((stat) => stat.name === statName)?.value ?? null
}

function getDefenseScore(multiplier) {
  if (multiplier === 0) return -2
  return Math.log2(multiplier)
}

function getTeamDefenseAnalysis(team) {
  return TYPE_NAMES.map((type) => {
    const entries = team.map((pokemon) => {
      const multiplier = pokemon.defenseProfile?.[type] ?? 1

      return {
        multiplier,
        name: pokemon.displayName,
        score: getDefenseScore(multiplier),
      }
    })
    const weak = entries.filter((entry) => entry.multiplier > 1)
    const resistant = entries.filter(
      (entry) => entry.multiplier > 0 && entry.multiplier < 1,
    )
    const immune = entries.filter((entry) => entry.multiplier === 0)
    const score = entries.reduce((sum, entry) => sum + entry.score, 0)

    return {
      immune,
      resistant,
      score,
      type,
      weak,
    }
  }).sort((a, b) => b.score - a.score || a.type.localeCompare(b.type))
}

function Metric({ label, value, tone }) {
  return (
    <div className={`metric ${tone ?? ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function TeamBuilder({ analysis, onClear, onRemove, team }) {
  return (
    <details className="team-builder">
      <summary>Il mio team ({team.length}/{TEAM_SIZE})</summary>
      <div className="team-header">
        <div>
          <p className="eyebrow compact">Team builder</p>
          <h2>Il mio team</h2>
        </div>
        <button
          className="ghost-button"
          disabled={team.length === 0}
          onClick={onClear}
          type="button"
        >
          Svuota team
        </button>
      </div>

      <div className="team-slots">
        {Array.from({ length: TEAM_SIZE }, (_, index) => {
          const pokemon = team[index]

          return pokemon ? (
            <article className="team-slot filled" key={pokemon.displayName}>
              {pokemon.image && <img src={pokemon.image} alt="" />}
              <div>
                <strong>{pokemon.displayName}</strong>
                <div className="type-row mini">
                  {pokemon.types.map((type) => (
                    <span className={`type-badge type-${type}`} key={type}>
                      {formatName(type)}
                    </span>
                  ))}
                </div>
              </div>
              <button
                aria-label={`Rimuovi ${pokemon.displayName} dal team`}
                onClick={() => onRemove(pokemon.displayName)}
                type="button"
              >
                Rimuovi
              </button>
            </article>
          ) : (
            <article className="team-slot empty" key={`empty-${index}`}>
              Slot {index + 1}
            </article>
          )
        })}
      </div>

      {team.length > 0 ? (
        <div className="team-analysis">
          {analysis.map((entry) => (
            <article
              className={`team-type-row ${getTeamRowTone(entry.score)}`}
              key={entry.type}
            >
              <span className={`type-badge type-${entry.type}`}>
                {formatName(entry.type)}
              </span>
              <DefenseBars score={entry.score} />
              <strong>{entry.score > 0 ? `+${entry.score}` : entry.score}</strong>
            </article>
          ))}
        </div>
      ) : (
        <p className="team-empty-message">
          Seleziona fino a 6 Pokémon per analizzare debolezze, resistenze e
          copertura difensiva del team.
        </p>
      )}
    </details>
  )
}

function DefenseBars({ score }) {
  const barCount = Math.min(Math.abs(score), TEAM_SIZE * 2)
  const tone = score > 0 ? 'weak' : score < 0 ? 'resist' : 'neutral'

  if (barCount === 0) {
    return <span className="defense-bars neutral">Bilanciato</span>
  }

  return (
    <span className={`defense-bars ${tone}`} aria-label={`Score ${score}`}>
      {Array.from({ length: barCount }, (_, index) => (
        <span key={index}></span>
      ))}
    </span>
  )
}

function getTeamRowTone(score) {
  if (score > 0) return 'vulnerable'
  if (score < 0) return 'covered'
  return 'balanced'
}

function PokemonCard({ isSelected, onToggleTeam, pokemon, teamIsFull }) {
  const total = pokemon.stats.reduce((sum, stat) => sum + stat.value, 0)
  const disabled = teamIsFull && !isSelected

  return (
    <article className="pokemon-card">
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

      <button
        className={`team-toggle ${isSelected ? 'selected' : ''}`}
        disabled={disabled}
        aria-label={isSelected ? 'Rimuovi dal team' : 'Aggiungi al team'}
        onClick={onToggleTeam}
        type="button"
      >
        {isSelected ? '−' : '+'}
      </button>

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
                {formatName(weakness.type)} x{weakness.multiplier}
              </span>
            ))
          ) : (
            <span className="muted">Nessuna debolezza sopra x1</span>
          )}
        </div>
      </div>

      <div className="abilities">
        <div className="section-title">
          <span>Abilità</span>
        </div>
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
      </div>
    </article>
  )
}

function UnsupportedCard({ pokemon }) {
  return (
    <article className="pokemon-card unsupported-card">
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

import { useDeferredValue, useEffect, useRef, useState } from 'react'
import './App.css'
import TeamDamageLink from './components/TeamDamageLink'
import { resolveTeamMatchup } from './lib/teamDamageLink'
import { useWorkspaceNavigation } from './lib/workspaceNavigation'
import { REGULATION_MC_POKEMON } from './data/regulationMc'
import DamageCalculator from './components/DamageCalculator'
import { updatePokemonMoveSlot } from './lib/damage/championsMoveSets'
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
function App() {
  const [pokemon, setPokemon] = useState([])
  const [teamNames, setTeamNames] = useState([])
  const [highlightedTeamMember, setHighlightedTeamMember] = useState(null)
  const [activePanel, setActivePanel] = useState(null)
  const { view, fromTeam, navigate } = useWorkspaceNavigation()
  const [teamDamageDraft, setTeamDamageDraft] = useState({ attackerName: '', defenderName: '' })
  const [moveSets, setMoveSets] = useState({})
  const [selectedDamageMove, setSelectedDamageMove] = useState({ side: 'attacker', slot: 0 })
  const [compareLeftName, setCompareLeftName] = useState('')
  const [compareRightName, setCompareRightName] = useState('')
  const [loadedCount, setLoadedCount] = useState(0)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [damageAttackerName, setDamageAttackerName] = useState('')
  const [damageDefenderName, setDamageDefenderName] = useState('')
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    document.querySelector('.workspace-view:not([hidden]) h1')?.focus({ preventScroll: true })
  }, [view])

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        setStatus('loading')
        const dataset = await loadPokemonDataset(REGULATION_MC_POKEMON, (count) => {
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
  const baseCount = pokemon.filter((entry) => entry.category === 'base').length
  const formCount = pokemon.filter((entry) => entry.category === 'form').length
  const megaCount = pokemon.filter((entry) => entry.category === 'mega').length
  const filtered = [
    ...pokemon.filter((entry) => {
      const matchesText = entry.displayName
        .toLowerCase()
        .includes(deferredQuery.trim().toLowerCase())
      const matchesType =
        selectedType === 'all' ||
        (entry.status === 'ready' && entry.types.includes(selectedType))
      const matchesCategory =
        selectedCategory === 'all' || entry.category === selectedCategory

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

  function handlePanelToggle(panelName, isOpen) {
    setActivePanel(isOpen ? panelName : null)
  }

  function changeMoveSlot(side, entry, slot, moveId) {
    setMoveSets((current) => updatePokemonMoveSlot(current, side, entry, slot, moveId))
  }

  function openDamageFromTeam() {
    const matchup = resolveTeamMatchup(team, supported, teamDamageDraft, moveSets)
    if (matchup.attacker && matchup.defender) {
      setDamageAttackerName(matchup.attacker.displayName)
      setDamageDefenderName(matchup.defender.displayName)
      const side = matchup.attackerMoves.some(Boolean) ? 'attacker' : 'defender'
      const slots = side === 'attacker' ? matchup.attackerMoves : matchup.defenderMoves
      setSelectedDamageMove({ side, slot: Math.max(0, slots.findIndex(Boolean)) })
    }
    navigate('damage', { fromTeam: true })
  }

  function returnToTeam() {
    setTeamDamageDraft((draft) => ({
      attackerName: teamNames.includes(damageAttackerName) ? damageAttackerName : draft.attackerName,
      defenderName: damageDefenderName || draft.defenderName,
    }))
    navigate('team')
  }

  function clearTeamHighlight() {
    setHighlightedTeamMember(null)
  }

  return (
    <main className="app-shell">
      <nav className="workspace-nav" aria-label="Navigazione principale">
        <a className="workspace-brand" href="#/catalogo" onClick={(event) => { event.preventDefault(); navigate('catalog') }}>Pokémon stats <span>M-C</span></a>
        <div className="workspace-nav-buttons">
          <button type="button" aria-current={view === 'catalog' ? 'page' : undefined} onClick={() => navigate('catalog')}>Catalogo</button>
          <button type="button" aria-current={view === 'team' ? 'page' : undefined} onClick={() => view === 'damage' && fromTeam ? returnToTeam() : navigate('team')}>Il mio team <span className="nav-count">{team.length}/{TEAM_SIZE}</span></button>
          <button
            type="button"
            aria-current={view === 'damage' ? 'page' : undefined}
            onClick={() => {
              if (view === 'damage') return
              if (view === 'team') openDamageFromTeam()
              else navigate('damage')
            }}
          >
            Damage calculator
          </button>
        </div>
      </nav>
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
              {loadedCount}/{REGULATION_MC_POKEMON.length} Pokémon caricati
            </span>
          </div>
        </section>
      )}

      <div className="workspace-view" hidden={view !== 'catalog'}>
        <details className="debug-panel">
          <summary>Debug</summary>
          <div className="debug-grid">
            <Metric label="Caricati" value={`${loadedCount}/${REGULATION_MC_POKEMON.length}`} />
            <Metric label="Supportati" value={supported.length} />
            <Metric label="Non risolti" value={unsupported.length} tone="warning" />
            <Metric label="Base" value={baseCount} />
            <Metric label="Forme alternative" value={formCount} />
            <Metric label="Mega" value={megaCount} />
          </div>
        </details>

        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Regulation M-C</p>
            <h1 tabIndex={-1}>Pokemon stats expo</h1>
          </div>
        </section>

        <details className="toolbar" open aria-label="Filtri">
          <summary>Cerca e filtra</summary>
          <div className="toolbar-fields">
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
          </div>
        </details>

        <ComparePanel
          onToggleTeam={toggleTeamMember}
          teamIsFull={teamNames.length >= TEAM_SIZE}
          teamNames={teamNames}
          isOpen={activePanel === 'compare'}
          leftName={compareLeftName}
          onLeftChange={setCompareLeftName}
          onOpenChange={(isOpen) => handlePanelToggle('compare', isOpen)}
          onRightChange={setCompareRightName}
          pokemon={supported}
          rightName={compareRightName}
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

      </div>
      <div className="workspace-view" hidden={view !== 'team'}>
        <header className="workspace-heading">
          <div>
            <p className="eyebrow compact">La tua squadra · Regulation M-C</p>
            <h1 tabIndex={-1}>Il mio team</h1>
            <p>Gestisci i tuoi Pokémon e prepara il confronto da aprire nel calcolatore.</p>
          </div>
          <button type="button" className="ghost-button" onClick={() => navigate('catalog')}>Aggiungi Pokémon dal catalogo</button>
        </header>
        <TeamBuilder
          analysis={teamAnalysis}
          highlightedTeamMember={highlightedTeamMember}
          onClearHighlight={clearTeamHighlight}
          onClear={() => setTeamNames([])}
          onHighlight={setHighlightedTeamMember}
          onRemove={(name) =>
            setTeamNames((currentTeam) => currentTeam.filter((entry) => entry !== name))
          }
          onSelectForDamage={(name) => setTeamDamageDraft((draft) => ({ ...draft, attackerName: name }))}
          selectedForDamage={resolveTeamMatchup(team, supported, teamDamageDraft, moveSets).attacker?.displayName}
          team={team}
        />

        <TeamDamageLink team={team} pokemon={supported} draft={teamDamageDraft} onChange={setTeamDamageDraft} onCalculate={openDamageFromTeam} moveSets={moveSets} onMoveChange={changeMoveSlot} />
      </div>
      <div className="workspace-view" hidden={view !== 'damage'}>
        <header className="workspace-heading">
          <div>
            <p className="eyebrow compact">Pokémon Champions</p>
            <h1 tabIndex={-1}>Damage calculator</h1>
            <p>Configura i due Pokémon e analizza il danno della mossa selezionata.</p>
          </div>
          {fromTeam && <button type="button" className="ghost-button back-to-team" onClick={returnToTeam}><span aria-hidden="true">← </span>Torna al mio team</button>}
        </header>
        <DamageCalculator
          pokemon={supported}
          attackerName={damageAttackerName}
          defenderName={damageDefenderName}
          onAttackerChange={setDamageAttackerName}
          onDefenderChange={setDamageDefenderName}
          moveSets={moveSets}
          onMoveChange={changeMoveSlot}
          selectedMove={selectedDamageMove}
          onSelectMove={setSelectedDamageMove}
        />

      </div>
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
    const entries = team.flatMap((pokemon) => {
      const multiplier = pokemon.defenseProfile?.[type] ?? 1
      const score = getDefenseScore(multiplier)

      if (score === 0) return []

      return Array.from({ length: Math.abs(score) }, (_, index) => ({
        id: `${type}-${pokemon.displayName}-${index}`,
        multiplier,
        name: pokemon.displayName,
        score: Math.sign(score),
        tone: score > 0 ? 'weak' : 'resist',
        type,
      }))
    })
    const score = entries.reduce((sum, entry) => sum + entry.score, 0)

    return {
      contributions: entries,
      score,
      type,
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

function TeamBuilder({
  analysis,
  highlightedTeamMember,
  onClear,
  onClearHighlight,
  onHighlight,
  onSelectForDamage,
  selectedForDamage,
  onRemove,
  team,
}) {
  return (
    <section className="team-builder" aria-label="Membri e analisi difensiva del team">
      <h2 className="team-section-title">La mia squadra <span>{team.length}/{TEAM_SIZE}</span></h2>
      {team.length > 0 && (
        <div className="team-header">
          <button
            className="ghost-button"
            onClick={onClear}
            type="button"
          >
            Svuota team
          </button>
        </div>
      )}

      <div className="team-slots">
        {Array.from({ length: TEAM_SIZE }, (_, index) => {
          const pokemon = team[index]

          return pokemon ? (
            <article className="team-slot filled" key={pokemon.displayName}>
              <div
                className={`team-slot-inner ${
                  highlightedTeamMember?.name === pokemon.displayName
                    ? `highlighted ${highlightedTeamMember.tone}`
                    : ''
                }`}
              >
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
                  type="button"
                  className="team-analyze"
                  aria-pressed={selectedForDamage === pokemon.displayName}
                  onClick={() => onSelectForDamage(pokemon.displayName)}
                >
                  {selectedForDamage === pokemon.displayName ? 'Attaccante selezionato' : 'Usa come attaccante'}
                </button>
                <button
                  aria-label={`Rimuovi ${pokemon.displayName} dal team`}
                  onClick={() => onRemove(pokemon.displayName)}
                  type="button"
                >
                  Rimuovi
                </button>
              </div>
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
              <DefenseBars
                contributions={entry.contributions}
                onClearHighlight={onClearHighlight}
                onHighlight={onHighlight}
              />
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
    </section>
  )
}

function DefenseBars({ contributions, onClearHighlight, onHighlight }) {
  if (contributions.length === 0) {
    return <span className="defense-bars neutral">Bilanciato</span>
  }

  return (
    <span className="defense-bars">
      {contributions.map((contribution) => (
        <button
          aria-label={`${contribution.name}: ${
            contribution.tone === 'weak' ? 'debolezza' : 'resistenza'
          } ${contribution.multiplier}x a ${formatName(contribution.type)}`}
          className={contribution.tone}
          key={contribution.id}
          onBlur={onClearHighlight}
          onClick={() => onHighlight(contribution)}
          onFocus={() => onHighlight(contribution)}
          onMouseEnter={() => onHighlight(contribution)}
          onMouseLeave={onClearHighlight}
          title={`${contribution.name}: ${contribution.multiplier}x ${formatName(
            contribution.type,
          )}`}
          type="button"
        ></button>
      ))}
    </span>
  )
}

function getTeamRowTone(score) {
  if (score > 0) return 'vulnerable'
  if (score < 0) return 'covered'
  return 'balanced'
}

function PokemonCard({
  isSelected = false,
  onToggleTeam,
  pokemon,
  showTeamToggle = true,
  teamIsFull = false,
}) {
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

      {showTeamToggle && (
      <button
        className={`team-toggle ${isSelected ? 'selected' : ''}`}
        disabled={disabled}
        aria-label={isSelected ? `Rimuovi ${pokemon.displayName} dal team` : `Aggiungi ${pokemon.displayName} al team`}
        title={isSelected ? 'Rimuovi dal mio team' : disabled ? 'Il mio team ? completo (6/6)' : 'Aggiungi al mio team'}
        onClick={onToggleTeam}
        type="button"
      >
        {isSelected ? '−' : '+'}
      </button>
      )}

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
                {resistance.multiplier === 0 ? 'Immune' : `x${resistance.multiplier}`}
              </span>
            ))
          ) : (
            <span className="muted">Nessuna resistenza</span>
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

function SearchableSelect({ label, onChange, options, value }) {
  const [inputValue, setInputValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    function handleMouseDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setInputValue(value)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [value])

  const filtered = options.filter((name) =>
    name.toLowerCase().includes(inputValue.toLowerCase()),
  )

  function handleSelect(name) {
    onChange(name)
    setInputValue(name)
    setIsOpen(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setIsOpen(false)
      setInputValue(value)
    }
  }

  return (
    <div className="searchable-select" ref={containerRef}>
      <span>{label}</span>
      <div className="searchable-select-input-wrap">
        <input
          autoComplete="off"
          onChange={(event) => {
            setInputValue(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Cerca Pokémon..."
          type="text"
          value={inputValue}
        />
        {isOpen && (
          <ul className="searchable-select-dropdown" role="listbox">
            {filtered.length > 0 ? (
              filtered.map((name) => (
                <li
                  aria-selected={name === value}
                  className={name === value ? 'selected' : ''}
                  key={name}
                  onMouseDown={() => handleSelect(name)}
                  role="option"
                >
                  {name}
                </li>
              ))
            ) : (
              <li className="no-results" role="option" aria-selected={false}>
                Nessun risultato
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

function ComparePanel({
  isOpen,
  onOpenChange,
  leftName: compareLeft,
  rightName: compareRight,
  onLeftChange: onChangeLeft,
  onRightChange: onChangeRight,
  onToggleTeam,
  pokemon: supported,
  teamIsFull,
  teamNames,
}) {
  const options = [...supported]
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map((p) => p.displayName)

  const leftPokemon = supported.find((p) => p.displayName === compareLeft)
  const rightPokemon = supported.find((p) => p.displayName === compareRight)

  return (
    <details className="compare-panel" open={isOpen} onToggle={(event) => onOpenChange(event.currentTarget.open)}>
      <summary>Confronta</summary>
      <div className="compare-selects">
        <SearchableSelect
          label="Pokémon 1"
          onChange={onChangeLeft}
          options={options}
          value={compareLeft}
        />
        <SearchableSelect
          label="Pokémon 2"
          onChange={onChangeRight}
          options={options}
          value={compareRight}
        />
      </div>
      {leftPokemon && rightPokemon ? (
        <div className="compare-grid">
          <PokemonCard
            isSelected={teamNames.includes(leftPokemon.displayName)}
            onToggleTeam={() => onToggleTeam(leftPokemon)}
            pokemon={leftPokemon}
            teamIsFull={teamIsFull}
          />
          <PokemonCard
            isSelected={teamNames.includes(rightPokemon.displayName)}
            onToggleTeam={() => onToggleTeam(rightPokemon)}
            pokemon={rightPokemon}
            teamIsFull={teamIsFull}
          />
        </div>
      ) : (
        <p className="team-empty-message">
          Seleziona due Pokémon per confrontarli fianco a fianco.
        </p>
      )}
    </details>
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

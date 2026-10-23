import { useDeferredValue, useEffect, useRef, useState } from 'react'
import './App.css'
import './components/TeamWorkspace.css'
import { formatTypeMultiplier } from './lib/typeLabels'
import PokemonActionMenu from './components/PokemonActionMenu'
import { getPokemonCardActions } from './lib/pokemonCardActions'
import TeamDamageLink from './components/TeamDamageLink'
import SquadSection from './components/SquadSection'
import TeamTypeSummary from './components/TeamTypeSummary'
import { applyImportedTeam, updateWorkspaceBuild, useTeamWorkspace } from './lib/teamWorkspace'
import { resolveTeamMatchup } from './lib/teamDamageLink'
import { useWorkspaceNavigation } from './lib/workspaceNavigation'
import { REGULATION_MC_POKEMON } from './data/regulationMc'
import DamageCalculator from './components/DamageCalculator'
import { updatePokemonMoveSlot } from './lib/damage/championsMoveSets'
import { formatName, loadPokemonDataset } from './lib/pokeapi'

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
  const { workspace, setWorkspace, saveError } = useTeamWorkspace()
  const { moveSets, builds } = workspace
  const teamNames = workspace.teams.attacker
  const opponentNames = workspace.teams.defender
  const [activePanel, setActivePanel] = useState(null)
  const { view, fromTeam, navigate } = useWorkspaceNavigation()
  const [teamDamageDraft, setTeamDamageDraft] = useState({ attackerName: '', defenderName: '' })
  const [selectedDamageMove, setSelectedDamageMove] = useState({ side: 'attacker', slot: 0 })
  const [compareLeftName, setCompareLeftName] = useState('')
  const [compareRightName, setCompareRightName] = useState('')
  const [compareRequest, setCompareRequest] = useState(0)
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
    if (!compareRequest) return
    const panel = document.querySelector('.compare-panel')
    panel?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    panel?.querySelector('summary')?.focus({ preventScroll: true })
  }, [compareRequest])

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
  const opponentTeam = opponentNames.map((name) => pokemon.find((entry) => entry.displayName === name)).filter(Boolean)
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

  function setSquadNames(side, update) {
    setWorkspace((current) => ({ ...current, teams: { ...current.teams, [side]: typeof update === 'function' ? update(current.teams[side]) : update } }))
  }

  function addMember(side, name) {
    setSquadNames(side, (names) => names.length < TEAM_SIZE && !names.includes(name) ? [...names, name] : names)
  }

  function handleCardAction(entry, action) {
    if (entry.status !== 'ready') return
    if (action === 'attacker' || action === 'defender') {
      setSquadNames(action, (names) => names.includes(entry.displayName)
        ? names.filter((name) => name !== entry.displayName)
        : names.length < TEAM_SIZE ? [...names, entry.displayName] : names)
      return
    }
    if (action === 'compare-1') setCompareLeftName(entry.displayName)
    else if (action === 'compare-2') setCompareRightName(entry.displayName)
    else return
    setActivePanel('compare')
    setCompareRequest((value) => value + 1)
  }

  function handleTeamImport(side, imported) {
    setWorkspace((current) => applyImportedTeam(current, side, imported))
    setTeamDamageDraft((current) => ({ ...current, [side === 'attacker' ? 'attackerName' : 'defenderName']: imported.members[0].name }))
  }

  function changeBuild(side, entry, changes) {
    if (!entry) return
    setWorkspace((current) => ({ ...current, builds: updateWorkspaceBuild(current.builds, side, entry.displayName, changes) }))
  }

  function configureMember(side, name) {
    const draft = { ...teamDamageDraft, [side === 'attacker' ? 'attackerName' : 'defenderName']: name }
    setTeamDamageDraft(draft)
    const match = resolveTeamMatchup(team, opponentTeam, draft, moveSets)
    setDamageAttackerName(side === 'attacker' ? name : match.attacker?.displayName || supported.find((entry) => entry.displayName !== name)?.displayName || '')
    setDamageDefenderName(side === 'defender' ? name : match.defender?.displayName || supported.find((entry) => entry.displayName !== name)?.displayName || '')
    setSelectedDamageMove({ side, slot: 0 })
    navigate('damage', { fromTeam: true })
  }

  function handlePanelToggle(panelName, isOpen) {
    setActivePanel(isOpen ? panelName : null)
  }

  function changeMoveSlot(side, entry, slot, moveId) {
    setWorkspace((current) => ({ ...current, moveSets: updatePokemonMoveSlot(current.moveSets, side, entry, slot, moveId) }))
  }

  function openDamageFromTeam() {
    const matchup = resolveTeamMatchup(team, opponentTeam, teamDamageDraft, moveSets)
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
      defenderName: opponentNames.includes(damageDefenderName) ? damageDefenderName : draft.defenderName,
    }))
    navigate('team')
  }

  return (
    <main className="app-shell">
      <nav className="workspace-nav" aria-label="Navigazione principale">
        <a className="workspace-brand" href="#/catalogo" onClick={(event) => { event.preventDefault(); navigate('catalog') }}>Pokémon stats <span>M-C</span></a>
        <div className="workspace-nav-buttons">
          <button type="button" aria-current={view === 'catalog' ? 'page' : undefined} onClick={() => navigate('catalog')}>Catalogo</button>
          <button type="button" aria-current={view === 'team' ? 'page' : undefined} onClick={() => view === 'damage' && fromTeam ? returnToTeam() : navigate('team')}>Il mio team</button>
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

      {saveError && <p className="notice error" role="status">{saveError}</p>}
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
          teams={workspace.teams}
          onCardAction={handleCardAction}
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
                key={entry.displayName}
                actions={getPokemonCardActions(entry.displayName, workspace.teams, compareLeftName, compareRightName)}
                onAction={(action) => handleCardAction(entry, action)}
                pokemon={entry}
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
            <p>Importa o prepara le due squadre e confronta tipi, mosse e configurazioni.</p>
          </div>
        </header>
        <div className="team-workspace-layout">
          <div className="team-workspace-main">
            {['attacker', 'defender'].map((side) => <SquadSection
              key={side} side={side} title={side === 'attacker' ? 'La mia squadra' : 'La squadra avversaria'}
              team={side === 'attacker' ? team : opponentTeam} roster={supported} builds={builds} moveSets={moveSets}
              selected={resolveTeamMatchup(team, opponentTeam, teamDamageDraft, moveSets)[side === 'attacker' ? 'attacker' : 'defender']?.displayName}
              onSelect={(name) => setTeamDamageDraft((draft) => ({ ...draft, [side === 'attacker' ? 'attackerName' : 'defenderName']: name }))}
              onConfigure={(name) => configureMember(side, name)}
              onAdd={(name) => addMember(side, name)}
              onRemove={(name) => setSquadNames(side, (names) => names.filter((entry) => entry !== name))}
              onClear={() => setSquadNames(side, [])} onImport={(imported) => handleTeamImport(side, imported)}
              onCatalog={() => navigate('catalog')}
            />)}
            <TeamDamageLink team={team} pokemon={opponentTeam} draft={teamDamageDraft} onChange={setTeamDamageDraft} onCalculate={openDamageFromTeam} moveSets={moveSets} onMoveChange={changeMoveSlot} />
          </div>
          <TeamTypeSummary team={team} opponentTeam={opponentTeam} moveSets={moveSets} />
        </div>
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
          builds={builds}
          onBuildChange={changeBuild}
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

function Metric({ label, value, tone }) {
  return (
    <div className={`metric ${tone ?? ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function PokemonCard({ pokemon, actions, onAction }) {
  const total = pokemon.stats.reduce((sum, stat) => sum + stat.value, 0)

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

      <PokemonActionMenu name={pokemon.displayName} actions={actions} onAction={onAction} />

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
  onCardAction,
  pokemon: supported,
  teams,
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
      <div className="compare-slot-actions">
        <button type="button" className="secondary-button" disabled={!compareLeft} onClick={() => onChangeLeft('')}>Libera Confronta 1</button>
        <button type="button" className="secondary-button" disabled={!compareRight} onClick={() => onChangeRight('')}>Libera Confronta 2</button>
      </div>
      <div className="compare-grid">
        {[leftPokemon, rightPokemon].map((entry, index) => entry ? (
          <PokemonCard key={index} pokemon={entry}
            actions={getPokemonCardActions(entry.displayName, teams, compareLeft, compareRight)}
            onAction={(action) => onCardAction(entry, action)} />
        ) : <article className="compare-card empty" key={index}>Confronta {index + 1}: scegli un Pokémon dal pulsante +</article>)}
      </div>
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

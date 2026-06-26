import { useDeferredValue, useEffect, useState } from 'react'
import './App.css'
import { REGULATION_MB_POKEMON } from './data/regulationMb'
import { calculateChampionsDamage } from './lib/damage/championsDamage'
import { CHAMPIONS_MOVES, CHAMPIONS_NATURES } from './lib/damage/championsData'
import { calculateChampionsStats } from './lib/damage/championsMath'
import {
  findKoOptions,
  findSurvivalOptions,
} from './lib/damage/championsOptimizer'
import { CHAMPIONS_ABILITIES } from './lib/damage/championsAbilities'
import {
  CHAMPIONS_ITEMS,
  getAllDamageItemOptions,
  getChampionsDamageItemOptions,
} from './lib/damage/championsItems'
import {
  NO_SUPPORTED_MOVES_OPTION,
  getSupportedAbilityOptions,
  getSupportedMoveOptions,
} from './lib/damage/championsOptions'
import { TYPE_NAMES, formatName, loadPokemonDataset } from './lib/pokeapi'

const STAT_LABELS = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
}
const DAMAGE_STAT_LABELS = {
  atk: 'Atk',
  def: 'Def',
  hp: 'HP',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Spe',
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
const DAMAGE_MOVE_OPTIONS = Object.entries(CHAMPIONS_MOVES).map(([value, move]) => ({
  ...move,
  value,
}))
const CHAMPIONS_SET_ITEM_OPTIONS = getChampionsDamageItemOptions()
const ALL_DAMAGE_ITEM_OPTIONS = getAllDamageItemOptions()
const BOOST_OPTIONS = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]
const NATURE_OPTIONS = Object.keys(CHAMPIONS_NATURES)
const SP_OPTIONS = Array.from({ length: 33 }, (_, index) => index)
const WEATHER_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Sun', value: 'Sun' },
  { label: 'Rain', value: 'Rain' },
]

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
  const [highlightedTeamMember, setHighlightedTeamMember] = useState(null)
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
  const [damageMoveName, setDamageMoveName] = useState(DAMAGE_MOVE_OPTIONS[0].value)
  const [damageAttackerAbility, setDamageAttackerAbility] = useState('')
  const [damageDefenderAbility, setDamageDefenderAbility] = useState('')
  const [damageItemMode, setDamageItemMode] = useState('champions')
  const [damageAttackerItem, setDamageAttackerItem] = useState('')
  const [damageDefenderItem, setDamageDefenderItem] = useState('')
  const [damageWeather, setDamageWeather] = useState('')
  const [damageAttackerBoost, setDamageAttackerBoost] = useState(0)
  const [damageDefenderBoost, setDamageDefenderBoost] = useState(0)
  const [damageAttackerNature, setDamageAttackerNature] = useState('serious')
  const [damageDefenderNature, setDamageDefenderNature] = useState('serious')
  const [damageAttackerSp, setDamageAttackerSp] = useState(32)
  const [damageDefenderHpSp, setDamageDefenderHpSp] = useState(32)
  const [damageDefenderDefenseSp, setDamageDefenderDefenseSp] = useState(32)
  const [damageBurned, setDamageBurned] = useState(false)
  const [damageCritical, setDamageCritical] = useState(false)
  const [damageReflect, setDamageReflect] = useState(false)
  const [damageLightScreen, setDamageLightScreen] = useState(false)
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

  function clearTeamHighlight() {
    setHighlightedTeamMember(null)
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
        highlightedTeamMember={highlightedTeamMember}
        onClearHighlight={clearTeamHighlight}
        onClear={() => setTeamNames([])}
        onHighlight={setHighlightedTeamMember}
        onRemove={(name) =>
          setTeamNames((currentTeam) => currentTeam.filter((entry) => entry !== name))
        }
        team={team}
      />

      <DamageCalculator
        attackerBoost={damageAttackerBoost}
        attackerAbility={damageAttackerAbility}
        attackerItem={damageAttackerItem}
        attackerName={damageAttackerName}
        attackerNature={damageAttackerNature}
        attackerSp={damageAttackerSp}
        burned={damageBurned}
        critical={damageCritical}
        defenderBoost={damageDefenderBoost}
        defenderAbility={damageDefenderAbility}
        defenderDefenseSp={damageDefenderDefenseSp}
        defenderHpSp={damageDefenderHpSp}
        defenderItem={damageDefenderItem}
        defenderName={damageDefenderName}
        defenderNature={damageDefenderNature}
        itemMode={damageItemMode}
        lightScreen={damageLightScreen}
        moveName={damageMoveName}
        onAttackerBoostChange={setDamageAttackerBoost}
        onAttackerAbilityChange={setDamageAttackerAbility}
        onAttackerChange={setDamageAttackerName}
        onAttackerItemChange={setDamageAttackerItem}
        onAttackerNatureChange={setDamageAttackerNature}
        onAttackerSpChange={setDamageAttackerSp}
        onBurnedChange={setDamageBurned}
        onCriticalChange={setDamageCritical}
        onDefenderDefenseSpChange={setDamageDefenderDefenseSp}
        onDefenderAbilityChange={setDamageDefenderAbility}
        onDefenderBoostChange={setDamageDefenderBoost}
        onDefenderChange={setDamageDefenderName}
        onDefenderHpSpChange={setDamageDefenderHpSp}
        onDefenderItemChange={setDamageDefenderItem}
        onDefenderNatureChange={setDamageDefenderNature}
        onItemModeChange={setDamageItemMode}
        onLightScreenChange={setDamageLightScreen}
        onMoveChange={setDamageMoveName}
        onReflectChange={setDamageReflect}
        onWeatherChange={setDamageWeather}
        pokemon={supported}
        reflect={damageReflect}
        weather={damageWeather}
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

function DamageCalculator({
  attackerAbility,
  attackerBoost,
  attackerItem,
  attackerName,
  attackerNature,
  attackerSp,
  burned,
  critical,
  defenderAbility,
  defenderBoost,
  defenderDefenseSp,
  defenderHpSp,
  defenderItem,
  defenderName,
  defenderNature,
  itemMode,
  lightScreen,
  moveName,
  onAttackerAbilityChange,
  onAttackerBoostChange,
  onAttackerChange,
  onAttackerItemChange,
  onAttackerNatureChange,
  onAttackerSpChange,
  onBurnedChange,
  onCriticalChange,
  onDefenderAbilityChange,
  onDefenderBoostChange,
  onDefenderChange,
  onDefenderDefenseSpChange,
  onDefenderHpSpChange,
  onDefenderItemChange,
  onDefenderNatureChange,
  onItemModeChange,
  onLightScreenChange,
  onMoveChange,
  onReflectChange,
  onWeatherChange,
  pokemon,
  reflect,
  weather,
}) {
  const [optimizerResult, setOptimizerResult] = useState(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const attacker = pokemon.find((entry) => entry.displayName === attackerName) ?? pokemon[0]
  const defender =
    pokemon.find((entry) => entry.displayName === defenderName) ??
    pokemon.find((entry) => entry.displayName !== attacker?.displayName) ??
    pokemon[1]
  const moveOptions = getSupportedMoveOptions(attacker)
  const selectedMoveName = moveOptions.some((option) => option.value === moveName)
    ? moveName
    : moveOptions[0]?.value ?? ''
  const move = moveOptions.find((option) => option.value === selectedMoveName)?.move
  const attackerAbilityOptions = getSupportedAbilityOptions(attacker)
  const defenderAbilityOptions = getSupportedAbilityOptions(defender)
  const itemOptions =
    itemMode === 'all' ? ALL_DAMAGE_ITEM_OPTIONS : CHAMPIONS_SET_ITEM_OPTIONS
  const selectedAttackerItem = itemOptions.some((option) => option.value === attackerItem)
    ? attackerItem
    : ''
  const selectedDefenderItem = itemOptions.some((option) => option.value === defenderItem)
    ? defenderItem
    : ''
  const selectedAttackerAbility = attackerAbilityOptions.some(
    (option) => option.value === attackerAbility,
  )
    ? attackerAbility
    : ''
  const selectedDefenderAbility = defenderAbilityOptions.some(
    (option) => option.value === defenderAbility,
  )
    ? defenderAbility
    : ''
  const attackerStats =
    attacker && move
      ? getChampionsDamageStats(attacker, {
          defenseSp: 0,
          hpSp: 0,
          nature: attackerNature,
          offenseSp: attackerSp,
          role: 'attacker',
          moveCategory: move.category,
        })
      : null
  const defenderStats =
    defender && move
      ? getChampionsDamageStats(defender, {
          defenseSp: defenderDefenseSp,
          hpSp: defenderHpSp,
          nature: defenderNature,
          offenseSp: 0,
          role: 'defender',
          moveCategory: move.category,
        })
      : null
  const result =
    attacker && defender && move
      ? calculateChampionsDamage({
          attacker: toDamagePokemon(attacker, {
            ability: selectedAttackerAbility,
            boost: attackerBoost,
            category: move.category,
            item: selectedAttackerItem,
            nature: attackerNature,
            stats: attackerStats,
            status: burned ? 'brn' : '',
          }),
          defender: toDamagePokemon(defender, {
            ability: selectedDefenderAbility,
            boost: defenderBoost,
            category: move.category,
            item: selectedDefenderItem,
            nature: defenderNature,
            stats: defenderStats,
          }),
          field: {
            defenderSide: {
              isLightScreen: lightScreen,
              isReflect: reflect,
            },
            isCritical: critical,
            weather,
          },
          move,
        })
      : null
  const defenderHp = defenderStats?.hp ?? 0
  const minPercent = result && defenderHp ? formatPercent(result.min, defenderHp) : '0'
  const maxPercent = result && defenderHp ? formatPercent(result.max, defenderHp) : '0'
  const optimizerContext =
    attacker && defender && move && defenderStats
      ? {
          attacker: {
            ability: selectedAttackerAbility,
            baseStats: getBaseStatMap(attacker),
            boost: attackerBoost,
            item: selectedAttackerItem,
            nature: attackerNature,
            offenseSp: attackerSp,
            types: attacker.types,
          },
          defender: {
            ability: selectedDefenderAbility,
            baseStats: getBaseStatMap(defender),
            boost: defenderBoost,
            defenseSp: defenderDefenseSp,
            hp: defenderStats.hp,
            hpSp: defenderHpSp,
            item: selectedDefenderItem,
            nature: defenderNature,
            types: defender.types,
          },
          move,
        }
      : null

  useEffect(() => {
    if (selectedMoveName !== moveName) {
      onMoveChange(selectedMoveName)
    }
  }, [moveName, onMoveChange, selectedMoveName])

  useEffect(() => {
    if (selectedAttackerAbility !== attackerAbility) {
      onAttackerAbilityChange(selectedAttackerAbility)
    }
  }, [
    attackerAbility,
    onAttackerAbilityChange,
    selectedAttackerAbility,
  ])

  useEffect(() => {
    if (selectedDefenderAbility !== defenderAbility) {
      onDefenderAbilityChange(selectedDefenderAbility)
    }
  }, [
    defenderAbility,
    onDefenderAbilityChange,
    selectedDefenderAbility,
  ])

  useEffect(() => {
    if (selectedAttackerItem !== attackerItem) {
      onAttackerItemChange(selectedAttackerItem)
    }
  }, [attackerItem, onAttackerItemChange, selectedAttackerItem])

  useEffect(() => {
    if (selectedDefenderItem !== defenderItem) {
      onDefenderItemChange(selectedDefenderItem)
    }
  }, [defenderItem, onDefenderItemChange, selectedDefenderItem])

  function optimizeSurvival() {
    if (!optimizerContext) return
    setIsOptimizing(true)
    setOptimizerResult({
      mode: 'survival',
      displayed: [],
      total: 0,
    })
    window.setTimeout(() => {
      setOptimizerResult({
        mode: 'survival',
        ...findSurvivalOptions(optimizerContext),
      })
      setIsOptimizing(false)
    }, 0)
  }

  function optimizeKo() {
    if (!optimizerContext) return
    setIsOptimizing(true)
    setOptimizerResult({
      mode: 'ko',
      displayed: [],
      total: 0,
    })
    window.setTimeout(() => {
      setOptimizerResult({
        mode: 'ko',
        ...findKoOptions(optimizerContext),
      })
      setIsOptimizing(false)
    }, 0)
  }

  return (
    <section className="damage-calculator" aria-label="Damage calculator">
      <div className="damage-header">
        <div>
          <p className="eyebrow compact">Damage preview</p>
          <h2>Champions core damage</h2>
        </div>
        {result && (
          <div className="damage-result">
            <span>Damage</span>
            <strong>
              {result.min}-{result.max} HP
            </strong>
            <small>
              {minPercent}% - {maxPercent}% of HP
            </small>
          </div>
        )}
      </div>

      <div className="damage-controls">
        <label className="select-field">
          <span>Attacker</span>
          <select
            value={attacker?.displayName ?? ''}
            onChange={(event) => onAttackerChange(event.target.value)}
          >
            {pokemon.map((entry) => (
              <option key={entry.displayName} value={entry.displayName}>
                {entry.displayName}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Defender</span>
          <select
            value={defender?.displayName ?? ''}
            onChange={(event) => onDefenderChange(event.target.value)}
          >
            {pokemon.map((entry) => (
              <option key={entry.displayName} value={entry.displayName}>
                {entry.displayName}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Move</span>
          <select
            disabled={moveOptions.length === 0}
            value={selectedMoveName}
            onChange={(event) => onMoveChange(event.target.value)}
          >
            {moveOptions.length > 0 ? (
              moveOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            ) : (
              <option
                disabled={NO_SUPPORTED_MOVES_OPTION.disabled}
                key={NO_SUPPORTED_MOVES_OPTION.name}
                value={NO_SUPPORTED_MOVES_OPTION.value}
              >
                {NO_SUPPORTED_MOVES_OPTION.name}
              </option>
            )}
          </select>
          <small>
            {moveOptions.length} supported moves for {attacker?.displayName ?? 'selected Pokemon'}
          </small>
        </label>

        <label className="select-field">
          <span>Weather</span>
          <select value={weather} onChange={(event) => onWeatherChange(event.target.value)}>
            {WEATHER_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Atk ability</span>
          <select
            value={selectedAttackerAbility}
            onChange={(event) => onAttackerAbilityChange(event.target.value)}
          >
            {attackerAbilityOptions.map((option) => (
              <option
                disabled={option.disabled}
                key={`attacker-${option.value}`}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Def ability</span>
          <select
            value={selectedDefenderAbility}
            onChange={(event) => onDefenderAbilityChange(event.target.value)}
          >
            {defenderAbilityOptions.map((option) => (
              <option
                disabled={option.disabled}
                key={`defender-${option.value}`}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="segmented-field">
          <legend>Item pool</legend>
          <label>
            <input
              checked={itemMode === 'champions'}
              name="damage-item-mode"
              onChange={() => onItemModeChange('champions')}
              type="radio"
            />
            <span>Champions set items</span>
          </label>
          <label>
            <input
              checked={itemMode === 'all'}
              name="damage-item-mode"
              onChange={() => onItemModeChange('all')}
              type="radio"
            />
            <span>All damage items</span>
          </label>
        </fieldset>

        <label className="select-field">
          <span>Attacker damage item</span>
          <select
            value={selectedAttackerItem}
            onChange={(event) => onAttackerItemChange(event.target.value)}
          >
            {itemOptions.map((option) => (
              <option key={`attacker-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Defender damage item</span>
          <select
            value={selectedDefenderItem}
            onChange={(event) => onDefenderItemChange(event.target.value)}
          >
            {itemOptions.map((option) => (
              <option key={`defender-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Atk nature</span>
          <select
            value={attackerNature}
            onChange={(event) => onAttackerNatureChange(event.target.value)}
          >
            {NATURE_OPTIONS.map((nature) => (
              <option key={nature} value={nature}>
                {formatNatureOption(nature)}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Def nature</span>
          <select
            value={defenderNature}
            onChange={(event) => onDefenderNatureChange(event.target.value)}
          >
            {NATURE_OPTIONS.map((nature) => (
              <option key={nature} value={nature}>
                {formatNatureOption(nature)}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Atk/SpA boost</span>
          <select
            value={attackerBoost}
            onChange={(event) => onAttackerBoostChange(Number(event.target.value))}
          >
            {BOOST_OPTIONS.map((boost) => (
              <option key={boost} value={boost}>
                {boost > 0 ? `+${boost}` : boost}
              </option>
            ))}
          </select>
          <small>
            {move?.category === 'physical' ? 'Physical move uses Atk' : 'Special move uses SpA'}
          </small>
        </label>

        <label className="select-field">
          <span>Def/SpD boost</span>
          <select
            value={defenderBoost}
            onChange={(event) => onDefenderBoostChange(Number(event.target.value))}
          >
            {BOOST_OPTIONS.map((boost) => (
              <option key={boost} value={boost}>
                {boost > 0 ? `+${boost}` : boost}
              </option>
            ))}
          </select>
          <small>
            {move?.category === 'physical' ? 'Physical move uses Def' : 'Special move uses SpD'}
          </small>
        </label>

        <label className="select-field">
          <span>Atk/SpA SP</span>
          <select
            value={attackerSp}
            onChange={(event) => onAttackerSpChange(Number(event.target.value))}
          >
            {SP_OPTIONS.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>
          <small>{move?.category === 'physical' ? 'Attacker Atk SP' : 'Attacker SpA SP'}</small>
        </label>

        <label className="select-field">
          <span>Defender HP SP</span>
          <select
            value={defenderHpSp}
            onChange={(event) => onDefenderHpSpChange(Number(event.target.value))}
          >
            {SP_OPTIONS.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Defender Def/SpD SP</span>
          <select
            value={defenderDefenseSp}
            onChange={(event) => onDefenderDefenseSpChange(Number(event.target.value))}
          >
            {SP_OPTIONS.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>
          <small>{move?.category === 'physical' ? 'Defender Def SP' : 'Defender SpD SP'}</small>
        </label>
      </div>

      <div className="damage-toggles">
        <label>
          <input
            checked={burned}
            onChange={(event) => onBurnedChange(event.target.checked)}
            type="checkbox"
          />
          Burn
        </label>
        <label>
          <input
            checked={critical}
            onChange={(event) => onCriticalChange(event.target.checked)}
            type="checkbox"
          />
          Crit
        </label>
        <label>
          <input
            checked={reflect}
            onChange={(event) => onReflectChange(event.target.checked)}
            type="checkbox"
          />
          Reflect
        </label>
        <label>
          <input
            checked={lightScreen}
            onChange={(event) => onLightScreenChange(event.target.checked)}
            type="checkbox"
          />
          Light Screen
        </label>
      </div>

      <div className="optimizer-actions">
        <button disabled={!optimizerContext} onClick={optimizeSurvival} type="button">
          Find Survival
        </button>
        <button disabled={!optimizerContext} onClick={optimizeKo} type="button">
          Find KO
        </button>
      </div>

      {result && (
        <div className="damage-rolls">
          <span>Effectiveness x{result.effectiveness}</span>
        </div>
      )}

      {optimizerResult && (
        <OptimizerResults
          isOptimizing={isOptimizing}
          moveCategory={move?.category}
          result={optimizerResult}
        />
      )}
    </section>
  )
}

function OptimizerResults({ isOptimizing, moveCategory, result }) {
  const title = result.mode === 'survival' ? 'Survival options' : 'KO options'
  const emptyText =
    result.mode === 'survival'
      ? 'No guaranteed survival found with current search rules.'
      : 'No guaranteed KO found with current search rules.'

  return (
    <div className="optimizer-results">
      <div className="optimizer-results-header">
        <strong>{title}</strong>
        <span>Showing {result.displayed.length} best options</span>
      </div>

      {isOptimizing ? (
        <div className="optimizer-loading">
          <div className="pokeball-spinner" aria-hidden="true"></div>
          <span>Calculating options</span>
        </div>
      ) : result.displayed.length > 0 ? (
        <ol>
          {result.displayed.map((option, index) => (
            <li key={`${result.mode}-${index}-${option.score}`}>
              {formatOptimizerOption(option, moveCategory)}
            </li>
          ))}
        </ol>
      ) : (
        <p>{emptyText}</p>
      )}
    </div>
  )
}

function formatOptimizerOption(option, moveCategory) {
  const percentMin = formatPercent(option.damage.min, option.defender.hp)
  const percentMax = formatPercent(option.damage.max, option.defender.hp)
  const damage = `Damage ${option.damage.min}-${option.damage.max} HP (${percentMin}% - ${percentMax}%)`

  if (option.kind === 'survival') {
    return [
      formatNatureOption(option.defender.nature),
      formatSelectedEffect(option.defender.ability),
      formatSelectedEffect(option.defender.item),
      `HP SP ${option.defender.hpSp}`,
      `${moveCategory === 'physical' ? 'Def' : 'SpD'} SP ${option.defender.defenseSp}`,
      option.defender.boost
        ? `+${option.defender.boost} ${moveCategory === 'physical' ? 'Def' : 'SpD'} boost`
        : '',
      option.field.screen,
      option.field.weather,
      option.attacker.burned ? 'Burn attacker' : '',
      damage,
    ].filter(Boolean).join(' · ')
  }

  return [
    formatNatureOption(option.attacker.nature),
    formatSelectedEffect(option.attacker.ability),
    formatSelectedEffect(option.attacker.item),
    `${moveCategory === 'physical' ? 'Atk' : 'SpA'} SP ${option.attacker.offenseSp}`,
    option.attacker.boost
      ? `+${option.attacker.boost} ${moveCategory === 'physical' ? 'Atk' : 'SpA'} boost`
      : '',
    option.field.critical ? 'Crit' : '',
    option.field.weather,
    damage,
  ].filter(Boolean).join(' · ')
}

function toDamagePokemon(entry, { ability, boost, category, item, stats, status = '' }) {
  const boosts = { atk: 0, def: 0, hp: 0, spa: 0, spd: 0, spe: 0 }
  if (category === 'physical') {
    boosts.atk = boost
    boosts.def = boost
  } else {
    boosts.spa = boost
    boosts.spd = boost
  }

  return {
    ability,
    item,
    level: 50,
    stats,
    status,
    boosts,
    types: entry.types,
  }
}

function getChampionsDamageStats(entry, { defenseSp, hpSp, moveCategory, nature, offenseSp, role }) {
  const baseStats = getBaseStatMap(entry)
  const sps = { atk: 0, def: 0, hp: 0, spa: 0, spd: 0, spe: 0 }

  if (role === 'attacker') {
    sps[moveCategory === 'physical' ? 'atk' : 'spa'] = offenseSp
  } else {
    sps.hp = hpSp
    sps[moveCategory === 'physical' ? 'def' : 'spd'] = defenseSp
  }

  return calculateChampionsStats({
    baseStats,
    nature,
    sps,
  })
}

function getBaseStatMap(entry) {
  return Object.fromEntries(
    entry.stats.map((stat) => [toDamageStatId(stat.name), stat.value]),
  )
}

function toDamageStatId(statName) {
  const aliases = {
    attack: 'atk',
    defense: 'def',
    hp: 'hp',
    'special-attack': 'spa',
    'special-defense': 'spd',
    speed: 'spe',
  }

  return aliases[statName]
}

function formatPercent(damage, hp) {
  return ((damage / hp) * 100).toFixed(1)
}

function formatNatureOption(nature) {
  const [plus, minus] = CHAMPIONS_NATURES[nature] ?? []
  const name = nature.charAt(0).toUpperCase() + nature.slice(1)

  if (!plus || plus === minus) {
    return `${name} (neutral)`
  }

  return `${name} (+${DAMAGE_STAT_LABELS[plus]} / -${DAMAGE_STAT_LABELS[minus]})`
}

function formatSelectedEffect(value) {
  if (!value) return ''

  const ability = CHAMPIONS_ABILITIES[value]
  const item = CHAMPIONS_ITEMS[value]

  return ability?.name ?? item?.name ?? ''
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
  onRemove,
  team,
}) {
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
    </details>
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

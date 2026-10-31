import { useEffect, useMemo, useState } from 'react'
import { BATTLE_DATA_GROUPS, BATTLE_DATA_ORIGIN, createBattleDataClient } from '../lib/competitive/battleData.js'
import { createCompetitiveMoveTypes, formatUsage } from '../lib/competitive/presentation.js'
import { POKEMON_DATASET } from '../lib/pokemonDataset.js'
import { REGULATION, REGULATION_MOVES } from '../lib/regulation.js'
import PokemonDetails from './PokemonDetails'
import PokemonImage from './PokemonImage'
import CompetitiveTooltip from './CompetitiveTooltip'

const client = createBattleDataClient()
const pokemonById = new Map(POKEMON_DATASET.map((pokemon) => [pokemon.showdownId, pokemon]))
const moveTypeFor = createCompetitiveMoveTypes(REGULATION_MOVES)
const statLabels = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe']
const tooltipKinds = { move: 'moves', held_item: 'items', ability: 'abilities', stat_alignment: 'natures' }
const dateFormat = new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })
const dayFormat = new Intl.DateTimeFormat('it-IT', { dateStyle: 'long', timeZone: 'UTC' })
const seasonLabel = (season) => season === 'Current' ? 'Attuale' : season
function errorMessage(error) {
  if (error.name === 'TimeoutError') return 'Il servizio impiega troppo tempo a rispondere. Riprova più tardi.'
  if (error instanceof TypeError || error instanceof SyntaxError) return 'Impossibile leggere i dati del servizio. Controlla la connessione e riprova più tardi.'
  return error.message
}

export default function NativeRankings({ active }) {
  const [season, setSeason] = useState('Current')
  const [seasons, setSeasons] = useState(['Current'])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [rankState, setRankState] = useState(null)
  const [detailState, setDetailState] = useState(null)
  const [rankRetry, setRankRetry] = useState(0)
  const [detailRetry, setDetailRetry] = useState(0)
  const rankings = rankState?.season === season && rankState.status === 'ready' ? rankState.result.data : null
  const selected = rankings?.rankings.find((row) => row.showdownId === selectedId)
  const detailKey = selected ? `${season}:${rankings.dataVersion}:${selected.showdownId}` : ''

  useEffect(() => {
    if (!active) { setRankState(null); return }
    const controller = new AbortController()
    setRankState({ season, status: 'loading' })
    client.rankings(season, { signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return
      setSeasons(result.data.seasons)
      setRankState({ season, status: 'ready', result })
      setSelectedId((id) => result.data.rankings.some((row) => row.showdownId === id) ? id : result.data.rankings[0]?.showdownId ?? '')
    }).catch((error) => {
      if (!controller.signal.aborted) setRankState({ season, status: 'error', error: errorMessage(error) })
    })
    return () => controller.abort()
  }, [active, season, rankRetry])

  useEffect(() => {
    if (!active || !detailKey) return
    const controller = new AbortController()
    setDetailState({ key: detailKey, status: 'loading' })
    client.battle(selectedId, season, { signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) setDetailState({ key: detailKey, status: 'ready', result })
    }).catch((error) => {
      if (!controller.signal.aborted) setDetailState({ key: detailKey, status: 'error', error: errorMessage(error) })
    })
    return () => controller.abort()
  }, [active, detailKey, selectedId, season, detailRetry])

  const rows = useMemo(() => (rankings?.rankings ?? []).filter((row) => `${row.name} ${row.battleName} ${pokemonById.get(row.showdownId)?.displayName ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())), [rankings, query])
  function selectPokemon(id) {
    setSelectedId(id)
    if (window.matchMedia('(max-width: 900px)').matches) requestAnimationFrame(() => document.querySelector('.native-detail')?.scrollIntoView({ block: 'start' }))
  }
  const details = detailState?.key === detailKey ? detailState : null

  return <section className="competitive-workspace native-rankings" aria-label="Ranked nativa Champions">
    <div className="competitive-filters">
      <label><span>Stagione ranked</span><select value={season} onChange={(event) => setSeason(event.target.value)}>{seasons.map((value) => <option key={value} value={value}>{seasonLabel(value)}</option>)}</select></label>
      <label><span>Cerca nella classifica</span><input type="search" placeholder="Nome del Pokémon nella fonte" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    </div>
    {rankState?.season === season && rankState.status === 'error' ? <NativeError message={rankState.error} onRetry={() => setRankRetry((value) => value + 1)} />
      : !rankings ? <p role="status">Caricamento della classifica ranked…</p>
        : <>
          <div className="competitive-data-bar">
            <p>Ranked nativa · Doubles · Dataset generato il {dayFormat.format(new Date(rankings.generatedAt))}</p>
            <details className="competitive-data-info"><summary>Informazioni sui dati</summary><div>
              <p>Fonte comunitaria indipendente: Pokémon Champions Battle Data. Le stagioni non sono associate automaticamente alla regulation {REGULATION.label}. La classifica non include percentuali d’uso delle specie.</p>
              <p>Dataset generato il {dateFormat.format(new Date(rankings.generatedAt))} UTC; consultato il {dateFormat.format(new Date(rankState.result.retrievedAt))} UTC.</p>
              <p>Le quote dei dettagli sono percentuali originali del servizio per il singolo Pokémon. Nature, strumenti e mosse sono distribuzioni separate; nessuna natura viene assegnata automaticamente a uno spread SP. Le quote assenti restano «Non disponibile».</p>
              <p>La scheda locale usa il catalogo {REGULATION.label} e non certifica il regolamento della stagione. La frequenza delle megapietre non assegna statistiche o posizioni separate alle Mega Evoluzioni.</p>
              <p>Dati recuperati su consultazione, con cache temporanea in memoria fino a due minuti.</p>
            </div></details>
          </div>
          <div className="competitive-layout native-layout">
            <section className="competitive-ranking" aria-labelledby="native-ranking-title">
              <div className="competitive-section-heading"><h3 id="native-ranking-title">Classifica ranked</h3><span role="status">{rows.length} / {rankings.total}</span></div>
              <div className="competitive-ranking-labels" aria-hidden="true"><span>Posizione · Pokémon</span></div>
              <div className="competitive-ranking-list">
                {rows.map((row) => {
                  const pokemon = pokemonById.get(row.showdownId)
                  return <button type="button" className="competitive-ranking-row native-ranking-row" key={row.showdownId} data-native-id={row.showdownId} aria-pressed={selectedId === row.showdownId} aria-controls="native-pokemon-detail" onClick={() => selectPokemon(row.showdownId)}>
                    <span className="competitive-rank">{row.position}</span><PokemonImage pokemon={pokemon ?? {}} size={44} />
                    <span className="competitive-ranking-name"><strong>{pokemon?.displayName ?? row.name}</strong><small>{pokemon ? 'Apri le scelte diffuse' : `Forma non riconciliata con il catalogo ${REGULATION.label}`}</small></span>
                  </button>
                })}
                {!rows.length && <p className="competitive-no-results">Nessun risultato. La ricerca non modifica le posizioni della fonte.</p>}
              </div>
              <p className="competitive-ranking-note">Posizioni della fonte; usage % non disponibile.</p>
            </section>
            <article id="native-pokemon-detail" className="competitive-detail native-detail" aria-label={selected ? `Dettagli ranked di ${selected.name}` : 'Dettagli ranked'}>
              {!selected ? <p>La fonte non contiene Pokémon per questa stagione.</p> : <>
                <div className="competitive-detail-heading"><span>#{selected.position} · classifica ranked</span><span>Stagione {seasonLabel(season)} · Doubles</span></div>
                {pokemonById.has(selected.showdownId) ? <div className="competitive-profile"><PokemonDetails pokemon={pokemonById.get(selected.showdownId)} /></div>
                  : <><h2>{selected.name}</h2><p className="competitive-detail-note">Questa identità della fonte non ha una corrispondenza esatta nel catalogo {REGULATION.label}. Statistiche, tipi e immagine non vengono sostituiti con quelli di una forma simile.</p></>}
                <p className="competitive-detail-note">Scheda del catalogo {REGULATION.label}; compatibilità con la stagione non certificata.</p>
                {details?.status === 'error' ? <NativeError message={details.error} onRetry={() => setDetailRetry((value) => value + 1)} />
                  : details?.status !== 'ready' ? <p role="status">Caricamento delle scelte diffuse…</p>
                    : <NativeDetails key={detailKey} data={details.result.data} retrievedAt={details.result.retrievedAt} />}
              </>}
            </article>
          </div>
        </>}
    <section className="competitive-attributions" aria-labelledby="native-sources-title">
      <h2 id="native-sources-title">Fonti dati e attribuzioni</h2>
      <p>Battle data provided by <a href={BATTLE_DATA_ORIGIN} target="_blank" rel="noopener noreferrer">Pokémon Champions Battle Data</a>.</p>
      <details className="competitive-data-info"><summary>Condizioni e attribuzioni</summary>
      <p>Dati consultati all’apertura della vista, al cambio di stagione o alla selezione di un Pokémon. Cache temporanea in memoria fino a due minuti, nel rispetto delle indicazioni del servizio; nessun archivio permanente delle risposte.</p>
      <p>Uso pubblico e commerciale con attribuzione e cache ragionevole secondo le <a href={`${BATTLE_DATA_ORIGIN}/api-rules/`} target="_blank" rel="noopener noreferrer">regole API</a>, verificate il 31 ottobre 2026. Il servizio non garantisce completezza o disponibilità continua. Se non risponde, i dati non vengono sostituiti con statistiche Showdown.</p>
      <p>PokemonStats è indipendente e non affiliato, sponsorizzato o approvato da Nintendo, Creatures, GAME FREAK o The Pokémon Company. Nomi e marchi Pokémon appartengono ai rispettivi titolari; l’uso dei dati non concede diritti sugli artwork.</p>
      </details>
    </section>
  </section>
}

function NativeError({ message, onRetry }) {
  return <div className="competitive-empty native-error" role="alert"><p>{message}</p><button type="button" className="secondary-button" onClick={onRetry}>Riprova</button></div>
}

function NativeDetails({ data, retrievedAt }) {
  return <>
    <details className="competitive-data-info native-detail-info"><summary>{data.date ? `Dati del ${dayFormat.format(new Date(data.date))}` : 'Informazioni sui dettagli'}</summary>
      <p className="native-data-date">{data.date ? `Dati del ${dayFormat.format(new Date(data.date))}.` : 'La fonte non indica una data per i dettagli attuali.'} Consultati il {dateFormat.format(new Date(retrievedAt))} UTC.</p>
      <p>Percentuali originali del servizio, senza rinormalizzazione. Le scelte elencate non costituiscono un set completo.</p>
    </details>
    <div className="competitive-distributions">
      {Object.entries(BATTLE_DATA_GROUPS).map(([category, title]) => <NativeDistribution key={category} category={category} title={title} rows={data.groups[category]} />)}
    </div>
    <a className="competitive-original" href={`${BATTLE_DATA_ORIGIN}/api/battle/Doubles/${data.showdownId}?season=${data.season}`} target="_blank" rel="noopener noreferrer">Consulta i dati originali del Pokémon ↗</a>
  </>
}

function NativeDistribution({ category, title, rows }) {
  const [expanded, setExpanded] = useState(false)
  return <section className={`competitive-distribution native-distribution-${category}`}>
    <h3>{title}</h3>
    {category === 'stat_points' && <p className="competitive-distribution-note">SP senza natura associata.</p>}
    {!rows.length ? <p>La fonte non pubblica voci per questa categoria.</p> : <ol>{rows.slice(0, expanded ? rows.length : 5).map((row) => {
      const moveType = category === 'move' ? moveTypeFor(row.name) : null
      return <li key={row.rank}>
        <div className="competitive-distribution-value"><span className={category === 'move' ? 'competitive-move-label' : undefined}>
          {row.points ? `Spread ${row.rank}` : <CompetitiveTooltip kind={tooltipKinds[category]} value={row.name}><span>{row.name}</span>{moveType && <span className={`type-badge type-${moveType}`}>{moveType}</span>}</CompetitiveTooltip>}
        </span><strong>{formatUsage(row.percentage)}</strong></div>
        {row.points ? <dl className="competitive-spread">{row.points.map((value, index) => <div key={statLabels[index]}><dt>{statLabels[index]}</dt><dd>{value}</dd></div>)}</dl>
          : row.percentage !== null && <div className="competitive-share-track" aria-hidden="true"><span style={{ width: `${row.percentage}%` }} /></div>}
      </li>
    })}</ol>}
    {rows.length > 5 && <button className="competitive-expand" type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? 'Mostra meno' : `Mostra ${rows.length} voci`}</button>}
  </section>
}

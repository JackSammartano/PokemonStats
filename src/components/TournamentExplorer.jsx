import { useEffect, useMemo, useState } from 'react'
import { createLimitlessClient, getLimitlessFormat, LIMITLESS_ORIGIN, TOURNAMENT_PAGE_SIZE, tournamentUrl } from '../lib/competitive/limitless.js'
import { createCompetitiveMoveTypes } from '../lib/competitive/presentation.js'
import { POKEMON_DATASET } from '../lib/pokemonDataset.js'
import { REGULATION, REGULATION_MOVES } from '../lib/regulation.js'
import PokemonImage from './PokemonImage'
import CompetitiveTooltip from './CompetitiveTooltip'
import './TournamentExplorer.css'

const client = createLimitlessClient()
const pokemonById = new Map(POKEMON_DATASET.map((pokemon) => [pokemon.showdownId, pokemon]))
const moveTypeFor = createCompetitiveMoveTypes(REGULATION_MOVES)
const dates = new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })
const dateLabel = (date) => `${dates.format(new Date(date))} UTC`
const message = (error) => error.name === 'TimeoutError' ? 'Limitless impiega troppo tempo a rispondere. Riprova più tardi.' : error instanceof TypeError || error instanceof SyntaxError ? 'Impossibile leggere Limitless. Controlla la connessione e riprova.' : error.message

function useProviderResult(active, key, load, retry) {
  const [state, setState] = useState(null)
  useEffect(() => {
    if (!active || !key) { setState(null); return }
    const controller = new AbortController()
    setState({ key, status: 'loading' })
    load(controller.signal).then((result) => {
      if (!controller.signal.aborted) setState({ key, status: 'ready', result })
    }).catch((error) => {
      if (!controller.signal.aborted) setState({ key, status: 'error', error: message(error) })
    })
    return () => controller.abort()
  }, [active, key, load, retry])
  return state?.key === key ? state : null
}
// Stable loaders keep rendering and filtering independent from provider requests.
const loadGames = (signal) => client.games({ signal })

export default function TournamentExplorer({ active }) {
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [playerQuery, setPlayerQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [retry, setRetry] = useState(0)
  const registryState = useProviderResult(active, 'games', loadGames, retry)
  const registry = registryState?.result?.data
  const format = registry ? getLimitlessFormat(registry, REGULATION) : null
  const listKey = format ? `${format}:${page}` : ''
  const listLoader = useMemo(() => (signal) => client.tournaments(format, page, { signal }), [format, page])
  const listState = useProviderResult(active, listKey, listLoader, retry)
  const rows = listState?.result?.data ?? []
  const selected = rows.find((row) => row.id === selectedId)
  const eventKey = selected ? `${format}:${selected.id}` : ''
  const eventLoader = useMemo(() => (signal) => client.event(selectedId, format, { signal }), [selectedId, format])
  const eventState = useProviderResult(active, eventKey, eventLoader, retry)
  const event = eventState?.result
  const search = query.trim().toLowerCase(), playerSearch = playerQuery.trim().toLowerCase()
  const standings = event?.standings.filter((row) => `${row.name} ${row.player} ${row.team?.map((member) => `${member.sourceName ?? ''} ${member.sourceId ?? ''} ${pokemonById.get(member.showdownId)?.displayName ?? ''}`).join(' ') ?? ''}`.toLowerCase().includes(playerSearch)) ?? []
  function changePage(next) { setPage(next); setSelectedId(''); setPlayerQuery(''); setQuery('') }
  const refresh = () => setRetry((value) => value + 1)

  return <section className="competitive-workspace tournament-workspace" aria-label="Tornei Limitless">
    <div className="competitive-data-bar"><p>Pokémon Champions · {REGULATION.label} · Tornei su Limitless</p><details className="competitive-data-info"><summary>Informazioni sui dati</summary><div><p>Eventi ospitati su Limitless: la piattaforma non certifica che siano tornei ufficiali. La classifica è quella pubblicata dalla fonte e può essere parziale. Record e piazzamenti vengono conservati senza ricostruire risultati mancanti.</p><p>Team sheet pubblicati, senza aggiungere mosse, strumenti, nature o spread assenti. Le Megaevoluzioni non vengono dedotte dalle megapietre. Immagini e descrizioni locali si riferiscono alla regulation attiva.</p></div></details></div>
    {registryState?.status === 'error' ? <ProviderError error={registryState.error} retry={refresh} /> : !registry ? <p role="status">Caricamento dei formati Limitless…</p> : !format ? <div className="competitive-empty"><p>Limitless non elenca un formato corrispondente a {REGULATION.label}.</p></div> : <div className="tournament-layout">
      <section className="competitive-ranking tournament-list" aria-label="Elenco tornei">
        <div className="competitive-section-heading"><h3>Tornei</h3><span>{format}</span></div>
        <label className="tournament-search"><span>Cerca in questa pagina</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome del torneo" /></label>
        <div className="tournament-scroll">
          {listState?.status === 'error' ? <ProviderError error={listState.error} retry={refresh} /> : listState?.status !== 'ready' ? <p role="status">Caricamento tornei…</p> : rows.length === 0 ? <p>Nessun torneo in questa pagina.</p> : <>
            {rows.filter((row) => row.name.toLowerCase().includes(search)).map((row) => <button type="button" className="tournament-row" key={row.id} aria-pressed={row.id === selectedId} onClick={() => { setSelectedId(row.id); setPlayerQuery('') }}><strong>{row.name}</strong><span>{dateLabel(row.date)}</span><small>{row.players} partecipanti</small></button>)}
            {rows.length > 0 && !rows.some((row) => row.name.toLowerCase().includes(search)) && <p>Nessun risultato in questa pagina.</p>}
          </>}
        </div>
        <nav className="tournament-pagination" aria-label="Pagine dei tornei"><button type="button" className="secondary-button" disabled={page === 1} onClick={() => changePage(page - 1)}>Precedente</button><span>Pagina {page}</span><button type="button" className="secondary-button" disabled={listState?.status !== 'ready' || rows.length < TOURNAMENT_PAGE_SIZE} onClick={() => changePage(page + 1)}>Successiva</button></nav>
      </section>
      <section className="competitive-detail tournament-detail" aria-label="Dettagli torneo" aria-busy={!!selected && eventState?.status === 'loading'}>
        {!selected ? <p className="competitive-detail-note">Scegli un torneo per consultarne classifica e team pubblicati.</p> : eventState?.status === 'error' ? <ProviderError error={eventState.error} retry={refresh} /> : !event ? <p role="status">Caricamento di {selected.name}…</p> : <>
          <div className="competitive-detail-heading"><span>{event.details.platform === null ? 'Piattaforma non indicata' : registry.platforms[event.details.platform] ?? event.details.platform} · {event.details.isOnline ? 'Online' : 'In presenza'}</span><a href={tournamentUrl(selected.id)} target="_blank" rel="noreferrer">Torneo originale ↗</a></div>
          <h3>{event.details.name}</h3>
          <p className="competitive-detail-note">{dateLabel(event.details.date)} · {event.details.players} partecipanti{event.details.organizer ? ` · ${event.details.organizer}` : ''}</p>
          {event.details.phases.length > 0 && <p className="competitive-detail-note">{event.details.phases.map((phase) => `${phase.type === 'SWISS' ? 'Swiss' : phase.type === 'SINGLE_BRACKET' ? 'Eliminazione diretta' : phase.type}: ${phase.rounds} turni ${phase.mode}`).join(' · ')}</p>}
          {(event.details.specialRules.length > 0 || event.details.hasCustomBans) && <p className="competitive-detail-note">Regole aggiuntive pubblicate: consulta il torneo originale. {event.details.specialRules.join(' · ')}</p>}
          <div className="tournament-standings-heading"><h4>Classifica pubblicata</h4><span>{event.standings.filter((row) => row.team?.length).length} team / {event.standings.length} giocatori elencati</span></div>
          <label className="tournament-search"><span>Cerca nel torneo</span><input type="search" value={playerQuery} onChange={(event) => setPlayerQuery(event.target.value)} placeholder="Giocatore o Pokémon" /></label>
          <div className="tournament-standings">{standings.map((row) => <Standing key={row.id} row={row} />)}{standings.length === 0 && <p>Nessun risultato pubblicato per questa ricerca.</p>}</div>
        </>}
      </section>
    </div>}
    <footer className="competitive-attributions"><p>Dati dei tornei: <a href={LIMITLESS_ORIGIN} target="_blank" rel="noreferrer">Limitless</a>. {event && `Consultati il ${dateLabel(event.retrievedAt)}.`}</p><details className="competitive-data-info"><summary>Fonti dati e attribuzioni</summary><div><p>Consultazione delle API pubbliche Limitless, con cache in memoria fino a due minuti. Nessun archivio permanente o ridistribuzione dei team sheet. I contenuti restano dei rispettivi autori; l’accessibilità pubblica non equivale a una licenza aperta.</p><p><a href="https://docs.limitlesstcg.com/developer/tournaments" target="_blank" rel="noreferrer">Documentazione API</a> · <a href={`${LIMITLESS_ORIGIN}/tos`} target="_blank" rel="noreferrer">Condizioni di utilizzo</a> · Verifica: 31 ottobre 2026.</p></div></details></footer>
  </section>
}

function ProviderError({ error, retry }) { return <div className="tournament-error" role="alert"><p>{error}</p><button type="button" className="secondary-button" onClick={retry}>Riprova</button></div> }
function TeamValue({ kind, value }) { return value ? <CompetitiveTooltip kind={kind} value={value}>{value}</CompetitiveTooltip> : <span className="tournament-missing">Non pubblicato</span> }
function Standing({ row }) {
  return <details className="tournament-standing"><summary>
    <span className="tournament-place" aria-label={row.placing ? `Piazzamento ${row.placing}` : 'Piazzamento non pubblicato'}>{row.placing ?? '—'}</span>
    <span className="tournament-player"><strong>{row.name}</strong><small aria-label="Record vittorie, sconfitte e pareggi">{['wins', 'losses', 'ties'].map((key) => row.record[key] ?? '—').join(' / ')}{row.drop > 0 ? ' · Ritirato' : ''}</small></span>
    <span className="tournament-team-preview">{row.team?.map((member, index) => <PokemonImage key={index} pokemon={pokemonById.get(member.showdownId) ?? {}} size={30} alt={member.sourceName ?? member.sourceId ?? 'Pokémon non identificato'} />)}<small>{row.team?.length ? `${row.team.length}/6 Pokémon` : 'Team non pubblicato'}</small></span>
  </summary><div className="tournament-team">{row.team?.length ? row.team.map((member, index) => <TeamMember key={index} member={member} />) : <p>Il team sheet non è disponibile.</p>}</div></details>
}
function TeamMember({ member }) {
  const pokemon = pokemonById.get(member.showdownId)
  return <article className="tournament-member"><header><PokemonImage pokemon={pokemon ?? {}} size={48} /><div><h5 title={member.sourceName ?? member.sourceId ?? undefined}>{pokemon?.displayName ?? member.sourceName ?? member.sourceId ?? 'Pokémon non identificato'}</h5>{!pokemon && <small>{member.identity === 'conflict' ? 'Identità discordante nella fonte' : 'Forma non associata al catalogo'}</small>}</div></header>
    <dl><dt>Strumento</dt><dd><TeamValue kind="items" value={member.item} /></dd><dt>Abilità</dt><dd><TeamValue kind="abilities" value={member.ability} /></dd><dt>Natura</dt><dd><TeamValue kind="natures" value={member.nature} /></dd>{member.tera && <><dt>Teratipo pubblicato</dt><dd>{member.tera}</dd></>}</dl>
    <ul aria-label="Mosse pubblicate">{member.moves?.length ? member.moves.map((move, index) => { const type = moveTypeFor(move); return <li key={index}><TeamValue kind="moves" value={move} />{type && <span className={`type-badge type-${type.toLowerCase()}`}>{type}</span>}</li> }) : <li className="tournament-missing">Mosse non pubblicate</li>}</ul>
  </article>
}

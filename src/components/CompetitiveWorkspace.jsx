import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import manifest from '../data/competitive/manifest.json'
import { REGULATION, REGULATION_ITEMS, REGULATION_MOVES, REGULATION_ROSTER } from '../lib/regulation.js'
import { POKEMON_BY_NAME, POKEMON_DATASET } from '../lib/pokemonDataset.js'
import { formatPeriod, formatShare, formatUsage, createCompetitiveLabels, createCompetitiveMoveTypes, getCompatibleSnapshots } from '../lib/competitive/presentation.js'
import { parseChampionsSpread, validateCompetitiveSnapshot } from '../lib/competitive/normalize.js'
import PokemonDetails from './PokemonDetails'
import PokemonImage from './PokemonImage'
import CompetitiveTooltip from './CompetitiveTooltip'
import './CompetitiveWorkspace.css'

// Ship the snapshot as a local JSON asset, avoiding a large executable JavaScript chunk.
const snapshotUrls = import.meta.glob('../data/competitive/*.json', { query: '?url', import: 'default', eager: true })
const compatible = getCompatibleSnapshots(manifest, REGULATION)
const pokemonById = new Map(POKEMON_DATASET.map((entry) => [entry.showdownId, entry]))
const labelFor = createCompetitiveLabels({ roster: REGULATION_ROSTER, moves: REGULATION_MOVES, items: REGULATION_ITEMS })
const moveTypeFor = createCompetitiveMoveTypes(REGULATION_MOVES)
const numbers = new Intl.NumberFormat('it-IT')
const STAT_LABELS = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe']
const NativeRankings = lazy(() => import('./NativeRankings'))

export default function CompetitiveWorkspace() {
  const [source, setSource] = useState('showdown')
  const [nativeOpened, setNativeOpened] = useState(false)
  function changeSource(next) {
    setSource(next)
    if (next === 'native') setNativeOpened(true)
  }
  return <section className="competitive-workspace" aria-label="Statistiche competitive">
    <nav className="competitive-source-nav" aria-label="Fonte delle statistiche">
      <button type="button" aria-pressed={source === 'showdown'} onClick={() => changeSource('showdown')}>Showdown</button>
      <button type="button" aria-pressed={source === 'native'} onClick={() => changeSource('native')}>Ranked Champions</button>
    </nav>
    <div hidden={source !== 'showdown'}><ShowdownRankings /></div>
    {nativeOpened && <div hidden={source !== 'native'}><Suspense fallback={<p role="status">Apertura ranked Champions…</p>}><NativeRankings active={source === 'native'} /></Suspense></div>}
  </section>
}

function ShowdownRankings() {
  const [snapshotId, setSnapshotId] = useState(compatible[0]?.id ?? '')
  const [loaded, setLoaded] = useState(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const descriptor = compatible.find((entry) => entry.id === snapshotId)
  useEffect(() => {
    let cancelled = false
    if (!descriptor) return
    const controller = new AbortController()
    setError('')
    Promise.resolve().then(async () => {
      const url = snapshotUrls[`../data/competitive/${descriptor.file}`]
      if (!url) throw new Error('Missing local snapshot')
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) throw new Error(`Local snapshot HTTP ${response.status}`)
      return response.json()
    })
      .then((snapshot) => {
        validateCompetitiveSnapshot(snapshot, REGULATION_ROSTER)
        if (snapshot.id !== descriptor.id || snapshot.sourceHash !== descriptor.sourceHash) throw new Error('Snapshot mismatch')
        if (!cancelled) {
          setLoaded(snapshot)
          setSelectedId((id) => snapshot.pokemon.some((row) => row.showdownId === id) ? id : snapshot.pokemon[0].showdownId)
        }
      })
      .catch(() => { if (!cancelled) setError('Non è stato possibile caricare lo snapshot locale. Riprova o ricarica la pagina.') })
    return () => { cancelled = true; controller.abort() }
  }, [descriptor, retry])
  const snapshot = loaded?.id === snapshotId ? loaded : null
  const rows = useMemo(() => (snapshot?.pokemon ?? []).filter((entry) => {
    const name = pokemonById.get(entry.showdownId)?.displayName ?? entry.sourceName
    return `${name} ${entry.sourceName}`.toLowerCase().includes(query.trim().toLowerCase())
  }), [snapshot, query])
  const selected = snapshot?.pokemon.find((entry) => entry.showdownId === selectedId)
  function selectPokemon(id) {
    setSelectedId(id)
    if (window.matchMedia('(max-width: 900px)').matches) requestAnimationFrame(() => document.querySelector('.competitive-detail')?.scrollIntoView({ block: 'start' }))
  }

  return <section className="competitive-workspace" aria-label="Statistiche Showdown">
    {!descriptor ? <div className="competitive-empty"><h3>Statistiche non ancora disponibili per {REGULATION.label}</h3><p>Non sono disponibili statistiche verificate per la regulation attiva.</p></div>
      : <>
        <div className="competitive-filters">
          <label><span>Periodo e soglia</span><select value={snapshotId} onChange={(event) => { setSnapshotId(event.target.value); setError('') }}>{compatible.map((entry) => <option value={entry.id} key={entry.id}>{formatPeriod(entry.period)} · soglia {entry.cutoff} · {entry.regulationLabel}</option>)}</select></label>
          <label><span>Cerca nella classifica</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome o forma del Pokémon" /></label>
        </div>
        {error ? <div className="competitive-empty" role="alert"><p>{error}</p><button type="button" className="secondary-button" onClick={() => setRetry((value) => value + 1)}>Riprova</button></div>
          : !snapshot ? <p role="status">Caricamento delle statistiche locali…</p>
            : <>
              <div className="competitive-data-bar">
                <p>Showdown · Doubles · {numbers.format(snapshot.battles)} battaglie nel formato</p>
                <details className="competitive-data-info"><summary>Informazioni sui dati</summary><div>
                  <p>Ladder simulata su Showdown, distinta dalla ranked nativa e dai tornei. L’usage indica la frequenza nel formato; la soglia Smogon è una ponderazione statistica, non un filtro rigido sui giocatori.</p>
                  <p>Le quote dei dettagli sono riferite a chi usa il Pokémon. Mosse e compagni possono sommare oltre il 100%. Strumento, abilità e natura più comuni non descrivono un set osservato.</p>
                  <p>Le nature sono aggregate da tutti gli spread della fonte. Gli spread conservano natura e SP pubblicati insieme: massimo 32 SP per statistica e 66 totali, senza conversione da EV tradizionali. Le statistiche base e le difese provengono dal Catalogo {snapshot.regulationLabel}.</p>
                </div></details>
              </div>
              <div className="competitive-layout">
                <section className="competitive-ranking" aria-labelledby="competitive-ranking-title">
                  <div className="competitive-section-heading"><h3 id="competitive-ranking-title">Classifica di utilizzo</h3><span role="status">{rows.length} / {snapshot.pokemon.length}</span></div>
                  <div className="competitive-ranking-labels" aria-hidden="true"><span>Pokémon</span><span>Usage</span></div>
                  <div className="competitive-ranking-list">
                    {rows.map((entry) => {
                      const pokemon = pokemonById.get(entry.showdownId)
                      const item = entry.distributions.items?.entries[0]
                      const nature = entry.distributions.natures?.entries[0]
                      return <button type="button" className="competitive-ranking-row" key={entry.showdownId} data-pokemon-id={entry.showdownId} aria-pressed={selectedId === entry.showdownId} aria-controls="competitive-pokemon-detail" onClick={() => selectPokemon(entry.showdownId)}>
                        <span className="competitive-rank">{entry.rank}</span><PokemonImage pokemon={pokemon} size={44} />
                        <span className="competitive-ranking-name"><strong>{pokemon.displayName}</strong><small>{item ? labelFor('items', item.key) : 'Strumento non disponibile'} · {nature?.key ?? 'Natura non disponibile'}</small></span>
                        <strong className="competitive-usage">{formatUsage(entry.usage * 100)}</strong>
                      </button>
                    })}
                    {!rows.length && <p className="competitive-no-results">Nessun Pokémon corrisponde alla ricerca. Il filtro non modifica le percentuali.</p>}
                  </div>
                  <p className="competitive-ranking-note">Strumento e natura indicati sono scelte indipendenti.</p>
                </section>
                {selected && <PokemonMeta key={`${snapshot.id}:${selected.showdownId}`} entry={selected} snapshot={snapshot} onSelect={selectPokemon} />}
              </div>
            </>}
      </>}
    <SourceAttributions snapshot={snapshot} />
  </section>
}

function PokemonMeta({ entry, snapshot, onSelect }) {
  const pokemon = pokemonById.get(entry.showdownId)
  return <article id="competitive-pokemon-detail" className="competitive-detail" aria-label={`Statistiche di ${pokemon.displayName}`}>
    <div className="competitive-detail-heading"><span>#{entry.rank} · {formatUsage(entry.usage * 100)} usage</span><span>{formatPeriod(snapshot.period)} · soglia {snapshot.cutoff}</span></div>
    <div className="competitive-profile"><PokemonDetails pokemon={pokemon} /></div>
    <p className="competitive-detail-note">Quote tra chi usa questo Pokémon; le scelte elencate non costituiscono un set completo.</p>
    <div className="competitive-distributions">
      <Distribution kind="moves" title="Mosse più usate" entry={entry} />
      <Distribution kind="items" title="Strumenti" entry={entry} />
      <Distribution kind="abilities" title="Abilità" entry={entry} />
      <Distribution kind="natures" title="Nature" entry={entry} />
      <Distribution kind="teammates" title="Compagni frequenti" entry={entry} onSelect={onSelect} available={snapshot.pokemon} />
      <Distribution kind="spreads" title="Distribuzioni SP" entry={entry} />
    </div>
    <a className="competitive-original" href={snapshot.sourceUrl} target="_blank" rel="noopener noreferrer">Consulta il dataset originale Smogon ↗</a>
  </article>
}

function Distribution({ kind, title, entry, onSelect, available }) {
  const [expanded, setExpanded] = useState(false)
  const distribution = entry.distributions[kind]
  const visible = distribution?.entries.slice(0, expanded ? 20 : 5) ?? []
  return <section className={`competitive-distribution competitive-distribution-${kind}`}>
    <h3>{title}</h3>
    {!distribution || !entry.weightedCount ? <p>Dati non disponibili per questa distribuzione.</p>
      : !distribution.entries.length ? <p>Nessuna voce con peso positivo nella fonte.</p>
        : <ol>{visible.map((row) => {
          const spread = kind === 'spreads' ? parseChampionsSpread(row.key) : null
          const teammateId = kind === 'teammates' ? POKEMON_BY_NAME.get(labelFor(kind, row.key))?.showdownId : null
          const canSelect = teammateId && available.some((pokemon) => pokemon.showdownId === teammateId)
          const label = labelFor(kind, row.key)
          const moveType = kind === 'moves' ? moveTypeFor(row.key) : null
          return <li key={row.key}>
            <div className="competitive-distribution-value">
              {spread ? <strong><CompetitiveTooltip kind="natures" value={spread.nature}>{spread.nature}</CompetitiveTooltip></strong> : canSelect ? <button type="button" onClick={() => onSelect(teammateId)}>{label}</button> : <span className={kind === 'moves' ? 'competitive-move-label' : undefined}><CompetitiveTooltip kind={kind} value={row.key}><span>{label}</span>{moveType && <span className={`type-badge type-${moveType}`}>{moveType}</span>}</CompetitiveTooltip></span>}
              <strong>{formatShare(row.weight, entry.weightedCount)}</strong>
            </div>
            {spread ? <dl className="competitive-spread">{spread.points.map((points, index) => <div key={STAT_LABELS[index]}><dt>{STAT_LABELS[index]}</dt><dd>{points}</dd></div>)}</dl>
              : <div className="competitive-share-track" aria-hidden="true"><span style={{ width: `${Math.min(100, row.weight / entry.weightedCount * 100)}%` }} /></div>}
          </li>
        })}</ol>}
    {distribution && entry.weightedCount > 0 && <>
      {distribution.entries.length > 5 && <button type="button" className="competitive-expand" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? 'Mostra meno' : `Mostra ${distribution.entries.length} voci`}</button>}
      {distribution.totalEntries > visible.length && <p className="competitive-truncation">Mostrate {visible.length} di {distribution.totalEntries} voci con peso positivo. Quote sul totale originale.</p>}
      {kind === 'moves' && distribution.emptySlotWeight > 0 && <p className="competitive-truncation">La fonte include slot mossa vuoti, separati dalle mosse elencate.</p>}
    </>}
  </section>
}

function SourceAttributions({ snapshot }) {
  return <section className="competitive-attributions" aria-labelledby="competitive-sources-title">
    <h2 id="competitive-sources-title">Fonti dati e attribuzioni</h2>
    <p>Statistiche aggregate: <a href="https://www.smogon.com/stats/" target="_blank" rel="noopener noreferrer">Smogon</a> / <a href="https://pokemonshowdown.com/" target="_blank" rel="noopener noreferrer">Pokémon Showdown</a>. Elaborazione locale per PokemonStats.</p>
    <details className="competitive-data-info"><summary>Condizioni e attribuzioni</summary>
    <dl><div><dt>Dati utilizzati</dt><dd>Usage e distribuzioni aggregate della ladder Champions Doubles; nessun team individuale o risultato di torneo.</dd></div>
      <div><dt>Aggiornamento</dt><dd>Snapshot mensili importati e verificati prima della pubblicazione.{snapshot && <> Importato il {new Intl.DateTimeFormat('it-IT', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(snapshot.importedAt))}; periodo {formatPeriod(snapshot.period)}.</>}</dd></div>
      <div><dt>Condizioni e ultima verifica</dt><dd>31 ottobre 2026. La <a href="https://pkmn.github.io/smogon/" target="_blank" rel="noopener noreferrer">documentazione @pkmn/smogon</a> distingue gli aggregati statistici disponibili in pubblico dominio da set e analisi editoriali protetti, che non vengono utilizzati.</dd></div></dl>
    <p>PokemonStats è un progetto indipendente, non affiliato, sponsorizzato o approvato da Nintendo, Creatures, GAME FREAK o The Pokémon Company. Nomi, personaggi e marchi Pokémon appartengono ai rispettivi titolari. Le condizioni dei dati non concedono diritti sugli artwork o sugli altri asset.</p>
    </details>
  </section>
}

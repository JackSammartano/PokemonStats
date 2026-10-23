import { useEffect, useRef } from 'react'
import { derivePokemonInsights, getPokemonCoverage } from '../lib/pokemonInsights.js'
import { describeTypeEffectiveness, formatTypeMultiplier } from '../lib/typeLabels.js'

export default function PokemonCoverageDialog({ pokemon, side, team, opponentTeam, moveSets, onClose }) {
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])
  const { outgoing, incoming } = getPokemonCoverage(pokemon, side, team, opponentTeam, moveSets)
  const insights = derivePokemonInsights({ outgoing, incoming })
  function close() {
    dialog.current.close()
    onClose()
  }
  return <dialog ref={dialog} className="pokemon-coverage-dialog" aria-labelledby="pokemon-coverage-title" onCancel={(event) => { event.preventDefault(); close() }} onClick={(event) => { if (event.target === dialog.current) {
    const rect = dialog.current.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close()
  } }}>
    <header className="coverage-dialog-header"><div><p className="eyebrow compact">{side === 'attacker' ? 'La mia squadra' : 'Squadra avversaria'}</p><h2 id="pokemon-coverage-title">{pokemon.displayName}</h2></div><button type="button" className="secondary-button" onClick={close} autoFocus aria-label="Chiudi dettagli copertura">Chiudi ×</button></header>
    <p>Efficacia dei tipi delle mosse selezionate. Abilità, oggetti e danno effettivo non sono inclusi.</p>
    <PokemonInsights insights={insights} total={outgoing.length} />
    <div className="coverage-dialog-columns"><CoverageGroup title={`${pokemon.displayName} → ${side === 'attacker' ? 'squadra avversaria' : 'la mia squadra'}`} rows={outgoing} /><CoverageGroup title={`${side === 'attacker' ? 'Squadra avversaria' : 'La mia squadra'} → ${pokemon.displayName}`} rows={incoming} /></div>
  </dialog>
}

function CoverageGroup({ title, rows }) {
  return <section><h3>{title}</h3><div className="coverage-targets">{rows.length ? rows.map((row) => <article className="coverage-target" key={row.name}>
    <h4>{row.name}</h4>
    {row.options.length ? <ul>{row.options.map((option) => <li className="coverage-move" key={`${option.attacker}:${option.slot}`}><div><span>{option.moveName}</span><span className={`type-badge type-${option.type}`}>{option.type}</span></div><small>{describeTypeEffectiveness(option.multiplier)}</small></li>)}</ul> : <p>Nessuna mossa offensiva selezionata.</p>}
  </article>) : <p>Aggiungi Pokémon alla squadra opposta per vedere i confronti.</p>}</div></section>
}

function PokemonInsights({ insights, total }) {
  const list = (names) => names.join(', ')
  if (!total) return <section className="pokemon-insights" aria-labelledby="pokemon-insights-title"><h3 id="pokemon-insights-title">Deduzioni sui dati</h3><p>Aggiungi Pokémon alla squadra opposta per ottenere deduzioni sul confronto.</p></section>
  return <section className="pokemon-insights" aria-labelledby="pokemon-insights-title">
    <h3 id="pokemon-insights-title">Deduzioni sui dati</h3>
    <dl>
      <div><dt>Minacce per tipo · {insights.threats.length}/{insights.evaluated}</dt><dd>{insights.evaluated ? insights.threats.length ? insights.threats.map((row) => `${row.name}${formatTypeMultiplier(row.worst) ? ` ${formatTypeMultiplier(row.worst)}` : ''}`).join(', ') : 'Nessuna mossa avversaria superefficace.' : 'Nessuna mossa offensiva avversaria da valutare.'}</dd></div>
      <div><dt>Matchup difensivi favorevoli</dt><dd>{!insights.evaluated ? 'Nessun avversario valutabile.' : insights.resisted.length ? `${list(insights.resisted)}: tutte le mosse selezionate sono resistite o inefficaci.` : 'Nessun avversario con sole mosse resistite o inefficaci.'}</dd></div>
      <div><dt>Copertura superefficace · {insights.covered.length}/{total}</dt><dd>{!insights.hasAttacks ? 'Nessuna mossa offensiva selezionata.' : <>{insights.covered.length ? list(insights.covered) : 'Nessun bersaglio.'}{insights.gaps.length > 0 && <small>Senza copertura: {list(insights.gaps)}.</small>}</>}</dd></div>
      <div><dt>Mosse con più copertura</dt><dd>{!insights.hasAttacks ? 'Seleziona mosse offensive per valutarne la copertura.' : insights.bestMoves.length ? <>{insights.bestMoves.map((move) => move.name).join(', ')}<small>{insights.bestMoves[0].targets.length}/{total} bersagli superefficaci per mossa.</small></> : 'Nessuna mossa colpisce un bersaglio superefficacemente.'}</dd></div>
    </dl>
    {insights.unknown.length > 0 && <p className="summary-note">Dati difensivi mancanti: {list(insights.unknown)} non hanno mosse offensive selezionate.</p>}
  </section>
}

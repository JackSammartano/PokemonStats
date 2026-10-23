import { useEffect, useRef } from 'react'
import { getPokemonCoverage } from '../lib/teamInsights.js'
import { describeTypeEffectiveness } from '../lib/typeLabels.js'

export default function PokemonCoverageDialog({ pokemon, side, team, opponentTeam, moveSets, onClose }) {
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])
  const { outgoing, incoming } = getPokemonCoverage(pokemon, side, team, opponentTeam, moveSets)
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
    <div className="coverage-dialog-columns"><CoverageGroup title={`${pokemon.displayName} → ${side === 'attacker' ? 'squadra avversaria' : 'la mia squadra'}`} rows={outgoing} /><CoverageGroup title={`${side === 'attacker' ? 'Squadra avversaria' : 'La mia squadra'} → ${pokemon.displayName}`} rows={incoming} /></div>
  </dialog>
}

function CoverageGroup({ title, rows }) {
  return <section><h3>{title}</h3><div className="coverage-targets">{rows.length ? rows.map((row) => <details className="coverage-target" key={row.name}>
    <summary><strong>{row.name}</strong><span className="coverage-chevron" aria-hidden="true">⌄</span></summary>
    {row.options.length ? <ul>{row.options.map((option) => <li className="coverage-move" key={`${option.attacker}:${option.slot}`}><div><strong>{option.attacker}</strong><span>→ {option.moveName}</span><span className={`type-badge type-${option.type}`}>{option.type}</span></div><small>{describeTypeEffectiveness(option.multiplier)}</small></li>)}</ul> : <p>Nessuna mossa offensiva selezionata.</p>}
  </details>) : <p>Aggiungi Pokémon alla squadra opposta per vedere i confronti.</p>}</div></section>
}

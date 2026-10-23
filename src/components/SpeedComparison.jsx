import { useMemo, useState } from 'react'
import { describeSpeedOrder, getBattleSpeed, getSpeedBenchmarks, SPEED_PROFILES } from '../lib/damage/championsSpeed.js'
import './SpeedComparison.css'

export default function SpeedComparison({ pokemon, attacker, defender, leftBuild, rightBuild, weather }) {
  const [profile, setProfile] = useState('max')
  const [query, setQuery] = useState('')
  const leftSpeed = getBattleSpeed(attacker, leftBuild, weather)
  const rightSpeed = getBattleSpeed(defender, rightBuild, weather)
  const rows = useMemo(() => getSpeedBenchmarks(pokemon, profile), [pokemon, profile])
  const filtered = rows.filter((row) => row.name.toLowerCase().includes(query.trim().toLowerCase()))
  return (
    <section className="speed-comparison" aria-labelledby="speed-comparison-title">
      <h3 id="speed-comparison-title">Scala Velocità</h3>
      <p className="speed-intro">Confronta i valori effettivi dei due Pokémon con il roster M-C al livello 50.</p>
      <div className="speed-current" aria-live="polite">
        {[[attacker, leftSpeed], [defender, rightSpeed]].map(([entry, speed], index) => (
          <div key={index} data-speed-side={index === 0 ? 'attacker' : 'defender'}><small>Pokémon {index + 1}</small><span>{entry?.displayName ?? 'Da scegliere'}</span><strong>{speed ?? '—'}</strong></div>
        ))}
      </div>
      <p className="speed-order" aria-live="polite">{describeSpeedOrder(leftSpeed, rightSpeed)}</p>
      <label className="select-field"><span>Scenario del roster</span><select value={profile} onChange={(event) => setProfile(event.target.value)}>{SPEED_PROFILES.map((entry) => <option value={entry.id} key={entry.id}>{entry.label}</option>)}</select></label>
      <label className="select-field"><span>Cerca nella scala</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Es. Salamence" /></label>
      <div className="speed-table-scroll" tabIndex={0} role="region" aria-label="Classifica Velocità del roster M-C">
        <table className="speed-table">
          <caption className="sr-only">Scenario {SPEED_PROFILES.find((entry) => entry.id === profile).label}. Differenze calcolate come Velocità del tuo Pokémon meno Velocità di riferimento.</caption>
          <thead><tr><th scope="col">Pokémon</th><th scope="col">Spe</th><th scope="col">Δ 1</th><th scope="col">Δ 2</th></tr></thead>
          <tbody>{filtered.map((row) => <tr key={row.name} className={row.name === attacker?.displayName || row.name === defender?.displayName ? 'speed-selected-row' : undefined}>
            <th scope="row">{row.name}<small>Base {row.base}</small></th><td>{row.speed}</td><SpeedDifference current={leftSpeed} reference={row.speed} /><SpeedDifference current={rightSpeed} reference={row.speed} />
          </tr>)}</tbody>
        </table>
        {!filtered.length && <p className="speed-empty">Nessun Pokémon trovato.</p>}
      </div>
      <p className="speed-note">Δ positivo: il Pokémon configurato è più veloce; 0: parità. SP, natura, boost Spe, Choice Scarf, strumenti che dimezzano la Velocità e abilità meteo sono inclusi. Altre condizioni e priorità delle mosse non sono incluse.</p>
    </section>
  )
}

function SpeedDifference({ current, reference }) {
  const difference = current === null ? null : current - reference
  return <td className={difference === null ? '' : difference > 0 ? 'speed-ahead' : difference < 0 ? 'speed-behind' : 'speed-tie'}>{difference === null ? '—' : difference > 0 ? `+${difference}` : difference}</td>
}

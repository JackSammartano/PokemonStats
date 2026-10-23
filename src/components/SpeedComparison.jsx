import { describeSpeedOrder, getBattleSpeed } from '../lib/damage/championsSpeed.js'
import './SpeedComparison.css'

export default function SpeedComparison({ attacker, defender, leftBuild, rightBuild, weather }) {
  const leftSpeed = getBattleSpeed(attacker, leftBuild, weather)
  const rightSpeed = getBattleSpeed(defender, rightBuild, weather)
  const maxSpeed = Math.max(leftSpeed ?? 0, rightSpeed ?? 0, 1)
  return (
    <section className="speed-comparison" aria-labelledby="speed-comparison-title">
      <h3 id="speed-comparison-title">Scala Velocità</h3>
      <p className="speed-intro">Velocità effettiva dei due Pokémon selezionati, aggiornata con le configurazioni del calcolatore al livello 50.</p>
      <div className="speed-current" aria-live="polite">
        {[[attacker, leftSpeed], [defender, rightSpeed]].map(([entry, speed], index) => (
          <div key={index} data-speed-side={index === 0 ? 'attacker' : 'defender'}>
            <small>Pokémon {index + 1}</small>
            <span>{entry?.displayName ?? 'Da scegliere'}</span>
            <strong>{speed ?? '—'}</strong>
            <div className="speed-bar" aria-hidden="true"><span style={{ width: `${speed === null ? 0 : speed / maxSpeed * 100}%` }} /></div>
          </div>
        ))}
      </div>
      <p className="speed-order" aria-live="polite">{describeSpeedOrder(leftSpeed, rightSpeed)}</p>
      <p className="speed-note">SP, natura, boost Spe, Choice Scarf, strumenti che dimezzano la Velocità e abilità meteo sono inclusi. Altre condizioni e priorità delle mosse non sono incluse.</p>
    </section>
  )
}

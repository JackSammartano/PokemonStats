import { getEffectiveSpeed, getSpeedTableRow } from '../lib/damage/championsSpeed.js'
import './SpeedComparison.css'

const COLUMNS = [
  { key: 'base', label: 'Base' },
  { key: 'current', label: 'Attuale' },
  { key: 'max', label: '+Spe', detail: '32 SP' },
  { key: 'neutral32', label: 'Neutra', detail: '32 SP' },
  { key: 'neutral0', label: 'Neutra', detail: '0 SP' },
  { key: 'minus0', label: '−Spe', detail: '0 SP' },
  { key: 'maxScarf', label: '+Spe · Scarf', detail: '32 SP' },
  { key: 'neutralScarf', label: 'Neutra · Scarf', detail: '32 SP' },
]

export default function SpeedComparison({ attacker, defender, leftBuild, rightBuild, weather, battle, reversed }) {
  return (
    <section className="speed-comparison" aria-labelledby="speed-comparison-title">
      <h3 id="speed-comparison-title">Scala Velocità</h3>
      <div className="speed-table-scroll" tabIndex={0} role="region" aria-label="Velocità dei due Pokémon selezionati">
        <table className="speed-table">
          <caption>Livello 50 · Attuale segue il calcolatore; gli altri valori sono scenari senza boost o abilità. Scarf = Choice Scarf.</caption>
          <thead><tr><th scope="col">Pokémon</th>{COLUMNS.map(({ key, label, detail }) => <th className={key === 'current' ? 'speed-current-column' : undefined} key={key} scope="col">{label}{detail && <small>{detail}</small>}</th>)}</tr></thead>
          <tbody>{[[attacker, leftBuild], [defender, rightBuild]].map(([pokemon, build], index) => {
            const row = getSpeedTableRow(pokemon, build, weather)
            const effective = (index === 0) !== reversed ? battle?.effectiveAttacker : battle?.effectiveDefender
            row.current = effective ? getEffectiveSpeed(effective.stats.spe, { ...effective, terrain: battle.field.terrain }, battle.field.weather) : null
            return <tr key={index} data-speed-side={index === 0 ? 'attacker' : 'defender'}>
              <th scope="row">{pokemon?.displayName ?? 'Da scegliere'}<small>Pokémon {index + 1}</small></th>
              {COLUMNS.map(({ key }) => <td data-speed-column={key} className={key === 'current' ? 'speed-current-column' : undefined} key={key}>{row[key] ?? '—'}</td>)}
            </tr>
          })}</tbody>
        </table>
      </div>
    </section>
  )
}

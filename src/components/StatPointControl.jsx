import { useId } from 'react'

export default function StatPointControl({ label, value, bumps, onChange }) {
  const hintId = useId()
  return (
    <div className="stat-point-control">
      <button type="button" aria-label={`${label}: diminuisci`} disabled={value <= 0} onClick={() => onChange(value - 1)}>−</button>
      <div className="stat-point-track" title={bumps.length ? `Bump a ${bumps.join(', ')} SP` : 'Nessun bump'}>
        <div className="stat-point-ticks" aria-hidden="true">
          {Array.from({ length: 33 }, (_, sp) => <i key={sp} style={{ left: `${sp / 32 * 100}%` }} className={`${sp <= value ? 'invested' : ''}${bumps.includes(sp) ? ' bump' : ''}`} />)}
        </div>
        <input type="range" min="0" max="32" step="1" value={value} aria-label={label} aria-describedby={hintId}
          aria-valuetext={`${value} SP${bumps.includes(value) ? ', bump: +2 alla statistica' : ''}`}
          onChange={(event) => onChange(Number(event.target.value))} />
      </div>
      <button type="button" aria-label={`${label}: aumenta`} disabled={value >= 32} onClick={() => onChange(value + 1)}>+</button>
      <output aria-label={`${label}: valore`} className={bumps.includes(value) ? 'stat-point-bump-value' : ''}>{value}</output>
      <span id={hintId} className="stat-point-hint">{bumps.length ? `Bump (+2 alla statistica) a ${bumps.join(', ')} SP.` : 'Nessun bump per questa statistica e natura.'}</span>
    </div>
  )
}

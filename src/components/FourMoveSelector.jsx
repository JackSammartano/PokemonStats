import { getTeamMove, getTeamMoveOptions } from '../lib/teamData.js'
import { REGULATION } from '../lib/regulation.js'

export default function FourMoveSelector({ pokemon, moves, onChange, rows = [], selectedSlot = -1, onSelect, label, readOnly = false }) {
  const { options: available, source } = getTeamMoveOptions(pokemon)
  const imported = moves.filter((id) => id && !available.some((option) => option.value === id))
  const options = [...available, ...imported.map((value) => ({ value, label: `${getTeamMove(value)?.name ?? value} (importata, fuori learnset)` }))]
  return (
    <div className="four-move-selector" role="group" aria-label={label} aria-disabled={!pokemon || undefined}>
      <div className="move-set-heading">
        <h3>{label}</h3>
        {readOnly && <p className="move-support-hint">Mosse copiate da Imposter: modifica gli slot nel pannello del bersaglio.</p>}
        {source === 'manual' && pokemon && <p className="move-support-hint">Scelta manuale: learnset supportato non disponibile. Verifica che {pokemon.displayName} possa imparare le mosse.</p>}
        {imported.length > 0 && <p className="move-support-hint">Alcune mosse importate non risultano nel learnset {REGULATION.label} verificato. Le selezioni sono conservate.</p>}
      </div>
      {moves.map((moveId, slot) => {
        const row = rows[slot]
        return (
          <div className={`move-slot ${selectedSlot === slot ? 'active' : ''}`} key={slot}>
            <div className="move-slot-input">
              <label>
                <span className="move-slot-number">{slot + 1}</span>
                <span className="sr-only">{label}, mossa {slot + 1}</span>
                <select disabled={!pokemon || readOnly} value={moveId} onChange={(event) => onChange(slot, event.target.value)}>
                  <option value="">Slot vuoto</option>
                  {options.map((option) => <option key={option.value} value={option.value} disabled={moves.some((id, index) => index !== slot && id === option.value)}>{option.label}</option>)}
                </select>
              </label>
              {onSelect && <button className="move-detail-button" type="button" disabled={!pokemon || !row?.move} aria-pressed={selectedSlot === slot} onClick={() => onSelect(slot)} aria-label={`Dettagli ${row?.move?.name ?? `mossa ${slot + 1}`} di ${pokemon?.displayName}`}>Dettagli</button>}
            </div>
            {row?.result && (
              <div className="move-slot-result">
                <span className={`type-badge type-${row.result.move.type}`}>{row.result.move.type}</span>
                <span className="move-category">{row.result.move.category === 'physical' ? 'Fisica' : 'Speciale'}</span>
                <strong>{row.minPercent.toFixed(1)}–{row.maxPercent.toFixed(1)}%</strong>
                <div className="move-damage-track" aria-hidden="true"><span style={{ width: `${Math.min(100, row.maxPercent)}%` }} /></div>
              </div>
            )}
            {row?.reason && <p className="move-support-hint move-row-note">{row.reason}</p>}
          </div>
        )
      })}
    </div>
  )
}

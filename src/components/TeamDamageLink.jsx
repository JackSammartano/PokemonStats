import { resolveTeamMatchup } from '../lib/teamDamageLink.js'
import FourMoveSelector from './FourMoveSelector'

export default function TeamDamageLink({ team, pokemon, draft, onChange, onCalculate, moveSets, onMoveChange }) {
  const { attacker, defender, attackerMoves, defenderMoves, canCalculate } = resolveTeamMatchup(team, pokemon, draft, moveSets)

  return (
    <section className="team-damage-link" aria-labelledby="team-damage-title">
      <div className="team-damage-intro">
        <p className="eyebrow compact">Dal team al calcolo</p>
        <h2 id="team-damage-title">Confronta i due Pokémon</h2>
        <p>Scegli i due Pokémon e prepara fino a quattro mosse per ciascuno. Le ritroverai tutte nel calcolatore.</p>
      </div>
      <div className="team-damage-fields">
        <label className="select-field">
          <span>Attaccante del mio team</span>
          <select
            value={attacker?.displayName ?? ''}
            disabled={!team.length}
            onChange={(event) => onChange({ ...draft, attackerName: event.target.value })}
          >
            {!team.length && <option value="">Aggiungi un Pokémon al team</option>}
            {team.map((entry) => <option key={entry.displayName} value={entry.displayName}>{entry.displayName}</option>)}
          </select>
        </label>
        <label className="select-field">
          <span>Pokémon avversario</span>
          <select
            value={defender?.displayName ?? ''}
            disabled={!pokemon.length}
            onChange={(event) => onChange({ ...draft, defenderName: event.target.value })}
          >
            {!pokemon.length && <option value="">Aggiungi Pokémon alla squadra avversaria</option>}
            {pokemon.map((entry) => <option key={entry.displayName} value={entry.displayName}>{entry.displayName}</option>)}
          </select>
        </label>
      </div>
      <div className="team-move-sets">
        <FourMoveSelector label={`Mosse di ${attacker?.displayName ?? 'un membro del team'}`} pokemon={attacker} moves={attackerMoves} onChange={(slot, value) => onMoveChange('attacker', attacker, slot, value)} />
        <FourMoveSelector label={`Mosse di ${defender?.displayName ?? 'un avversario'}`} pokemon={team.length ? defender : null} moves={defenderMoves} onChange={(slot, value) => onMoveChange('defender', defender, slot, value)} />
      </div>
      <button className="ghost-button" type="button" disabled={!canCalculate} onClick={onCalculate}>
        Apri nel damage calculator <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}

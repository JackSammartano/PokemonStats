import { resolveTeamMatchup } from '../lib/teamDamageLink.js'

export default function TeamDamageLink({ team, pokemon, draft, onChange, onCalculate }) {
  const { attacker, defender, move, moveOptions, canCalculate } = resolveTeamMatchup(team, pokemon, draft)

  return (
    <section className="team-damage-link" aria-labelledby="team-damage-title">
      <div className="team-damage-intro">
        <p className="eyebrow compact">Dal team al calcolo</p>
        <h2 id="team-damage-title">Prepara un confronto</h2>
        <p>Scegli un membro del team, il Pokémon avversario e la mossa da simulare.</p>
      </div>
      <div className="team-damage-fields">
        <label className="select-field">
          <span>Attaccante del mio team</span>
          <select
            value={attacker?.displayName ?? ''}
            disabled={!team.length}
            onChange={(event) => onChange({ ...draft, attackerName: event.target.value, moveName: '' })}
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
            {!pokemon.length && <option value="">Caricamento Pokémon</option>}
            {pokemon.map((entry) => <option key={entry.displayName} value={entry.displayName}>{entry.displayName}</option>)}
          </select>
        </label>
        <label className="select-field">
          <span>Mossa da simulare</span>
          <select
            value={move?.value ?? ''}
            disabled={!team.length || !moveOptions.options.length}
            onChange={(event) => onChange({ ...draft, moveName: event.target.value })}
          >
            {moveOptions.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {team.length > 0 && moveOptions.source === 'manual' && (
            <small className="weather-override-hint">Learnset supportato non disponibile: verifica manualmente che il Pokémon possa usare la mossa.</small>
          )}
        </label>
      </div>
      {attacker && defender && (
        <div className="team-matchup-preview" aria-live="polite">
          <MatchupPokemon pokemon={attacker} />
          <span className="matchup-versus">vs</span>
          <MatchupPokemon pokemon={defender} />
        </div>
      )}
      <button className="ghost-button" type="button" disabled={!canCalculate} onClick={onCalculate}>
        Apri nel damage calculator <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}

function MatchupPokemon({ pokemon }) {
  return (
    <div className="matchup-pokemon">
      {pokemon.image && <img src={pokemon.image} alt="" />}
      <div>
        <strong>{pokemon.displayName}</strong>
        <div className="type-row mini">
          {pokemon.types.map((type) => <span className={`type-badge type-${type}`} key={type}>{type}</span>)}
        </div>
      </div>
    </div>
  )
}

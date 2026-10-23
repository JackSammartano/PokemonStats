import { analyzeOffensiveCoverage, analyzeTeamTypes } from '../lib/teamTypeAnalysis.js'

export default function TeamTypeSummary({ team, opponentTeam, moveSets }) {
  const own = analyzeTeamTypes(team)
  const enemy = analyzeTeamTypes(opponentTeam)
  const risks = own.filter((row) => row.weak.length >= 2).sort((a, b) => b.weak.length - a.weak.length)
  const ownCoverage = analyzeOffensiveCoverage(team, opponentTeam, 'attacker', moveSets)
  const enemyCoverage = analyzeOffensiveCoverage(opponentTeam, team, 'defender', moveSets)
  return (
    <aside className="team-type-summary" aria-labelledby="team-types-title">
      <header><p className="eyebrow compact">Le squadre a confronto</p><h2 id="team-types-title">Resoconto dei tipi</h2><p>Efficacia dei tipi. Abilità, oggetti e condizioni di campo non sono inclusi.</p></header>
      <section><h3>Tipi in squadra</h3><TypeComposition label="La mia squadra" rows={own} /><TypeComposition label="Squadra avversaria" rows={enemy} /></section>
      <section><h3>Debolezze condivise</h3>{!team.length ? <p>Aggiungi Pokémon per vedere le priorità difensive.</p> : risks.length ? <ul className="type-risk-list">{risks.slice(0, 4).map((row) => <li key={row.type}><span className={`type-badge type-${row.type}`}>{row.type}</span><span>{row.weak.length} deboli · {row.resistant.length + row.immune.length} coperture</span>{row.resistant.length + row.immune.length === 0 && <strong>Nessuna resistenza</strong>}</li>)}</ul> : <p>Nessuna debolezza di tipo condivisa da almeno due membri.</p>}</section>
      <section><h3>Copertura delle mosse selezionate</h3><Coverage label="La mia squadra → avversari" rows={ownCoverage} /><Coverage label="Avversari → la mia squadra" rows={enemyCoverage} /><p className="summary-note">Conta i bersagli colpibili con efficacia superiore a ×1. Le mosse di stato non contano come attacchi.</p></section>
      <section><h3>Difesa per tipo</h3><div className="type-defense-head"><span>Tipo</span><span>Mia</span><span>Avversaria</span></div>
        {own.map((row, index) => <details className="type-defense-row" key={row.type}><summary><span className={`type-badge type-${row.type}`}>{row.type}</span><DefenseCount row={row} /><DefenseCount row={enemy[index]} /></summary><div className="type-defense-members"><DefenseMembers label="La mia squadra" row={row} /><DefenseMembers label="Squadra avversaria" row={enemy[index]} /></div></details>)}
        <p className="summary-note">D = deboli, R = resistenti, I = immuni. Apri un tipo per vedere i Pokémon coinvolti.</p>
      </section>
    </aside>
  )
}

function TypeComposition({ label, rows }) {
  const present = rows.filter((row) => row.count > 0)
  return <div className="type-composition"><strong>{label}</strong><div className="type-row mini">{present.length ? present.map((row) => <span className={`type-badge type-${row.type}`} key={row.type}>{row.type} · {row.count}</span>) : <span className="muted">Squadra vuota</span>}</div></div>
}
function Coverage({ label, rows }) {
  const covered = rows.filter((row) => row.best > 1)
  return <div className="offensive-coverage"><strong>{label}</strong><span>{rows.length ? `${covered.length}/${rows.length} bersagli` : '—'}</span>{rows.length > 0 && <small>{rows.filter((row) => row.best === null).length === rows.length ? 'Nessuna mossa offensiva selezionata.' : rows.filter((row) => row.best <= 1).map((row) => row.name).join(', ') || 'Copertura superefficace su tutti i bersagli.'}</small>}</div>
}
function DefenseCount({ row }) {
  return <span className="type-defense-count"><b className={row.weak.length ? 'type-weak-count' : ''}>{row.weak.length} D</b><span>{row.resistant.length} R</span><span>{row.immune.length} I</span></span>
}
function DefenseMembers({ label, row }) {
  const affected = row.members.filter((member) => member.multiplier !== 1)
  return <p><strong>{label}:</strong> {affected.map((member) => `${member.name} ×${member.multiplier}`).join(' · ') || 'Nessuna debolezza o resistenza.'}</p>
}

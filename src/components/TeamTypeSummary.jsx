import { analyzeOffensiveCoverage, analyzeTeamTypes } from '../lib/teamTypeAnalysis.js'
import { describeTypeEffectiveness, formatTypeMultiplier } from '../lib/typeLabels.js'

export default function TeamTypeSummary({ team, opponentTeam, moveSets }) {
  const own = analyzeTeamTypes(team)
  const enemy = analyzeTeamTypes(opponentTeam)
  const risks = own.filter((row) => row.weak.length >= 2).sort((a, b) => b.weak.length - a.weak.length)
  const ownCoverage = analyzeOffensiveCoverage(team, opponentTeam, 'attacker', moveSets)
  const enemyCoverage = analyzeOffensiveCoverage(opponentTeam, team, 'defender', moveSets)
  return (
    <aside className="team-type-summary" aria-labelledby="team-types-title">
      <header><p className="eyebrow compact">Le squadre a confronto</p><h2 id="team-types-title">Resoconto dei tipi</h2><p>Efficacia dei tipi. Abilità, oggetti e condizioni di campo non sono inclusi.</p></header>
      <section><h3>Debolezze ricorrenti della mia squadra</h3><p>Tipi a cui sono deboli almeno due membri. Il conteggio non considera le mosse avversarie.</p>{!team.length ? <p>Aggiungi Pokémon per vedere le priorità difensive.</p> : risks.length ? <ul className="type-risk-list">{risks.slice(0, 4).map((row) => <li key={row.type}><span className={`type-badge type-${row.type}`}>{row.type}</span><span>{row.weak.length} deboli · {row.resistant.length + row.immune.length} resistenti o immuni</span><small>Deboli: {row.weak.map((member) => member.name).join(', ')}</small>{row.resistant.length + row.immune.length === 0 && <strong>Nessuna resistenza</strong>}</li>)}</ul> : <p>Nessuna debolezza di tipo condivisa da almeno due membri.</p>}</section>
      <section><h3>Copertura delle mosse selezionate</h3><Coverage label="La mia squadra → avversari" rows={ownCoverage} /><Coverage label="Avversari → la mia squadra" rows={enemyCoverage} /><p className="summary-note">Conta i bersagli colpibili con mosse superefficaci. Le mosse di stato non contano come attacchi.</p></section>
      <section><h3>Difesa per tipo</h3><div className="type-defense-head"><span>Tipo</span><span>Mia</span><span>Avversaria</span></div>
        {own.map((row, index) => <details className="type-defense-row" key={row.type}><summary><span className={`type-badge type-${row.type}`}>{row.type}</span><DefenseCount row={row} /><DefenseCount row={enemy[index]} /></summary><div className="type-defense-members"><DefenseMembers label="La mia squadra" row={row} /><DefenseMembers label="Squadra avversaria" row={enemy[index]} /></div></details>)}
        <p className="summary-note">D = deboli, R = resistenti, I = immuni. Apri un tipo per vedere i Pokémon coinvolti.</p>
      </section>
    </aside>
  )
}

function Coverage({ label, rows }) {
  const covered = rows.filter((row) => row.best > 1)
  return <div className="offensive-coverage">
    <strong>{label}</strong><span>{rows.length ? `${covered.length}/${rows.length} bersagli` : '—'}</span>
    <div className="coverage-targets">
      {!rows.length && <p>Nessun bersaglio: aggiungi Pokémon alla squadra da confrontare.</p>}
      {rows.map((row) => <article className="coverage-target" key={row.name}>
        <header><strong>{row.name}</strong><small>{row.best === null ? 'Nessuna mossa offensiva selezionata' : describeTypeEffectiveness(row.best)}</small></header>
        <ul>{row.options.slice(0, 2).map((option) => <CoverageMove key={`${option.attacker}:${option.slot}`} option={option} />)}</ul>
        {row.options.length > 2 && <details><summary>Altre {row.options.length - 2} mosse</summary><ul>{row.options.slice(2).map((option) => <CoverageMove key={`${option.attacker}:${option.slot}`} option={option} />)}</ul></details>}
      </article>)}
    </div>
  </div>
}
function CoverageMove({ option }) {
  return <li className="coverage-move">
    <div><strong>{option.attacker}</strong><span>→ {option.moveName}</span><span className={`type-badge type-${option.type}`}>{option.type}</span></div>
    <small>{describeTypeEffectiveness(option.multiplier)}</small>
  </li>
}
function DefenseCount({ row }) {
  return <span className="type-defense-count"><b className={row.weak.length ? 'type-weak-count' : ''}>{row.weak.length} D</b><span>{row.resistant.length} R</span><span>{row.immune.length} I</span></span>
}
function DefenseMembers({ label, row }) {
  const names = (members) => members.map((member) => `${member.name}${formatTypeMultiplier(member.multiplier) ? ` ${formatTypeMultiplier(member.multiplier)}` : ''}`).join(', ')
  return <div><strong>{label}</strong>
    {row.weak.length > 0 && <p>Deboli: {names(row.weak)}</p>}
    {row.resistant.length > 0 && <p>Resistenti: {names(row.resistant)}</p>}
    {row.immune.length > 0 && <p>Immuni: {row.immune.map((member) => member.name).join(', ')}</p>}
    {!row.weak.length && !row.resistant.length && !row.immune.length && <p>Nessuna debolezza o resistenza.</p>}
  </div>
}

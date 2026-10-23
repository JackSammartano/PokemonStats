import { deriveTeamMatchupInsights } from '../lib/teamInsights.js'

export default function TeamInsights({ team, opponentTeam, moveSets }) {
  const insights = deriveTeamMatchupInsights(team, opponentTeam, moveSets)
  return <section className="team-insights" aria-labelledby="team-insights-title">
    <h3 id="team-insights-title">Deduzioni sui dati</h3>
    <p>Esposizione ai tipi delle mosse selezionate, non previsione del danno. Abilità, oggetti, statistiche e velocità non sono considerati.</p>
    {team.length && opponentTeam.length ? <>
      <SquadInsights label="La mia squadra" result={insights.attacker} opponents={opponentTeam.length} />
      <SquadInsights label="Squadra avversaria" result={insights.defender} opponents={team.length} />
    </> : <p>Aggiungi Pokémon a entrambe le squadre per confrontarne i matchup.</p>}
  </section>
}

function SquadInsights({ label, result, opponents }) {
  const names = (rows) => rows.map((row) => row.name).join(', ')
  const risk = result.mostExposed[0]
  const safe = result.leastExposed[0]
  return <div className="squad-insights"><h4>{label}</h4><dl>
    {risk ? result.sameExposure ? <><dt>Esposizione equivalente</dt><dd>{names(result.mostExposed)}. {risk.threats}/{risk.evaluated} avversari valutabili hanno almeno una mossa superefficace.</dd></> : <>
      <dt>Più esposto ai tipi avversari</dt><dd><strong>{names(result.mostExposed)}</strong>: {risk.threats}/{risk.evaluated} avversari con almeno una mossa superefficace.</dd>
      <dt>Meno esposto ai tipi avversari</dt><dd><strong>{names(result.leastExposed)}</strong>: {safe.threats}/{safe.evaluated} avversari con mosse superefficaci; {safe.resisted} con sole mosse resistite o immuni.</dd>
    </> : <><dt>Esposizione non valutabile</dt><dd>Nessuna mossa offensiva selezionata dagli avversari.</dd></>}
    {risk && result.evaluatedOpponents < opponents && <><dt>Dati parziali</dt><dd>{opponents - result.evaluatedOpponents} avversari senza mosse offensive selezionate.</dd></>}
    <dt>Bersagli senza copertura superefficace</dt><dd>{!result.hasAttacks ? 'Seleziona mosse offensive per valutare la copertura.' : result.gaps.length ? result.gaps.join(', ') : 'Tutti i bersagli hanno almeno una copertura superefficace.'}</dd>
    {result.versatile.length > 0 && <><dt>Copertura offensiva più ampia</dt><dd><strong>{names(result.versatile)}</strong>: {result.versatile[0].covered}/{opponents} bersagli colpibili superefficacemente.</dd></>}
  </dl><p className="summary-note">Parità mantenute. L’esposizione confronta prima il numero di avversari con mosse superefficaci, poi debolezze quadruple, efficacia massima e resistenze.</p></div>
}

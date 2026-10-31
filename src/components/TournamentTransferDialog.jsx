import { useEffect, useMemo, useRef, useState } from 'react'
import { previewTournamentTransfer } from '../lib/tournamentTransfer.js'
import { missingSetLabel } from '../lib/teamCompleteness.js'
import { getTeamMove } from '../lib/teamData.js'
import { LIMITLESS_ORIGIN, tournamentUrl } from '../lib/competitive/limitless.js'
import PokemonImage from './PokemonImage'

export default function TournamentTransferDialog({ request, workspace, onApply, onClose }) {
  const dialog = useRef(null)
  const [side, setSide] = useState('attacker'), [error, setError] = useState('')
  const preview = useMemo(() => previewTournamentTransfer(request), [request])
  useEffect(() => { dialog.current.showModal() }, [])
  function apply(event) { event.preventDefault(); try { onApply(side, request) } catch (error) { setError(error.message) } }
  return <dialog ref={dialog} className="team-library-dialog tournament-transfer-dialog" onCancel={onClose} aria-labelledby="tournament-transfer-title"><form onSubmit={apply}>
    <h2 id="tournament-transfer-title">Esporta team · {request.standing.name}</h2>
    <p>{request.event.details.name} · {request.event.details.format} · <a href={tournamentUrl(request.event.details.id)} target="_blank" rel="noreferrer">Torneo originale ↗</a></p>
    <p>Dati dei tornei: <a href={LIMITLESS_ORIGIN} target="_blank" rel="noreferrer">Limitless</a>. {request.standing.team?.length ?? 0}/6 Pokémon pubblicati. Gli SP non sono pubblicati e resteranno da configurare.</p>
    <label className="select-field"><span>Destinazione</span><select value={side} onChange={(event) => setSide(event.target.value)}><option value="attacker">La mia squadra</option><option value="defender">Squadra avversaria</option></select></label>
    <p>Confermando sostituirai l’intera formazione attuale: <strong>{workspace.teams[side].join(', ') || 'squadra vuota'}</strong>, comprese le sue configurazioni.</p>
    <div className="tournament-transfer-members">{preview.members.map((member) => <article key={member.pokemon.showdownId}><header><PokemonImage pokemon={member.pokemon} size={44} /><strong>{member.pokemon.displayName}</strong></header><p>{member.build.itemName || 'Strumento non pubblicato'} · {member.build.abilityName || 'Abilità non pubblicata'} · {member.build.missingFields.includes('nature') ? 'Natura non pubblicata' : member.build.nature}</p><p>{member.moves.filter(Boolean).map((id) => getTeamMove(id)?.name).join(' / ') || 'Mosse non pubblicate'}</p><p className="team-missing-note">Da completare: {missingSetLabel(member.build)}</p></article>)}</div>
    {preview.warnings.map((warning) => <p key={warning} className="team-missing-note">{warning}</p>)}
    {(preview.issues.length > 0 || error) && <div className="import-error" role="alert">{preview.issues.map((issue) => <p key={issue}>{issue}</p>)}{error && <p>{error}</p>}</div>}
    <div className="team-library-actions"><button className="secondary-button" type="button" onClick={onClose}>Annulla</button><button className="ghost-button" type="submit" disabled={preview.issues.length > 0}>Carica e sostituisci</button></div>
  </form></dialog>
}

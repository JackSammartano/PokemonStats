import { useEffect, useRef, useState } from 'react'
import { competitiveTransferPokemon, previewCompetitiveTransfer } from '../lib/competitiveTransfer.js'
import { getTeamMove, getTeamMoveOptions } from '../lib/teamData.js'
import { formatPeriod } from '../lib/competitive/presentation.js'

const statLabels = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' }
const spreadLabel = (build) => `${build.nature} · ${Object.entries(statLabels).map(([stat, label]) => `${build.sps[stat]} ${label}`).join(' / ')}`
const movesLabel = (moves) => moves.map((id) => getTeamMove(id)?.name ?? '—').join(' / ')

export default function CompetitiveTransferDialog({ request, workspace, onApply, onClose }) {
  const dialog = useRef(null)
  const [side, setSide] = useState('attacker')
  const [moves, setMoves] = useState([])
  const [submitError, setSubmitError] = useState('')
  useEffect(() => { dialog.current.showModal() }, [])
  let pokemon, preview, error = ''
  const selection = { moves, spreadKey: request.spreadKey }
  try { pokemon = competitiveTransferPokemon(request); preview = previewCompetitiveTransfer(workspace, side, request, selection) }
  catch (caught) { error = caught.message }
  const legal = new Set(pokemon ? getTeamMoveOptions(pokemon).options.map((option) => option.value) : [])
  const exists = pokemon && workspace.teams[side].includes(pokemon.displayName)
  function submit(event) {
    event.preventDefault()
    try { onApply(side, request, selection) } catch (caught) { setSubmitError(caught.message) }
  }
  return <dialog ref={dialog} className="team-library-dialog competitive-transfer-dialog" onCancel={onClose} aria-labelledby="competitive-transfer-title"><form onSubmit={submit}><h2 id="competitive-transfer-title">{request.kind === 'moves' ? 'Trasferisci mosse' : 'Applica spread'} · {pokemon?.displayName ?? request.entry.sourceName}</h2>
    <p>Showdown · {request.snapshot.regulationLabel} · {formatPeriod(request.snapshot.period)} · soglia {request.snapshot.cutoff}</p>
    <label className="select-field"><span>Destinazione</span><select value={side} onChange={(event) => { setSide(event.target.value); setSubmitError('') }}><option value="attacker">La mia squadra</option><option value="defender">Squadra avversaria</option></select></label>
    <p>{exists ? 'Il Pokémon è già presente: aggiornerai la sua configurazione.' : 'Il Pokémon verrà aggiunto al primo slot libero.'}</p>
    {request.kind === 'moves' && <><p>Seleziona da una a quattro mosse, nell’ordine desiderato. Sono frequenze individuali: la combinazione è una tua scelta.</p><fieldset className="competitive-transfer-moves"><legend>Mosse da applicare · {moves.length}/4</legend>{request.entry.distributions.moves.entries.map((row) => { const allowed = legal.has(row.key); return <label key={row.key}><input type="checkbox" checked={moves.includes(row.key)} disabled={!allowed || (moves.length === 4 && !moves.includes(row.key))} onChange={(event) => { setMoves((current) => event.target.checked ? [...current, row.key] : current.filter((id) => id !== row.key)); setSubmitError('') }} /><span>{getTeamMove(row.key)?.name ?? row.key}{!allowed && <small> · Non disponibile nel learnset verificato</small>}</span></label> })}</fieldset></>}
    {preview && <div className="competitive-transfer-preview"><p><strong>{exists ? 'Valori attuali' : 'Prima dell’applicazione'}</strong><br />{request.kind === 'moves' ? movesLabel(preview.previousMoves) : spreadLabel(preview.previous)}</p><p><strong>Dopo l’applicazione</strong><br />{request.kind === 'moves' ? movesLabel(preview.moves) : spreadLabel(preview.changes)}</p></div>}
    {(submitError || error) && <p role="status" className="import-error">{submitError || error}</p>}
    <div className="team-library-actions"><button type="button" className="secondary-button" onClick={onClose}>Annulla</button><button type="submit" className="ghost-button" disabled={!preview}>Applica e apri Il mio team</button></div>
  </form></dialog>
}

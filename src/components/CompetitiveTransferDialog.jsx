import { useEffect, useRef, useState } from 'react'
import { competitiveTransferPokemon, previewCompetitiveTransfer } from '../lib/competitiveTransfer.js'
import { getTeamMove } from '../lib/teamData.js'
import { createCompetitiveLabels, formatPeriod } from '../lib/competitive/presentation.js'
import { BATTLE_DATA_ORIGIN } from '../lib/competitive/battleData.js'
import { REGULATION, REGULATION_ITEMS, REGULATION_MOVES, REGULATION_ROSTER } from '../lib/regulation.js'

const statLabels = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' }
const pointsLabel = (sps) => Object.entries(statLabels).map(([stat, label]) => `${sps[stat]} ${label}`).join(' / ')
const movesLabel = (moves) => moves.map((id) => getTeamMove(id)?.name ?? '—').join(' / ')
const labelFor = createCompetitiveLabels({ roster: REGULATION_ROSTER, moves: REGULATION_MOVES, items: REGULATION_ITEMS })
const fieldLabel = (kind, value, name) => kind === 'natures' ? value[0].toUpperCase() + value.slice(1) : name || labelFor(kind, value)

export default function CompetitiveTransferDialog({ request, workspace, onApply, onClose }) {
  const dialog = useRef(null)
  const [side, setSide] = useState('attacker')
  const [submitError, setSubmitError] = useState('')
  useEffect(() => { dialog.current.showModal() }, [])
  let pokemon, preview, error = ''
  const selection = request.selection
  const native = request.provider === 'champions-battle-data'
  try { pokemon = competitiveTransferPokemon(request); preview = previewCompetitiveTransfer(workspace, side, request, selection) }
  catch (caught) { error = caught.message }
  const exists = pokemon && workspace.teams[side].includes(pokemon.displayName)
  const rows = []
  if (preview?.moves) rows.push({ label: 'Mosse', before: movesLabel(preview.previousMoves), after: movesLabel(preview.moves) })
  for (const [key, label, name, kind] of [['item', 'Strumento', 'itemName', 'items'], ['ability', 'Abilità', 'abilityName', 'abilities'], ['nature', 'Natura', 'nature', 'natures']]) {
    if (preview?.changes && Object.hasOwn(preview.changes, key)) rows.push({ label, before: fieldLabel(kind, preview.previous[key], preview.previous[name]), after: fieldLabel(kind, preview.changes[key], preview.changes[name]) })
  }
  if (preview?.changes?.sps) rows.push({ label: 'SP', before: pointsLabel(preview.previous.sps), after: pointsLabel(preview.changes.sps) })
  function submit(event) {
    event.preventDefault()
    try { onApply(side, request, selection) } catch (caught) { setSubmitError(caught.message) }
  }
  return <dialog ref={dialog} className="team-library-dialog competitive-transfer-dialog" onCancel={onClose} aria-labelledby="competitive-transfer-title"><form onSubmit={submit}><h2 id="competitive-transfer-title">Esporta · {pokemon?.displayName ?? request.entry.sourceName}</h2>
    {native ? <><p>Ranked Champions · Doubles · Stagione {request.data.season === 'Current' ? 'Attuale' : request.data.season} · {request.data.date ? new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(request.data.date)) : 'Data dei dettagli non indicata'}</p><p>Campi verificati sul catalogo {REGULATION.label}; compatibilità del regolamento della stagione non certificata. Natura e SP sono scelte indipendenti.</p><p>Battle data provided by <a href={BATTLE_DATA_ORIGIN} target="_blank" rel="noreferrer">Pokémon Champions Battle Data</a>.</p></> : <p>Showdown · {request.snapshot.regulationLabel} · {formatPeriod(request.snapshot.period)} · soglia {request.snapshot.cutoff}</p>}
    <label className="select-field"><span>Destinazione</span><select value={side} onChange={(event) => { setSide(event.target.value); setSubmitError('') }}><option value="attacker">La mia squadra</option><option value="defender">Squadra avversaria</option></select></label>
    <p>{exists ? 'Il Pokémon è già presente: aggiornerai solo i campi selezionati.' : 'Il Pokémon verrà aggiunto al primo slot libero.'} Le scelte compongono la tua build, non un set completo osservato nella fonte.</p>
    {preview && <div className="competitive-transfer-preview">{rows.map((row) => <div key={row.label}><strong>{row.label}</strong><p>Prima: {row.before}</p><p>Dopo: {row.after}</p></div>)}</div>}
    {preview?.associatedNature && <p>Gli SP della fonte sono pubblicati con natura {preview.associatedNature}. Qui vengono applicati solo i campi selezionati.</p>}
    {(submitError || error) && <p role="alert" className="import-error">{submitError || error}</p>}
    <div className="team-library-actions"><button type="button" className="secondary-button" onClick={onClose}>Annulla</button><button type="submit" className="ghost-button" disabled={!preview}>Applica e apri Il mio team</button></div>
  </form></dialog>
}

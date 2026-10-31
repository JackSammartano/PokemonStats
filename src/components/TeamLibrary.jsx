import { useEffect, useRef, useState } from 'react'
import { createSavedTeam, isSavedTeamCompatible, MAX_TEAM_BACKUP_BYTES, parseTeamLibrary, putSavedTeam, serializeTeamLibrary } from '../lib/teamLibrary.js'
import { POKEMON_DATASET } from '../lib/pokemonDataset.js'
import PokemonImage from './PokemonImage'
import './TeamLibrary.css'

const byId = new Map(POKEMON_DATASET.map((pokemon) => [pokemon.showdownId, pokemon]))
const sideName = (side) => side === 'attacker' ? 'La mia squadra' : 'Squadra avversaria'
const dateLabel = (date) => new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(new Date(date))

export default function TeamLibrary({ workspace, library, error, onChange, onLoad, action, onAction, visible, onMessage, onError }) {
  const input = useRef(null)
  function download() {
    try {
      const url = URL.createObjectURL(new Blob([serializeTeamLibrary(library)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url; link.download = 'pokemonstats-squadre.json'
      document.body.append(link); link.click(); link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      onMessage('Backup scaricato. Conservalo per ripristinare le squadre su un altro browser o dispositivo.')
    } catch (error) { onError(error.message) }
  }
  async function readBackup(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      if (file.size > MAX_TEAM_BACKUP_BYTES) throw new Error('Il backup supera il limite di 2 MB.')
      const restored = parseTeamLibrary(await file.text())
      onAction({ mode: 'restore', library: restored })
    } catch (error) { onError(error.message) }
    finally { event.target.value = '' }
  }
  return <><section hidden={!visible} id="team-saved-panel" className="team-library" aria-labelledby="team-library-title">
    <header><div><h2 id="team-library-title">Squadre salvate</h2><p>{library.teams.length} squadre · Archivio in questo browser</p></div><div className="team-library-actions"><button type="button" className="secondary-button" disabled={!library.teams.length || !!error} onClick={download}>Scarica backup</button><button type="button" className="secondary-button" onClick={() => input.current.click()}>Ripristina backup</button><input ref={input} type="file" accept=".json,application/json" aria-label="File di backup delle squadre" hidden onChange={readBackup} /></div></header>
    <p className="team-library-hint">Salva una squadra con il pulsante Salva sopra i suoi Pokémon. I salvataggi restano su questo browser; scarica un backup per conservarli anche altrove.</p>
    {error && <p className="import-error" role="alert">{error}</p>}
    {!library.teams.length ? <p className="team-library-empty">Non hai ancora salvato squadre.</p> : <div className="team-library-grid">{library.teams.map((team) => {
      const compatible = isSavedTeamCompatible(team)
      return <article className="saved-team" key={team.id} data-saved-team-id={team.id}><h3>{team.name}</h3><p>{team.regulation.label} · {dateLabel(team.updatedAt)} · {team.members.length} Pokémon</p><div className="saved-team-preview">{team.members.map((member) => <PokemonImage key={member.pokemonId} pokemon={byId.get(member.pokemonId) ?? {}} size={40} alt={byId.get(member.pokemonId)?.displayName ?? member.pokemonId} />)}</div>
        {!compatible && <p className="saved-team-incompatible">Regulation o revisione diversa: caricamento non disponibile. Il salvataggio è conservato nel backup.</p>}
        <div className="team-library-actions"><button type="button" className="ghost-button" disabled={!compatible} onClick={() => onAction({ mode: 'load', id: team.id, side: 'attacker' })}>Carica nella mia squadra</button><button type="button" className="secondary-button" disabled={!compatible} onClick={() => onAction({ mode: 'load', id: team.id, side: 'defender' })}>Carica nella squadra avversaria</button></div>
        <div className="team-library-actions"><button type="button" className="secondary-button" disabled={!!error} onClick={() => onAction({ mode: 'rename', id: team.id })}>Rinomina</button><button type="button" className="secondary-button" disabled={!compatible || !!error} onClick={() => onAction({ mode: 'update', id: team.id, side: 'attacker' })}>Aggiorna</button><button type="button" className="secondary-button" disabled={!!error} onClick={() => onAction({ mode: 'delete', id: team.id })}>Elimina</button></div>
      </article>
    })}</div>}
  </section>{action && <LibraryDialog key={`${action.mode}:${action.id ?? action.side ?? ''}`} action={action} workspace={workspace} library={library} onChange={onChange} onLoad={onLoad} onClose={() => onAction(null)} onMessage={onMessage} />}</>
}

function LibraryDialog({ action, workspace, library, onChange, onLoad, onClose, onMessage }) {
  const dialog = useRef(null)
  const saved = library.teams.find((team) => team.id === action.id)
  const [name, setName] = useState(saved?.name ?? '')
  const [side, setSide] = useState(action.side ?? 'attacker')
  const [error, setError] = useState('')
  useEffect(() => { dialog.current.showModal() }, [])
  const titles = { save: 'Salva squadra', rename: 'Rinomina squadra', update: 'Aggiorna squadra salvata', load: 'Carica squadra', delete: 'Elimina squadra salvata', restore: 'Ripristina backup' }
  function apply(event) {
    event.preventDefault(); setError('')
    try {
      if (action.mode === 'load') { if (!saved) throw new Error('Il salvataggio non è più disponibile.'); onLoad(side, saved); onMessage(`“${saved.name}” caricata in ${sideName(side).toLowerCase()}.`) }
      else if (action.mode === 'delete') { onChange((current) => ({ ...current, teams: current.teams.filter((team) => team.id !== action.id) })); onMessage('Squadra eliminata dall’archivio. Le squadre attive restano invariate.') }
      else if (action.mode === 'restore') { onChange(() => action.library, { restore: true }); onMessage(`Ripristinate ${action.library.teams.length} squadre dal backup.`) }
      else if (action.mode === 'rename') { if (!saved) throw new Error('Il salvataggio non è più disponibile.'); onChange((current) => putSavedTeam(current, { ...saved, name, updatedAt: new Date().toISOString() })); onMessage('Nome aggiornato.') }
      else {
        if (action.mode === 'update' && !saved) throw new Error('Il salvataggio non è più disponibile.')
        const team = createSavedTeam(workspace, side, action.mode === 'update' ? saved.name : name, { previous: action.mode === 'update' ? saved : undefined })
        onChange((current) => putSavedTeam(current, team)); onMessage(`“${team.name}” ${action.mode === 'update' ? 'aggiornata' : 'salvata'}.`)
      }
      onClose()
    } catch (error) { setError(error.message) }
  }
  return <dialog ref={dialog} className="team-library-dialog" onCancel={onClose} aria-labelledby="team-library-dialog-title"><form onSubmit={apply}><h2 id="team-library-dialog-title">{titles[action.mode]}</h2>
    {(action.mode === 'save' || action.mode === 'rename') && <label className="select-field"><span>Nome della squadra</span><input autoFocus required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Es. Rain M-C" /></label>}
    {action.mode === 'update' && <label className="select-field"><span>Usa i Pokémon e le configurazioni di</span><select value={side} onChange={(event) => setSide(event.target.value)}><option value="attacker">La mia squadra</option><option value="defender">Squadra avversaria</option></select></label>}
    {(action.mode === 'save' || action.mode === 'update') && <p>{workspace.teams[side].length} Pokémon da {sideName(side).toLowerCase()}: {workspace.teams[side].join(', ') || 'squadra vuota'}. {action.mode === 'update' && `Sostituirai il salvataggio “${saved?.name ?? ''}”.`}</p>}
    {action.mode === 'load' && <><p>Caricare “{saved?.name}” in <strong>{sideName(side)}</strong>?</p><p>La squadra attuale ({workspace.teams[side].join(', ') || 'vuota'}) verrà sostituita insieme alle sue configurazioni.</p></>}
    {action.mode === 'delete' && <p>Eliminare “{saved?.name}” dall’archivio?</p>}
    {action.mode === 'restore' && <><p>Il backup contiene {action.library.teams.length} squadre: {action.library.teams.map((team) => team.name).join(', ') || 'archivio vuoto'}.</p><p>Sostituirà tutte le {library.teams.length} squadre dell’archivio locale. Le due squadre attive resteranno invariate.</p></>}
    {error && <p className="import-error" role="alert">{error}</p>}
    <div className="team-library-actions"><button type="button" className="secondary-button" onClick={onClose}>Annulla</button><button type="submit" className="ghost-button" disabled={(action.mode === 'save' || action.mode === 'update') && !workspace.teams[side].length}>{action.mode === 'save' ? 'Salva' : action.mode === 'load' ? 'Carica e sostituisci' : action.mode === 'restore' ? 'Ripristina archivio' : action.mode === 'delete' ? 'Elimina' : 'Conferma'}</button></div>
  </form></dialog>
}

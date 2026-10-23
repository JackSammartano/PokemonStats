import { useEffect, useRef, useState } from 'react'
import { parseShowdownTeam } from '../lib/showdownImport.js'
import { getWorkspaceBuild } from '../lib/teamWorkspace.js'
import { getPokemonMoveSlots } from '../lib/damage/championsMoveSets.js'
import { getTeamMove } from '../lib/teamData.js'
import PokemonImage from './PokemonImage'
import { getMegaAction } from '../lib/megaEvolution.js'

export default function SquadSection({ side, title, team, roster, builds, moveSets, selected, onSelect, onConfigure, onInfo, onMegaToggle, onAdd, onRemove, onClear, onImport, onCatalog }) {
  const [message, setMessage] = useState('')
  const [editor, setEditor] = useState(null)
  const [busy, setBusy] = useState(false)
  const dialog = useRef(null)
  const section = useRef(null)
  const megaFocusTarget = useRef(null)
  useEffect(() => { if (editor && !dialog.current.open) dialog.current.showModal() }, [editor])
  useEffect(() => {
    if (!megaFocusTarget.current) return
    const card = [...section.current.querySelectorAll('.squad-member')].find((entry) => entry.dataset.pokemonName === megaFocusTarget.current)
    card?.querySelector('.pokemon-mega-toggle')?.focus({ preventScroll: true })
    megaFocusTarget.current = null
  }, [team])

  function importText(text) {
    const result = parseShowdownTeam(text)
    onImport(result)
    setMessage(`Importati ${result.members.length} Pokémon. ${result.warnings.join(' ')}`)
    setEditor(null)
  }

  async function importClipboard() {
    let text = ''
    setBusy(true)
    try {
      text = await navigator.clipboard.readText()
      importText(text)
    } catch (error) {
      setEditor({ text, error: text ? error.message : 'Incolla qui l’export Showdown se la lettura degli appunti non è disponibile.' })
    } finally { setBusy(false) }
  }

  return (
    <section ref={section} className={`squad-section squad-${side}`} aria-labelledby={`squad-title-${side}`}>
      <header className="squad-header">
        <div><p className="eyebrow compact">{side === 'attacker' ? 'La tua formazione' : 'Il tuo avversario'}</p><h2 id={`squad-title-${side}`}>{title} <span>{team.length}/6</span></h2></div>
        <div className="squad-actions">
          <button className="ghost-button" type="button" disabled={busy} onClick={importClipboard} aria-label={`Importa ${title.toLowerCase()} da Showdown`}>{busy ? 'Lettura…' : 'Importa'}</button>
          <button className="secondary-button" type="button" disabled={!team.length} onClick={onClear}>Svuota</button>
        </div>
      </header>
      <p className="squad-import-hint">Importa legge dagli appunti l’export testuale di Showdown e sostituisce questa squadra.</p>
      {message && <p className="squad-import-message" role="status">{message}</p>}
      <div className="squad-add-controls">
        <label className="select-field"><span>Aggiungi Pokémon</span>
          <select value="" disabled={team.length >= 6 || !roster.length} aria-label={`Aggiungi Pokémon a ${title.toLowerCase()}`} onChange={(event) => onAdd(event.target.value)}>
            <option value="">{team.length >= 6 ? 'Squadra completa' : 'Scegli dal roster M-C…'}</option>
            {roster.filter((entry) => !team.some((member) => member.displayName === entry.displayName)).map((entry) => <option key={entry.displayName} value={entry.displayName}>{entry.displayName}</option>)}
          </select>
        </label>
        <button className="secondary-button" type="button" onClick={onCatalog}>Sfoglia il catalogo</button>
      </div>
      <div className="squad-roster">
        {Array.from({ length: 6 }, (_, index) => {
          const pokemon = team[index]
          if (!pokemon) return <div className="squad-empty-slot" key={`empty-${index}`}>Slot {index + 1}</div>
          const build = getWorkspaceBuild(builds, side, pokemon.displayName)
          const moves = getPokemonMoveSlots(moveSets, side, pokemon)
          const mega = getMegaAction(pokemon, build, team.map((entry) => entry.displayName))
          return (
            <article className={`squad-member ${selected === pokemon.displayName ? 'selected' : ''}`} key={pokemon.displayName} data-pokemon-name={pokemon.displayName}>
              <button type="button" className="pokemon-info-button" aria-label={`Copertura e matchup di ${pokemon.displayName} · ${title}`} aria-haspopup="dialog" onClick={() => onInfo(pokemon.displayName)}>i</button>
              {mega && <button type="button" className={`pokemon-mega-toggle${mega.evolving ? '' : ' is-mega'}`} title={mega.label} aria-label={`${mega.label} · ${title}`} disabled={mega.disabled} onClick={() => { megaFocusTarget.current = mega.targetName; onMegaToggle(pokemon.displayName) }}>{mega.evolving ? 'M' : 'm'}</button>}
              <div className="squad-member-heading">
                <PokemonImage pokemon={pokemon} size={52} />
                <div><strong>{pokemon.displayName}</strong><div className="type-row mini">{pokemon.types.map((type) => <span className={`type-badge type-${type}`} key={type}>{type}</span>)}</div></div>
              </div>
              <p className="squad-member-build">{build.nature[0].toUpperCase() + build.nature.slice(1)} · L{build.level}{build.gender ? ` · ${build.gender}` : ''}</p>
              <p className="squad-member-build">{build.abilityName || build.ability || 'Abilità da impostare'}<br />{build.itemName || build.item || 'Nessun oggetto'}</p>
              <div className="squad-member-moves">{moves.map((id, slot) => { const move = getTeamMove(id); return <span key={slot} title={move?.category === 'status' ? 'Mossa di stato' : move?.type} className={move ? `squad-move type-${move.type}` : 'squad-move empty'}>{move?.name || '—'}</span> })}</div>
              <div className="squad-member-actions">
                <button type="button" aria-pressed={selected === pokemon.displayName} onClick={() => onSelect(pokemon.displayName)}>{selected === pokemon.displayName ? 'Selezionato' : 'Confronta'}</button>
                <button type="button" onClick={() => onConfigure(pokemon.displayName)}>Configura</button>
                <button className="squad-remove" type="button" aria-label={`Rimuovi ${pokemon.displayName} da ${title.toLowerCase()}`} onClick={() => onRemove(pokemon.displayName)}>Rimuovi</button>
              </div>
            </article>
          )
        })}
      </div>
      {editor && <dialog ref={dialog} className="showdown-import-dialog" onCancel={() => setEditor(null)} aria-labelledby={`import-title-${side}`}>
        <h2 id={`import-title-${side}`}>Importa {title.toLowerCase()}</h2>
        <p>Incolla il testo dell’export Showdown. La squadra attuale viene sostituita solo se il testo è valido.</p>
        <p className="import-error" role="alert">{editor.error}</p>
        <textarea autoFocus aria-label={`Export Showdown per ${title.toLowerCase()}`} value={editor.text} onChange={(event) => setEditor({ ...editor, text: event.target.value })} placeholder={'Garchomp-Mega-Z @ Garchompite Z\nAbility: Levitate\nLevel: 50\n…'} />
        <div className="squad-actions"><button className="secondary-button" type="button" onClick={() => setEditor(null)}>Annulla</button><button className="ghost-button" type="button" onClick={() => { try { importText(editor.text) } catch (error) { setEditor({ ...editor, error: error.message }) } }}>Importa testo</button></div>
      </dialog>}
    </section>
  )
}

export function CompetitiveChoice({ choice, onToggle, children }) {
  if (!choice) return <li>{children}</li>
  return <li className={`competitive-choice${choice.checked ? ' is-selected' : ''}${choice.disabled ? ' is-disabled' : ''}`} onClick={(event) => { if (!choice.disabled && !event.target.closest('button,a,input')) onToggle() }}>
    <input type="checkbox" checked={choice.checked} disabled={choice.disabled} aria-label={`Seleziona ${choice.label}`} onChange={onToggle} />
    <div className="competitive-choice-content">{children}{choice.reason && <p className="competitive-choice-reason">{choice.reason}</p>}</div>
  </li>
}

export function CompetitiveExport({ selection, request, onExport }) {
  return <div className="competitive-export"><p>{selection.count ? `${selection.count} voci selezionate · Verranno applicati solo i campi scelti.` : 'Seleziona le voci degli elenchi per comporre la tua build.'}</p><button type="button" className="ghost-button" disabled={!request || !selection.count} onClick={() => onExport({ ...request, selection: { ...selection.selection, moves: [...selection.selection.moves] } })}>Esporta</button></div>
}

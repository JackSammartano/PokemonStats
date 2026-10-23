import { useEffect, useId, useRef, useState } from 'react'

export default function PokemonActionMenu({ name, actions, onAction }) {
  const [open, setOpen] = useState(false)
  const [above, setAbove] = useState(false)
  const container = useRef(null)
  const trigger = useRef(null)
  const lastFirst = useRef(false)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    window.scrollTo({ top: window.scrollY, left: window.scrollX, behavior: 'instant' })
    const position = () => {
      const anchor = trigger.current?.getBoundingClientRect()
      const menu = container.current?.querySelector('.pokemon-action-menu')?.getBoundingClientRect()
      if (anchor && menu) setAbove(anchor.bottom + 8 + menu.height > window.innerHeight && anchor.top > menu.height + 12)
    }
    window.addEventListener('scroll', position, true)
    window.addEventListener('resize', position)
    const buttons = container.current.querySelectorAll('.pokemon-action-menu button:not(:disabled)')
    buttons[lastFirst.current ? buttons.length - 1 : 0]?.focus({ preventScroll: true })
    container.current.querySelector('.pokemon-action-menu')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
    position()
    const frame = window.requestAnimationFrame(position)
    const dismiss = (event) => { if (!container.current?.contains(event.target)) setOpen(false) }
    const routeChanged = () => setOpen(false)
    document.addEventListener('pointerdown', dismiss)
    window.addEventListener('popstate', routeChanged)
    window.addEventListener('hashchange', routeChanged)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('scroll', position, true)
      window.removeEventListener('resize', position)
      window.cancelAnimationFrame(frame)
      window.removeEventListener('popstate', routeChanged)
      window.removeEventListener('hashchange', routeChanged)
    }
  }, [open])

  function close() {
    setOpen(false)
    trigger.current?.focus()
  }

  function handleKeys(event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return }
    if (event.key === 'Tab') { setOpen(false); return }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const buttons = [...container.current.querySelectorAll('.pokemon-action-menu button:not(:disabled)')]
    const current = buttons.indexOf(document.activeElement)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
    buttons[next]?.focus()
  }

  return (
    <div className="pokemon-card-actions" ref={container} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <button
        className="team-toggle" type="button" ref={trigger}
        aria-label={`Azioni per ${name}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
        title={`Scegli dove aggiungere ${name}`}
        onClick={() => { lastFirst.current = false; setAbove(false); setOpen((value) => !value) }}
        onKeyDown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); lastFirst.current = event.key === 'ArrowUp'; setAbove(false); setOpen(true) } }}
      ><span aria-hidden="true">+</span> Aggiungi <span className="action-menu-chevron" aria-hidden="true">⌄</span></button>
      {open && <div className={`pokemon-action-menu${above ? ' above' : ''}`} id={menuId} role="menu" aria-label={`Destinazione di ${name}`} onKeyDown={handleKeys}>
        <p>{name}</p>
        {actions.map((action) => <button
          type="button" key={action.id} role={action.id.startsWith('compare-') ? 'menuitem' : 'menuitemcheckbox'}
          aria-checked={action.id.startsWith('compare-') ? undefined : action.selected}
          disabled={action.disabled} onClick={() => { close(); onAction(action.id) }}
        >
          <span>{action.label}{action.selected && <span aria-hidden="true"> ✓</span>}</span>
          <small>{action.description}</small>
        </button>)}
      </div>}
    </div>
  )
}

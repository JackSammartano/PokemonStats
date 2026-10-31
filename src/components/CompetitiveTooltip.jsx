import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createCompetitiveDescriptions } from '../lib/competitive/descriptions.js'
import { REGULATION, REGULATION_ITEMS, REGULATION_MOVES, REGULATION_ROSTER } from '../lib/regulation.js'

const describe = createCompetitiveDescriptions({ moves: REGULATION_MOVES, items: REGULATION_ITEMS, roster: REGULATION_ROSTER })
// Only this component owns the active overlay; no provider data or browser storage is involved.
let dismissActive = null

export default function CompetitiveTooltip({ kind, value, children }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const trigger = useRef(null), tooltip = useRef(null), closeTimer = useRef(null)
  const pinned = useRef(false), overTooltip = useRef(false)
  const id = useId()
  const info = describe(kind, value)
  const cancelClose = useCallback(() => clearTimeout(closeTimer.current), [])
  const dismiss = useCallback(() => {
    cancelClose()
    pinned.current = false
    overTooltip.current = false
    setOpen(false)
    setPosition(null)
    if (dismissActive === dismiss) dismissActive = null
  }, [cancelClose])

  function reveal() {
    cancelClose()
    if (dismissActive && dismissActive !== dismiss) dismissActive()
    dismissActive = dismiss
    setOpen(true)
  }
  function scheduleClose() {
    cancelClose()
    closeTimer.current = setTimeout(() => {
      if (!pinned.current && !overTooltip.current && document.activeElement !== trigger.current) dismiss()
    }, 140)
  }
  useEffect(() => () => {
    cancelClose()
    if (dismissActive === dismiss) dismissActive = null
  }, [cancelClose, dismiss])

  useLayoutEffect(() => {
    if (!open || !trigger.current || !tooltip.current) return
    const anchor = trigger.current.getBoundingClientRect(), box = tooltip.current.getBoundingClientRect()
    const margin = 12, gap = 8
    const width = document.documentElement.clientWidth, height = window.visualViewport?.height ?? window.innerHeight
    const left = Math.max(margin, Math.min(anchor.left, width - box.width - margin))
    const top = anchor.bottom + gap + box.height <= height - margin ? anchor.bottom + gap : Math.max(margin, anchor.top - gap - box.height)
    setPosition({ left, top })
  }, [open, kind, value])

  useEffect(() => {
    if (!open) return
    const outside = (event) => { if (!trigger.current?.contains(event.target) && !tooltip.current?.contains(event.target)) dismiss() }
    const keyboard = (event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismiss() } }
    const scroll = (event) => { if (!(event.target instanceof Node) || !tooltip.current?.contains(event.target)) dismiss() }
    document.addEventListener('pointerdown', outside, true)
    document.addEventListener('keydown', keyboard, true)
    window.addEventListener('scroll', scroll, true)
    window.addEventListener('resize', dismiss)
    window.addEventListener('hashchange', dismiss)
    window.addEventListener('popstate', dismiss)
    return () => {
      document.removeEventListener('pointerdown', outside, true)
      document.removeEventListener('keydown', keyboard, true)
      window.removeEventListener('scroll', scroll, true)
      window.removeEventListener('resize', dismiss)
      window.removeEventListener('hashchange', dismiss)
      window.removeEventListener('popstate', dismiss)
    }
  }, [open, dismiss])

  if (!info) return children
  return <>
    <button ref={trigger} type="button" className="competitive-info-trigger" aria-describedby={open ? id : undefined}
      onPointerEnter={(event) => { if (event.pointerType === 'mouse') reveal() }} onPointerLeave={scheduleClose}
      onFocus={reveal} onBlur={() => { if (!overTooltip.current) dismiss() }}
      onClick={() => { if (pinned.current) dismiss(); else { pinned.current = true; reveal() } }}>
      {children}
    </button>
    {open && createPortal(<div ref={tooltip} id={id} role="tooltip" className="competitive-info-tooltip"
      style={{ left: position?.left ?? 0, top: position?.top ?? 0, visibility: position ? 'visible' : 'hidden' }}
      onPointerEnter={() => { overTooltip.current = true; cancelClose() }} onPointerLeave={() => { overTooltip.current = false; scheduleClose() }}>
      <strong className="competitive-info-title">{info.name}</strong>
      <small>{info.kind} · {REGULATION.label}</small>
      <p lang={info.lang}>{info.description}</p>
      {info.facts.length > 0 && <dl>{info.facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}
    </div>, document.body)}
  </>
}

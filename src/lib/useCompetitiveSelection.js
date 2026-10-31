import { useEffect, useMemo, useState } from 'react'
import { competitiveTransferOptions, emptyCompetitiveSelection, TRANSFER_CATEGORIES } from './competitiveTransfer.js'

export function useCompetitiveSelection(request, active = true) {
  const [selection, setSelection] = useState(emptyCompetitiveSelection)
  useEffect(() => { if (!active) setSelection(emptyCompetitiveSelection()) }, [active])
  const options = useMemo(() => request ? Object.fromEntries(TRANSFER_CATEGORIES.map((category) => [category, competitiveTransferOptions(request, category)])) : {}, [request])
  function toggle(category, key) {
    if (!request) return
    const option = options[category]?.find((option) => option.key === key)
    if (!option || option.disabledReason) return
    setSelection((current) => category === 'moves' ? { ...current, moves: current.moves.includes(key) ? current.moves.filter((value) => value !== key) : current.moves.length < 4 ? [...current.moves, key] : current.moves } : { ...current, [category]: current[category] === key ? null : key })
  }
  const count = selection.moves.length + TRANSFER_CATEGORIES.slice(1).filter((category) => selection[category] !== null).length
  function state(category, key) {
    const option = options[category]?.find((option) => option.key === key)
    const checked = category === 'moves' ? selection.moves.includes(key) : selection[category] === key
    return { checked, disabled: !option || !!option.disabledReason || (category === 'moves' && selection.moves.length === 4 && !checked), reason: option?.disabledReason ?? '', label: option?.label ?? key }
  }
  return { selection, count, toggle, state, options }
}

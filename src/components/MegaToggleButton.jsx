export default function MegaToggleButton({ action, onToggle, context }) {
  if (!action) return null
  return <button
    type="button"
    className={`pokemon-mega-toggle${action.evolving ? '' : ' is-mega'}`}
    title={action.label}
    aria-label={context ? `${action.label} · ${context}` : action.label}
    disabled={action.disabled}
    onClick={onToggle}
  >{action.evolving ? 'M' : 'm'}</button>
}

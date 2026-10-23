export function getPokemonCardActions(name, teams, leftName, rightName) {
  const actions = [['attacker', 'Mia squadra'], ['defender', 'Squadra avversaria']].map(([id, label]) => {
    const names = teams[id]
    const selected = names.includes(name)
    const full = names.length >= 6
    return {
      id, label, selected, disabled: full && !selected,
      description: selected ? 'Già presente · rimuovi dalla squadra' : full ? 'Squadra completa · 6/6' : `Aggiungi · ${names.length}/6 Pokémon`,
    }
  })
  const slots = [leftName, rightName]
  const existing = slots.indexOf(name)
  const empty = slots.findIndex((value) => !value)
  const targets = existing >= 0 ? [existing] : empty >= 0 ? [empty] : [0, 1]
  return [...actions, ...targets.map((slot) => ({
    id: `compare-${slot + 1}`, label: `Confronta ${slot + 1}`,
    selected: existing === slot, disabled: false,
    description: existing === slot ? 'Già selezionato · apri confronto' : slots[slot] ? `Sostituisci ${slots[slot]}` : 'Aggiungi al primo slot libero',
  }))]
}

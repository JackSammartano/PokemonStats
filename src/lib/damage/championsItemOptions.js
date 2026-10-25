import { REGULATION_ITEMS, REGULATION_MEGA_EVOLUTIONS } from '../regulation.js'

// Functional categories are presentation metadata, independent of damage coverage.
const ITEM_GROUPS = [
  ['Attacco', new Set(['binding-band', 'black-belt', 'black-glasses', 'charcoal', 'choice-band', 'choice-specs', 'dragon-fang', 'expert-belt', 'fairy-feather', 'hard-stone', 'king-s-rock', 'leek', 'life-orb', 'light-ball', 'magnet', 'metal-coat', 'metronome', 'miracle-seed', 'muscle-band', 'mystic-water', 'never-melt-ice', 'normal-gem', 'poison-barb', 'scope-lens', 'sharp-beak', 'silk-scarf', 'silver-powder', 'soft-sand', 'spell-tag', 'twisted-spoon', 'wise-glasses'])],
  ['Difesa e recupero', new Set(['air-balloon', 'assault-vest', 'big-root', 'bright-powder', 'electric-seed', 'focus-band', 'focus-sash', 'grassy-seed', 'leftovers', 'misty-seed', 'psychic-seed', 'rocky-helmet', 'shell-bell'])],
  ['Velocità', new Set(['choice-scarf', 'iron-ball', 'quick-claw'])],
]
const GROUP_LABELS = ['Megapietre compatibili', 'Bacche', ...ITEM_GROUPS.map(([label]) => label), 'Supporto e utilità']

export function getPokemonDamageItemOptions(pokemon, currentItem = '', currentName = '') {
  const id = pokemon?.showdownId
  const mega = REGULATION_MEGA_EVOLUTIONS.find((link) => link.megaId === id)
  const compatibleStones = new Set(REGULATION_MEGA_EVOLUTIONS
    .filter((link) => mega ? link.megaId === id : link.baseId === id)
    .map((link) => link.itemId))
  const groups = new Map(GROUP_LABELS.map((label) => [label, []]))
  for (const item of REGULATION_ITEMS) {
    if (item.megaStone && !compatibleStones.has(item.id)) continue
    const label = item.megaStone ? GROUP_LABELS[0] : item.isBerry ? 'Bacche'
      : ITEM_GROUPS.find(([, ids]) => ids.has(item.id))?.[0] ?? 'Supporto e utilità'
    groups.get(label).push({ value: item.id, label: item.name })
  }
  const options = [{ value: '', label: 'Nessuno' }, ...[...groups]
    .filter(([, items]) => items.length)
    .map(([label, items]) => ({ label, options: items.sort((a, b) => a.label.localeCompare(b.label, 'en')) }))]
  if (currentItem && !options.some((option) => (option.options ?? [option]).some((item) => item.value === currentItem))) {
    const metadata = REGULATION_ITEMS.find((item) => item.id === currentItem)
    options.push({ label: metadata?.megaStone ? 'Megapietra non compatibile (già equipaggiata)' : 'Oggetto importato',
      options: [{ value: currentItem, label: currentName || metadata?.name || currentItem }] })
  }
  return options
}

import { toId } from './championsMath.js'
import { CHAMPIONS_ADDITIONAL_ITEMS } from '../../data/championsAdditionalItems.js'
import { REGULATION_ITEMS } from '../regulation.js'
import { CHAMPIONS_ITEM_COVERAGE } from '../../data/championsItemCoverage.js'

export const CHAMPIONS_ITEMS = {
  '': {
    name: 'None',
  },
  'assault-vest': {
    name: 'Assault Vest',
  },
  'black-belt': {
    boostType: 'fighting',
    name: 'Black Belt',
  },
  'black-glasses': {
    boostType: 'dark',
    name: 'Black Glasses',
  },
  charcoal: {
    boostType: 'fire',
    name: 'Charcoal',
  },
  'choice-band': {
    name: 'Choice Band',
  },
  'choice-specs': {
    name: 'Choice Specs',
  },
  'chople-berry': {
    name: 'Chople Berry',
    resistType: 'fighting',
  },
  'colbur-berry': {
    name: 'Colbur Berry',
    resistType: 'dark',
  },
  'dragon-fang': {
    boostType: 'dragon',
    name: 'Dragon Fang',
  },
  'expert-belt': {
    name: 'Expert Belt',
  },
  'fairy-feather': {
    boostType: 'fairy',
    name: 'Fairy Feather',
  },
  'hard-stone': {
    boostType: 'rock',
    name: 'Hard Stone',
  },
  'life-orb': {
    name: 'Life Orb',
  },
  magnet: {
    boostType: 'electric',
    name: 'Magnet',
  },
  'metal-coat': {
    boostType: 'steel',
    name: 'Metal Coat',
  },
  'miracle-seed': {
    boostType: 'grass',
    name: 'Miracle Seed',
  },
  'mystic-water': {
    boostType: 'water',
    name: 'Mystic Water',
  },
  'never-melt-ice': {
    boostType: 'ice',
    name: 'Never-Melt Ice',
  },
  'occa-berry': {
    name: 'Occa Berry',
    resistType: 'fire',
  },
  'poison-barb': {
    boostType: 'poison',
    name: 'Poison Barb',
  },
  'shuca-berry': {
    name: 'Shuca Berry',
    resistType: 'ground',
  },
  'sharp-beak': {
    boostType: 'flying',
    name: 'Sharp Beak',
  },
  'silk-scarf': {
    boostType: 'normal',
    name: 'Silk Scarf',
  },
  'silver-powder': {
    boostType: 'bug',
    name: 'Silver Powder',
  },
  'soft-sand': {
    boostType: 'ground',
    name: 'Soft Sand',
  },
  'spell-tag': {
    boostType: 'ghost',
    name: 'Spell Tag',
  },
  'twisted-spoon': {
    boostType: 'psychic',
    name: 'Twisted Spoon',
  },
  'yache-berry': {
    name: 'Yache Berry',
    resistType: 'ice',
  },
}

Object.assign(CHAMPIONS_ITEMS, CHAMPIONS_ADDITIONAL_ITEMS)

export const CHAMPIONS_SET_ITEM_IDS = new Set([
  'abomasite',
  'aerodactylite',
  'aggronite',
  'alakazite',
  'altarianite',
  'ampharosite',
  'banettite',
  'beedrillite',
  'black-glasses',
  'blastoisinite',
  'cameruptite',
  'charcoal',
  'charizardite-x',
  'charizardite-y',
  'choice-scarf',
  'chople-berry',
  'colbur-berry',
  'focus-sash',
  'galladite',
  'garchompite',
  'gardevoirite',
  'gengarite',
  'gyaradosite',
  'heracronite',
  'houndoominite',
  'kangaskhanite',
  'leftovers',
  'lopunnite',
  'lucarionite',
  'lum-berry',
  'manectite',
  'medichamite',
  'mental-herb',
  'mystic-water',
  'occa-berry',
  'pidgeotite',
  'pinsirite',
  'sablenite',
  'scizorite',
  'sharpedonite',
  'shuca-berry',
  'silk-scarf',
  'sitrus-berry',
  'slowbronite',
  'spell-tag',
  'steelixite',
  'tyranitarite',
  'venusaurite',
  'yache-berry',
])

function toItemOption([value, item]) {
  return {
    label: item.name,
    value,
  }
}

function groupDamageItemOptions(entries) {
  const options = entries.map(toItemOption)
  const mainOptions = options.filter(({ value }) => !CHAMPIONS_ITEMS[value]?.resistType)
  const berryOptions = options.filter(({ value }) => CHAMPIONS_ITEMS[value]?.resistType)

  if (berryOptions.length === 0) {
    return mainOptions
  }

  return [
    ...mainOptions,
    {
      label: 'Berry',
      options: berryOptions,
    },
  ]
}

export function getChampionsDamageItemOptions() {
  return groupDamageItemOptions(
    Object.entries(CHAMPIONS_ITEMS)
      .filter(([value]) => ['implemented', 'no-direct-effect'].includes(getItemCoverage(value)) && (value === '' || CHAMPIONS_SET_ITEM_IDS.has(value))),
  )
}

export function getAllDamageItemOptions() {
  return groupDamageItemOptions(Object.entries(CHAMPIONS_ITEMS).filter(([value]) => ['implemented', 'no-direct-effect'].includes(getItemCoverage(value))))
}

export function getItem(item) {
  return CHAMPIONS_ITEMS[toId(item)] ?? CHAMPIONS_ITEMS['']
}

export function getItemCoverage(item, items = REGULATION_ITEMS) {
  const id = toId(item)
  if (!id) return 'no-direct-effect'
  const reviewed = CHAMPIONS_ITEM_COVERAGE[id]
  if (!reviewed) return 'unknown'
  const fingerprint = items.find((entry) => entry.id === id)?.fingerprint
  return fingerprint && reviewed.fingerprints.includes(fingerprint) ? reviewed.status : 'changed'
}

export function getItemCoverageNote(item, name, items = REGULATION_ITEMS) {
  const id = toId(item)
  const coverage = getItemCoverage(id, items)
  if (['implemented', 'no-direct-effect'].includes(coverage)) return ''
  const metadata = CHAMPIONS_ITEMS[id]
  const label = name || metadata?.name || item
  return coverage === 'changed' ? `Il comportamento di ${label} richiede una nuova verifica per questa regulation.` : `Effetto di ${label} non ancora verificato.`
}

export function getItemBasePowerMods({ attacker, move }) {
  const item = getItem(attacker.item)
  const mods = []
  if (item.boostType === toId(move.type)) {
    mods.push(4915)
  }
  if ((toId(attacker.item) === 'muscle-band' && move.category === 'physical') || (toId(attacker.item) === 'wise-glasses' && move.category === 'special')) mods.push(4505)
  if (attacker.gemActive && move.type === 'normal') mods.push(5325)
  return mods
}

export function getItemAttackMods({ attacker, move }) {
  const itemId = toId(attacker.item)

  if (itemId === 'light-ball' && toId(attacker.originalSpeciesId ?? attacker.showdownId ?? attacker.name) === 'pikachu') return [8192]

  if (itemId === 'choice-band' && move.category === 'physical') {
    return [6144]
  }

  if (itemId === 'choice-specs' && move.category === 'special') {
    return [6144]
  }

  return []
}

export function getItemDefenseMods({ defender, move }) {
  if (toId(defender.item) === 'assault-vest' && move.category === 'special' && move.overrideDefensiveStat !== 'def') {
    return [6144]
  }

  return []
}

export function getItemFinalMods({ attacker, defender, effectiveness, move }) {
  const mods = []
  const itemId = toId(attacker.item)

  if (itemId === 'expert-belt' && effectiveness > 1) {
    mods.push(4915)
  } else if (itemId === 'life-orb') {
    mods.push(5324)
  } else if (itemId === 'metronome') {
    const uses = Math.max(0, Math.min(5, attacker.consecutiveUses ?? 0))
    mods.push([4096, 4915, 5734, 6553, 7372, 8192][uses])
  }

  const defenderItem = getItem(defender.item)

  if (
    defenderItem.resistType === toId(move.type) &&
    (effectiveness > 1 || toId(move.type) === 'normal') &&
    toId(attacker.ability) !== 'unnerve'
  ) {
    mods.push(toId(defender.ability) === 'ripen' ? 1024 : 2048)
  }

  return mods
}

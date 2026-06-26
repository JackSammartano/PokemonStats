import { toId } from './championsMath.js'

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
  'poison-barb': {
    boostType: 'poison',
    name: 'Poison Barb',
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
}

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

export function getChampionsDamageItemOptions() {
  return Object.entries(CHAMPIONS_ITEMS)
    .filter(([value]) => value === '' || CHAMPIONS_SET_ITEM_IDS.has(value))
    .map(([value, item]) => ({
      label: item.name,
      value,
    }))
}

export function getAllDamageItemOptions() {
  return Object.entries(CHAMPIONS_ITEMS).map(([value, item]) => ({
    label: item.name,
    value,
  }))
}

export function getItem(item) {
  return CHAMPIONS_ITEMS[toId(item)] ?? CHAMPIONS_ITEMS['']
}

export function getItemBasePowerMods({ attacker, move }) {
  const item = getItem(attacker.item)

  if (item.boostType === toId(move.type)) {
    return [4915]
  }

  return []
}

export function getItemAttackMods({ attacker, move }) {
  const itemId = toId(attacker.item)

  if (itemId === 'choice-band' && move.category === 'physical') {
    return [6144]
  }

  if (itemId === 'choice-specs' && move.category === 'special') {
    return [6144]
  }

  return []
}

export function getItemDefenseMods({ defender, move }) {
  if (toId(defender.item) === 'assault-vest' && move.category === 'special') {
    return [6144]
  }

  return []
}

export function getItemFinalMods({ attacker, effectiveness }) {
  const itemId = toId(attacker.item)

  if (itemId === 'expert-belt' && effectiveness > 1) {
    return [4915]
  }

  if (itemId === 'life-orb') {
    return [5324]
  }

  return []
}

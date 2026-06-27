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
      .filter(([value]) => value === '' || CHAMPIONS_SET_ITEM_IDS.has(value)),
  )
}

export function getAllDamageItemOptions() {
  return groupDamageItemOptions(Object.entries(CHAMPIONS_ITEMS))
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

export function getItemFinalMods({ attacker, defender, effectiveness, move }) {
  const mods = []
  const itemId = toId(attacker.item)

  if (itemId === 'expert-belt' && effectiveness > 1) {
    mods.push(4915)
  } else if (itemId === 'life-orb') {
    mods.push(5324)
  }

  const defenderItem = getItem(defender.item)

  if (
    defenderItem.resistType === toId(move.type) &&
    effectiveness > 1 &&
    toId(attacker.ability) !== 'unnerve'
  ) {
    mods.push(toId(defender.ability) === 'ripen' ? 1024 : 2048)
  }

  return mods
}

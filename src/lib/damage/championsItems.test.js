import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CHAMPIONS_SET_ITEM_IDS,
  getAllDamageItemOptions,
  getChampionsDamageItemOptions,
} from './championsItems.js'

function flattenOptions(options) {
  return options.flatMap((option) => option.options ?? option)
}

describe('Champions item options', () => {
  it('keeps only Champions set items with implemented damage effects', () => {
    assert.deepEqual(getChampionsDamageItemOptions(), [
      { label: 'None', value: '' },
      { label: 'Black Glasses', value: 'black-glasses' },
      { label: 'Charcoal', value: 'charcoal' },
      { label: 'Mystic Water', value: 'mystic-water' },
      { label: 'Silk Scarf', value: 'silk-scarf' },
      { label: 'Spell Tag', value: 'spell-tag' },
      {
        label: 'Berry',
        options: [
          { label: 'Chople Berry', value: 'chople-berry' },
          { label: 'Colbur Berry', value: 'colbur-berry' },
          { label: 'Occa Berry', value: 'occa-berry' },
          { label: 'Shuca Berry', value: 'shuca-berry' },
          { label: 'Yache Berry', value: 'yache-berry' },
        ],
      },
    ])
  })

  it('documents Champions items that are not selectable until implemented', () => {
    assert.equal(CHAMPIONS_SET_ITEM_IDS.has('leftovers'), true)
    assert.equal(CHAMPIONS_SET_ITEM_IDS.has('choice-scarf'), true)
    assert.equal(CHAMPIONS_SET_ITEM_IDS.has('occa-berry'), true)

    const selectableIds = new Set(
      flattenOptions(getChampionsDamageItemOptions()).map((option) => option.value),
    )
    assert.equal(selectableIds.has('leftovers'), false)
    assert.equal(selectableIds.has('choice-scarf'), false)
    assert.equal(selectableIds.has('occa-berry'), true)
    assert.equal(selectableIds.has('life-orb'), false)
  })

  it('can expose all implemented damage items for free simulations', () => {
    const selectableIds = new Set(
      flattenOptions(getAllDamageItemOptions()).map((option) => option.value),
    )

    assert.equal(selectableIds.has('fairy-feather'), true)
    assert.equal(selectableIds.has('magnet'), true)
    assert.equal(selectableIds.has('soft-sand'), true)
    assert.equal(selectableIds.has('black-glasses'), true)
  })
})

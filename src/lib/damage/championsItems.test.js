import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CHAMPIONS_SET_ITEM_IDS,
  getAllDamageItemOptions,
  getChampionsDamageItemOptions,
  getItemCoverage,
  getItemCoverageNote,
} from './championsItems.js'
import { REGULATION_ITEMS } from '../regulation.js'

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
      { label: 'Choice Scarf', value: 'choice-scarf' },
      { label: 'Focus Sash', value: 'focus-sash' },
      { label: 'Leftovers', value: 'leftovers' },
      { label: 'Lum Berry', value: 'lum-berry' },
      { label: 'Mental Herb', value: 'mental-herb' },
      { label: 'Sitrus Berry', value: 'sitrus-berry' },
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

  it('includes reviewed items while preserving the restriction to example set items', () => {
    assert.equal(CHAMPIONS_SET_ITEM_IDS.has('leftovers'), true)
    assert.equal(CHAMPIONS_SET_ITEM_IDS.has('choice-scarf'), true)
    assert.equal(CHAMPIONS_SET_ITEM_IDS.has('occa-berry'), true)

    const selectableIds = new Set(
      flattenOptions(getChampionsDamageItemOptions()).map((option) => option.value),
    )
    assert.equal(selectableIds.has('leftovers'), true)
    assert.equal(selectableIds.has('choice-scarf'), true)
    assert.equal(selectableIds.has('occa-berry'), true)
    assert.equal(selectableIds.has('life-orb'), false)
  })

  it('detects changed behavior independently of imported metadata', () => {
    assert.equal(getItemCoverage('Focus Sash'), 'implemented')
    assert.equal(getItemCoverage('Leftovers'), 'no-direct-effect')
    assert.equal(getItemCoverage('New Item'), 'unknown')
    const changed = REGULATION_ITEMS.map((item) => item.id === 'focus-sash' ? { ...item, fingerprint: 'changed' } : item)
    assert.equal(getItemCoverage('Focus Sash', changed), 'changed')
    assert.match(getItemCoverageNote('Focus Sash', undefined, changed), /nuova verifica/)
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

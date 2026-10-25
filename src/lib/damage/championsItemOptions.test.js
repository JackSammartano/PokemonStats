import assert from 'node:assert/strict'
import { test } from 'node:test'
import { REGULATION_ITEMS, REGULATION_MEGA_EVOLUTIONS } from '../regulation.js'
import { getPokemonDamageItemOptions } from './championsItemOptions.js'

const flatten = (options) => options.flatMap((option) => option.options ?? [option])
const stones = (id) => flatten(getPokemonDamageItemOptions({ showdownId: id })).filter((option) => REGULATION_ITEMS.find((item) => item.id === option.value)?.megaStone).map((option) => option.value).sort()

test('each base and Mega form exposes only its mapped stones', () => {
  for (const link of REGULATION_MEGA_EVOLUTIONS) {
    assert.deepEqual(stones(link.baseId), [...new Set(REGULATION_MEGA_EVOLUTIONS.filter((candidate) => candidate.baseId === link.baseId).map((candidate) => candidate.itemId))].sort())
    assert.deepEqual(stones(link.megaId), [link.itemId])
  }
  assert.deepEqual(stones('pikachu'), [])
  assert.deepEqual(stones(undefined), [])
})

test('all non-Mega items appear once with berries and functional categories sorted', () => {
  const options = getPokemonDamageItemOptions({ showdownId: 'pikachu' })
  const all = flatten(options)
  assert.equal(all[0].value, '')
  assert.equal(new Set(all.map((item) => item.value)).size, all.length)
  assert.deepEqual(all.slice(1).map((item) => item.value).sort(), REGULATION_ITEMS.filter((item) => !item.megaStone).map((item) => item.id).sort())
  const berries = options.find((group) => group.label === 'Bacche').options
  assert.deepEqual(berries.map((item) => item.value).sort(), REGULATION_ITEMS.filter((item) => item.isBerry).map((item) => item.id).sort())
  for (const group of options.filter((option) => option.options)) assert.deepEqual(group.options.map((item) => item.label), group.options.map((item) => item.label).sort((a, b) => a.localeCompare(b, 'en')))
  assert.ok(options.find((group) => group.label === 'Attacco').options.some((item) => item.value === 'life-orb'))
  assert.ok(options.find((group) => group.label === 'Difesa e recupero').options.some((item) => item.value === 'leftovers'))
  assert.ok(options.find((group) => group.label === 'Velocità').options.some((item) => item.value === 'choice-scarf'))
  assert.ok(options.find((group) => group.label === 'Supporto e utilità').options.some((item) => item.value === 'light-clay'))
})

test('existing incompatible and imported items remain visible without duplication', () => {
  const incompatible = getPokemonDamageItemOptions({ showdownId: 'pikachu' }, 'charizardite-x', 'Charizardite X')
  assert.match(incompatible.at(-1).label, /non compatibile/)
  assert.deepEqual(incompatible.at(-1).options, [{ value: 'charizardite-x', label: 'Charizardite X' }])
  assert.equal(flatten(getPokemonDamageItemOptions({ showdownId: 'charizard' }, 'charizardite-x')).filter((option) => option.value === 'charizardite-x').length, 1)
  assert.deepEqual(getPokemonDamageItemOptions(undefined, 'unknown-item', 'Imported').at(-1), { label: 'Oggetto importato', options: [{ value: 'unknown-item', label: 'Imported' }] })
})

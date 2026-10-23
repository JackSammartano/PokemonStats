import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import { test } from 'node:test'
import { REGULATION_MC_ROSTER } from '../data/regulationMc.js'
import { POKEMON_IMAGES, MISSING_POKEMON_IMAGES } from '../data/pokemonImages.js'
import { createPokemonDataset } from './pokemonDataset.js'

test('the complete catalog is synchronous and makes no network requests even when fetch cannot resolve', (context) => {
  let requests = 0
  context.mock.method(globalThis, 'fetch', () => { requests++; return new Promise(() => {}) })
  const dataset = createPokemonDataset()
  assert.equal(dataset.length, 351)
  assert.ok(dataset.every((entry) => entry.status === 'ready' && entry.stats.length === 6 && entry.moves.length > 0 && entry.abilities.length > 0))
  assert.equal(requests, 0)
})

test('every local form keeps exact Showdown stats, types, abilities and defensive relations', () => {
  const dataset = createPokemonDataset()
  for (const [index, entry] of REGULATION_MC_ROSTER.entries()) {
    assert.equal(dataset[index].displayName, entry.displayName)
    assert.equal(dataset[index].showdownId, entry.showdownId)
    assert.deepEqual(dataset[index].types, entry.types)
    assert.deepEqual(dataset[index].stats.map(({ value }) => value), Object.values(entry.baseStats))
    assert.deepEqual(dataset[index].abilities, entry.abilities)
  }
  const z = dataset.find((entry) => entry.showdownId === 'garchompmegaz')
  assert.deepEqual(z.types, ['dragon'])
  assert.equal(z.defenseProfile.ice, 2)
  const charizard = dataset.find((entry) => entry.showdownId === 'charizard')
  assert.equal(charizard.defenseProfile.rock, 4)
  assert.equal(charizard.defenseProfile.ground, 0)
  assert.equal(charizard.defenseProfile.grass, 0.25)
})

test('all image mappings resolve to real local assets, with distinct files for different forms', async () => {
  assert.equal(Object.keys(POKEMON_IMAGES).length + MISSING_POKEMON_IMAGES.length, 351)
  await Promise.all(Object.values(POKEMON_IMAGES).map(({ file }) => access(new URL(`../../public/images/pokemon/${file}`, import.meta.url))))
  const dataset = createPokemonDataset()
  assert.ok(dataset.every((entry) => entry.image.startsWith('/images/') && !entry.image.startsWith('http')))
  const forms = dataset.filter((entry) => ['garchomp', 'garchompmega', 'garchompmegaz'].includes(entry.showdownId))
  assert.equal(new Set(forms.map((entry) => entry.image)).size, 3)
})

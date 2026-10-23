import assert from 'node:assert/strict'
import { test } from 'node:test'
import { REGULATION_MC_POKEMON } from '../data/regulationMc.js'

let moduleId = 0
const freshLoader = () => import(`./pokeapi.js?test=${moduleId++}`)

test('entire M-C roster stays usable when PokeAPI is offline', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => { throw new Error('offline') })
  const { loadPokemonDataset } = await freshLoader()
  const progress = []
  const dataset = await loadPokemonDataset(REGULATION_MC_POKEMON, (count) => progress.push(count))
  assert.equal(dataset.length, REGULATION_MC_POKEMON.length)
  assert.ok(dataset.every((entry) => entry.status === 'ready' && entry.stats.length === 6))
  assert.equal(progress.at(-1), dataset.length)
  const garchompZ = dataset.find((entry) => entry.showdownId === 'garchompmegaz')
  assert.deepEqual(garchompZ.types, ['dragon'])
  assert.equal(garchompZ.defenseProfile.ice, 2)
  assert.equal(garchompZ.defenseProfile.fairy, 2)
  assert.equal(dataset.find((entry) => entry.showdownId === 'golisopodmega').defenseProfile.poison, 0)
})

test('missing Mega Z never falls back to another Mega or the base species', async (context) => {
  const requests = []
  context.mock.method(globalThis, 'fetch', async (url) => {
    requests.push(url)
    return new Response('', { status: 404 })
  })
  const { fetchPokemon } = await freshLoader()
  const pokemon = await fetchPokemon('Mega Absol Z', {})
  assert.deepEqual(requests, ['https://pokeapi.co/api/v2/pokemon/absol-mega-z'])
  assert.deepEqual(pokemon.types, ['dark', 'ghost'])
  assert.equal(pokemon.status, 'ready')
  assert.equal(pokemon.abilities[0].name, 'Sharpness')
})

test('ability lookup failure cannot discard a resolved Pokemon, and Showdown owns core data', async (context) => {
  context.mock.method(globalThis, 'fetch', async (url) => {
    if (url.includes('/ability/')) return new Response('', { status: 503 })
    return Response.json({
      name: 'garchomp-mega-z', id: 99999, base_experience: 300,
      types: [{ slot: 1, type: { name: 'ground' } }],
      abilities: [{ slot: 1, is_hidden: false, ability: { name: 'levitate', url: 'https://pokeapi.co/api/v2/ability/levitate' } }],
      stats: [{ stat: { name: 'attack' }, base_stat: 1 }],
      sprites: { front_default: 'form-sprite.png' },
      moves: [{ move: { name: 'dragon-pulse' } }],
    })
  })
  const { fetchPokemon } = await freshLoader()
  const pokemon = await fetchPokemon('Mega Garchomp Z', {})
  assert.equal(pokemon.status, 'ready')
  assert.deepEqual(pokemon.types, ['dragon'])
  assert.equal(pokemon.stats.find((stat) => stat.name === 'attack').value, 130)
  assert.equal(pokemon.abilities[0].name, 'Levitate')
  assert.ok(pokemon.abilities[0].description.includes('Ground'))
  assert.equal(pokemon.image, 'form-sprite.png')
  assert.equal(pokemon.moves[0].id, 'dragon-pulse')
})

test('unknown Pokemon are still reported as unsupported instead of inventing data', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => new Response('', { status: 404 }))
  const { fetchPokemon } = await freshLoader()
  assert.equal((await fetchPokemon('Missing Pokemon', {})).status, 'unsupported')
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { CHAMPIONS_MOVES } from './championsData.js'

describe('Champions move data', () => {
  it('includes direct-damage Champions moves from the reference data', () => {
    assert.equal(Object.keys(CHAMPIONS_MOVES).length, 146)
    assert.deepEqual(CHAMPIONS_MOVES['fire-blast'], {
      basePower: 110,
      category: 'special',
      name: 'Fire Blast',
      type: 'fire',
    })
    assert.deepEqual(CHAMPIONS_MOVES['close-combat'], {
      basePower: 120,
      category: 'physical',
      name: 'Close Combat',
      type: 'fighting',
    })
    assert.deepEqual(CHAMPIONS_MOVES['solar-beam'], {
      basePower: 120,
      category: 'special',
      name: 'Solar Beam',
      type: 'grass',
    })
  })

  it('does not include moves that need special damage formulas', () => {
    for (const move of [
      'body-press',
      'freeze-dry',
      'grass-knot',
      'psyshock',
      'rock-blast',
      'stored-power',
      'water-spout',
    ]) {
      assert.equal(CHAMPIONS_MOVES[move], undefined)
    }
  })
})

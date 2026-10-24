import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { CHAMPIONS_MOVES } from './championsData.js'
import { REGULATION_MOVES } from '../regulation.js'

const core = ({ basePower, category, name, type }) => ({ basePower, category, name, type })

describe('Champions move data', () => {
  it('includes direct-damage Champions moves from the reference data', () => {
    for (const [id, move] of Object.entries(REGULATION_MOVES)) {
      if (move.category !== 'status') assert.ok(CHAMPIONS_MOVES[id], id)
    }
    assert.deepEqual(core(CHAMPIONS_MOVES['fire-blast']), {
      basePower: 110,
      category: 'special',
      name: 'Fire Blast',
      type: 'fire',
    })
    assert.deepEqual(core(CHAMPIONS_MOVES['close-combat']), {
      basePower: 120,
      category: 'physical',
      name: 'Close Combat',
      type: 'fighting',
    })
    assert.deepEqual(core(CHAMPIONS_MOVES['solar-beam']), {
      basePower: 120,
      category: 'special',
      name: 'Solar Beam',
      type: 'grass',
    })
  })

  it('preserves multihit metadata used by the sequence engine', () => {
    assert.deepEqual(CHAMPIONS_MOVES['rock-blast'].multihit, [2, 5])
    assert.deepEqual(CHAMPIONS_MOVES['bullet-seed'].multihit, [2, 5])
    assert.equal(CHAMPIONS_MOVES['beat-up'].name, 'Beat Up')
  })
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateChampionsStat, getChampionsStatBumps, STAT_IDS } from './championsMath.js'

test('favorable natures expose the actual +2 thresholds for the base stat', () => {
  assert.deepEqual(getChampionsStatBumps({ base: 100, nature: 'adamant', stat: 'atk' }), [10, 20, 30])
  assert.deepEqual(getChampionsStatBumps({ base: 105, nature: 'adamant', stat: 'atk' }), [5, 15, 25])
  assert.deepEqual(getChampionsStatBumps({ base: 108, nature: 'adamant', stat: 'atk' }), [2, 12, 22, 32])
})

test('HP, neutral and lowered stats have no +2 thresholds', () => {
  for (const stat of STAT_IDS) assert.deepEqual(getChampionsStatBumps({ base: 100, nature: 'serious', stat }), [])
  assert.deepEqual(getChampionsStatBumps({ base: 100, nature: 'adamant', stat: 'spa' }), [])
  assert.deepEqual(getChampionsStatBumps({ base: 1, nature: 'adamant', stat: 'hp' }), [])
})

test('markers agree with the stat engine for every SP, base stat residue and nature modifier', () => {
  for (let base = 1; base <= 255; base++) for (const nature of ['adamant', 'modest', 'serious']) {
    const params = { base, nature, stat: 'atk' }
    const bumps = getChampionsStatBumps(params)
    for (let sp = 1; sp <= 32; sp++) assert.equal(bumps.includes(sp), calculateChampionsStat({ ...params, sp }) - calculateChampionsStat({ ...params, sp: sp - 1 }) === 2)
  }
})

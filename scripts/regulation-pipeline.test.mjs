import assert from 'node:assert/strict'
import { test } from 'node:test'
import mc from '../src/data/regulations/mc.js'
import mb from '../src/data/regulations/mb.js'
import { compareRegulations } from './compare-regulations.mjs'
import { fingerprintAbility, fingerprintItem, validateSnapshot, verifyFormat } from './import-regulation.mjs'
import { readRegulationConfig } from './regulation-config.mjs'

test('historical M-B is a complete isolated snapshot and the transition includes the six M-C Megas', () => {
  validateSnapshot(mb)
  validateSnapshot(mc)
  assert.equal(mb.source.mod, 'championsregmb')
  assert.equal(mb.items.length, 148)
  assert.equal(mc.items.length, 166)
  const diff = compareRegulations(mb, mc)
  assert.equal(diff.roster.added.length, 33)
  assert.equal(diff.roster.removed.length, 0)
  for (const id of ['absolmegaz', 'salamencemega', 'garchompmegaz', 'lucariomegaz', 'golisopodmega', 'baxcaliburmega']) {
    assert.ok(diff.megaEvolutions.added.includes(id), id)
    assert.equal(mb.roster.some((entry) => entry.showdownId === id), false)
  }
  assert.ok(diff.learnsets.changed.length)
  assert.deepEqual(diff.targetCoverage.missingMoves, [])
})

test('configuration rejects unknown future regulations instead of silently falling back', async () => {
  await assert.rejects(readRegulationConfig('__unconfigured__'), /Unknown regulation/)
  await assert.rejects(readRegulationConfig('../mc'), /Unknown regulation/)
})

test('item fingerprints include Fling, seed boosts and handlers while ignoring presentation', () => {
  const item = { name: 'Fixture', fling: { basePower: 30 }, boosts: { def: 1 }, onStart() { return 1 } }
  const fingerprint = fingerprintItem(item)
  assert.equal(fingerprintItem({ ...item, name: 'Renamed', spritenum: 99 }), fingerprint)
  assert.notEqual(fingerprintItem({ ...item, fling: { basePower: 60 } }), fingerprint)
  assert.notEqual(fingerprintItem({ ...item, boosts: { spd: 1 } }), fingerprint)
  assert.notEqual(fingerprintItem({ ...item, onStart() { return 2 } }), fingerprint)
})

test('format validation stops on mod, rules, or bans changes', () => {
  const source = (changes) => `export const Formats = ${JSON.stringify([{ name: mc.source.formatName, mod: 'champions', gameType: 'doubles', ruleset: ['Flat Rules', 'VGC Timer', 'Open Team Sheets'], ...changes }])}`
  verifyFormat(source({}), mc.source)
  assert.throws(() => verifyFormat(source({ mod: 'gen9' }), mc.source), /mismatch/)
  assert.throws(() => verifyFormat(source({ banlist: ['Charizard'] }), mc.source), /rules changed/)
  assert.throws(() => verifyFormat(source({ ruleset: ['Standard'] }), mc.source), /rules changed/)
})

test('snapshot validation catches broken links and missing learned move metadata', () => {
  const badLearnset = structuredClone(mc)
  badLearnset.learnsets.charizard.push('missing-move')
  assert.throws(() => validateSnapshot(badLearnset), /Invalid learnset/)
  const badMega = structuredClone(mc)
  badMega.megaEvolutions[0].itemId = 'missing-item'
  assert.throws(() => validateSnapshot(badMega), /Invalid Mega link/)
})

test('behavior fingerprints detect handler and nested condition changes while ignoring presentation metadata', () => {
  const first = { name: 'Example', rating: 1, flags: {}, onStart() { return 1 }, condition: { onModifyAtk() { return 2 } } }
  assert.equal(fingerprintAbility(first), fingerprintAbility({ ...first, name: 'Renamed', rating: 4, isNonstandard: null }))
  assert.notEqual(fingerprintAbility(first), fingerprintAbility({ ...first, onStart() { return 2 } }))
  assert.notEqual(fingerprintAbility(first), fingerprintAbility({ ...first, condition: { onModifyAtk() { return 3 } } }))
  const broken = structuredClone(mc)
  delete broken.abilityMechanics['aura-guard']
  assert.throws(() => validateSnapshot(broken), /Missing ability mechanics/)
})

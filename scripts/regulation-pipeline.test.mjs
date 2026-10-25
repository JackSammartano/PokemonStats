import assert from 'node:assert/strict'
import { test } from 'node:test'
import mc from '../src/data/regulations/mc.js'
import mb from '../src/data/regulations/mb.js'
import { compareRegulations } from './compare-regulations.mjs'
import { fingerprintAbility, fingerprintItem, getMovePresentationMetadata, validateSnapshot, verifyFormat } from './import-regulation.mjs'
import { readRegulationConfig } from './regulation-config.mjs'
import { getCoverage } from './check-regulation.mjs'

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

test('move presentation imports source text and accuracy without serializing callbacks', () => {
  assert.deepEqual(getMovePresentationMetadata({ name: 'Example', accuracy: true, damage: 'level' }, { shortDesc: 'Damage equals the user’s level.' }), { accuracy: true, shortDesc: 'Damage equals the user’s level.', fixedDamage: 'level' })
  const source = { name: 'Future Move', accuracy: 85, basePowerCallback() {}, onHit() {} }
  assert.deepEqual(getMovePresentationMetadata(source, { shortDesc: ' A new effect supplied by the source. ' }), { accuracy: 85, shortDesc: 'A new effect supplied by the source.', variablePower: true })
  assert.equal(getMovePresentationMetadata({ name: 'Example', accuracy: 100, damageCallback() {} }, { shortDesc: 'Fixed damage.' }).fixedDamage, true)
})

test('move text resolves general, Champions and regulation-specific overrides in order', () => {
  const move = { name: 'Example', accuracy: 100 }
  const text = { shortDesc: 'General.', champions: { shortDesc: 'Champions.' }, championsregmb: { shortDesc: 'Historical regulation.' } }
  assert.equal(getMovePresentationMetadata(move, text).shortDesc, 'General.')
  assert.equal(getMovePresentationMetadata(move, text, ['champions']).shortDesc, 'Champions.')
  assert.equal(getMovePresentationMetadata(move, text, ['champions', 'championsregmb']).shortDesc, 'Historical regulation.')
  assert.equal(getMovePresentationMetadata(move, text, ['champions', 'futuremod']).shortDesc, 'Champions.')
  assert.equal(getMovePresentationMetadata({ ...move, shortDesc: 'Direct override.' }, text, ['champions']).shortDesc, 'Direct override.')
})

test('missing or explicitly empty descriptions stop import rather than silently losing effects', () => {
  const move = { name: 'Future Move', accuracy: 100 }
  for (const text of [undefined, {}, { shortDesc: '' }, { shortDesc: '  ' }, { shortDesc: 42 }]) {
    assert.throws(() => getMovePresentationMetadata(move, text), /Missing short description: Future Move/)
  }
  assert.throws(() => getMovePresentationMetadata(move, { shortDesc: 'General.', champions: { shortDesc: '' } }, ['champions']), /Missing short description/)
})

test('coverage identifies missing descriptions and accuracy in both damaging and status moves', () => {
  for (const snapshot of [mb, mc]) assert.deepEqual(getCoverage(snapshot).incompleteMovePresentation, [])
  const broken = structuredClone(mc)
  delete broken.moves.psychic.presentation.shortDesc
  broken.moves.protect.presentation.accuracy = null
  assert.deepEqual(getCoverage(broken).incompleteMovePresentation, ['protect', 'psychic'])
})

test('regulation comparison reports changes to move text and its completeness', () => {
  const next = structuredClone(mc)
  next.moves.psychic.presentation.shortDesc = 'Changed effect from the updated source.'
  assert.deepEqual(compareRegulations(mc, next).moves.changed, ['psychic'])
  delete next.moves.psychic.presentation.shortDesc
  assert.deepEqual(compareRegulations(mc, next).targetCoverage.incompleteMovePresentation, ['psychic'])
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

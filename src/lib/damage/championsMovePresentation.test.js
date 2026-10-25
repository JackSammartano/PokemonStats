import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getMovePresentation, isMovePresentationComplete } from './championsMovePresentation.js'
import mb from '../../data/regulations/mb.js'
import mc from '../../data/regulations/mc.js'

// These reference expectations belong to the pinned M-C snapshot, not whichever
// future regulation is temporarily active during a transition.
const present = (id) => getMovePresentation(mc.moves[id])

test('ordinary moves show base power and accuracy without an unnecessary description', () => {
  assert.equal(getMovePresentation(null), null)
  assert.deepEqual(present('earthquake'), { power: '100', accuracy: '100%', description: 'Hits adjacent Pokemon. Double damage on Dig.' })
  assert.equal(present('dragon-claw').description, '')
  assert.equal(present('dazzling-gleam').description, '')
  assert.equal(present('thunder').accuracy, '70%')
  assert.equal(present('aura-sphere').accuracy, 'Sempre a segno')
  assert.equal(present('protect').power, '—')
  assert.match(present('protect').description, /Prevents moves/)
})

test('probabilities and stat changes use Champions overrides rather than standard descriptions', () => {
  assert.match(present('psychic').description, /10% chance to lower.*Sp\. Def by 1/)
  assert.match(present('iron-head').description, /20% chance.*flinch/)
  assert.doesNotMatch(present('freeze-dry').description, /freeze/i)
  assert.match(present('freeze-dry').description, /Super effective on Water/)
  assert.match(present('toxic-thread').description, /Speed by 2.*poisons/)
  assert.match(present('make-it-rain').description, /Sp\. Atk by 2/)
  assert.equal(present('make-it-rain').accuracy, '95%')
  assert.match(present('salt-cure').description, /1\/16.*1\/8.*Steel, Water/)
  assert.match(present('dire-claw').description, /30%.*sleep, poison, or paralyze/)
})

test('guaranteed effects distinguish the user, allies, stages and actual stat values', () => {
  assert.match(present('close-combat').description, /Lowers the user's Defense and Sp\. Def by 1/)
  assert.match(present('coaching').description, /ally's Attack and Defense/)
  assert.match(present('howl').description, /user's and ally's Attack/)
  assert.match(present('memento').description, /User faints/)
  assert.match(present('recover').description, /Heals the user by 50%/)
  assert.match(present('life-dew').description, /user and its allies by 1\/4/)
  assert.match(present('guard-split').description, /Averages.*stats/)
  assert.match(present('guard-swap').description, /Swaps.*changes/)
  assert.match(present('drain-punch').description, /recovers 50% of the damage/)
  assert.match(present('brave-bird').description, /33% recoil/)
})

test('variable power, fixed damage, multihit, charge and recharge remain distinct', () => {
  assert.equal(present('gyro-ball').power, 'Variabile')
  assert.equal(present('weather-ball').power, '50 (variabile)')
  assert.equal(present('hex').power, '65 (variabile)')
  assert.equal(present('solar-beam').power, '120 (variabile)')
  assert.equal(present('seismic-toss').power, 'Danno fisso')
  assert.match(present('seismic-toss').description, /equal to the user's level/)
  assert.equal(present('fissure').power, 'Danno fisso')
  assert.match(present('fissure').description, /OHKOs/)
  assert.match(present('bullet-seed').description, /2-5 times/)
  assert.match(present('triple-axel').description, /Each hit can miss, but power rises/)
  assert.match(present('electro-shot').description, /Rain: no charge/)
  assert.match(present('hyper-beam').description, /cannot move next turn/)
  assert.match(present('outrage').description, /2-3 turns/)
})

test('callback-based effects are described even when the damage engine cannot produce a result', () => {
  for (const [id, effect] of Object.entries({
    'alluring-voice': /confuse/, 'burning-jealousy': /burns/, 'eerie-spell': /3 PP/,
    'psychic-noise': /prevented from healing/, 'spirit-shackle': /switching out/,
    'syrup-bomb': /3 turns/, 'throat-chop': /sound moves/, 'tri-attack': /20%.*freeze/,
    'stone-axe': /Stealth Rock/, 'ceaseless-edge': /Spikes/,
  })) assert.match(present(id).description, effect, id)
})

test('both regulation snapshots have complete source descriptions without mutating metadata', () => {
  const before = structuredClone([mb, mc])
  for (const snapshot of [mb, mc]) for (const [id, move] of Object.entries(snapshot.moves)) {
    assert.ok(isMovePresentationComplete(move), `${snapshot.source.id}: ${id}`)
    const info = getMovePresentation(move)
    assert.ok(info.power && info.accuracy, id)
    assert.doesNotMatch(info.description, /undefined|NaN|\[object Object\]/, id)
    if (move.category === 'status') assert.ok(info.description, id)
    if (!move.presentation.shortDesc.startsWith('No additional effect.')) assert.equal(info.description, move.presentation.shortDesc)
  }
  assert.deepEqual([mb, mc], before)
})

test('new source descriptions are shown without adding a move-specific implementation', () => {
  const move = { name: 'Future Move', category: 'special', basePower: 90, presentation: { accuracy: 100, shortDesc: 'A newly documented effect.' } }
  assert.equal(getMovePresentation(move).description, 'A newly documented effect.')
  assert.equal(isMovePresentationComplete(move), true)
  for (const accuracy of [undefined, null, 0, 101, '100', NaN]) assert.equal(isMovePresentationComplete({ ...move, presentation: { ...move.presentation, accuracy } }), false)
  assert.equal(isMovePresentationComplete({ ...move, presentation: { accuracy: 100, shortDesc: '  ' } }), false)
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  NO_SUPPORTED_MOVES_OPTION,
  getDamageMoveOptions,
  getSupportedAbilityOptions,
  getSupportedMoveOptions,
} from './championsOptions.js'

describe('champions option filters', () => {
  it('keeps only moves learned by the pokemon and implemented in Champions', () => {
    const options = getSupportedMoveOptions({
      moves: [
        { id: 'flamethrower' },
        { id: 'splash' },
        { id: 'earthquake' },
      ],
    })

    assert.deepEqual(
      options.map((option) => option.label),
      ['Earthquake', 'Flamethrower'],
    )
  })

  it('uses Champions set moves before PokeAPI learnsets for forms', () => {
    const options = getSupportedMoveOptions({
      apiName: 'charizard-mega-y',
      moves: [
        { id: 'earthquake' },
        { id: 'flamethrower' },
      ],
    })

    assert.deepEqual(
      options.map((option) => option.value),
      [
        'air-slash',
        'blast-burn',
        'fire-blast',
        'flame-charge',
        'flamethrower',
        'focus-blast',
        'heat-wave',
        'overheat',
        'solar-beam',
      ],
    )
  })

  it('returns no move options when no implemented Champions move is learned', () => {
    assert.equal(getSupportedMoveOptions({ moves: [{ id: 'splash' }] }).length, 0)
    assert.equal(NO_SUPPORTED_MOVES_OPTION.label, 'No supported moves')
  })

  it('falls back to manual implemented moves when no supported move is available', () => {
    const result = getDamageMoveOptions({
      apiName: 'pyroar-mega',
      moves: [],
    })

    assert.equal(result.source, 'manual')
    assert.ok(result.options.some((option) => option.value === 'fire-blast'))
    assert.ok(result.options.some((option) => option.value === 'hyper-voice'))
    assert.ok(result.options.some((option) => option.value === 'heat-wave'))
  })

  it('keeps verified move options when they are available', () => {
    const result = getDamageMoveOptions({
      apiName: 'charizard-mega-y',
      moves: [
        { id: 'earthquake' },
        { id: 'flamethrower' },
      ],
    })

    assert.equal(result.source, 'supported')
    assert.deepEqual(
      result.options.map((option) => option.value),
      [
        'air-slash',
        'blast-burn',
        'fire-blast',
        'flame-charge',
        'flamethrower',
        'focus-blast',
        'heat-wave',
        'overheat',
        'solar-beam',
      ],
    )
  })

  it('keeps None, implemented abilities, and disabled unimplemented abilities', () => {
    const options = getSupportedAbilityOptions({
      abilities: [
        { id: 'blaze' },
        { id: 'drought' },
        { id: 'solar-power', isHidden: true },
        { id: 'flash-fire' },
      ],
    })

    assert.deepEqual(options, [
      { label: 'None', value: '' },
      { disabled: true, label: 'Blaze (not calculated yet)', value: 'blaze' },
      { label: 'Drought', value: 'drought' },
      {
        disabled: true,
        label: 'Solar Power (Hidden) (not calculated yet)',
        value: 'solar-power',
      },
      { label: 'Flash Fire', value: 'flash-fire' },
    ])
  })
})

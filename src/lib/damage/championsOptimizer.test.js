import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { CHAMPIONS_MOVES } from './championsData.js'
import {
  findKoOptions,
  findSurvivalOptions,
  scoreOption,
} from './championsOptimizer.js'

const physicalContext = {
  attacker: {
    baseStats: {
      hp: 80,
      atk: 120,
      def: 80,
      spa: 70,
      spd: 80,
      spe: 100,
    },
    boost: 0,
    nature: 'serious',
    offenseSp: 32,
    types: ['ground'],
  },
  defender: {
    baseStats: {
      hp: 60,
      atk: 50,
      def: 60,
      spa: 50,
      spd: 60,
      spe: 50,
    },
    boost: 0,
    defenseSp: 0,
    hp: 135,
    hpSp: 0,
    nature: 'serious',
    types: ['normal'],
  },
  move: CHAMPIONS_MOVES.earthquake,
}

const specialContext = {
  attacker: {
    baseStats: {
      hp: 60,
      atk: 50,
      def: 45,
      spa: 130,
      spd: 95,
      spe: 120,
    },
    boost: 0,
    nature: 'serious',
    offenseSp: 0,
    types: ['ice'],
  },
  defender: {
    baseStats: {
      hp: 60,
      atk: 60,
      def: 60,
      spa: 60,
      spd: 60,
      spe: 60,
    },
    boost: 0,
    defenseSp: 0,
    hp: 135,
    hpSp: 0,
    nature: 'serious',
    types: ['dragon', 'ground'],
  },
  move: CHAMPIONS_MOVES['ice-beam'],
}

describe('Champions optimizer', () => {
  it('finds guaranteed survival options', () => {
    const result = findSurvivalOptions(physicalContext, {
      attackerBurned: [false],
      defenderBoosts: [0, 1],
      defenderDefenseSp: [0, 32],
      defenderHpSp: [0, 32],
      defenderNatures: ['serious'],
      screens: ['', 'Reflect'],
      weather: [''],
    })

    assert.ok(result.total > 0)
    assert.ok(result.displayed.length <= 50)
    assert.ok(
      result.displayed.every((option) => option.damage.max < option.defender.hp),
    )
    assert.equal(
      result.displayed.some(
        (option) => option.defender.hpSp > 0 && option.defender.defenseSp > 0,
      ),
      false,
    )
  })

  it('finds guaranteed KO options', () => {
    const result = findKoOptions(specialContext, {
      attackerBoosts: [0, 1],
      attackerNatures: ['serious', 'modest'],
      attackerSp: [0, 32],
      critical: [false],
      weather: [''],
    })

    assert.ok(result.total > 0)
    assert.ok(result.displayed.length <= 50)
    assert.ok(
      result.displayed.every((option) => option.damage.min >= option.defender.hp),
    )
  })

  it('removes dominated KO options', () => {
    const result = findKoOptions(specialContext, {
      attackerBoosts: [1],
      attackerNatures: ['modest'],
      attackerSp: [0, 1, 32],
      critical: [false],
      weather: [''],
    })

    assert.equal(result.total, 1)
    assert.equal(result.displayed[0].attacker.offenseSp, 0)
  })

  it('respects the internal candidate limit', () => {
    const result = findSurvivalOptions(physicalContext, {
      attackerBurned: [false, true],
      defenderBoosts: [0, 1, 2],
      defenderDefenseSp: [0, 1, 2, 32],
      defenderHpSp: [0, 1, 2, 32],
      defenderNatures: ['serious', 'bold', 'impish'],
      internalLimit: 3,
      screens: ['', 'Reflect'],
      weather: ['', 'Rain'],
    })

    assert.equal(result.total <= 3, true)
    assert.equal(result.displayed.length <= 3, true)
  })

  it('scores less invasive options lower', () => {
    const baseline = {
      attacker: {
        boost: 0,
        burned: false,
        nature: 'serious',
        offenseSp: 0,
      },
      defender: {
        boost: 0,
        defenseSp: 0,
        hpSp: 0,
        nature: 'serious',
      },
      field: {
        critical: false,
        screen: '',
        weather: '',
      },
    }
    const boosted = {
      ...baseline,
      attacker: {
        ...baseline.attacker,
        boost: 1,
        nature: 'modest',
        offenseSp: 32,
      },
      field: {
        ...baseline.field,
        critical: true,
      },
    }

    assert.ok(scoreOption(baseline) < scoreOption(boosted))
  })
})

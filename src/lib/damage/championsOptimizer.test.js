import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { CHAMPIONS_MOVES } from './championsData.js'
import {
  findKoOptions,
  findSurvivalOptions,
  OPTIMIZER_RANKING_MODES,
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

  it('does not include critical hits in default KO options', () => {
    const result = findKoOptions(specialContext, {
      attackerNatures: ['serious', 'modest'],
      attackerSp: [0, 32],
      weather: [''],
    })

    assert.ok(result.total > 0)
    assert.equal(
      result.displayed.some((option) => option.field.critical),
      false,
    )
  })

  it('can rank KO options by practical offensive investment', () => {
    const minimum = findKoOptions(specialContext, {
      attackerNatures: ['modest'],
      attackerSp: [0, 12, 32],
      weather: [''],
    })
    const practical = findKoOptions(specialContext, {
      attackerNatures: ['modest'],
      attackerSp: [0, 12, 32],
      rankingMode: OPTIMIZER_RANKING_MODES.practical,
      weather: [''],
    })

    assert.equal(minimum.displayed[0].attacker.offenseSp, 0)
    assert.equal(practical.displayed[0].attacker.offenseSp, 32)
  })

  it('can rank survival options by practical defensive investment', () => {
    const minimum = findSurvivalOptions(physicalContext, {
      attackerBurned: [false],
      defenderDefenseSp: [0, 32],
      defenderHpSp: [0, 32],
      defenderNatures: ['serious'],
      screens: ['Reflect'],
      weather: [''],
    })
    const practical = findSurvivalOptions(physicalContext, {
      attackerBurned: [false],
      defenderDefenseSp: [0, 32],
      defenderHpSp: [0, 32],
      defenderNatures: ['serious'],
      rankingMode: OPTIMIZER_RANKING_MODES.practical,
      screens: ['Reflect'],
      weather: [''],
    })

    assert.equal(minimum.displayed[0].defender.hpSp, 0)
    assert.equal(minimum.displayed[0].defender.defenseSp, 0)
    assert.equal(practical.displayed[0].defender.hpSp, 32)
    assert.equal(practical.displayed[0].defender.defenseSp, 32)
  })

  it('removes dominated KO options', () => {
    const result = findKoOptions(specialContext, {
      attackerNatures: ['modest'],
      attackerSp: [0, 1, 32],
      critical: [false],
      weather: [''],
    })

    assert.equal(result.total, 1)
    assert.equal(result.displayed[0].attacker.offenseSp, 0)
  })

  it('groups KO natures with the same offensive stat modifier', () => {
    const result = findKoOptions(specialContext, {
      attackerNatures: ['modest', 'mild', 'quiet', 'rash'],
      attackerSp: [32],
      critical: [false],
      weather: [''],
    })

    assert.equal(result.total, 1)
    assert.equal(result.displayed[0].attacker.natureGroup.label, 'Any +SpA nature')
    assert.deepEqual(result.displayed[0].attacker.natureGroup.natures, [
      'modest',
      'mild',
      'quiet',
      'rash',
    ])
  })

  it('groups survival natures with the same defensive stat modifier', () => {
    const result = findSurvivalOptions(
      {
        ...specialContext,
        attacker: {
          ...specialContext.attacker,
          baseStats: {
            ...specialContext.attacker.baseStats,
            spa: 70,
          },
          types: ['fire'],
        },
        defender: {
          ...specialContext.defender,
          baseStats: {
            ...specialContext.defender.baseStats,
            hp: 90,
            spd: 90,
          },
          types: ['normal'],
        },
        move: CHAMPIONS_MOVES.flamethrower,
      },
      {
        attackerBurned: [false],
        defenderDefenseSp: [32],
        defenderHpSp: [32],
        defenderNatures: ['calm', 'careful', 'gentle', 'sassy'],
        screens: [''],
        weather: [''],
      },
    )

    assert.equal(result.total, 1)
    assert.equal(result.displayed[0].defender.natureGroup.label, 'Any +SpD nature')
    assert.deepEqual(result.displayed[0].defender.natureGroup.natures, [
      'calm',
      'careful',
      'gentle',
      'sassy',
    ])
  })

  it('respects the internal candidate limit', () => {
    const result = findSurvivalOptions(physicalContext, {
      attackerBurned: [false, true],
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

  it('does not score temporary battle boosts as investment', () => {
    const baseline = {
      attacker: {
        burned: false,
        nature: 'serious',
        offenseSp: 0,
      },
      defender: {
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
      },
    }

    assert.equal(scoreOption(baseline), scoreOption(boosted))
  })

  it('does not include temporary boosts in optimizer results', () => {
    const ko = findKoOptions(specialContext, {
      attackerNatures: ['modest'],
      attackerSp: [32],
      weather: [''],
    })
    const survival = findSurvivalOptions(physicalContext, {
      attackerBurned: [false],
      defenderDefenseSp: [32],
      defenderHpSp: [32],
      defenderNatures: ['bold'],
      screens: ['Reflect'],
      weather: [''],
    })

    assert.equal('boost' in ko.displayed[0].attacker, false)
    assert.equal('boost' in ko.displayed[0].defender, false)
    assert.equal('boost' in survival.displayed[0].attacker, false)
    assert.equal('boost' in survival.displayed[0].defender, false)
  })

  it('ignores selected UI boosts during optimizer searches', () => {
    const boostedContext = {
      ...specialContext,
      attacker: {
        ...specialContext.attacker,
        boost: 6,
      },
      defender: {
        ...specialContext.defender,
        boost: 6,
      },
    }
    const baseline = findKoOptions(specialContext, {
      attackerNatures: ['modest'],
      attackerSp: [32],
      weather: [''],
    })
    const boosted = findKoOptions(boostedContext, {
      attackerNatures: ['modest'],
      attackerSp: [32],
      weather: [''],
    })

    assert.deepEqual(boosted, baseline)
  })

  it('uses weather in KO searches through the damage engine', () => {
    const context = {
      ...specialContext,
      attacker: {
        ...specialContext.attacker,
        types: ['fire'],
      },
      defender: {
        ...specialContext.defender,
        hp: 110,
        types: ['normal'],
      },
      move: CHAMPIONS_MOVES.flamethrower,
    }
    const result = findKoOptions(context, {
      attackerNatures: ['serious'],
      attackerSp: [0],
      weather: ['', 'Sun', 'Rain'],
    })

    assert.ok(result.displayed.length > 0)
    assert.ok(result.displayed.every((option) => option.field.weather === 'Sun'))
  })

  it('lets weather abilities force weather in KO searches', () => {
    const context = {
      ...specialContext,
      attacker: {
        ...specialContext.attacker,
        ability: 'Drought',
        types: ['fire'],
      },
      defender: {
        ...specialContext.defender,
        hp: 110,
        types: ['normal'],
      },
      field: {
        weather: 'Rain',
      },
      move: CHAMPIONS_MOVES.flamethrower,
    }
    const result = findKoOptions(context, {
      attackerNatures: ['serious'],
      attackerSp: [0],
      weather: ['Rain'],
    })

    assert.ok(result.displayed.length > 0)
    assert.ok(result.displayed.every((option) => option.field.weather === 'Sun'))
  })

  it('uses weather in survival searches through the damage engine', () => {
    const context = {
      ...specialContext,
      attacker: {
        ...specialContext.attacker,
        types: ['fire'],
      },
      defender: {
        ...specialContext.defender,
        baseStats: {
          ...specialContext.defender.baseStats,
          hp: 20,
        },
        hp: 95,
        types: ['normal'],
      },
      move: CHAMPIONS_MOVES.flamethrower,
    }
    const result = findSurvivalOptions(context, {
      attackerBurned: [false],
      defenderDefenseSp: [0],
      defenderHpSp: [0],
      defenderNatures: ['serious'],
      screens: [''],
      weather: ['', 'Sun', 'Rain'],
    })

    assert.ok(result.displayed.length > 0)
    assert.ok(result.displayed.every((option) => option.field.weather === 'Rain'))
  })

  it('uses game type in KO searches through the damage engine', () => {
    const context = {
      attacker: {
        baseStats: {
          hp: 80,
          atk: 120,
          def: 80,
          spa: 120,
          spd: 80,
          spe: 100,
        },
        boost: 0,
        nature: 'serious',
        offenseSp: 0,
        types: ['normal'],
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
        hp: 57,
        hpSp: 0,
        nature: 'serious',
        types: ['normal'],
      },
      move: CHAMPIONS_MOVES['heat-wave'],
    }
    const singles = findKoOptions(
      {
        ...context,
        field: {
          gameType: 'Singles',
        },
      },
      {
        attackerNatures: ['serious'],
        attackerSp: [0],
        weather: [''],
      },
    )
    const doubles = findKoOptions(
      {
        ...context,
        field: {
          gameType: 'Doubles',
        },
      },
      {
        attackerNatures: ['serious'],
        attackerSp: [0],
        weather: [''],
      },
    )

    assert.equal(singles.total, 1)
    assert.equal(doubles.total, 0)
  })
})

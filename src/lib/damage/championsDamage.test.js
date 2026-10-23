import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  calculateChampionsStat,
  getModifiedStat,
} from './championsMath.js'
import { calculateChampionsDamage } from './championsDamage.js'

const neutralAttacker = {
  level: 50,
  stats: {
    hp: 100,
    atk: 120,
    def: 100,
    spa: 120,
    spd: 100,
    spe: 100,
  },
  types: ['normal'],
}

const neutralDefender = {
  stats: {
    hp: 100,
    atk: 100,
    def: 100,
    spa: 100,
    spd: 100,
    spe: 100,
  },
  types: ['normal'],
}

describe('Champions damage math', () => {
  it('calculates Champions stats from base stats, SP, and nature', () => {
    assert.equal(
      calculateChampionsStat({
        base: 60,
        sp: 32,
        stat: 'hp',
      }),
      167,
    )
    assert.equal(
      calculateChampionsStat({
        base: 130,
        nature: 'Timid',
        sp: 32,
        stat: 'spa',
      }),
      182,
    )
    assert.equal(
      calculateChampionsStat({
        base: 110,
        nature: 'Timid',
        sp: 32,
        stat: 'spe',
      }),
      178,
    )
  })

  it('applies modern stat boost ratios', () => {
    assert.equal(getModifiedStat(182, 2), 364)
    assert.equal(getModifiedStat(182, -1), 121)
  })

  it('returns the 16 neutral damage rolls', () => {
    const result = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: neutralDefender,
      move: 'Thunderbolt',
    })

    assert.deepEqual(result.damage, [
      41, 42, 42, 43, 43, 44, 44, 45,
      45, 46, 46, 47, 47, 48, 48, 49,
    ])
    assert.equal(result.min, 41)
    assert.equal(result.max, 49)
  })

  it('applies STAB before type effectiveness', () => {
    const result = calculateChampionsDamage({
      attacker: {
        ...neutralAttacker,
        types: ['electric'],
      },
      defender: {
        ...neutralDefender,
        types: ['water'],
      },
      move: 'Thunderbolt',
    })

    assert.equal(result.effectiveness, 2)
    assert.equal(result.min, 122)
    assert.equal(result.max, 146)
  })

  it('halves physical damage when the attacker is burned', () => {
    const result = calculateChampionsDamage({
      attacker: {
        ...neutralAttacker,
        status: 'brn',
      },
      defender: neutralDefender,
      move: 'Earthquake',
    })

    assert.equal(result.min, 22)
    assert.equal(result.max, 27)
  })

  it('applies Reflect as a final modifier', () => {
    const result = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: neutralDefender,
      field: {
        defenderSide: {
          isReflect: true,
        },
      },
      move: 'Earthquake',
    })

    assert.equal(result.min, 22)
    assert.equal(result.max, 27)
  })

  it('critical hits ignore negative attack and positive defense boosts', () => {
    const normal = calculateChampionsDamage({
      attacker: {
        ...neutralAttacker,
        boosts: {
          atk: -2,
        },
      },
      defender: {
        ...neutralDefender,
        boosts: {
          def: 2,
        },
      },
      move: 'Earthquake',
    })
    const critical = calculateChampionsDamage({
      attacker: {
        ...neutralAttacker,
        boosts: {
          atk: -2,
        },
      },
      defender: {
        ...neutralDefender,
        boosts: {
          def: 2,
        },
      },
      field: {
        isCritical: true,
      },
      move: 'Earthquake',
    })

    assert.deepEqual(normal.damage, [
      12, 12, 13, 13, 13, 13, 13, 13,
      13, 14, 14, 14, 14, 14, 14, 15,
    ])
    assert.equal(critical.min, 68)
    assert.equal(critical.max, 81)
  })

  it('applies sun to Fire-type base damage', () => {
    const result = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: neutralDefender,
      field: {
        weather: 'Sun',
      },
      move: 'Flamethrower',
    })

    assert.equal(result.min, 62)
    assert.equal(result.max, 73)
  })

  it('applies rain to Water-type base damage and weakens Fire-type base damage', () => {
    const water = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: neutralDefender,
      field: {
        weather: 'Rain',
      },
      move: 'Surf',
    })
    const fire = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: neutralDefender,
      field: {
        weather: 'Rain',
      },
      move: 'Flamethrower',
    })

    assert.equal(water.min, 62)
    assert.equal(water.max, 73)
    assert.equal(fire.min, 20)
    assert.equal(fire.max, 24)
  })

  it('lets weather abilities override the selected weather', () => {
    const drought = calculateChampionsDamage({
      attacker: {
        ...neutralAttacker,
        ability: 'Drought',
      },
      defender: neutralDefender,
      field: {
        weather: 'Rain',
      },
      move: 'Flamethrower',
    })
    const drizzle = calculateChampionsDamage({
      attacker: {
        ...neutralAttacker,
        ability: 'Drizzle',
      },
      defender: neutralDefender,
      field: {
        weather: 'Sun',
      },
      move: 'Surf',
    })

    assert.equal(drought.min, 62)
    assert.equal(drought.max, 73)
    assert.equal(drizzle.min, 62)
    assert.equal(drizzle.max, 73)
  })

  it('applies spread damage only in Doubles for adjacent target moves', () => {
    const heatWaveSingles = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: neutralDefender,
      field: {
        gameType: 'Singles',
      },
      move: 'Heat Wave',
    })
    const heatWaveDoubles = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: neutralDefender,
      field: {
        gameType: 'Doubles',
      },
      move: 'Heat Wave',
    })
    const earthquakeDoubles = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: neutralDefender,
      field: {
        gameType: 'Doubles',
      },
      move: 'Earthquake',
    })

    assert.equal(heatWaveSingles.min, 44)
    assert.equal(heatWaveSingles.max, 52)
    assert.equal(heatWaveDoubles.min, 33)
    assert.equal(heatWaveDoubles.max, 39)
    assert.equal(earthquakeDoubles.min, 34)
    assert.equal(earthquakeDoubles.max, 40)
  })

  it('applies Adaptability to same-type attacks', () => {
    const normal = calculateChampionsDamage({
      attacker: {
        ...neutralAttacker,
        types: ['electric'],
      },
      defender: neutralDefender,
      move: 'Thunderbolt',
    })
    const adaptability = calculateChampionsDamage({
      attacker: {
        ...neutralAttacker,
        ability: 'Adaptability',
        types: ['electric'],
      },
      defender: neutralDefender,
      move: 'Thunderbolt',
    })

    assert.ok(adaptability.min > normal.min)
    assert.equal(adaptability.min, 82)
    assert.equal(adaptability.max, 98)
  })

  it('applies Huge Power and Choice Band to physical attacks', () => {
    const hugePower = calculateChampionsDamage({
      attacker: {
        ...neutralAttacker,
        ability: 'Huge Power',
      },
      defender: neutralDefender,
      move: 'Earthquake',
    })
    const choiceBand = calculateChampionsDamage({
      attacker: {
        ...neutralAttacker,
        item: 'Choice Band',
      },
      defender: neutralDefender,
      move: 'Earthquake',
    })

    assert.equal(hugePower.attack, 240)
    assert.equal(choiceBand.attack, 180)
  })

  it('applies Thick Fat and Assault Vest as defensive modifiers', () => {
    const thickFat = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: {
        ...neutralDefender,
        ability: 'Thick Fat',
      },
      move: 'Flamethrower',
    })
    const assaultVest = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: {
        ...neutralDefender,
        item: 'Assault Vest',
      },
      move: 'Flamethrower',
    })

    assert.equal(thickFat.attack, 60)
    assert.equal(assaultVest.defense, 150)
  })

  it('applies final damage item and ability modifiers', () => {
    const lifeOrb = calculateChampionsDamage({
      attacker: {
        ...neutralAttacker,
        item: 'Life Orb',
      },
      defender: neutralDefender,
      move: 'Thunderbolt',
    })
    const expertBelt = calculateChampionsDamage({
      attacker: {
        ...neutralAttacker,
        item: 'Expert Belt',
      },
      defender: {
        ...neutralDefender,
        types: ['water'],
      },
      move: 'Thunderbolt',
    })
    const multiscale = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: {
        ...neutralDefender,
        ability: 'Multiscale',
      },
      move: 'Thunderbolt',
    })
    const filter = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: {
        ...neutralDefender,
        ability: 'Filter',
        types: ['water'],
      },
      move: 'Thunderbolt',
    })

    assert.equal(lifeOrb.min, 53)
    assert.equal(expertBelt.min, 98)
    assert.equal(multiscale.max, 24)
    assert.equal(filter.max, 73)
  })

  it('applies matching resist berries to super effective damage', () => {
    const normal = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: {
        ...neutralDefender,
        types: ['steel'],
      },
      move: 'Flamethrower',
    })
    const occaBerry = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: {
        ...neutralDefender,
        item: 'Occa Berry',
        types: ['steel'],
      },
      move: 'Flamethrower',
    })

    assert.equal(normal.effectiveness, 2)
    assert.equal(occaBerry.min, 41)
    assert.equal(occaBerry.max, 49)
  })

  it('does not apply resist berries to neutral damage', () => {
    const normal = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: neutralDefender,
      move: 'Flamethrower',
    })
    const occaBerry = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: {
        ...neutralDefender,
        item: 'Occa Berry',
      },
      move: 'Flamethrower',
    })

    assert.equal(normal.effectiveness, 1)
    assert.deepEqual(occaBerry.damage, normal.damage)
  })

  it('does not apply resist berries to the wrong move type', () => {
    const wrongBerry = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: {
        ...neutralDefender,
        item: 'Yache Berry',
        types: ['steel'],
      },
      move: 'Flamethrower',
    })

    assert.equal(wrongBerry.effectiveness, 2)
    assert.equal(wrongBerry.min, 82)
    assert.equal(wrongBerry.max, 98)
  })

  it('applies Unnerve and Ripen to resist berries', () => {
    const unnerve = calculateChampionsDamage({
      attacker: {
        ...neutralAttacker,
        ability: 'Unnerve',
      },
      defender: {
        ...neutralDefender,
        item: 'Occa Berry',
        types: ['steel'],
      },
      move: 'Flamethrower',
    })
    const ripen = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: {
        ...neutralDefender,
        ability: 'Ripen',
        item: 'Occa Berry',
        types: ['steel'],
      },
      move: 'Flamethrower',
    })

    assert.equal(unnerve.min, 82)
    assert.equal(unnerve.max, 98)
    assert.equal(ripen.min, 20)
    assert.equal(ripen.max, 24)
  })

  it('applies type boosting items as base power modifiers', () => {
    const result = calculateChampionsDamage({
      attacker: {
        ...neutralAttacker,
        item: 'Magnet',
      },
      defender: neutralDefender,
      move: 'Thunderbolt',
    })

    assert.equal(result.basePower, 108)
  })

  it('blocks moves with immunity abilities', () => {
    const levitate = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: {
        ...neutralDefender,
        ability: 'Levitate',
      },
      move: 'Earthquake',
    })
    const flashFire = calculateChampionsDamage({
      attacker: neutralAttacker,
      defender: {
        ...neutralDefender,
        ability: 'Flash Fire',
      },
      move: 'Flamethrower',
    })

    assert.equal(levitate.max, 0)
    assert.equal(flashFire.max, 0)
  })

  it('calculates damage from Champions base stats when final stats are absent', () => {
    const result = calculateChampionsDamage({
      attacker: {
        baseStats: {
          hp: 60,
          atk: 50,
          def: 45,
          spa: 130,
          spd: 95,
          spe: 120,
        },
        nature: 'timid',
        sps: {
          spa: 32,
        },
        types: ['psychic'],
      },
      defender: {
        baseStats: {
          hp: 108,
          atk: 130,
          def: 95,
          spa: 80,
          spd: 85,
          spe: 102,
        },
        nature: 'serious',
        sps: {
          hp: 32,
          spd: 32,
        },
        types: ['dragon', 'ground'],
      },
      move: 'Ice Beam',
    })

    assert.equal(result.attack, 182)
    assert.equal(result.defense, 137)
    assert.equal(result.effectiveness, 4)
    assert.deepEqual(result.damage, [
      180, 184, 184, 188, 192, 192, 196, 196,
      200, 200, 204, 204, 208, 208, 212, 216,
    ])
  })
})

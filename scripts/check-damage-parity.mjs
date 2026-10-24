import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { calculate, Pokemon, Move, Field } from '../.cache/damage-reference/adaptable.js'
import { Generations } from '../.cache/damage-reference/data/index.js'
import { getFlingPower } from '../.cache/damage-reference/items.js'
import { CHAMPIONS_MOVES, CHAMPIONS_TYPE_CHART } from '../src/lib/damage/championsData.js'
import { CHAMPIONS_ITEMS } from '../src/lib/damage/championsItems.js'
import { calculateChampionsDamage } from '../src/lib/damage/championsDamage.js'
import { calculateChampionsStats, toId } from '../src/lib/damage/championsMath.js'
import { REGULATION, REGULATION_ITEMS, REGULATION_MOVES } from '../src/lib/regulation.js'
import { getMoveConditions } from '../src/lib/damage/championsMoveConditions.js'

const gen = Generations.get(0)
// Keep ordinary multi-hit sequences nonlethal: the reference reports potential
// damage beyond KO, whereas our sequence stops when either Pokemon faints.
const baseStats = { hp: 10000, atk: 120, def: 100, spa: 120, spd: 100, spe: 100 }
const unavailable = {
  'aura-wheel': 'Requires a Morpeko form; covered by species-specific tests.',
  'beat-up': 'The local reference has no party contribution formula.',
  belch: 'The local reference does not validate the berry prerequisite.',
  'last-resort': 'The local reference does not validate previously used moves.',
  'upper-hand': 'The local reference does not validate the target action.',
  snore: 'The local reference does not validate the sleep prerequisite.',
  'last-respects': 'The local reference has no allies-fainted power formula.',
  'rage-fist': 'The local reference has no hits-taken power formula.',
  'spit-up': 'The local reference has no Stockpile formula.',
  counter: 'The local reference has no received-damage context.',
  'mirror-coat': 'The local reference has no received-damage context.',
  'metal-burst': 'The local reference has no received-damage context.',
  comeuppance: 'The local reference has no received-damage context.',
  'super-fang': 'The local reference does not model current-target-HP damage.',
  endeavor: 'The local reference does not model the HP difference.',
}
const abilities = [
  ['', ''], ['Tough Claws', ''], ['Sharpness', ''], ['Technician', ''], ['Iron Fist', ''],
  ['Strong Jaw', ''], ['Mega Launcher', ''], ['Long Reach', ''], ['Mold Breaker', 'Levitate'],
  ['', 'Fur Coat'], ['Sniper', ''], ['', 'Thick Fat'], ['', 'Filter'],
  ['Blaze', '', { currentHp: 50 }], ['Overgrow', '', { currentHp: 50 }],
  ['Torrent', '', { currentHp: 50 }], ['Swarm', '', { currentHp: 50 }],
  ['Guts', '', { status: 'brn' }], ['Hustle', ''], ['', 'Heatproof'],
  ['Water Bubble', ''], ['', 'Water Bubble'], ['Solar Power', ''], ['Fire Mane', ''],
  ['', 'Purifying Salt'], ['Sand Force', ''], ['Flash Fire', '', { abilityOn: true }],
  ['', '', {}, { types: ['rock'] }], ['', '', {}, { types: ['ice'] }],
  ['', '', { item: 'Muscle Band' }], ['', '', { item: 'Wise Glasses' }],
  ['', '', { item: 'Metronome', consecutiveUses: 3 }],
  ['', '', { item: 'Light Ball', name: 'Pikachu' }],
  ...['Aerilate', 'Dragonize', 'Pixilate', 'Refrigerate', 'Reckless', 'Fairy Aura', 'Mega Sol', 'Liquid Voice', 'Scrappy', 'Huge Power', 'Pure Power'].map((ability) => [ability, '']),
  ['Analytic', '', { abilityOn: true }], ['Sheer Force', ''],
  ['Plus', '', { abilityOn: true }], ['Minus', '', { abilityOn: true }],
  ['Supreme Overlord', '', { alliesFainted: 3 }],
  ['Rivalry', '', { gender: 'M' }, { gender: 'M' }],
  ['Rivalry', '', { gender: 'M' }, { gender: 'F' }],
  ...['Dry Skin', 'Earth Eater', 'Eelevate', 'Lightning Rod', 'Motor Drive', 'Bulletproof', 'Soundproof', 'Armor Tail', 'Queenly Majesty', 'Grass Pelt', 'Marvel Scale'].map((ability) => ['', ability]),
  ...Object.values(CHAMPIONS_ITEMS).filter((item) => item.resistType).map((item) => ['', '', {}, { item: item.name, types: [Object.entries(CHAMPIONS_TYPE_CHART[item.resistType]).find(([, value]) => value === 2)?.[0] ?? 'normal'] }]),
]
const fixtures = [], differences = [], recorded = new Map(), skipped = new Map(), skippedScenarios = new Map()
let comparisons = 0
for (const [attackerAbility, defenderAbility, attacking = {}, defending = {}] of abilities) {
  for (const weather of ['', 'Sun', 'Rain', 'Sand', 'Snow']) {
    for (const move of Object.values(CHAMPIONS_MOVES)) {
      const id = toId(move.name)
      const reason = unavailable[id] ?? (move.ohko ? 'OHKO accuracy and immunity are tested against primary-source behavior.' : '')
      if (reason) { skipped.set(id, reason); continue }
      if (id === 'fling' && attacking.item) {
        const power = REGULATION_ITEMS.find((item) => item.id === toId(attacking.item))?.flingPower ?? 0
        const referencePower = getFlingPower(attacking.item, gen.num)
        if (power !== referencePower) {
          skippedScenarios.set(`Fling / ${attacking.item}`, `Pinned item power ${power}; local reference item power ${referencePower}. Verified separately against the primary source.`)
          continue
        }
      }
      const attackerBaseStats = id === 'payback' ? { ...baseStats, spe: attackerAbility === 'Analytic' ? 99 : 101 } : baseStats
      const input = {
        attacker: { level: 50, types: [id === 'burn-up' ? 'fire' : id === 'double-shock' ? 'electric' : 'normal'], baseStats: attackerBaseStats, weightkg: 100, ability: toId(attackerAbility), ...attacking },
        defender: { types: ['normal'], baseStats, weightkg: 100, ability: toId(defenderAbility), ...defending },
        move: move.name, field: { weather, gameType: 'Doubles', isCritical: attackerAbility === 'Sniper' },
      }
      const attacker = new Pokemon(gen, attacking.name ?? 'Snorlax', { ability: attackerAbility || 'No Ability', item: attacking.item, gender: attacking.gender, alliesFainted: attacking.alliesFainted, nature: 'Serious', curHP: attacking.currentHp, status: attacking.status, abilityOn: attacking.abilityOn, overrides: { baseStats: attackerBaseStats, weightkg: 100, types: input.attacker.types.map((type) => type[0].toUpperCase() + type.slice(1)) } })
      const defender = new Pokemon(gen, 'Snorlax', { ability: defenderAbility || 'No Ability', item: defending.item, gender: defending.gender, nature: 'Serious', curHP: defending.currentHp, status: defending.status, overrides: { baseStats, weightkg: 100, types: input.defender.types.map((type) => type[0].toUpperCase() + type.slice(1)) } })
      // Multiscale and similar effects need explicit stats on our low-level input.
      input.attacker.stats = calculateChampionsStats({ baseStats: attackerBaseStats })
      input.defender.stats = calculateChampionsStats({ baseStats })
      const metadata = { ...move, ...REGULATION_MOVES[toId(move.name)] }
      const refMove = new Move(gen, move.name, { hits: getMoveConditions(move).hits, overrides: {
        basePower: metadata.basePower, type: metadata.type[0].toUpperCase() + metadata.type.slice(1),
        category: metadata.category[0].toUpperCase() + metadata.category.slice(1),
        flags: metadata.flags ?? {}, target: metadata.target ?? 'normal', willCrit: Boolean(metadata.isCrit),
        priority: metadata.priority ?? 0, recoil: metadata.recoil, hasCrashDamage: metadata.hasCrashDamage,
        secondaries: metadata.secondaries, hasSheerForceBoost: metadata.hasSheerForceBoost,
        overrideOffensiveStat: metadata.overrideOffensiveStat, overrideOffensivePokemon: metadata.overrideOffensivePokemon,
        overrideDefensiveStat: metadata.overrideDefensiveStat, ignoreDefensive: metadata.ignoreDefensive,
      } })
      refMove.isCrit ||= input.field.isCritical
      refMove.timesUsedWithMetronome = attacking.consecutiveUses ?? 0
      const expected = calculate(gen, attacker, defender, refMove, new Field({ weather, gameType: 'Doubles', isCritical: input.field.isCritical })).damage
      const result = calculateChampionsDamage(input)
      const actual = result.damage
      const rolls = typeof expected === 'number' ? Array(16).fill(expected) : expected
      const range = Array.isArray(rolls[0]) ? [rolls.reduce((sum, hit) => sum + Math.min(...hit), 0), rolls.reduce((sum, hit) => sum + Math.max(...hit), 0)] : [Math.min(...rolls), Math.max(...rolls)]
      comparisons++
      if (result.hits > 1 ? result.min !== range[0] || result.max !== range[1] : JSON.stringify(actual) !== JSON.stringify(rolls)) differences.push({ move: move.name, attackerAbility, defenderAbility, attacking, defending, weather, actual: [actual[0], actual.at(-1)], expected: range })
      else {
        const key = `${attackerAbility}:${defenderAbility}:${weather}`
        if (!result.hits && (recorded.get(key) ?? 0) < 2) {
          fixtures.push({ input, expected: rolls })
          recorded.set(key, (recorded.get(key) ?? 0) + 1)
        }
      }
    }
  }
}
console.log(JSON.stringify({ comparisons, differences: differences.length, skippedMoves: Object.fromEntries(skipped), skippedScenarios: Object.fromEntries(skippedScenarios), referenceLimitations: ['Aura Guard, Fluffy, Ice Scales, Tinted Lens and Punk Rock are absent from the local reference; implemented effects are verified against pinned Showdown handlers instead.'], examples: differences.slice(0, 18) }, null, 2))
if (differences.length) throw new Error('Damage results differ from the reference')
if (process.argv.includes('--fixtures')) {
  const source = new URL('../.cache/damage-reference/mechanics/champions.js', import.meta.url)
  const referenceHash = createHash('sha256').update(await readFile(source)).digest('hex')
  await mkdir(new URL('../src/lib/damage/fixtures/', import.meta.url), { recursive: true })
  await writeFile(new URL('../src/lib/damage/fixtures/reference-abilities.json', import.meta.url), `${JSON.stringify({ source: 'local damage-calc/calc/src/mechanics/champions.ts', referenceHash, dataCommit: REGULATION.commit, cases: fixtures }, null, 2)}\n`)
}

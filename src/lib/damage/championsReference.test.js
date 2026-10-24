import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { calculateChampionsDamage } from './championsDamage.js'

const fixture = JSON.parse(readFileSync(new URL('./fixtures/reference-abilities.json', import.meta.url), 'utf8'))

test('all damage rolls match the recorded local reference across abilities and weather', () => {
  assert.match(fixture.referenceHash, /^[a-f0-9]{64}$/)
  assert.ok(fixture.cases.length > 0)
  for (const { input, expected } of fixture.cases) {
    assert.deepEqual(calculateChampionsDamage(input).damage, expected, `${input.move}: ${input.attacker.ability}/${input.defender.ability}, ${input.field.weather}`)
  }
})

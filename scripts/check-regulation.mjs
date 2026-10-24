import { access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import snapshot from '../src/data/activeRegulation.js'
import { CHAMPIONS_MOVES } from '../src/lib/damage/championsData.js'
import { getAbilityCoverage } from '../src/lib/damage/championsCoverage.js'
import { getItemCoverage } from '../src/lib/damage/championsItems.js'
import { toId } from '../src/lib/damage/championsMath.js'
import { POKEMON_IMAGES } from '../src/data/pokemonImages.js'
import { readRegulationConfig, root } from './regulation-config.mjs'
import { validateSnapshot } from './import-regulation.mjs'

export function getCoverage(data) {
  const damaging = Object.entries(data.moves).filter(([, move]) => move.category !== 'status')
  const abilities = [...new Set(data.roster.flatMap((pokemon) => pokemon.abilities.map((ability) => toId(ability.name))))].sort()
  return {
    damagingMoves: damaging.length,
    supportedDamagingMoves: damaging.filter(([id]) => CHAMPIONS_MOVES[id]).length,
    missingMoves: damaging.filter(([id]) => !CHAMPIONS_MOVES[id]).map(([id]) => id),
    unclassifiedAbilities: abilities.filter((id) => getAbilityCoverage(id, data.abilityMechanics) === 'unknown'),
    changedAbilities: abilities.filter((id) => getAbilityCoverage(id, data.abilityMechanics) === 'changed'),
    partialAbilities: abilities.filter((id) => getAbilityCoverage(id, data.abilityMechanics) === 'partial'),
    noDirectEffectAbilities: abilities.filter((id) => getAbilityCoverage(id, data.abilityMechanics) === 'no-direct-effect'),
    unclassifiedItems: data.items.filter((item) => getItemCoverage(item.id, data.items) === 'unknown').map((item) => item.id),
    changedItems: data.items.filter((item) => getItemCoverage(item.id, data.items) === 'changed').map((item) => item.id),
  }
}

export async function checkRegulation({ complete = false, details = false } = {}) {
  const { regulation } = await readRegulationConfig()
  validateSnapshot(snapshot)
  for (const key of Object.keys(regulation)) {
    if (JSON.stringify(snapshot.source[key]) !== JSON.stringify(regulation[key])) throw new Error(`Stale active snapshot: ${key}; run npm run data:regulation`)
  }
  for (const pokemon of snapshot.roster) {
    const image = POKEMON_IMAGES[pokemon.showdownId]
    if (!image) throw new Error(`Missing exact image mapping: ${pokemon.showdownId}; run npm run assets:pokemon`)
    await access(new URL(`public/images/pokemon/${image.file}`, root))
  }
  for (const [id, move] of Object.entries(snapshot.moves)) {
    const implemented = CHAMPIONS_MOVES[id]
    if (!implemented) continue
    for (const key of ['basePower', 'type', 'category']) {
      if (move[key] !== implemented[key]) throw new Error(`Damage engine metadata mismatch: ${id}.${key}`)
    }
  }
  const coverage = getCoverage(snapshot)
  const summary = details ? coverage : {
    damagingMoves: coverage.damagingMoves, supportedDamagingMoves: coverage.supportedDamagingMoves,
    missingMoves: coverage.missingMoves.length, unclassifiedAbilities: coverage.unclassifiedAbilities.length,
    changedAbilities: coverage.changedAbilities.length, partialAbilities: coverage.partialAbilities.length,
    noDirectEffectAbilities: coverage.noDirectEffectAbilities.length,
    unclassifiedItems: coverage.unclassifiedItems.length,
    changedItems: coverage.changedItems.length,
  }
  console.log(JSON.stringify({ regulation: regulation.label, source: regulation.commit, forms: snapshot.roster.length, items: snapshot.items.length, coverage: summary }, null, 2))
  if (complete && (coverage.missingMoves.length || coverage.unclassifiedAbilities.length || coverage.changedAbilities.length || coverage.partialAbilities.length || coverage.unclassifiedItems.length || coverage.changedItems.length)) {
    throw new Error('Damage coverage is incomplete; review the listed mechanics before release')
  }
  return coverage
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) await checkRegulation({ complete: process.argv.includes('--complete'), details: process.argv.includes('--details') })

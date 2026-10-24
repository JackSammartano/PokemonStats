import { findKoOptions, findSurvivalOptions, getOptimizerBaseline } from './championsOptimizer.js'

export function runOptimizerJob({ mode, context, rankingMode }) {
  if (!['ko', 'survival'].includes(mode)) throw new RangeError('Modalità di ottimizzazione non valida.')
  const baseline = getOptimizerBaseline(context)
  const hp = context.defender.hp
  const satisfied = mode === 'ko' ? baseline.guaranteedKO ?? baseline.min >= hp : baseline.guaranteedSurvival ?? baseline.max < hp
  if (satisfied) return { mode, alreadySatisfied: true, defenderHp: hp, min: baseline.min, max: baseline.max, displayed: [], total: 0 }
  const search = mode === 'ko' ? findKoOptions : findSurvivalOptions
  return { mode, ...search(context, { rankingMode }) }
}

if (typeof self !== 'undefined') {
  self.onmessage = ({ data }) => {
    try { self.postMessage({ result: runOptimizerJob(data) }) }
    catch (error) { self.postMessage({ error: error instanceof RangeError ? error.message : 'Impossibile completare l’ottimizzazione con queste condizioni.' }) }
  }
}

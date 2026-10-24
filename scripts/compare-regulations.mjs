import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { readRegulationConfig, root } from './regulation-config.mjs'
import { validateSnapshot } from './import-regulation.mjs'
import { getCoverage } from './check-regulation.mjs'

function compareEntries(before, after, identity) {
  const old = new Map(before.map((entry) => [identity(entry), entry]))
  const next = new Map(after.map((entry) => [identity(entry), entry]))
  return {
    added: [...next.keys()].filter((id) => !old.has(id)).sort(),
    removed: [...old.keys()].filter((id) => !next.has(id)).sort(),
    changed: [...next.keys()].filter((id) => old.has(id) && JSON.stringify(old.get(id)) !== JSON.stringify(next.get(id))).sort(),
  }
}

export function compareRegulations(before, after) {
  return {
    from: before.source.label, to: after.source.label,
    roster: compareEntries(before.roster, after.roster, (entry) => entry.showdownId),
    moves: compareEntries(Object.entries(before.moves), Object.entries(after.moves), ([id]) => id),
    items: compareEntries(before.items, after.items, (entry) => entry.id),
    learnsets: compareEntries(Object.entries(before.learnsets), Object.entries(after.learnsets), ([id]) => id),
    megaEvolutions: compareEntries(before.megaEvolutions, after.megaEvolutions, (entry) => entry.megaId),
    abilityMechanics: compareEntries(Object.entries(before.abilityMechanics), Object.entries(after.abilityMechanics), ([id]) => id),
    targetCoverage: getCoverage(after),
  }
}

export async function readSnapshot(id) {
  await readRegulationConfig(id)
  const { default: data } = await import(new URL(`src/data/regulations/${id}.js`, root))
  return validateSnapshot(data)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const [before, after] = process.argv.slice(2)
  if (!before || !after) throw new Error('Usage: npm run data:diff -- mb mc')
  console.log(JSON.stringify(compareRegulations(await readSnapshot(before), await readSnapshot(after)), null, 2))
}

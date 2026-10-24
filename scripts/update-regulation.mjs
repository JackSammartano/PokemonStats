import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { importRegulation, writeAtomic } from './import-regulation.mjs'
import { configPath, readRegulationConfig, root } from './regulation-config.mjs'

const [id, ...extra] = process.argv.slice(2)
if (extra.length) throw new Error('Usage: npm run data:update -- mc')
const { regulation } = await readRegulationConfig(id)
const backups = []
for (const path of [configPath, new URL('src/data/activeRegulation.js', root), new URL('src/data/pokemonImages.js', root), new URL(`src/data/regulations/${regulation.id}.js`, root), new URL(`src/data/regulations/${regulation.id}-learnsets.js`, root)]) {
  try { backups.push([path, await readFile(path, 'utf8')]) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
}

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`Update stopped: ${args.join(' ')}`)
}

try {
  await importRegulation({ id, activate: true })
  run(['scripts/import-pokemon-images.mjs'])
  run(['scripts/check-regulation.mjs', '--complete'])
  run(['--test', 'src/lib/damage/*.test.js', 'src/lib/*.test.js', 'scripts/*.test.mjs'])
  run(['node_modules/oxlint/bin/oxlint'])
  run(['node_modules/vite/bin/vite.js', 'build'])
  console.log(`Update verified: ${regulation.label}. Review the data diff before committing. Nothing was published.`)
} catch (error) {
  for (const [path, content] of backups) await writeAtomic(path, content)
  throw error
}

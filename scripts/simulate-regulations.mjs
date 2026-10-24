import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { importRegulation, writeAtomic } from './import-regulation.mjs'
import { compareRegulations, readSnapshot } from './compare-regulations.mjs'
import { configPath, root } from './regulation-config.mjs'

// Always restore the selected regulation, including when a historical build fails.
const pointer = new URL('src/data/activeRegulation.js', root)
const originalConfig = await readFile(configPath, 'utf8')
const originalPointer = await readFile(pointer, 'utf8')
const [from = 'mb', to = 'mc'] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
const snapshots = []
let failure
try {
  for (const id of [from, to]) {
    const previous = await readSnapshot(id)
    const snapshot = await importRegulation({ id, activate: true, offline: process.argv.includes('--offline') })
    assert.deepEqual(JSON.parse(JSON.stringify(snapshot)), previous, `Non-reproducible snapshot: ${id}`)
    snapshots.push(snapshot)
    const script = `import {REGULATION,REGULATION_ROSTER,REGULATION_LEARNSETS} from './src/lib/regulation.js'; import {POKEMON_DATASET} from './src/lib/pokemonDataset.js'; import {parseShowdownTeam} from './src/lib/showdownImport.js'; import {TEAM_STORAGE_KEY,createTeamWorkspace,readTeamWorkspace} from './src/lib/teamWorkspace.js'; import {getMegaAction} from './src/lib/megaEvolution.js'; import {getTeamMoveOptions} from './src/lib/teamData.js'; import assert from 'node:assert/strict'; assert.equal(REGULATION.id,${JSON.stringify(id)}); assert.equal(POKEMON_DATASET.length,REGULATION_ROSTER.length); assert.ok(TEAM_STORAGE_KEY.endsWith('.'+REGULATION.id)); assert.deepEqual(readTeamWorkspace({getItem:()=>JSON.stringify({...createTeamWorkspace(),regulation:'foreign'})}),createTeamWorkspace()); for(const p of POKEMON_DATASET){assert.ok(getTeamMoveOptions(p).options.length);if(p.category==='mega')assert.ok(getMegaAction(p,{}));} assert.equal(parseShowdownTeam('Charizard\\n- Protect').members.length,1); assert.ok(REGULATION_LEARNSETS.charizard.includes('protect')); console.log('Runtime smoke passed: '+REGULATION.label);`
    for (const args of [['--input-type=module', '-e', script], ['scripts/check-regulation.mjs'], ['--test', 'src/lib/damage/*.test.js', 'src/lib/*.test.js', 'scripts/*.test.mjs'], ['node_modules/vite/bin/vite.js', 'build']]) {
      const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' })
      if (result.error) throw result.error
      assert.equal(result.status, 0, `${id}: ${args[0]} failed`)
    }
  }
  console.log(JSON.stringify(compareRegulations(...snapshots), null, 2))
} catch (error) {
  failure = error
} finally {
  await writeAtomic(configPath, originalConfig)
  await writeAtomic(pointer, originalPointer)
  const restored = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], { cwd: root, stdio: 'inherit' })
  failure ??= restored.error ?? (restored.status !== 0 ? new Error('Build failed after restoring the original regulation') : null)
}
if (failure) throw failure

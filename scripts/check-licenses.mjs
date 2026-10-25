import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const normalize = (text) => text.replaceAll('\r\n', '\n').trim()
const source = normalize(await readFile(new URL('docs/licenses/pokemon-showdown.txt', root), 'utf8'))
for (const directory of ['public', 'dist']) {
  const path = `${directory}/licenses/pokemon-showdown.txt`
  assert.equal(normalize(await readFile(new URL(path, root), 'utf8')), source, `Showdown license mismatch: ${path}`)
}
console.log('Showdown copyright and MIT license verified in public and dist.')

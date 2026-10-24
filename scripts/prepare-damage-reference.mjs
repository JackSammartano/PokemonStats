import { readdir, readFile, mkdir, writeFile, access } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { resolve, relative, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Optional local oracle. Transpile the reference into our cache without installing
// packages or changing its checkout. Only the reference's production sources run.
const source = resolve(process.argv[2] ?? 'C:/Progetti/damage-calc/damage-calc/calc/src')
const target = fileURLToPath(new URL('../.cache/damage-reference/', import.meta.url))
async function compile(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) { await compile(path); continue }
    if (!entry.name.endsWith('.ts') || /(?:\.test|\.spec|test-util)\.ts$/.test(entry.name) || entry.name.endsWith('.d.ts')) continue
    const destination = join(target, relative(source, path)).replace(/\.ts$/, '.js')
    let code = stripTypeScriptTypes(await readFile(path, 'utf8'), { mode: 'transform' })
    const matches = [...code.matchAll(/from\s+['"]([.][^'"]+)['"]/g)]
    for (const match of matches) {
      let module = resolve(dirname(path), match[1])
      try { await access(`${module}.ts`); module += '.ts' }
      catch { module = join(module, 'index.ts'); await access(module) }
      const modulePath = relative(dirname(destination), join(target, relative(source, module))).replaceAll('\\', '/').replace(/\.ts$/, '.js')
      code = code.replace(match[0], `from '${modulePath.startsWith('.') ? modulePath : `./${modulePath}`}'`)
    }
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, code)
  }
}
await compile(source)
const reference = await import(pathToFileURL(join(target, 'adaptable.js')))
console.log(`Reference ready: ${Object.keys(reference).join(', ')}`)

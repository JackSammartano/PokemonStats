import { readFile } from 'node:fs/promises'

export const root = new URL('../', import.meta.url)
export const configPath = new URL('config/regulations.json', root)

export async function readRegulationConfig(id) {
  const config = JSON.parse(await readFile(configPath, 'utf8'))
  const selected = id ?? config.active
  const regulation = config.regulations[selected]
  if (!/^[a-z][a-z0-9-]*$/.test(selected) || !regulation) throw new Error(`Unknown regulation: ${selected}`)
  if (!/^[a-f0-9]{40}$/.test(regulation.commit)) throw new Error('A full pinned Showdown commit is required')
  if (regulation.mechanics !== 'champions') throw new Error(`Unsupported mechanics: ${regulation.mechanics}`)
  for (const mod of [...regulation.parents, regulation.mod]) {
    if (!/^[a-z0-9]+$/.test(mod)) throw new Error(`Invalid mod: ${mod}`)
  }
  if (!Array.isArray(regulation.excludedTags)) throw new Error('Explicit excludedTags are required')
  return { config, regulation: { id: selected, ...regulation } }
}

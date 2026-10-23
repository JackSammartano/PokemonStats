import { CHAMPIONS_TEAM_ITEMS, CHAMPIONS_TEAM_LEARNSETS, CHAMPIONS_TEAM_MOVES } from '../data/championsTeamData.js'
import { getDamageMoveOptions } from './damage/championsOptions.js'
import { toId } from './damage/championsMath.js'

export { CHAMPIONS_TEAM_ITEMS }
export const normalizeShowdownId = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
export const getTeamMove = (id) => Object.hasOwn(CHAMPIONS_TEAM_MOVES, id) ? CHAMPIONS_TEAM_MOVES[id] : null

export function getTeamMoveOptions(pokemon) {
  const ids = CHAMPIONS_TEAM_LEARNSETS[pokemon?.showdownId]
  if (!ids) return getDamageMoveOptions(pokemon)
  return {
    source: 'supported',
    options: ids.map((value) => ({ value, label: CHAMPIONS_TEAM_MOVES[value].name, move: CHAMPIONS_TEAM_MOVES[value] }))
      .sort((a, b) => a.label.localeCompare(b.label, 'en')),
  }
}

export function getAbilityOptions(pokemon, current = '', currentName = '') {
  const options = [{ value: '', label: 'Nessuna' }]
  for (const ability of pokemon?.abilities ?? []) {
    options.push({ value: toId(ability.name), label: `${ability.name}${ability.isHidden ? ' (Hidden)' : ''}` })
  }
  if (current && !options.some((option) => option.value === current)) options.push({ value: current, label: `${currentName || current} (importata)` })
  return options
}

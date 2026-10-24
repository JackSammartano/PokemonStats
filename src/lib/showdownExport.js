import { REGULATION_ABILITY_MECHANICS, REGULATION_ITEMS, REGULATION_ROSTER } from './regulation.js'
import { CHAMPIONS_NATURES } from './damage/championsData.js'
import { getPokemonMoveSlots } from './damage/championsMoveSets.js'
import { getWorkspaceBuild } from './teamWorkspace.js'
import { getTeamMove } from './teamData.js'

const roster = new Map(REGULATION_ROSTER.map((pokemon) => [pokemon.displayName, pokemon]))
const items = new Map(REGULATION_ITEMS.map((item) => [item.id, item.name]))
const statLabels = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' }
// Additional set fields accepted by Teams.exportSet/parseExportedTeamLine at the
// pinned Showdown commit. Unknown imported lines remain consultation data only.
const extraField = /^(?:Shiny|Happiness|Pokeball|Hidden Power|Dynamax Level|Gigantamax|Tera Type): [^\r\n]+$/

export function exportShowdownTeam({ side, team, builds, moveSets }) {
  if (!['attacker', 'defender'].includes(side)) throw new Error('Squadra non valida.')
  if (!team.length || team.length > 6) throw new Error('La squadra da esportare deve contenere da 1 a 6 Pokémon.')
  const seen = new Set()
  return team.map((pokemon) => {
    const entry = roster.get(pokemon.displayName)
    if (!entry || seen.has(entry.showdownId)) throw new Error(`Pokémon non riconosciuto o duplicato: ${pokemon.displayName}.`)
    seen.add(entry.showdownId)
    const build = getWorkspaceBuild(builds, side, entry.displayName)
    const invalid = (detail) => new Error(`${entry.displayName}: ${detail}`)
    if (!Object.hasOwn(CHAMPIONS_NATURES, build.nature)) throw invalid('natura non riconosciuta.')
    if (!['', 'M', 'F'].includes(build.gender)) throw invalid('genere non valido.')
    if (!Number.isInteger(build.level) || build.level < 1 || build.level > 100) throw invalid('livello non valido.')
    const spread = Object.keys(statLabels).map((stat) => [stat, build.sps[stat]])
    if (spread.some(([, value]) => !Number.isInteger(value) || value < 0 || value > 32) || spread.reduce((sum, [, value]) => sum + value, 0) > 66) throw invalid('SP non validi: massimo 32 per statistica e 66 totali.')
    const item = build.item ? items.get(build.item) : ''
    const ability = build.ability ? REGULATION_ABILITY_MECHANICS[build.ability]?.name : ''
    if (build.item && !item) throw invalid(`oggetto non riconosciuto: ${build.item}.`)
    if (build.ability && !ability) throw invalid(`abilità non riconosciuta: ${build.ability}.`)
    const lines = [`${entry.showdownName}${build.gender ? ` (${build.gender})` : ''}${item ? ` @ ${item}` : ''}`]
    if (ability) lines.push(`Ability: ${ability}`)
    lines.push(`Level: ${build.level}`)
    const invested = spread.filter(([, value]) => value > 0)
    if (invested.length) lines.push(`EVs: ${invested.map(([stat, value]) => `${value} ${statLabels[stat]}`).join(' / ')}`)
    lines.push(`${build.nature[0].toUpperCase() + build.nature.slice(1)} Nature`)
    for (const line of build.extraLines ?? []) if (typeof line === 'string' && extraField.test(line)) lines.push(line)
    const seenMoves = new Set()
    for (const id of getPokemonMoveSlots(moveSets, side, pokemon)) {
      if (!id) continue
      const move = getTeamMove(id)
      if (!move || seenMoves.has(id)) throw invalid(`mossa non riconosciuta o ripetuta: ${id}.`)
      seenMoves.add(id)
      lines.push(`- ${move.name}`)
    }
    return lines.join('\n')
  }).join('\n\n') + '\n'
}

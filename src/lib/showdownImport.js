import { REGULATION_MC_ROSTER } from '../data/regulationMc.js'
import { CHAMPIONS_NATURES } from './damage/championsData.js'
import { createDamageBuild } from './damage/championsMatchup.js'
import { toId } from './damage/championsMath.js'
import { getTeamMove, getTeamMoveOptions, normalizeShowdownId } from './teamData.js'

const STAT_IDS = { hp: 'hp', atk: 'atk', def: 'def', spa: 'spa', spatk: 'spa', spd: 'spd', spdef: 'spd', spe: 'spe' }
const rosterIndex = new Map(REGULATION_MC_ROSTER.flatMap((entry) => [entry.showdownId, entry.showdownName, entry.displayName, entry.apiName].filter(Boolean).map((name) => [normalizeShowdownId(name), entry])))

function parseSpread(text, max, label) {
  const result = {}
  for (const part of text.split('/')) {
    const match = part.trim().match(/^(\d+)\s+([\w. ]+)$/)
    const stat = match && STAT_IDS[normalizeShowdownId(match[2])]
    if (!stat || Number(match[1]) > max || Object.hasOwn(result, stat)) throw new Error(`${label} non validi: ${part.trim()}. Limite per statistica: ${max}.`)
    result[stat] = Number(match[1])
  }
  return result
}

export function parseShowdownTeam(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Gli appunti sono vuoti. Copia un export testuale di Pokémon Showdown.')
  if (text.length > 100000) throw new Error('Il testo è troppo lungo per un team Showdown.')
  const lines = text.replace(/\r/g, '').split('\n').map((line) => line.trim()).filter((line) => !/^===.*===$/.test(line))
  const blocks = lines.join('\n').trim().split(/\n\s*\n/).filter(Boolean)
  if (blocks.length > 6) throw new Error('Un team può contenere al massimo 6 Pokémon. Importa un solo team alla volta.')
  const members = []
  const warnings = []
  for (const block of blocks) {
    const [header, ...details] = block.split('\n').map((line) => line.trim()).filter(Boolean)
    const [rawName, ...itemParts] = header.split(/\s*@\s*/)
    let name = rawName.trim()
    const genderMatch = name.match(/\s+\(([MF])\)$/)
    const gender = genderMatch?.[1] ?? ''
    name = name.replace(/\s+\([MF]\)$/, '')
    const nicknameMatch = name.match(/^(.*?)\s+\(([^()]+)\)$/)
    const speciesName = nicknameMatch?.[2] ?? name
    const entry = rosterIndex.get(normalizeShowdownId(speciesName))
    if (!entry) throw new Error(`Pokémon non riconosciuto nel roster M-C: ${speciesName}. Nessuna modifica applicata.`)
    if (members.some((member) => member.name === entry.displayName)) throw new Error(`Pokémon duplicato: ${entry.displayName}.`)
    const canonicalHeader = `${entry.showdownName}${gender ? ` (${gender})` : ''}${itemParts.length ? ` @ ${itemParts.join(' @ ')}` : ''}`
    const build = { ...createDamageBuild(), gender, item: toId(itemParts.join(' @ ')), itemName: itemParts.join(' @ '), sourceText: [canonicalHeader, ...details].join('\n'), extraLines: [] }
    const moves = []
    for (const line of details) {
      if (/^Ability:/i.test(line)) {
        build.abilityName = line.replace(/^Ability:\s*/i, '')
        build.ability = toId(build.abilityName)
      } else if (/^Level:/i.test(line)) {
        build.level = Number(line.replace(/^Level:\s*/i, ''))
        if (!Number.isInteger(build.level) || build.level < 1 || build.level > 100) throw new Error(`Livello non valido per ${entry.displayName}.`)
      } else if (/^(EVs|SPs):/i.test(line)) {
        const spread = parseSpread(line.replace(/^(EVs|SPs):\s*/i, ''), 32, 'SP Champions')
        if (Object.values(spread).reduce((sum, value) => sum + value, 0) > 66) throw new Error(`SP di ${entry.displayName}: il totale supera 66. L'export deve usare i valori Champions, non gli EV da 252.`)
        build.sps = { ...build.sps, ...spread }
      } else if (/^IVs:/i.test(line)) {
        // Champions uses fixed IVs; ignore this line in main-series exports.
        continue
      } else if (/ Nature$/i.test(line)) {
        build.nature = line.replace(/ Nature$/i, '').toLowerCase()
        if (!Object.hasOwn(CHAMPIONS_NATURES, build.nature)) throw new Error(`Natura non riconosciuta: ${line}.`)
      } else if (/^[-–]\s+/.test(line)) {
        const id = toId(line.replace(/^[-–]\s+/, ''))
        if (!getTeamMove(id)) throw new Error(`Mossa non riconosciuta: ${line}. Il team non è stato modificato.`)
        if (moves.includes(id)) throw new Error(`Mossa ripetuta per ${entry.displayName}: ${line}.`)
        moves.push(id)
      } else build.extraLines.push(line)
    }
    if (moves.length > 4) throw new Error(`${entry.displayName} ha più di quattro mosse.`)
    if (Object.values(build.sps).reduce((sum, value) => sum + value, 0) > 66) throw new Error(`SP di ${entry.displayName}: il totale supera 66.`)
    const legal = new Set(getTeamMoveOptions(entry).options.map((option) => option.value))
    for (const id of moves) if (!legal.has(id)) warnings.push(`${entry.displayName}: ${getTeamMove(id).name} non risulta nel learnset M-C verificato.`)
    members.push({ name: entry.displayName, build, moves: Array.from({ length: 4 }, (_, index) => moves[index] ?? '') })
  }
  if (!members.length) throw new Error('Nessun Pokémon trovato nel testo.')
  return { members, warnings }
}

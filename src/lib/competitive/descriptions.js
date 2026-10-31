import { CHAMPIONS_NATURES } from '../damage/championsData.js'
import { getMovePresentation } from '../damage/championsMovePresentation.js'
import { showdownId } from './normalize.js'

const statNames = { hp: 'PS', atk: 'Attacco', def: 'Difesa', spa: 'Attacco Speciale', spd: 'Difesa Speciale', spe: 'Velocità' }
const kinds = { moves: 'Mossa', items: 'Strumento', abilities: 'Abilità', natures: 'Natura' }
const categories = { physical: 'Fisica', special: 'Speciale', status: 'Stato' }
const usableText = (value) => typeof value === 'string' && value.trim() && value !== 'Descrizione non disponibile.'

export function createCompetitiveDescriptions({ moves, items, roster }) {
  const moveMap = new Map(Object.entries(moves).flatMap(([id, move]) => [[showdownId(id), move], [showdownId(move.name), move]]))
  const itemMap = new Map(items.flatMap((item) => [[showdownId(item.id), item], [showdownId(item.name), item]]))
  const abilityMap = new Map(roster.flatMap((pokemon) => pokemon.abilities.flatMap((ability) => [[showdownId(ability.id), ability], [showdownId(ability.name), ability]])))
  return (kind, key) => {
    if (!Object.hasOwn(kinds, kind)) return null
    const id = showdownId(key)
    let entry, description, facts = [], lang = 'en'
    if (kind === 'moves') {
      entry = moveMap.get(id)
      if (entry) {
        const presentation = getMovePresentation(entry)
        description = entry.presentation?.shortDesc
        facts = [
          { label: 'Tipo', value: entry.type }, { label: 'Categoria', value: categories[entry.category] ?? entry.category },
          { label: 'Potenza base', value: presentation.power }, { label: 'Precisione base', value: presentation.accuracy },
        ]
      }
    } else if (kind === 'items') {
      entry = itemMap.get(id)
      description = entry?.description
      if (key === '') { entry = { name: 'Nessuno strumento' }; description = 'Non è assegnato alcuno strumento.'; lang = 'it' }
    } else if (kind === 'abilities') {
      entry = abilityMap.get(id)
      description = entry?.description
    } else {
      const nature = CHAMPIONS_NATURES[id]
      if (nature) {
        entry = { name: id.charAt(0).toUpperCase() + id.slice(1) }
        description = nature[0] === nature[1] ? 'Non modifica le statistiche.' : `${statNames[nature[0]]} +10%; ${statNames[nature[1]]} −10%.`
        lang = 'it'
      }
    }
    if (!usableText(description)) { description = 'Descrizione non disponibile nei dati della regulation attiva.'; lang = 'it' }
    return { name: entry?.name ?? key, kind: kinds[kind], description, lang, facts }
  }
}

import snapshot from '../data/activeRegulation.js'

export const REGULATION = snapshot.source
export const REGULATION_ROSTER = snapshot.roster
export const REGULATION_POKEMON = REGULATION_ROSTER.map((entry) => entry.displayName)
export const REGULATION_MOVES = snapshot.moves
export const REGULATION_LEARNSETS = snapshot.learnsets
export const REGULATION_ITEMS = snapshot.items
export const REGULATION_MEGA_EVOLUTIONS = snapshot.megaEvolutions
export const REGULATION_ABILITY_MECHANICS = snapshot.abilityMechanics

import { CHAMPIONS_ABILITY_COVERAGE } from '../../data/championsAbilityCoverage.js'
import { REGULATION_ABILITY_MECHANICS } from '../regulation.js'
import { toId } from './championsMath.js'
import { getEffectiveAbility } from './championsBattle.js'

export function getAbilityCoverage(ability, mechanics = REGULATION_ABILITY_MECHANICS) {
  const id = toId(ability)
  if (!id) return 'no-direct-effect'
  const reviewed = CHAMPIONS_ABILITY_COVERAGE[id]
  if (!reviewed) return 'unknown'
  const fingerprint = mechanics?.[id]?.fingerprint
  if (!fingerprint || !reviewed.fingerprints.includes(fingerprint)) return 'changed'
  return reviewed.status
}

export function getBattleAbilityCoverageNotes(build, opponent, field = {}) {
  const notes = [getAbilityCoverageNote(build.ability, build.abilityName)]
  const effective = getEffectiveAbility(build, opponent, field)
  if (effective !== toId(build.ability)) notes.push(getAbilityCoverageNote(effective))
  return notes.filter(Boolean)
}

export function getAbilityCoverageNote(ability, name, mechanics = REGULATION_ABILITY_MECHANICS) {
  const status = getAbilityCoverage(ability, mechanics)
  if (status === 'implemented' || status === 'no-direct-effect') return ''
  const label = name || ability
  return status === 'changed' ? `Il comportamento di ${label} richiede una nuova verifica per questa regulation.`
    : status === 'partial' ? `Effetto di ${label} implementato solo parzialmente.`
      : `Effetto di ${label} non implementato.`
}

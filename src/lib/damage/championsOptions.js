import { CHAMPIONS_SET_MOVE_IDS } from '../../data/championsSetMoves.js'
import { CHAMPIONS_ABILITIES } from './championsAbilities.js'
import { CHAMPIONS_MOVES } from './championsData.js'
import { toId } from './championsMath.js'

export const NO_SUPPORTED_MOVES_OPTION = {
  disabled: true,
  label: 'No supported moves',
  name: 'No supported moves',
  value: '',
}

export function getAllDamageMoveOptions() {
  return Object.entries(CHAMPIONS_MOVES)
    .map(([moveId, move]) => ({
      label: move.name,
      move,
      value: moveId,
    }))
}

export function getSupportedMoveOptions(pokemon) {
  const championsSetMoves = CHAMPIONS_SET_MOVE_IDS[toId(pokemon?.apiName)]
  const learnset = new Set(
    championsSetMoves ??
      (pokemon?.moves ?? []).map((move) => toId(move.id ?? move.name)),
  )

  return getAllDamageMoveOptions().filter(({ value }) => learnset.has(value))
}

export function getDamageMoveOptions(pokemon) {
  const supportedOptions = getSupportedMoveOptions(pokemon)

  if (supportedOptions.length > 0) {
    return {
      options: supportedOptions,
      source: 'supported',
    }
  }

  return {
    options: getAllDamageMoveOptions(),
    source: 'manual',
  }
}

export function getSupportedAbilityOptions(pokemon) {
  const options = [{ label: CHAMPIONS_ABILITIES[''].name, value: '' }]
  const seen = new Set([''])

  for (const ability of pokemon?.abilities ?? []) {
    const abilityId = toId(ability.id ?? ability.name)

    if (!abilityId || seen.has(abilityId)) {
      continue
    }

    seen.add(abilityId)
    const championsAbility = CHAMPIONS_ABILITIES[abilityId]
    const option = {
      label: [
        championsAbility?.name ?? ability.name ?? formatOptionName(abilityId),
        ability.isHidden ? '(Hidden)' : '',
        championsAbility ? '' : '(not calculated yet)',
      ].filter(Boolean).join(' '),
      value: abilityId,
    }

    if (!championsAbility) {
      option.disabled = true
    }

    options.push(option)
  }

  return options
}

function formatOptionName(value) {
  return String(value)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

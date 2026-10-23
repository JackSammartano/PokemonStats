import { CHAMPIONS_NATURES } from '../lib/damage/championsData.js'
import { CHAMPIONS_ABILITIES } from '../lib/damage/championsAbilities.js'
import { CHAMPIONS_ITEMS } from '../lib/damage/championsItems.js'
const DAMAGE_STAT_LABELS = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' }

export default function OptimizerResults({ isOptimizing, moveCategory, result }) {
  const title = result.mode === 'survival' ? 'Survival options' : 'KO options'
  const emptyText =
    result.mode === 'survival'
      ? 'No guaranteed survival found with current search rules.'
      : 'No guaranteed KO found with current search rules.'
  const alreadySatisfiedText =
    result.mode === 'survival'
      ? 'Current setup already survives.'
      : 'Current setup already guarantees KO.'
  const headerText = result.alreadySatisfied
    ? 'Current setup'
    : `Showing ${result.displayed.length} best options`

  return (
    <div className="optimizer-results">
      <div className="optimizer-results-header">
        <strong>{title}</strong>
        <span>{headerText}</span>
      </div>

      {isOptimizing ? (
        <div className="optimizer-loading">
          <div className="pokeball-spinner" aria-hidden="true"></div>
          <span>Calculating options</span>
        </div>
      ) : result.alreadySatisfied ? (
        <p>
          {alreadySatisfiedText} Damage {result.min}-{result.max} HP (
          {formatPercent(result.min, result.defenderHp)}% -{' '}
          {formatPercent(result.max, result.defenderHp)}%).
        </p>
      ) : result.displayed.length > 0 ? (
        <div className="optimizer-table-wrap">
          {result.mode === 'survival' ? (
            <OptimizerSurvivalTable moveCategory={moveCategory} options={result.displayed} />
          ) : (
            <OptimizerKoTable moveCategory={moveCategory} options={result.displayed} />
          )}
        </div>
      ) : (
        <p>{emptyText}</p>
      )}
    </div>
  )
}

function OptimizerSurvivalTable({ moveCategory, options }) {
  const defenseLabel = moveCategory === 'physical' ? 'Def' : 'SpD'

  return (
    <table className="optimizer-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Nature</th>
          <th>Ability</th>
          <th>Item</th>
          <th>HP SP</th>
          <th>{defenseLabel} SP</th>
          <th>Screen</th>
          <th>Weather</th>
          <th>Condition</th>
          <th>Damage</th>
          <th>% HP</th>
        </tr>
      </thead>
      <tbody>
        {options.map((option, index) => (
          <tr key={`survival-${index}-${option.score}`}>
            <td>{index + 1}</td>
            <td>{formatOptimizerNature(option.defender)}</td>
            <td>{formatTableValue(formatSelectedEffect(option.defender.ability))}</td>
            <td>{formatTableValue(formatSelectedEffect(option.defender.item))}</td>
            <td>{option.defender.hpSp}</td>
            <td>{option.defender.defenseSp}</td>
            <td>{formatTableValue(option.field.screen)}</td>
            <td>{formatTableValue(option.field.weather)}</td>
            <td>{option.attacker.burned ? 'Burn attacker' : '-'}</td>
            <td>{formatDamageRange(option.damage)}</td>
            <td>{formatDamagePercent(option.damage, option.defender.hp)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function OptimizerKoTable({ moveCategory, options }) {
  const offenseLabel = moveCategory === 'physical' ? 'Atk' : 'SpA'

  return (
    <table className="optimizer-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Nature</th>
          <th>Ability</th>
          <th>Item</th>
          <th>{offenseLabel} SP</th>
          <th>Weather</th>
          <th>Damage</th>
          <th>% HP</th>
        </tr>
      </thead>
      <tbody>
        {options.map((option, index) => (
          <tr key={`ko-${index}-${option.score}`}>
            <td>{index + 1}</td>
            <td>{formatOptimizerNature(option.attacker)}</td>
            <td>{formatTableValue(formatSelectedEffect(option.attacker.ability))}</td>
            <td>{formatTableValue(formatSelectedEffect(option.attacker.item))}</td>
            <td>{option.attacker.offenseSp}</td>
            <td>{formatTableValue(option.field.weather)}</td>
            <td>{formatDamageRange(option.damage)}</td>
            <td>{formatDamagePercent(option.damage, option.defender.hp)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function formatDamageRange(damage) {
  return `${damage.min}-${damage.max} HP`
}

function formatDamagePercent(damage, hp) {
  return `${formatPercent(damage.min, hp)}% - ${formatPercent(damage.max, hp)}%`
}

function formatTableValue(value) {
  return value || '-'
}

function formatPercent(damage, hp) {
  return ((damage / hp) * 100).toFixed(1)
}

function formatNatureOption(nature) {
  const [plus, minus] = CHAMPIONS_NATURES[nature] ?? []
  const name = nature.charAt(0).toUpperCase() + nature.slice(1)

  if (!plus || plus === minus) {
    return `${name} (neutral)`
  }

  return `${name} (+${DAMAGE_STAT_LABELS[plus]} / -${DAMAGE_STAT_LABELS[minus]})`
}

function formatOptimizerNature(pokemon) {
  if (!pokemon.natureGroup) return formatNatureOption(pokemon.nature)

  return `${pokemon.natureGroup.label}: ${pokemon.natureGroup.natures
    .map((nature) => nature.charAt(0).toUpperCase() + nature.slice(1))
    .join(', ')}`
}

function formatSelectedEffect(value) {
  if (!value) return ''

  const ability = CHAMPIONS_ABILITIES[value]
  const item = CHAMPIONS_ITEMS[value]

  return ability?.name ?? item?.name ?? ''
}

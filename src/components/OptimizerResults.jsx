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

      {result.error ? <p role="alert">{result.error}</p> : isOptimizing ? (
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
      {result.excludedCandidates > 0 && <p>{result.excludedCandidates} configurazioni escluse: per Payback seleziona esplicitamente l’ordine del colpo per includere anche le parità di Velocità.</p>}
    </div>
  )
}

function OptimizerSurvivalTable({ moveCategory, options }) {
  const defenseLabel = DAMAGE_STAT_LABELS[options[0]?.sort?.defenseStat] ?? (moveCategory === 'physical' ? 'Def' : 'SpD')
  const stats = options[0]?.defender.investmentStats ?? ['hp', options[0]?.sort?.defenseStat ?? (moveCategory === 'physical' ? 'def' : 'spd')]

  return (
    <table className="optimizer-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Nature</th>
          <th>Ability</th>
          <th>Item</th>
          {stats.map((stat) => <th key={stat}>{DAMAGE_STAT_LABELS[stat] ?? defenseLabel} SP</th>)}
          <th>SP totali</th>
          <th>Categoria</th>
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
            {stats.map((stat) => <td key={stat}>{option.defender.sps?.[stat] ?? (stat === 'hp' ? option.defender.hpSp : option.defender.defenseSp)}</td>)}
            <td>{totalSps(option.defender)}</td>
            <td>{option.damage.category === 'physical' ? 'Fisica' : 'Speciale'}</td>
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
  const offenseLabel = DAMAGE_STAT_LABELS[options[0]?.sort?.offenseStat] ?? (moveCategory === 'physical' ? 'Atk' : 'SpA')
  const stats = options[0]?.attacker.investmentStats ?? [options[0]?.sort?.offenseStat ?? (moveCategory === 'physical' ? 'atk' : 'spa')]

  return (
    <table className="optimizer-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Nature</th>
          <th>Ability</th>
          <th>Item</th>
          {stats.map((stat) => <th key={stat}>{DAMAGE_STAT_LABELS[stat] ?? offenseLabel} SP</th>)}
          <th>SP totali</th>
          <th>Categoria</th>
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
            {stats.map((stat) => <td key={stat}>{option.attacker.sps?.[stat] ?? option.attacker.offenseSp}</td>)}
            <td>{totalSps(option.attacker)}</td>
            <td>{option.damage.category === 'physical' ? 'Fisica' : 'Speciale'}</td>
            <td>{formatTableValue(option.field.weather)}</td>
            <td>{formatDamageRange(option.damage)}</td>
            <td>{formatDamagePercent(option.damage, option.defender.hp)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function totalSps(pokemon) {
  return pokemon.sps ? Object.values(pokemon.sps).reduce((sum, sp) => sum + sp, 0) : '—'
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

import { useState } from 'react'
import FourMoveSelector from './FourMoveSelector'
import OptimizerResults from './OptimizerResults'
import SpeedComparison from './SpeedComparison'
import PokemonImage from './PokemonImage'
import { CHAMPIONS_NATURES } from '../lib/damage/championsData.js'
import { CHAMPIONS_ITEMS as IMPLEMENTED_ITEMS } from '../lib/damage/championsItems.js'
import { CHAMPIONS_TEAM_ITEMS, getAbilityOptions } from '../lib/teamData.js'
import { getWorkspaceBuild } from '../lib/teamWorkspace.js'
import { CHAMPIONS_ABILITIES } from '../lib/damage/championsAbilities.js'
import { resolveAbilityWeather } from '../lib/damage/championsAbilities.js'
import { getPokemonMoveSlots } from '../lib/damage/championsMoveSets.js'
import { calculateMoveRows, createOptimizerContext, getBuildStats } from '../lib/damage/championsMatchup.js'
import { findKoOptions, findSurvivalOptions } from '../lib/damage/championsOptimizer.js'
import { describeTypeEffectiveness } from '../lib/typeLabels.js'

const STAT_LABELS = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' }
const SP_OPTIONS = Array.from({ length: 33 }, (_, index) => index)
const BOOST_OPTIONS = Array.from({ length: 13 }, (_, index) => index - 6)
const ITEM_OPTIONS = [{ value: '', label: 'Nessuno' }, ...CHAMPIONS_TEAM_ITEMS.map((item) => ({ value: item.id, label: item.name }))]

export default function DamageCalculator({ pokemon, attackerName, defenderName, onAttackerChange, onDefenderChange, moveSets, onMoveChange, selectedMove, onSelectMove, builds, onBuildChange }) {
  const [field, setField] = useState({ weather: '', gameType: 'Doubles', critical: false })
  const [rankingMode, setRankingMode] = useState('minimum')
  const [optimization, setOptimization] = useState(null)
  const attacker = pokemon.find((entry) => entry.displayName === attackerName) ?? pokemon[0]
  const defender = pokemon.find((entry) => entry.displayName === defenderName)
    ?? pokemon.find((entry) => entry.displayName !== attacker?.displayName) ?? pokemon[0]
  const itemOptions = ITEM_OPTIONS
  const leftBuild = getWorkspaceBuild(builds, 'attacker', attacker?.displayName)
  const rightBuild = getWorkspaceBuild(builds, 'defender', defender?.displayName)
  const leftMoves = getPokemonMoveSlots(moveSets, 'attacker', attacker)
  const rightMoves = getPokemonMoveSlots(moveSets, 'defender', defender)
  const leftRows = calculateMoveRows(attacker, defender, leftBuild, rightBuild, leftMoves, field)
  const rightRows = calculateMoveRows(defender, attacker, rightBuild, leftBuild, rightMoves, field)
  const reversed = selectedMove.side === 'defender'
  const selectedRow = (reversed ? rightRows : leftRows)[selectedMove.slot]
  const source = reversed ? defender : attacker
  const target = reversed ? attacker : defender
  const sourceBuild = reversed ? rightBuild : leftBuild
  const targetBuild = reversed ? leftBuild : rightBuild
  const optimizerContext = createOptimizerContext(source, target, sourceBuild, targetBuild, selectedRow?.move, field)
  const calculationKey = JSON.stringify({ attacker: attacker?.displayName, defender: defender?.displayName, leftBuild, rightBuild, leftMoves, rightMoves, field, selectedMove, rankingMode })
  const activeOptimization = optimization?.key === calculationKey ? optimization : null
  const weather = resolveAbilityWeather({ attackerAbility: leftBuild.ability, defenderAbility: rightBuild.ability, selectedWeather: field.weather })

  function optimize(mode) {
    if (!optimizerContext || !selectedRow?.result) return
    const result = selectedRow.result
    const alreadySatisfied = mode === 'ko' ? result.min >= selectedRow.defenderHp : result.max < selectedRow.defenderHp
    if (alreadySatisfied) {
      setOptimization({ key: calculationKey, result: { mode, alreadySatisfied: true, defenderHp: selectedRow.defenderHp, min: result.min, max: result.max, displayed: [], total: 0 } })
      return
    }
    setOptimization({ key: calculationKey, isOptimizing: true, result: { mode, displayed: [], total: 0 } })
    window.setTimeout(() => {
      const search = mode === 'ko' ? findKoOptions : findSurvivalOptions
      setOptimization({ key: calculationKey, result: { mode, ...search(optimizerContext, { rankingMode }) } })
    }, 0)
  }

  return (
    <section className="damage-calculator" aria-label="Configurazione del calcolo danni">
      <div className="damage-moves-overview">
        <FourMoveSelector
          label={`${attacker?.displayName ?? 'Pokémon 1'} → ${defender?.displayName ?? 'Pokémon 2'}`}
          pokemon={attacker} moves={leftMoves} rows={leftRows}
          selectedSlot={!reversed ? selectedMove.slot : -1}
          onSelect={(slot) => onSelectMove({ side: 'attacker', slot })}
          onChange={(slot, value) => onMoveChange('attacker', attacker, slot, value)}
        />
        <FourMoveSelector
          label={`${defender?.displayName ?? 'Pokémon 2'} → ${attacker?.displayName ?? 'Pokémon 1'}`}
          pokemon={defender} moves={rightMoves} rows={rightRows}
          selectedSlot={reversed ? selectedMove.slot : -1}
          onSelect={(slot) => onSelectMove({ side: 'defender', slot })}
          onChange={(slot, value) => onMoveChange('defender', defender, slot, value)}
        />
      </div>

      <div className="selected-move-detail" aria-live="polite">
        <div>
          <p className="eyebrow compact">Dettaglio mossa selezionata</p>
          <h2>{selectedRow?.move?.name ?? 'Seleziona una mossa'}</h2>
          <p>{source?.displayName ?? 'Pokémon 1'} <span aria-hidden="true">→</span> {target?.displayName ?? 'Pokémon 2'}</p>
        </div>
        {selectedRow?.result ? (
          <div className="damage-result">
            <span>{selectedRow.move.category === 'physical' ? 'Fisica' : 'Speciale'} · {describeTypeEffectiveness(selectedRow.result.effectiveness)}</span>
            <strong>{selectedRow.result.min}–{selectedRow.result.max} HP</strong>
            <small>{selectedRow.minPercent.toFixed(1)}–{selectedRow.maxPercent.toFixed(1)}% di {target.displayName}</small>
          </div>
        ) : <p>{selectedRow?.reason || <>Compila lo slot oppure scegli “Dettagli” su un'altra mossa.</>}</p>}
      </div>
      {[...calculationNotes(leftBuild), ...calculationNotes(rightBuild)].length > 0 && (
        <p className="calculation-note">Calcolo parziale: {[...new Set([...calculationNotes(leftBuild), ...calculationNotes(rightBuild)])].join(' ')}</p>
      )}

      <div className="damage-controls">
        <PokemonBuildControls side="attacker" label="Pokémon 1" pokemon={attacker} roster={pokemon} build={leftBuild} itemOptions={itemOptions} onPokemonChange={onAttackerChange} onChange={(changes) => onBuildChange('attacker', attacker, changes)} />
        <section className="damage-panel damage-battle-panel" aria-label="Battle controls">
          <h3>Campo e condizioni</h3>
          <label className="select-field"><span>Meteo</span>
            <select value={field.weather} onChange={(event) => setField({ ...field, weather: event.target.value })}>
              <option value="">Nessuno</option><option value="Sun">Sole</option><option value="Rain">Pioggia</option>
            </select>
            {weather.sourceAbility && <small className="weather-override-hint">Meteo effettivo: {weather.weather}, da {weather.sourceAbility}.</small>}
          </label>
          <label className="select-field"><span>Formato</span>
            <select value={field.gameType} onChange={(event) => setField({ ...field, gameType: event.target.value })}><option value="Singles">Singles</option><option value="Doubles">Doubles</option></select>
          </label>
          <div className="damage-toggles"><label><input type="checkbox" checked={field.critical} onChange={(event) => setField({ ...field, critical: event.target.checked })} />Brutto colpo (tutte le mosse)</label></div>
          <div className="optimizer-actions">
            <p className="optimizer-direction">Ottimizza la mossa selezionata: {source?.displayName} → {target?.displayName}</p>
            <label className="select-field optimizer-ranking-field"><span>Ordina le build</span>
              <select value={rankingMode} onChange={(event) => setRankingMode(event.target.value)}><option value="minimum">Minimum investment</option><option value="practical">Practical build</option></select>
            </label>
            <button disabled={!optimizerContext || activeOptimization?.isOptimizing} type="button" onClick={() => optimize('survival')}>Find Survival</button>
            <button disabled={!optimizerContext || activeOptimization?.isOptimizing} type="button" onClick={() => optimize('ko')}>Find KO</button>
          </div>
        </section>
        <PokemonBuildControls side="defender" label="Pokémon 2" pokemon={defender} roster={pokemon} build={rightBuild} itemOptions={itemOptions} onPokemonChange={onDefenderChange} onChange={(changes) => onBuildChange('defender', defender, changes)} />
      </div>
      <SpeedComparison attacker={attacker} defender={defender} leftBuild={leftBuild} rightBuild={rightBuild} weather={weather.weather} />
      {activeOptimization && <OptimizerResults result={activeOptimization.result} isOptimizing={activeOptimization.isOptimizing} moveCategory={selectedRow?.move?.category} />}
    </section>
  )
}

function PokemonBuildControls({ side, label, pokemon, roster, build, itemOptions, onPokemonChange, onChange }) {
  const stats = getBuildStats(pokemon, build)
  return (
    <section className="damage-panel" aria-label={side === 'attacker' ? 'Attacker controls' : 'Defender controls'}>
      <h3>{label}</h3>
      <label className="select-field"><span>Pokémon</span>
        <div className="pokemon-select-preview">{pokemon && <PokemonImage pokemon={pokemon} size={54} />}
          <select value={pokemon?.displayName ?? ''} onChange={(event) => onPokemonChange(event.target.value)}>
            {roster.map((entry) => <option key={entry.displayName} value={entry.displayName}>{entry.displayName}</option>)}
          </select>
        </div>
      </label>
      <div className="build-identity-fields">
        <label className="select-field"><span>Nickname</span><input aria-label={`${label} nickname`} value={build.nickname ?? ''} onChange={(event) => onChange({ nickname: event.target.value })} /></label>
        <label className="select-field"><span>Genere</span><select aria-label={`${label} genere`} value={build.gender ?? ''} onChange={(event) => onChange({ gender: event.target.value })}><option value="">—</option><option value="M">M</option><option value="F">F</option></select></label>
        <label className="select-field"><span>Livello</span><input aria-label={`${label} livello`} type="number" min="1" max="100" value={build.level ?? 50} onChange={(event) => onChange({ level: Number(event.target.value) })} /></label>
      </div>
      <label className="select-field"><span>Abilità</span><select value={build.ability} onChange={(event) => onChange({ ability: event.target.value, abilityName: event.target.selectedOptions[0].textContent })}>
        {getAbilityOptions(pokemon, build.ability, build.abilityName).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select></label>
      <label className="select-field"><span>Oggetto</span><select value={build.item} onChange={(event) => onChange({ item: event.target.value, itemName: event.target.selectedOptions[0].textContent })}>
        {(build.item && !itemOptions.some((item) => item.value === build.item) ? [...itemOptions, { value: build.item, label: build.itemName || build.item }] : itemOptions).map((option) => option.options ? <optgroup key={option.label} label={option.label}>{option.options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</optgroup> : <option key={option.value} value={option.value}>{option.label}</option>)}
      </select></label>
      <label className="select-field"><span>Natura</span><select value={build.nature} onChange={(event) => onChange({ nature: event.target.value })}>
        {Object.entries(CHAMPIONS_NATURES).map(([name, [plus, minus]]) => <option key={name} value={name}>{name[0].toUpperCase() + name.slice(1)} {plus === minus ? '(neutra)' : `(+${STAT_LABELS[plus]} / −${STAT_LABELS[minus]})`}</option>)}
      </select></label>
      <div className="build-stat-table">
        <div className="build-stat-heading"><span>Stat</span><span>SP</span><span>Boost</span><span>Valore</span></div>
        {Object.entries(STAT_LABELS).map(([id, text]) => (
          <div className="build-stat-row" key={id}>
            <strong>{text}</strong>
            <select aria-label={`${label} ${text} SP`} value={build.sps[id]} onChange={(event) => onChange({ sps: { ...build.sps, [id]: Number(event.target.value) } })}>{SP_OPTIONS.map((sp) => <option key={sp} value={sp}>{sp}</option>)}</select>
            {id === 'hp' ? <span className="build-no-boost">—</span> : <select aria-label={`${label} ${text} boost`} value={build.boosts[id]} onChange={(event) => onChange({ boosts: { ...build.boosts, [id]: Number(event.target.value) } })}>{BOOST_OPTIONS.map((boost) => <option key={boost} value={boost}>{boost > 0 ? `+${boost}` : boost}</option>)}</select>}
            <span>{stats?.[id] ?? '—'}</span>
          </div>
        ))}
        <small>I valori mostrati includono SP e natura; i boost si applicano al calcolo.</small>
        <small className={Object.values(build.sps).reduce((sum, value) => sum + value, 0) > 66 ? 'invalid-sp-total' : ''}>SP totali: {Object.values(build.sps).reduce((sum, value) => sum + value, 0)}/66</small>
      </div>
      <div className="damage-toggles damage-panel-toggles">
        {[['burned', 'Scottato'], ['reflect', 'Reflect'], ['lightScreen', 'Light Screen']].map(([key, text]) => <label key={key}><input type="checkbox" checked={build[key]} onChange={(event) => onChange({ [key]: event.target.checked })} />{text}</label>)}
      </div>
    </section>
  )
}

function calculationNotes(build) {
  const notes = []
  if (build.ability && !CHAMPIONS_ABILITIES[build.ability]) notes.push(`Effetto di ${build.abilityName || build.ability} non implementato.`)
  if (build.item && !IMPLEMENTED_ITEMS[build.item] && !CHAMPIONS_TEAM_ITEMS.find((item) => item.id === build.item)?.megaStone) notes.push(`Effetto di ${build.itemName || build.item} non implementato.`)
  return notes
}

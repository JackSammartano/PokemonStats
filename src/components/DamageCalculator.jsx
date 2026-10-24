import { memo, useEffect, useRef, useState } from 'react'
import FourMoveSelector from './FourMoveSelector'
import OptimizerResults from './OptimizerResults'
import SpeedComparison from './SpeedComparison'
import PokemonImage from './PokemonImage'
import { CHAMPIONS_NATURES } from '../lib/damage/championsData.js'
import { getItemCoverageNote } from '../lib/damage/championsItems.js'
import { CHAMPIONS_TEAM_ITEMS, getAbilityOptions } from '../lib/teamData.js'
import { getWorkspaceBuild } from '../lib/teamWorkspace.js'
import { getAbilityCoverageNote } from '../lib/damage/championsCoverage.js'
import { resolveAbilityWeather } from '../lib/damage/championsAbilities.js'
import { getPokemonMoveSlots } from '../lib/damage/championsMoveSets.js'
import { calculateMoveRows, createOptimizerContext, getBuildStats } from '../lib/damage/championsMatchup.js'
import { describeTypeEffectiveness } from '../lib/typeLabels.js'
import { getMoveConditionFields } from '../lib/damage/championsMoveConditions.js'
import { BATTLE_CONDITION_FIELDS } from '../lib/damage/championsBattleConditions.js'
import { getEffectiveAbility } from '../lib/damage/championsBattle.js'

const STAT_LABELS = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' }
const SP_OPTIONS = Array.from({ length: 33 }, (_, index) => index)
const BOOST_OPTIONS = Array.from({ length: 13 }, (_, index) => index - 6)
const ITEM_OPTIONS = [{ value: '', label: 'Nessuno' }, ...CHAMPIONS_TEAM_ITEMS.map((item) => ({ value: item.id, label: item.name }))]

export default memo(function DamageCalculator({ pokemon, teams, attackerName, defenderName, onAttackerChange, onDefenderChange, moveSets, onMoveChange, selectedMove, onSelectMove, builds, onBuildChange }) {
  const [field, setField] = useState({ weather: '', gameType: 'Doubles', critical: false })
  const [rankingMode, setRankingMode] = useState('minimum')
  const [optimization, setOptimization] = useState(null)
  const optimizerWorker = useRef(null)
  const attacker = pokemon.find((entry) => entry.displayName === attackerName) ?? pokemon[0]
  const defender = pokemon.find((entry) => entry.displayName === defenderName)
    ?? pokemon.find((entry) => entry.displayName !== attacker?.displayName) ?? pokemon[0]
  const itemOptions = ITEM_OPTIONS
  const leftBuild = getWorkspaceBuild(builds, 'attacker', attacker?.displayName)
  const rightBuild = getWorkspaceBuild(builds, 'defender', defender?.displayName)
  const leftTransformed = leftBuild.ability === 'imposter' && leftBuild.transformActive
  const rightTransformed = rightBuild.ability === 'imposter' && rightBuild.transformActive
  const leftMovePokemon = leftTransformed ? { ...attacker, showdownId: defender?.showdownId, moves: defender?.moves } : attacker
  const rightMovePokemon = rightTransformed ? { ...defender, showdownId: attacker?.showdownId, moves: attacker?.moves } : defender
  const leftMoves = getPokemonMoveSlots(moveSets, leftTransformed ? 'defender' : 'attacker', leftTransformed ? defender : attacker)
  const rightMoves = getPokemonMoveSlots(moveSets, rightTransformed ? 'attacker' : 'defender', rightTransformed ? attacker : defender)
  const leftParty = beatUpParty(teams?.attacker, attacker, pokemon, builds, 'attacker')
  const rightParty = beatUpParty(teams?.defender, defender, pokemon, builds, 'defender')
  const leftField = { ...field, attackerParty: leftParty, defenderParty: rightParty }
  const rightField = { ...field, attackerParty: rightParty, defenderParty: leftParty }
  const leftRows = calculateMoveRows(attacker, defender, leftBuild, rightBuild, leftMoves, leftField)
  const rightRows = calculateMoveRows(defender, attacker, rightBuild, leftBuild, rightMoves, rightField)
  const reversed = selectedMove.side === 'defender'
  const selectedRow = (reversed ? rightRows : leftRows)[selectedMove.slot]
  const source = reversed ? defender : attacker
  const target = reversed ? attacker : defender
  const sourceBuild = reversed ? rightBuild : leftBuild
  const targetBuild = reversed ? leftBuild : rightBuild
  const optimizerContext = createOptimizerContext(source, target, sourceBuild, targetBuild, selectedRow?.move, reversed ? rightField : leftField)
  const calculationKey = JSON.stringify({ attacker: attacker?.displayName, defender: defender?.displayName, leftBuild, rightBuild, leftMoves, rightMoves, leftParty, rightParty, field, selectedMove, rankingMode })
  const activeOptimization = optimization?.key === calculationKey ? optimization : null
  useEffect(() => () => {
    optimizerWorker.current?.terminate()
    optimizerWorker.current = null
  }, [calculationKey])
  const leftAbility = getEffectiveAbility(leftBuild, rightBuild, field)
  const rightAbility = getEffectiveAbility(rightBuild, leftBuild, field)
  const weather = resolveAbilityWeather({ attackerAbility: leftAbility, defenderAbility: rightAbility, selectedWeather: field.weather,
    attackerEntryActive: leftBuild.entryAbilityActive !== false, defenderEntryActive: rightBuild.entryAbilityActive !== false, weatherSuppressed: field.isCloudNine && field.gameType === 'Doubles' })

  function optimize(mode) {
    if (!optimizerContext || !selectedRow?.result) return
    optimizerWorker.current?.terminate()
    setOptimization({ key: calculationKey, isOptimizing: true, result: { mode, displayed: [], total: 0 } })
    const failed = (message) => setOptimization({ key: calculationKey, result: { mode, error: message, displayed: [], total: 0 } })
    try {
      const worker = new Worker(new URL('../lib/damage/championsOptimizer.worker.js', import.meta.url), { type: 'module' })
      optimizerWorker.current = worker
      worker.onmessage = ({ data }) => {
        if (optimizerWorker.current !== worker) return
        worker.terminate()
        optimizerWorker.current = null
        if (data.error) failed(data.error)
        else setOptimization({ key: calculationKey, result: data.result })
      }
      worker.onerror = () => {
        if (optimizerWorker.current !== worker) return
        worker.terminate()
        optimizerWorker.current = null
        failed('Impossibile avviare il calcolo. Riprova con le condizioni selezionate.')
      }
      worker.postMessage({ mode, context: optimizerContext, rankingMode })
    } catch {
      optimizerWorker.current?.terminate()
      optimizerWorker.current = null
      failed('Impossibile avviare il calcolo. Riprova con le condizioni selezionate.')
    }
  }

  return (
    <section className="damage-calculator" aria-label="Configurazione del calcolo danni">
      <div className="damage-workspace">
        <div className="damage-results-panel" role="region" aria-label="Risultati del calcolo danni" tabIndex={0}>
          <div className="selected-move-detail" aria-live="polite">
            <div>
              <p className="eyebrow compact">Dettaglio mossa selezionata</p>
              <h2>{selectedRow?.move?.name ?? 'Seleziona una mossa'}</h2>
              <p>{source?.displayName ?? 'Pokémon 1'} <span aria-hidden="true">→</span> {target?.displayName ?? 'Pokémon 2'}</p>
            </div>
            {selectedRow?.result ? (
              <div className="damage-result">
                <span>{selectedRow.result.move.category === 'physical' ? 'Fisica' : 'Speciale'} · {describeTypeEffectiveness(selectedRow.result.effectiveness)}</span>
                <strong>{selectedRow.minPercent.toFixed(1)}–{selectedRow.maxPercent.toFixed(1)}%</strong>
                <small>di {target.displayName}</small>
                {selectedRow.result.failureReason && <small>{selectedRow.result.failureReason}</small>}
                {selectedRow.result.accuracyDependentKO && <small>KO solo se la mossa colpisce; l’optimizer non garantisce queste mosse.</small>}
                {selectedRow.result.hits > 1 && <small>{selectedRow.result.hits} colpi selezionati; la sequenza si interrompe se un Pokémon va KO.</small>}
                {selectedRow.result.effectiveAttacker?.transformed && <small>Statistiche e abilità copiate dal bersaglio; HP propri conservati.</small>}
              </div>
            ) : <p>{selectedRow?.reason || <>Compila lo slot oppure scegli “Dettagli” su un'altra mossa.</>}</p>}
          </div>
          <div className="damage-moves-overview">
            <FourMoveSelector
              label={`${attacker?.displayName ?? 'Pokémon 1'} → ${defender?.displayName ?? 'Pokémon 2'}`}
              pokemon={leftMovePokemon} moves={leftMoves} rows={leftRows} readOnly={leftTransformed}
              selectedSlot={!reversed ? selectedMove.slot : -1}
              onSelect={(slot) => onSelectMove({ side: 'attacker', slot })}
              onChange={(slot, value) => onMoveChange('attacker', leftMovePokemon, slot, value)}
            />
            <FourMoveSelector
              label={`${defender?.displayName ?? 'Pokémon 2'} → ${attacker?.displayName ?? 'Pokémon 1'}`}
              pokemon={rightMovePokemon} moves={rightMoves} rows={rightRows} readOnly={rightTransformed}
              selectedSlot={reversed ? selectedMove.slot : -1}
              onSelect={(slot) => onSelectMove({ side: 'defender', slot })}
              onChange={(slot, value) => onMoveChange('defender', rightMovePokemon, slot, value)}
            />
          </div>
          {selectedRow?.move && <MoveConditionControls move={selectedRow.move} effectiveAbility={selectedRow.result?.effectiveAttacker?.ability} onChange={(conditions) => onBuildChange(selectedMove.side, source, { moveConditions: { ...sourceBuild.moveConditions, [selectedRow.moveId]: conditions } })} />}
          {[...calculationNotes(leftBuild), ...calculationNotes(rightBuild)].length > 0 && (
            <p className="calculation-note">Calcolo parziale: {[...new Set([...calculationNotes(leftBuild), ...calculationNotes(rightBuild)])].join(' ')}</p>
          )}
        </div>
        <div className="damage-configuration-panel">
          <div className="damage-controls">
            <PokemonBuildControls side="attacker" label="Pokémon 1" pokemon={attacker} roster={pokemon} build={leftBuild} effectiveAbility={leftAbility} itemOptions={itemOptions} onPokemonChange={onAttackerChange} onChange={(changes) => onBuildChange('attacker', attacker, changes)} />
            <PokemonBuildControls side="defender" label="Pokémon 2" pokemon={defender} roster={pokemon} build={rightBuild} effectiveAbility={rightAbility} itemOptions={itemOptions} onPokemonChange={onDefenderChange} onChange={(changes) => onBuildChange('defender', defender, changes)} />
            <section className="damage-panel damage-battle-panel" aria-label="Battle controls">
              <h3>Campo e condizioni</h3>
              <label className="select-field"><span>Meteo</span>
                <select value={field.weather} onChange={(event) => setField({ ...field, weather: event.target.value })}>
                  <option value="">Nessuno</option><option value="Sun">Sole</option><option value="Rain">Pioggia</option><option value="Sand">Sabbia</option><option value="Snow">Neve</option>
                </select>
                {weather.sourceAbility && <small className="weather-override-hint">{weather.requiresChoice ? 'Le due abilità impostano meteo diversi: seleziona il meteo effettivo dopo l’ultimo ingresso.' : `Meteo effettivo: ${weather.weather}, da ${weather.sourceAbility}.`}</small>}
              </label>
              <label className="select-field"><span>Formato</span>
                <select value={field.gameType} onChange={(event) => setField({ ...field, gameType: event.target.value })}><option value="Singles">Singles</option><option value="Doubles">Doubles</option></select>
              </label>
              <label className="select-field"><span>Terreno</span><select value={field.terrain ?? ''} onChange={(event) => setField({ ...field, terrain: event.target.value })}><option value="">Nessuno</option><option value="Electric">Elettrico</option><option value="Grassy">Erboso</option><option value="Misty">Nebbioso</option><option value="Psychic">Psichico</option></select></label>
              <label><input type="checkbox" checked={Boolean(field.isGravity)} onChange={(event) => setField({ ...field, isGravity: event.target.checked })} />Gravity</label>
              <label><input type="checkbox" checked={Boolean(field.isWonderRoom)} onChange={(event) => setField({ ...field, isWonderRoom: event.target.checked })} />Wonder Room</label>
              <label><input type="checkbox" checked={Boolean(field.isMagicRoom)} onChange={(event) => setField({ ...field, isMagicRoom: event.target.checked })} />Magic Room</label>
              <label><input type="checkbox" checked={Boolean(field.isFairyAura)} onChange={(event) => setField({ ...field, isFairyAura: event.target.checked })} />Fairy Aura da un altro Pokémon</label>
              <label><input type="checkbox" checked={Boolean(field.isCloudNine)} onChange={(event) => setField({ ...field, isCloudNine: event.target.checked })} />Cloud Nine da un altro Pokémon (Doubles)</label>
              <label><input type="checkbox" checked={Boolean(field.isDamp)} onChange={(event) => setField({ ...field, isDamp: event.target.checked })} />Damp da un altro Pokémon (Doubles)</label>
              <div className="damage-toggles"><label><input type="checkbox" checked={field.critical} onChange={(event) => setField({ ...field, critical: event.target.checked })} />Brutto colpo (tutte le mosse)</label></div>
              <div className="optimizer-actions">
                <p className="optimizer-direction">Ottimizza la mossa selezionata: {source?.displayName} → {target?.displayName}</p>
                <label className="select-field optimizer-ranking-field"><span>Ordina le build</span>
                  <select value={rankingMode} onChange={(event) => setRankingMode(event.target.value)}><option value="minimum">Minimum investment</option><option value="practical">Practical build</option></select>
                </label>
                <button disabled={!optimizerContext || !selectedRow?.result || activeOptimization?.isOptimizing} type="button" onClick={() => optimize('survival')}>Find Survival</button>
                <button disabled={!optimizerContext || !selectedRow?.result || activeOptimization?.isOptimizing} type="button" onClick={() => optimize('ko')}>Find KO</button>
              </div>
            </section>
          </div>
          {!weather.requiresChoice && <SpeedComparison attacker={attacker} defender={defender} leftBuild={leftBuild} rightBuild={rightBuild} weather={weather.weather} battle={selectedRow?.result} reversed={reversed} />}
        </div>
      </div>
      {activeOptimization && <OptimizerResults result={activeOptimization.result} isOptimizing={activeOptimization.isOptimizing} moveCategory={selectedRow?.move?.category} />}
    </section>
  )
})

function beatUpParty(names, selected, roster, builds, side) {
  if (!selected || !names?.includes(selected.displayName)) return undefined
  const eligible = names.map((name) => ({ pokemon: roster.find((entry) => entry.displayName === name), build: getWorkspaceBuild(builds, side, name) }))
    .filter(({ pokemon: entry, build }) => entry && (entry.displayName === selected.displayName || (!build.isFainted && !build.status && !build.burned)))
  if (eligible.some(({ pokemon: entry, build }) => entry.category === 'mega' || entry.battleOnly || build.transformActive)) return undefined
  return eligible.map(({ pokemon: entry }) => entry.stats.find((stat) => stat.name === 'attack').value)
}

function MoveConditionControls({ move, effectiveAbility, onChange }) {
  const fields = getMoveConditionFields(move)
  if (!fields.length) return null
  return <fieldset className="damage-panel"><legend>Condizioni di {move.name}</legend><p>Il risultato assume le condizioni selezionate e che il colpo vada a segno.</p>
    {fields.map((field) => {
      const forcedHits = field.key === 'hits' && effectiveAbility === 'skill-link' && (Array.isArray(move.multihit) || move.multiaccuracy)
      const value = forcedHits ? field.max : move.conditions?.[field.key] ?? field.default
      const update = (next) => onChange({ ...move.conditions, [field.key]: next })
      return <label key={field.key} className="select-field"><span>{field.label}</span>
        {field.type === 'boolean' ? <input type="checkbox" checked={value} onChange={(event) => update(event.target.checked)} />
          : field.type === 'select' ? <select value={value} onChange={(event) => update(event.target.value)}>{field.options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
            : <input type={field.type} disabled={forcedHits} min={field.min} max={field.max} value={value} onChange={(event) => update(field.type === 'number' ? Number(event.target.value) : event.target.value)} />}
      </label>
    })}
  </fieldset>
}

function PokemonBuildControls({ side, label, pokemon, roster, build, effectiveAbility, itemOptions, onPokemonChange, onChange }) {
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
        <label className="select-field"><span>Genere</span><select aria-label={`${label} genere`} value={build.gender ?? ''} onChange={(event) => onChange({ gender: event.target.value })}><option value="">—</option><option value="M">M</option><option value="F">F</option></select></label>
        <label className="select-field"><span>Livello</span><input aria-label={`${label} livello`} type="number" min="1" max="100" value={build.level ?? 50} onChange={(event) => onChange({ level: Number(event.target.value) })} /></label>
      </div>
      <label className="select-field"><span>Abilità</span><select value={build.ability} onChange={(event) => onChange({ ability: event.target.value, abilityName: event.target.selectedOptions[0].textContent })}>
        {getAbilityOptions(pokemon, build.ability, build.abilityName).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select></label>
      <label className="select-field"><span>Oggetto</span><select value={build.item} onChange={(event) => onChange({ item: event.target.value, itemName: event.target.selectedOptions[0].textContent })}>
        {(build.item && !itemOptions.some((item) => item.value === build.item) ? [...itemOptions, { value: build.item, label: build.itemName || build.item }] : itemOptions).map((option) => option.options ? <optgroup key={option.label} label={option.label}>{option.options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</optgroup> : <option key={option.value} value={option.value}>{option.label}</option>)}
      </select></label>
      <label className="select-field"><span>HP attuali</span><input aria-label={`${label} HP attuali`} type="number" min="1" max={stats?.hp ?? 1} value={build.currentHp == null ? stats?.hp ?? '' : Math.min(build.currentHp, stats?.hp ?? 1)} onChange={(event) => { const hp = Number(event.target.value); onChange({ currentHp: hp >= (stats?.hp ?? 1) ? null : Math.max(1, hp) }) }} /></label>
      <label className="select-field"><span>Stato</span><select value={build.status || (build.burned ? 'brn' : '')} onChange={(event) => onChange({ status: event.target.value, burned: event.target.value === 'brn' })}>
        <option value="">Nessuno</option><option value="brn">Scottato</option><option value="par">Paralizzato</option><option value="psn">Avvelenato</option><option value="tox">Iperavvelenato</option><option value="slp">Addormentato</option><option value="frz">Congelato</option>
      </select></label>
      <details><summary>Situazione del Pokémon e supporti</summary>
        {BATTLE_CONDITION_FIELDS.filter((condition) => (!condition.abilities || condition.abilities.includes(build.ability) || condition.abilities.includes(effectiveAbility)) && (!condition.items || condition.items.includes(build.item))).map((condition) => {
          const value = build[condition.key] ?? condition.default
          const label = condition.key === 'abilityOn' ? ({ 'flash-fire': 'Flash Fire attivata da un attacco Fuoco', analytic: 'Agisce dopo tutti gli altri Pokémon', plus: 'Alleato con Plus o Minus attivo', minus: 'Alleato con Plus o Minus attivo', unburden: 'Unburden attivata dalla perdita dell’oggetto', 'zero-to-hero': 'È già uscito dal campo (Hero)' })[effectiveAbility] : condition.label
          return <label className="select-field" key={condition.key}><span>{label}</span>
            {condition.type === 'boolean' ? <input type="checkbox" checked={value} onChange={(event) => onChange({ [condition.key]: event.target.checked })} />
              : condition.type === 'select' ? <select value={value} onChange={(event) => onChange({ [condition.key]: event.target.value })}>{condition.options.map(([id, text]) => <option value={id} key={id}>{text}</option>)}</select>
                : <input type="number" value={value ?? ''} min={condition.min} max={condition.max} step={condition.step ?? 1} onChange={(event) => onChange({ [condition.key]: condition.default === null && event.target.value === '' ? null : Number(event.target.value) })} />}
          </label>
        })}
        <small>Gli effetti casuali si applicano soltanto al colpo indicato. I supporti da alleati richiedono Doubles.</small>
      </details>
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
        {[['reflect', 'Reflect'], ['lightScreen', 'Light Screen']].map(([key, text]) => <label key={key}><input type="checkbox" checked={build[key]} onChange={(event) => onChange({ [key]: event.target.checked })} />{text}</label>)}
      </div>
    </section>
  )
}

function calculationNotes(build) {
  const notes = []
  const abilityNote = getAbilityCoverageNote(build.ability, build.abilityName)
  if (abilityNote) notes.push(abilityNote)
  const itemNote = getItemCoverageNote(build.item, build.itemName)
  if (itemNote) notes.push(itemNote)
  return notes
}

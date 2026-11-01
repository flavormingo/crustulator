import {
  applySchedule,
  diameterFor,
  formatDuration,
  formatLength,
  formatPercent,
  formatTemperature,
  formatWeight,
  hoursScale,
  hydrationVibe,
  isCold,
  lengthScale,
  limits,
  loadingScale,
  marginHints,
  marginNames,
  matchSchedule,
  patienceVibe,
  pieceName,
  planHours,
  prefermentHints,
  prefermentNames,
  round,
  schedulePresets,
  setPrefermentType,
  setShapeKind,
  setYeast,
  stagePlace,
  stageTitle,
  temperatureScale,
  waterTemperature,
  weightScale,
  yeastNames,
  type Dough,
  type Margin,
  type Preferences,
  type PrefermentType,
  type Recipe,
  type SchedulePreset,
  type Shape,
  type Stage,
  type StageStep,
  type YeastType,
} from '@crustulator/core'
import { Fridge, NavArrowDown, Plus, SunLight, Trash } from 'iconoir-react'


import { Choice, Ruler, ScaledRuler, Stepper, Switch } from './fields'

export interface SectionProps {
  recipe: Recipe
  dough: Dough
  preferences: Preferences
  update: (next: (current: Recipe) => Recipe) => void
}

const shapeOptions: { value: Shape['kind']; label: string }[] = [
  { value: 'round', label: 'Round' },
  { value: 'ball', label: 'Weight' },
  { value: 'pan', label: 'Pan' },
]

export function SizeFields({ recipe, dough, preferences, update }: SectionProps) {
  const { shape } = recipe
  const pieces = pieceName(recipe, 2)
  return (
    <fieldset>
      <legend>{pieces.charAt(0).toUpperCase() + pieces.slice(1)}</legend>
      <Stepper
        label="Number of pizzas"
        value={recipe.count}
        min={limits.count[0]}
        max={limits.count[1]}
        unit={(count) => pieceName(recipe, count)}
        onChange={(count) => update((current) => ({ ...current, count }))}
      />
      <Choice legend="Size by" name="shape" value={shape.kind} options={shapeOptions} onChange={(kind) => update((current) => setShapeKind(current, kind))} />
      {shape.kind === 'ball' ? (
        <ScaledRuler
          label="Dough ball"
          scale={weightScale(preferences.weight)}
          value={shape.weight}
          onChange={(weight) => update((current) => ({ ...current, shape: { kind: 'ball', weight } }))}
          note={`Stretches to about ${formatLength(diameterFor(shape.weight, recipe.loading), preferences.length)} across.`}
        />
      ) : null}
      {shape.kind === 'round' ? (
        <ScaledRuler
          label="Diameter"
          scale={lengthScale(preferences.length, [15, 60])}
          value={shape.diameter}
          onChange={(diameter) => update((current) => ({ ...current, shape: { kind: 'round', diameter } }))}
          note={`About ${formatWeight(dough.ball, preferences.weight)} of dough each.`}
        />
      ) : null}
      {shape.kind === 'pan' ? (
        <>
          <ScaledRuler
            label="Pan width"
            scale={lengthScale(preferences.length, [10, 80])}
            value={shape.width}
            onChange={(width) => update((current) => (current.shape.kind === 'pan' ? { ...current, shape: { ...current.shape, width } } : current))}
          />
          <ScaledRuler
            label="Pan length"
            scale={lengthScale(preferences.length, [10, 80])}
            value={shape.length}
            onChange={(length) => update((current) => (current.shape.kind === 'pan' ? { ...current, shape: { ...current.shape, length } } : current))}
            note={`About ${formatWeight(dough.ball, preferences.weight)} of dough per pan.`}
          />
        </>
      ) : null}
    </fieldset>
  )
}

export function FormulaFields({ recipe, update }: SectionProps) {
  const vibe = hydrationVibe(recipe.hydration)
  const set = (key: 'hydration' | 'salt' | 'oil' | 'sugar') => (value: number) => update((current) => ({ ...current, [key]: value }))
  return (
    <details>
      <summary>
        The formula
        <NavArrowDown aria-hidden="true" />
      </summary>
      <Ruler label="Hydration" value={recipe.hydration} min={45} max={100} step={0.5} major={10} format={formatPercent} onChange={set('hydration')} note={`${vibe.label}. ${vibe.note}`} />
      <Ruler label="Salt" value={recipe.salt} min={0} max={5} step={0.1} major={10} format={formatPercent} onChange={set('salt')} />
      <Ruler label="Olive oil" value={recipe.oil} min={0} max={20} step={0.5} major={10} format={formatPercent} onChange={set('oil')} />
      <Ruler label="Sugar" value={recipe.sugar} min={0} max={6} step={0.25} major={4} format={formatPercent} onChange={set('sugar')} />
    </details>
  )
}

const yeastOptions = (['active', 'instant', 'fresh', 'sourdough'] as YeastType[]).map((value) => ({ value, label: yeastNames[value] }))
const marginOptions = (['tight', 'balanced', 'relaxed'] as Margin[]).map((value) => ({ value, label: marginNames[value] }))
const prefermentOptions = (['none', 'poolish', 'biga'] as PrefermentType[]).map((value) => ({ value, label: prefermentNames[value] }))

export function YeastFields({ recipe, dough, preferences, update }: SectionProps) {
  const sourdough = recipe.yeast === 'sourdough'
  const manual = recipe.yeastPercent !== null
  const preferment = recipe.preferment
  const name = prefermentNames[preferment.type].toLowerCase()

  const autoNote = sourdough
    ? `Use ${formatPercent(dough.mixPercent)} ripe starter. Worked out from your schedule.`
    : dough.preferment
      ? dough.mixPercent > 0
        ? `The ${name} does most of the work. Add ${formatPercent(dough.mixPercent)} more yeast to the final dough.`
        : `The ${name} brings all the yeast the final dough needs.`
      : `${formatPercent(dough.yeastPercent)} of the flour weight. Worked out from your time and temperatures.`

  const setPreferment = (patch: Partial<Recipe['preferment']>) => update((current) => ({ ...current, preferment: { ...current.preferment, ...patch } }))

  return (
    <fieldset>
      <legend>Yeast</legend>
      <Choice legend="Yeast type" name="yeast" value={recipe.yeast} options={yeastOptions} onChange={(yeast) => update((current) => setYeast(current, yeast))} />
      {manual ? null : (
        <>
          <Choice legend="Dough is ready" name="margin" value={recipe.margin} options={marginOptions} onChange={(margin) => update((current) => ({ ...current, margin }))} />
          <p>{marginHints[recipe.margin]}</p>
        </>
      )}
      {manual ? (
        <Ruler
          label={sourdough ? 'Starter' : dough.preferment ? 'Yeast in the final dough' : 'Yeast'}
          value={recipe.yeastPercent ?? 0}
          min={0}
          max={sourdough ? 40 : recipe.yeast === 'fresh' ? 6 : 2}
          step={sourdough ? 0.5 : 0.01}
          major={10}
          format={formatPercent}
          onChange={(yeastPercent) => update((current) => ({ ...current, yeastPercent }))}
        />
      ) : (
        <p>{autoNote}</p>
      )}
      <Switch
        label="Set the amount myself"
        checked={manual}
        onChange={(checked) => update((current) => ({ ...current, yeastPercent: checked ? round(dough.mixPercent, sourdough ? 1 : 3) : null }))}
      />
      {sourdough ? (
        <Ruler
          label="Starter hydration"
          value={recipe.starterHydration}
          min={50}
          max={200}
          step={5}
          major={10}
          format={formatPercent}
          onChange={(starterHydration) => update((current) => ({ ...current, starterHydration }))}
          note="Water in your starter as a share of its flour. Most starters are 100%."
        />
      ) : (
        <>
          <Choice legend="Preferment" name="preferment" value={preferment.type} options={prefermentOptions} onChange={(type) => update((current) => setPrefermentType(current, type))} />
          <p>{prefermentHints[preferment.type]}</p>
          {preferment.type !== 'none' ? (
            <>
              <Ruler label={`Flour in the ${name}`} value={preferment.flour} min={10} max={100} step={5} major={2} format={formatPercent} onChange={(flour) => setPreferment({ flour })} />
              <Ruler label={`${prefermentNames[preferment.type]} hydration`} value={preferment.hydration} min={40} max={130} step={5} major={2} format={formatPercent} onChange={(hydration) => setPreferment({ hydration })} />
              <ScaledRuler label={`${prefermentNames[preferment.type]} time`} scale={{ ...hoursScale(48), min: 1 }} value={preferment.hours} onChange={(hours) => setPreferment({ hours: Math.max(1, hours) })} />
              <ScaledRuler
                label={`${prefermentNames[preferment.type]} temperature`}
                scale={temperatureScale(preferences.temperature, [2, 30])}
                value={preferment.temp}
                onChange={(temp) => setPreferment({ temp })}
                note={`Mix it with ${formatPercent(dough.preferment ? (dough.preferment.yeast / dough.preferment.flour) * 100 : 0)} yeast by flour weight.`}
              />
            </>
          ) : null}
        </>
      )}
    </fieldset>
  )
}

const stepOptions: { value: StageStep; label: string }[] = [
  { value: 'bulk', label: 'One piece' },
  { value: 'balls', label: 'Balls' },
  { value: 'pan', label: 'In the pan' },
]

const placeOptions: { value: 'counter' | 'fridge'; label: string }[] = [
  { value: 'counter', label: 'Counter' },
  { value: 'fridge', label: 'Fridge' },
]

export function ScheduleFields({ recipe, preferences, update }: SectionProps) {
  const hours = planHours(recipe)
  const vibe = patienceVibe(hours)
  const preset = matchSchedule(recipe)

  const updateStage = (index: number, patch: Partial<Stage>) =>
    update((current) => ({ ...current, stages: current.stages.map((stage, stageIndex) => (stageIndex === index ? { ...stage, ...patch } : stage)) }))

  const removeStage = (index: number) =>
    update((current) => (current.stages.length > 1 ? { ...current, stages: current.stages.filter((_, stageIndex) => stageIndex !== index) } : current))

  const addStage = () =>
    update((current) => {
      if (current.stages.length >= limits.stages[1]) return current
      const last = current.stages.at(-1)
      const step: StageStep = last?.step === 'bulk' ? 'balls' : (last?.step ?? 'balls')
      return { ...current, stages: [...current.stages, { step, hours: 2, temp: 22 }] }
    })

  return (
    <fieldset>
      <legend>Schedule</legend>
      <Choice<SchedulePreset['id']>
        legend="Quick picks"
        name="schedule"
        value={preset}
        options={schedulePresets.map((item) => ({ value: item.id, label: item.name }))}
        onChange={(id) => update((current) => applySchedule(current, id))}
      />
      <ol aria-label="Fermentation steps">
        {recipe.stages.map((stage, index) => (
          <li key={index}>
            <details>
              <summary>
                {isCold(stage.temp) ? <Fridge aria-hidden="true" /> : <SunLight aria-hidden="true" />}
                <strong>{stageTitle(stage)}</strong>
                <small>{stagePlace(stage, preferences)}</small>
                <data value={stage.hours}>{formatDuration(stage.hours)}</data>
                <NavArrowDown aria-hidden="true" />
              </summary>
              <div>
                <Choice legend="Dough shape" name={`step-${index}`} value={stage.step} options={stepOptions} onChange={(step) => updateStage(index, { step })} />
                <Choice
                  legend="Where it rests"
                  name={`place-${index}`}
                  value={isCold(stage.temp) ? 'fridge' : 'counter'}
                  options={placeOptions}
                  onChange={(place) => updateStage(index, { temp: place === 'fridge' ? 4 : 22 })}
                />
                <ScaledRuler label="Time" scale={hoursScale(96)} value={stage.hours} onChange={(value) => updateStage(index, { hours: value })} />
                <ScaledRuler label="Temperature" scale={temperatureScale(preferences.temperature, [1, 35])} value={stage.temp} onChange={(temp) => updateStage(index, { temp })} />
                <button type="button" disabled={recipe.stages.length === 1} onClick={() => removeStage(index)}>
                  <Trash aria-hidden="true" />
                  Remove this step
                </button>
              </div>
            </details>
          </li>
        ))}
      </ol>
      <button type="button" disabled={recipe.stages.length >= limits.stages[1]} onClick={addStage}>
        <Plus aria-hidden="true" />
        Add a step
      </button>
      <p>
        <strong>{formatDuration(hours)}</strong> {`${vibe.label}. ${vibe.note}`}
      </p>
    </fieldset>
  )
}

export function TuningFields({ recipe, preferences, update }: SectionProps) {
  const room = recipe.stages.find((stage) => !isCold(stage.temp))?.temp ?? 22
  const water = waterTemperature({ doughTemp: recipe.doughTemp, flourTemp: room, roomTemp: room, method: 'hand' })
  return (
    <details>
      <summary>
        Fine tuning
        <NavArrowDown aria-hidden="true" />
      </summary>
      <ScaledRuler
        label="Dough temperature"
        scale={temperatureScale(preferences.temperature, [16, 30])}
        value={recipe.doughTemp}
        onChange={(doughTemp) => update((current) => ({ ...current, doughTemp }))}
        note={`Kneading by hand in a ${formatTemperature(room, preferences.temperature)} kitchen? Use water at about ${formatTemperature(Math.max(1, water), preferences.temperature)}.`}
      />
      <ScaledRuler
        label="Thickness"
        scale={loadingScale(preferences.length)}
        value={recipe.loading}
        onChange={(loading) => update((current) => ({ ...current, loading }))}
        note="Dough per area. Higher numbers bake up thicker."
      />
      <Ruler
        label="Bowl residue"
        value={recipe.residue}
        min={0}
        max={10}
        step={0.5}
        major={2}
        format={formatPercent}
        onChange={(residue) => update((current) => ({ ...current, residue }))}
        note="A little extra for the dough that sticks to your hands and bowl."
      />
    </details>
  )
}

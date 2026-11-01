import { describe, expect, it } from 'vitest'
import {
  HOUR,
  MINUTE,
  applySchedule,
  applyStyle,
  buildPlan,
  calculate,
  defaultRecipe,
  describeEvent,
  getStyle,
  matchSchedule,
  normalizeRecipe,
  planHours,
  setPrefermentType,
  setShapeKind,
  setYeast,
  schedulePresets,
  waterTemperature,
  type Recipe,
} from '../src'

const bake = Date.UTC(2026, 8, 19, 23, 0)

describe('plans', () => {
  it('works backwards from bake time', () => {
    const recipe = defaultRecipe('new-york')
    const style = getStyle('new-york')
    const events = buildPlan(recipe, style.oven, { bake })
    expect(planHours(recipe)).toBe(48)
    expect(events[0]).toMatchObject({ kind: 'mix', at: bake - 48 * HOUR })
    expect(events.map((event) => event.kind)).toEqual(['mix', 'divide', 'counter', 'preheat', 'bake'])
    expect(events.at(-1)?.at).toBe(bake)
    expect(events.find((event) => event.kind === 'preheat')?.at).toBe(bake - 60 * MINUTE)
  })

  it('starts with the preferment when there is one', () => {
    const recipe = defaultRecipe('contemporary')
    const events = buildPlan(recipe, getStyle('contemporary').oven, { start: 0 })
    expect(events[0]?.kind).toBe('preferment')
    expect(events[1]).toMatchObject({ kind: 'mix', at: 16 * HOUR })
    expect(events.at(-1)?.at).toBe(22 * HOUR)
  })

  it('describes pan steps and fridge moves', () => {
    const recipe = defaultRecipe('sicilian')
    const style = getStyle('sicilian')
    const dough = calculate(recipe)
    const events = buildPlan(recipe, style.oven, { start: 0 })
    expect(events.map((event) => event.kind)).toEqual(['mix', 'fridge', 'pan', 'preheat', 'bake'])
    const copy = events.map((event) => describeEvent(event, { recipe, dough, oven: style.oven, preferences: { weight: 'g', temperature: 'f', length: 'in', salt: 'fine' } }))
    expect(copy[2]?.title).toBe('Into the pan')
    expect(copy[4]?.detail).toContain('°F')
    for (const line of copy) {
      expect(line.title.length).toBeGreaterThan(0)
      expect(line.detail).not.toMatch(/, and /)
    }
  })
})

describe('recipe edits', () => {
  it('keeps yeast choice when switching styles', () => {
    const sourdough = setYeast(defaultRecipe('neapolitan'), 'sourdough')
    const next = applyStyle(sourdough, 'contemporary')
    expect(next.yeast).toBe('sourdough')
    expect(next.preferment.type).toBe('none')
    expect(next.style).toBe('contemporary')
  })

  it('converts between ball, round and pan while keeping the dough weight close', () => {
    const recipe: Recipe = { ...defaultRecipe('neapolitan'), shape: { kind: 'ball', weight: 250 }, loading: 0.35 }
    const round = setShapeKind(recipe, 'round')
    expect(round.shape.kind).toBe('round')
    const pan = setShapeKind(round, 'pan')
    expect(pan.shape.kind).toBe('pan')
    const back = setShapeKind(pan, 'ball')
    expect(back.shape.kind === 'ball' && Math.abs(back.shape.weight - 250) < 15).toBe(true)
  })

  it('swaps sourdough out when a preferment is chosen', () => {
    const recipe = setPrefermentType(setYeast(defaultRecipe('neapolitan'), 'sourdough'), 'biga')
    expect(recipe.yeast).toBe('active')
    expect(recipe.preferment).toMatchObject({ type: 'biga', hydration: 45 })
  })

  it('applies schedule presets and recognizes them again', () => {
    for (const preset of schedulePresets) {
      const round = applySchedule(defaultRecipe('neapolitan'), preset.id)
      expect(matchSchedule(round)).toBe(preset.id)
      const pan = applySchedule(defaultRecipe('detroit'), preset.id)
      expect(pan.stages.at(-1)?.step).toBe('pan')
      expect(matchSchedule(pan)).toBe(preset.id)
    }
    expect(matchSchedule(defaultRecipe('neapolitan'))).toBe('counter-24')
    expect(matchSchedule(defaultRecipe('new-york'))).toBe('fridge-48')
    expect(matchSchedule(defaultRecipe('detroit'))).toBeNull()
  })

  it('normalizes junk into a usable recipe', () => {
    const recipe = normalizeRecipe({ style: 'detroit', hydration: 'wet', stages: 'soon', count: 2.6 })
    expect(recipe.style).toBe('detroit')
    expect(recipe.hydration).toBe(defaultRecipe('detroit').hydration)
    expect(recipe.stages).toEqual(defaultRecipe('detroit').stages)
    expect(recipe.count).toBe(3)
    expect(normalizeRecipe(null)).toEqual(defaultRecipe('new-york'))
  })
})

describe('water temperature', () => {
  it('uses the desired dough temperature method', () => {
    expect(waterTemperature({ doughTemp: 24, flourTemp: 22, roomTemp: 22, method: 'hand' })).toBe(24 * 3 - 22 - 22 - 2)
    expect(waterTemperature({ doughTemp: 24, flourTemp: 22, roomTemp: 22, method: 'stand', prefermentTemp: 20 })).toBe(24 * 4 - 22 - 22 - 12 - 20)
  })
})

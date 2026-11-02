import { describe, expect, it } from 'vitest'
import {
  applySchedule,
  buildPlan,
  calculate,
  calendarFile,
  defaultRecipe,
  describeEvent,
  getStyle,
  hoursScale,
  isPanStyle,
  lengthScale,
  limits,
  loadingScale,
  matchSchedule,
  setShapeKind,
  starterFor,
  temperatureScale,
  weightScale,
  yeastLimit,
  type Preferences,
  type Recipe,
} from '../src'

const preferences: Preferences = { weight: 'g', temperature: 'c', length: 'cm', salt: 'fine' }
const plan = (recipe: Recipe) => buildPlan(recipe, getStyle(recipe.style).oven, { bake: 0 })

describe('plans survive odd schedules', () => {
  it('ignores a zero hour stage without mislabelling the next one', () => {
    const recipe: Recipe = {
      ...defaultRecipe('new-york'),
      stages: [
        { step: 'bulk', hours: 2, temp: 22 },
        { step: 'balls', hours: 0, temp: 4 },
        { step: 'balls', hours: 20, temp: 4 },
      ],
    }
    expect(plan(recipe).map((event) => event.kind)).toEqual(['mix', 'divide', 'preheat', 'bake'])
  })

  it('never tells you to preheat before you mix', () => {
    for (const hours of [0, 0.25, 1, 24]) {
      const recipe: Recipe = { ...defaultRecipe('new-york'), stages: [{ step: 'balls', hours, temp: 22 }] }
      const events = plan(recipe)
      const mix = events.findIndex((event) => event.kind === 'mix')
      const preheat = events.findIndex((event) => event.kind === 'preheat')
      expect(mix).toBeGreaterThanOrEqual(0)
      expect(mix).toBeLessThan(preheat)
    }
  })

  it('still explains what to do when every stage is zero', () => {
    const recipe: Recipe = { ...defaultRecipe('new-york'), stages: [{ step: 'balls', hours: 0, temp: 22 }] }
    const events = plan(recipe)
    const copy = describeEvent(events[0]!, { recipe, dough: calculate(recipe), oven: getStyle('new-york').oven, preferences })
    expect(copy.title).toBe('Mix the dough')
    expect(copy.detail).toContain('resting time')
  })
})

describe('pan styles', () => {
  it('treats Roman Teglia as the pan pizza it is', () => {
    const teglia = defaultRecipe('roman-teglia')
    expect(teglia.shape.kind).toBe('pan')
    expect(isPanStyle(teglia)).toBe(true)
    expect(teglia.stages.at(-1)?.step).toBe('pan')
    expect(plan(teglia).map((event) => event.kind)).toContain('pan')
  })

  it('does not match a preset whose steps differ', () => {
    const detroit = applySchedule(defaultRecipe('detroit'), 'overnight')
    expect(matchSchedule(detroit)).toBe('overnight')
    expect(matchSchedule({ ...detroit, stages: detroit.stages.map((stage) => ({ ...stage, step: 'bulk' as const })) })).toBeNull()
  })
})

describe('yeast guard rails', () => {
  it('never asks for more than the sliders can show', () => {
    for (const yeast of ['instant', 'active', 'fresh', 'sourdough'] as const) {
      for (const hours of [0, 1, 2, 6, 24]) {
        const recipe: Recipe = { ...defaultRecipe('new-york'), yeast, stages: [{ step: 'balls', hours, temp: 22 }] }
        expect(calculate(recipe).mixPercent).toBeLessThanOrEqual(yeastLimit(yeast))
      }
    }
  })

  it('warns about too much yeast even when you set it yourself', () => {
    expect(calculate({ ...defaultRecipe('new-york'), yeastPercent: 40 }).warnings).toContain('yeast-heavy')
    expect(calculate({ ...defaultRecipe('new-york'), stages: [{ step: 'balls', hours: 1, temp: 22 }] }).warnings).toContain('yeast-heavy')
  })

  it('warns when a sourdough schedule leaves nothing to weigh', () => {
    const recipe: Recipe = { ...defaultRecipe('new-york'), yeast: 'sourdough', stages: [{ step: 'balls', hours: 96, temp: 35 }] }
    expect(calculate(recipe).warnings).toContain('starter-light')
  })

  it('lets fridge temperature change the starter', () => {
    const at = (temp: number) => starterFor([{ step: 'balls', hours: 48, temp }], temp, 100, { margin: 'tight' })
    expect(at(1)).toBeGreaterThan(at(4))
    expect(at(4)).toBeGreaterThan(at(8))
    expect(at(8)).toBeGreaterThan(at(12))
    expect(at(4) / at(12)).toBeGreaterThan(1.5)
  })
})

describe('measurements stay inside the engine limits', () => {
  it('keeps every imperial scale within its metric bounds', () => {
    const pairs = [
      [weightScale('oz'), limits.weight],
      [lengthScale('in', limits.diameter), limits.diameter],
      [lengthScale('in', limits.side), limits.side],
      [temperatureScale('f', limits.temp), limits.temp],
      [loadingScale('in'), limits.loading],
      [hoursScale(), limits.stageHours],
    ] as const
    for (const [scale, range] of pairs) {
      expect(scale.fromDisplay(scale.min)).toBeGreaterThanOrEqual(range[0] - 1e-9)
      expect(scale.fromDisplay(scale.max)).toBeLessThanOrEqual(range[1] + 1e-9)
    }
  })

  it('keeps the dough weight when switching how size is set', () => {
    for (const shape of [{ kind: 'ball', weight: 3000 } as const, { kind: 'ball', weight: 60 } as const]) {
      for (const loading of [0.1, 0.75, 1.5]) {
        const recipe: Recipe = { ...defaultRecipe('new-york'), shape, loading }
        for (const kind of ['round', 'pan'] as const) {
          const next = setShapeKind(recipe, kind)
          expect(calculate(next).ball).toBeCloseTo(calculate(recipe).ball, 0)
        }
      }
    }
  })
})

describe('calendar export', () => {
  it('folds by octets and keeps emoji intact', () => {
    const file = calendarFile([{ at: Date.UTC(2026, 10, 2, 18), title: '🍕'.repeat(40), detail: 'a'.repeat(120) }], 'Friday 🍕')
    const encoder = new TextEncoder()
    for (const line of file.split('\r\n')) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75)
      expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(line)).toBe(false)
    }
    expect(file).toContain('🍕')
  })

  it('strips a stray carriage return', () => {
    const file = calendarFile([{ at: 0, title: 'a\rb', detail: 'c' }], 'x')
    expect(file.split('\r\n').every((line) => !line.includes('\r'))).toBe(true)
    expect(file).toContain('SUMMARY:a\\nb')
  })
})

import { describe, expect, it } from 'vitest'
import {
  applySchedule,
  calculate,
  convertYeast,
  defaultRecipe,
  fermentationRate,
  formulaModifier,
  hoursToReady,
  instantYeastFor,
  prefermentYeastFor,
  simulate,
  starterFor,
  toInstant,
  type Stage,
} from '../src'

const counter = (hours: number, temp = 22): Stage[] => [{ step: 'balls', hours, temp }]
const fahrenheit = (value: number) => ((value - 32) * 5) / 9
const near = (actual: number, expected: number, tolerance: number) => {
  expect(actual).toBeGreaterThan(expected * (1 - tolerance))
  expect(actual).toBeLessThan(expected * (1 + tolerance))
}

describe('fermentation rate', () => {
  it('speeds up with warmth and stalls near freezing and in the heat', () => {
    expect(fermentationRate(24)).toBeCloseTo(1, 9)
    expect(fermentationRate(4)).toBeLessThan(fermentationRate(10))
    expect(fermentationRate(10)).toBeLessThan(fermentationRate(20))
    expect(fermentationRate(20)).toBeLessThan(fermentationRate(30))
    expect(fermentationRate(-5)).toBe(0)
    expect(fermentationRate(60)).toBe(0)
  })

  it('follows the hours to ready from Craig’s chart at 0.1% instant yeast', () => {
    near(hoursToReady(fahrenheit(40)), 92, 0.08)
    near(hoursToReady(fahrenheit(60)), 17.4, 0.08)
    near(hoursToReady(fahrenheit(70)), 7.9, 0.08)
    near(hoursToReady(fahrenheit(80)), 3.8, 0.08)
  })
})

describe('commercial yeast calibration', () => {
  const tight = { margin: 'tight' } as const

  it('matches Craig’s chart for single temperatures', () => {
    near(instantYeastFor(counter(72, fahrenheit(38)), fahrenheit(38), tight), 0.18, 0.15)
    near(instantYeastFor(counter(8, fahrenheit(70)), fahrenheit(70), tight), 0.099, 0.15)
    near(instantYeastFor(counter(24, fahrenheit(70)), fahrenheit(70), tight), 0.022, 0.15)
    near(instantYeastFor(counter(12, fahrenheit(55)), fahrenheit(55), tight), 0.3, 0.15)
  })

  it('reproduces Craig’s multi temperature example', () => {
    const stages: Stage[] = [
      { step: 'balls', hours: 24, temp: fahrenheit(64) },
      { step: 'balls', hours: 120, temp: fahrenheit(36) },
    ]
    near(instantYeastFor(stages, fahrenheit(64), tight), 0.025, 0.15)
  })

  it('adds breathing room with the margin', () => {
    const stages = counter(24, 20)
    const justInTime = instantYeastFor(stages, 20, { margin: 'tight' })
    expect(instantYeastFor(stages, 20, { margin: 'balanced' })).toBeCloseTo(justInTime * 1.5, 9)
    expect(instantYeastFor(stages, 20, { margin: 'relaxed' })).toBeCloseTo(justInTime * 2.25, 9)
  })

  it('lands in the range real bakers use for the default styles', () => {
    const range = (style: Parameters<typeof defaultRecipe>[0], low: number, high: number) => {
      const dough = calculate(defaultRecipe(style))
      expect(dough.instantPercent).toBeGreaterThan(low)
      expect(dough.instantPercent).toBeLessThan(high)
    }
    range('neapolitan', 0.02, 0.08)
    range('new-york', 0.15, 0.45)
    range('detroit', 0.12, 0.6)
    range('deep-dish', 0.3, 1.5)
    const sameDay = calculate(applySchedule(defaultRecipe('neapolitan'), 'same-day'))
    expect(sameDay.instantPercent).toBeGreaterThan(0.08)
    expect(sameDay.instantPercent).toBeLessThan(0.3)
  })
})

describe('schedules', () => {
  it('drops the yeast as fermentation gets longer', () => {
    let previous = Number.POSITIVE_INFINITY
    for (const hours of [2, 4, 8, 12, 24, 48]) {
      const amount = instantYeastFor(counter(hours), 22)
      expect(amount).toBeLessThan(previous)
      previous = amount
    }
  })

  it('drops the yeast as the kitchen gets warmer', () => {
    let previous = Number.POSITIVE_INFINITY
    for (const temp of [16, 19, 22, 25, 28]) {
      const amount = instantYeastFor(counter(8, temp), temp)
      expect(amount).toBeLessThan(previous)
      previous = amount
    }
  })

  it('needs more yeast in the fridge than on the counter', () => {
    const cold = instantYeastFor([{ step: 'balls', hours: 48, temp: 4 }], 22)
    const warm = instantYeastFor(counter(48), 22)
    expect(cold).toBeGreaterThan(warm * 3)
  })

  it('lets cold dough warm up gradually after the fridge', () => {
    const tempering: Stage[] = [{ step: 'balls', hours: 3, temp: 22 }]
    const fromFridge = simulate(tempering, 4)
    const alreadyWarm = simulate(tempering, 22)
    expect(fromFridge.effective).toBeLessThan(alreadyWarm.effective * 0.8)
    expect(fromFridge.temp).toBeGreaterThan(18)
    expect(fromFridge.temp).toBeLessThan(22)
  })

  it('warms balls faster than a big bulk mass', () => {
    const balls = simulate([{ step: 'balls', hours: 2, temp: 22 }], 4)
    const bulk = simulate([{ step: 'bulk', hours: 2, temp: 22 }], 4)
    expect(balls.temp).toBeGreaterThan(bulk.temp)
  })
})

describe('formula', () => {
  it('asks for more yeast in salty, rich or very stiff doughs', () => {
    expect(formulaModifier({ hydration: 65, salt: 2, oil: 2 })).toBeCloseTo(1, 9)
    expect(formulaModifier({ hydration: 60, salt: 3, oil: 0 })).toBeLessThan(1.1)
    expect(formulaModifier({ hydration: 52, salt: 1.5, oil: 17 })).toBeGreaterThan(1.8)
    expect(formulaModifier({ hydration: 50, salt: 2, oil: 8 })).toBeGreaterThan(1.4)
  })
})

describe('yeast types', () => {
  it('converts both ways', () => {
    for (const type of ['instant', 'active', 'fresh'] as const) {
      expect(toInstant(convertYeast(0.2, type), type)).toBeCloseTo(0.2, 9)
    }
    expect(convertYeast(0.1, 'fresh')).toBeCloseTo(0.3, 9)
    expect(convertYeast(0.1, 'active')).toBeCloseTo(0.13, 9)
  })
})

describe('sourdough', () => {
  it('follows Craig’s starter model', () => {
    near(starterFor(counter(24, 23.9), 23.9, 100, { margin: 'tight' }), 1, 0.12)
    const craig = 0.219
    near(starterFor(counter(12, 20), 20, 100, { margin: 'tight' }), (100 * craig) / (1 + craig / 2), 0.08)
  })

  it('needs less starter for longer and warmer ferments', () => {
    expect(starterFor(counter(24, 20), 20, 100)).toBeLessThan(starterFor(counter(12, 20), 20, 100))
    expect(starterFor(counter(12, 24), 24, 100)).toBeLessThan(starterFor(counter(12, 18), 18, 100))
  })
})

describe('preferments', () => {
  it('follows Giorilli’s poolish table at room temperature', () => {
    near(prefermentYeastFor({ type: 'poolish', flour: 30, hydration: 100, hours: 16, temp: 21 }).percent * 3, 0.1, 0.25)
    near(prefermentYeastFor({ type: 'poolish', flour: 30, hydration: 100, hours: 7, temp: 21 }).percent * 3, 0.78, 0.3)
  })

  it('gives a stiff biga more yeast than a poolish', () => {
    const poolish = prefermentYeastFor({ type: 'poolish', flour: 40, hydration: 100, hours: 18, temp: 18 })
    const biga = prefermentYeastFor({ type: 'biga', flour: 40, hydration: 45, hours: 18, temp: 18 })
    expect(biga.percent).toBeGreaterThan(poolish.percent * 2)
    near(biga.percent * 3, 1, 0.35)
  })

  it('uses less yeast for longer preferments', () => {
    const short = prefermentYeastFor({ type: 'poolish', flour: 30, hydration: 100, hours: 4, temp: 20 })
    const long = prefermentYeastFor({ type: 'poolish', flour: 30, hydration: 100, hours: 16, temp: 20 })
    expect(long.percent).toBeLessThan(short.percent)
  })

  it('never adds more final dough yeast than the schedule needs on its own', () => {
    const plain = calculate({ ...defaultRecipe('contemporary'), preferment: { type: 'none', flour: 30, hydration: 100, hours: 16, temp: 20 } })
    const poolish = calculate(defaultRecipe('contemporary'))
    expect(poolish.mixPercent).toBeLessThanOrEqual(plain.mixPercent)
  })
})

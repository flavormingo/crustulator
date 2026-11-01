import { describe, expect, it } from 'vitest'
import {
  area,
  ballWeight,
  calculate,
  defaultRecipe,
  defaultStyle,
  diameterFor,
  styles,
  type Recipe,
} from '../src'

const neapolitan = (): Recipe => ({
  ...defaultRecipe('neapolitan'),
  count: 4,
  shape: { kind: 'ball', weight: 250 },
  hydration: 60,
  salt: 3,
  oil: 0,
  sugar: 0,
  residue: 0,
  yeastPercent: 0.1,
  yeast: 'instant',
})

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

describe('geometry', () => {
  it('measures rounds and pans', () => {
    expect(area({ kind: 'round', diameter: 30 })).toBeCloseTo(706.858, 2)
    expect(area({ kind: 'pan', width: 25, length: 35 })).toBe(875)
    expect(area({ kind: 'ball', weight: 250 })).toBe(0)
  })

  it('turns size into dough weight with the loading factor', () => {
    expect(ballWeight({ shape: { kind: 'round', diameter: 30 }, loading: 0.35 })).toBeCloseTo(247.4, 1)
    expect(ballWeight({ shape: { kind: 'pan', width: 25, length: 35 }, loading: 0.5 })).toBeCloseTo(437.5, 5)
    expect(diameterFor(247.4, 0.35)).toBeCloseTo(30, 1)
  })
})

describe('styles', () => {
  it('lists styles in menu order with New York first', () => {
    expect(styles.map((style) => style.id)).toEqual([
      'new-york',
      'deep-dish',
      'tavern',
      'detroit',
      'new-haven',
      'grandma',
      'sicilian',
      'contemporary',
      'neapolitan',
      'roman-teglia',
      'roman-tonda',
      'cast-iron',
    ])
    expect(defaultStyle).toBe('new-york')
  })
})

describe('calculate', () => {
  it('splits a simple dough by baker’s percentages', () => {
    const dough = calculate(neapolitan())
    expect(dough.total).toBeCloseTo(1000, 6)
    expect(dough.flour).toBeCloseTo(1000 / 1.631, 6)
    expect(dough.water / dough.flour).toBeCloseTo(0.6, 9)
    expect(dough.salt / dough.flour).toBeCloseTo(0.03, 9)
    expect(dough.yeast / dough.flour).toBeCloseTo(0.001, 9)
    expect(dough.flour + dough.water + dough.salt + dough.yeast).toBeCloseTo(1000, 6)
  })

  it('adds the bowl residue on top', () => {
    const dough = calculate({ ...neapolitan(), residue: 5 })
    expect(dough.total).toBeCloseTo(1050, 6)
    expect(dough.ball).toBe(250)
  })

  it('lists the mixing lines so they add up to the total dough', () => {
    for (const style of styles) {
      const dough = calculate(style.recipe)
      const lines = dough.groups.find((group) => group.key === 'dough')?.lines ?? []
      expect(sum(lines.map((line) => line.grams))).toBeCloseTo(dough.total, 6)
    }
  })

  it('converts yeast types from the instant equivalent', () => {
    const instant = calculate({ ...neapolitan(), yeastPercent: 0.1 })
    const active = calculate({ ...neapolitan(), yeast: 'active', yeastPercent: 0.13 })
    const fresh = calculate({ ...neapolitan(), yeast: 'fresh', yeastPercent: 0.3 })
    expect(instant.instantPercent).toBeCloseTo(0.1, 9)
    expect(active.instantPercent).toBeCloseTo(0.1, 9)
    expect(fresh.instantPercent).toBeCloseTo(0.1, 9)
  })

  it('counts the flour and water inside a sourdough starter', () => {
    const recipe: Recipe = { ...neapolitan(), yeast: 'sourdough', yeastPercent: 20, starterHydration: 100 }
    const dough = calculate(recipe)
    expect(dough.starter).not.toBeNull()
    const starter = dough.starter!
    expect(starter.weight).toBeCloseTo(dough.flour * 0.2, 9)
    expect(starter.flour).toBeCloseTo(starter.water, 9)
    expect(dough.total).toBeCloseTo(1000, 6)
    expect(dough.water / dough.flour).toBeCloseTo(0.6, 9)
    expect(dough.flour + dough.water + dough.salt).toBeCloseTo(1000, 6)
    const lines = Object.fromEntries(dough.groups[0]!.lines.map((line) => [line.key, line.grams]))
    expect(lines.flour).toBeCloseTo(dough.flour - starter.flour, 9)
    expect(lines.water).toBeCloseTo(dough.water - starter.water, 9)
    expect(lines.yeast).toBeUndefined()
  })

  it('warns when the starter carries more water than the dough allows', () => {
    const dough = calculate({ ...neapolitan(), hydration: 30, yeast: 'sourdough', yeastPercent: 50, starterHydration: 200 })
    expect(dough.warnings).toContain('starter-water')
  })

  it('builds a poolish out of the total flour and water', () => {
    const recipe: Recipe = {
      ...neapolitan(),
      yeastPercent: null,
      preferment: { type: 'poolish', flour: 30, hydration: 100, hours: 16, temp: 18 },
    }
    const dough = calculate(recipe)
    const poolish = dough.preferment!
    expect(poolish.flour).toBeCloseTo(dough.flour * 0.3, 9)
    expect(poolish.water).toBeCloseTo(poolish.flour, 9)
    expect(poolish.yeast).toBeGreaterThan(0)
    const [first, second] = dough.groups
    expect(first?.key).toBe('preferment')
    expect(second?.lines[0]?.key).toBe('preferment')
    expect(dough.water / dough.flour).toBeCloseTo(0.6, 9)
  })

  it('never lets the poolish take more water than exists', () => {
    const dough = calculate({
      ...neapolitan(),
      hydration: 50,
      preferment: { type: 'poolish', flour: 80, hydration: 100, hours: 12, temp: 20 },
    })
    expect(dough.warnings).toContain('preferment-water')
    expect(dough.preferment!.water).toBeCloseTo(dough.water, 9)
  })

  it('ignores preferments for sourdough', () => {
    const dough = calculate({
      ...neapolitan(),
      yeast: 'sourdough',
      yeastPercent: 15,
      preferment: { type: 'poolish', flour: 30, hydration: 100, hours: 16, temp: 18 },
    })
    expect(dough.preferment).toBeNull()
  })

  it('asks for time when the schedule is empty', () => {
    const dough = calculate({ ...neapolitan(), yeastPercent: null, stages: [{ step: 'bulk', hours: 0, temp: 22 }] })
    expect(dough.warnings).toContain('no-time')
    expect(Number.isFinite(dough.yeast)).toBe(true)
  })

  it('produces finite numbers for every style and yeast', () => {
    for (const style of styles) {
      for (const yeast of ['instant', 'active', 'fresh', 'sourdough'] as const) {
        const dough = calculate({ ...style.recipe, yeast })
        for (const value of [dough.flour, dough.water, dough.salt, dough.yeast, dough.yeastPercent, dough.total]) {
          expect(Number.isFinite(value)).toBe(true)
          expect(value).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })
})

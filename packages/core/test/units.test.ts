import { describe, expect, it } from 'vitest'
import {
  formatDuration,
  formatLength,
  formatOvenRange,
  formatOvenTemperature,
  formatPercent,
  formatSpoons,
  formatTemperature,
  formatTotalWeight,
  formatWeight,
  group,
  preferencesFor,
  toCelsius,
  toFahrenheit,
} from '../src'

describe('units', () => {
  it('groups thousands', () => {
    expect(group(1234567.5)).toBe('1,234,567.5')
    expect(group(999)).toBe('999')
    expect(group(-1000)).toBe('-1,000')
  })

  it('formats weights with sensible precision', () => {
    expect(formatWeight(1234.4, 'g')).toBe('1,234 g')
    expect(formatWeight(28.46, 'g')).toBe('28.5 g')
    expect(formatWeight(0.347, 'g')).toBe('0.35 g')
    expect(formatWeight(28.349523125, 'oz')).toBe('1 oz')
    expect(formatWeight(500, 'oz')).toBe('17.6 oz')
  })

  it('formats totals in kilograms and pounds', () => {
    expect(formatTotalWeight(1530, 'g')).toBe('1.53 kg')
    expect(formatTotalWeight(640, 'g')).toBe('640 g')
    expect(formatTotalWeight(1000, 'oz')).toBe('2 lb 3.3 oz')
    expect(formatTotalWeight(453.59237, 'oz')).toBe('1 lb')
  })

  it('formats percentages', () => {
    expect(formatPercent(62)).toBe('62%')
    expect(formatPercent(2.75)).toBe('2.8%')
    expect(formatPercent(0.125)).toBe('0.13%')
    expect(formatPercent(0.0312)).toBe('0.031%')
    expect(formatPercent(0)).toBe('0%')
  })

  it('converts temperatures', () => {
    expect(toFahrenheit(100)).toBe(212)
    expect(toCelsius(32)).toBe(0)
    expect(formatTemperature(4, 'f')).toBe('39°F')
    expect(formatTemperature(21.5, 'c')).toBe('21.5°C')
    expect(formatTemperature(22, 'c')).toBe('22°C')
  })

  it('rounds oven temperatures to friendly numbers', () => {
    expect(formatOvenTemperature(290, 'f')).toBe('555°F')
    expect(formatOvenTemperature(288, 'f')).toBe('550°F')
    expect(formatOvenRange([260, 290], 'f')).toBe('500–555°F')
    expect(formatOvenRange([430, 485], 'c')).toBe('430–485°C')
  })

  it('formats lengths and durations', () => {
    expect(formatLength(40.64, 'in')).toBe('16″')
    expect(formatLength(22.86, 'in')).toBe('9″')
    expect(formatLength(30, 'cm')).toBe('30 cm')
    expect(formatDuration(0.5)).toBe('30 min')
    expect(formatDuration(1.5)).toBe('1 h 30 min')
    expect(formatDuration(24)).toBe('24 h')
    expect(formatDuration(72)).toBe('3 days')
  })

  it('estimates spoons for small amounts', () => {
    expect(formatSpoons(7, 'instant')).toBe('2 ¼ tsp')
    expect(formatSpoons(0.05, 'instant')).toBe('a pinch')
    expect(formatSpoons(18, 'fine')).toBe('1 tbsp')
    expect(formatSpoons(1.5, 'fine')).toBe('¼ tsp')
    expect(formatSpoons(0, 'sugar')).toBeNull()
  })

  it('picks regional defaults', () => {
    expect(preferencesFor('US')).toMatchObject({ temperature: 'f', length: 'in', weight: 'g' })
    expect(preferencesFor('IT')).toMatchObject({ temperature: 'c', length: 'cm', weight: 'g' })
    expect(preferencesFor(null).temperature).toBe('c')
  })
})

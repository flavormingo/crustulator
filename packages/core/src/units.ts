import type { Preferences, SaltType } from './types'

export const GRAMS_PER_OUNCE = 28.349523125
export const CM_PER_INCH = 2.54

export const defaultPreferences: Preferences = {
  weight: 'g',
  temperature: 'c',
  length: 'cm',
  salt: 'fine',
}

export function preferencesFor(region: string | null | undefined): Preferences {
  const imperial = region === 'US' || region === 'LR' || region === 'MM'
  return imperial ? { ...defaultPreferences, temperature: 'f', length: 'in' } : { ...defaultPreferences }
}

export const toFahrenheit = (celsius: number) => (celsius * 9) / 5 + 32
export const toCelsius = (fahrenheit: number) => ((fahrenheit - 32) * 5) / 9

export function group(value: number): string {
  const [whole = '0', fraction] = Math.abs(value).toString().split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return (value < 0 ? '-' : '') + (fraction ? `${grouped}.${fraction}` : grouped)
}

export function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function gramsPrecision(grams: number): number {
  if (grams >= 100) return 0
  if (grams >= 1) return 1
  return 2
}

export function weightNumber(grams: number, unit: Preferences['weight']): string {
  if (unit === 'oz') {
    const ounces = grams / GRAMS_PER_OUNCE
    return group(round(ounces, ounces >= 10 ? 1 : 2))
  }
  return group(round(grams, gramsPrecision(grams)))
}

export function formatWeight(grams: number, unit: Preferences['weight']): string {
  return `${weightNumber(grams, unit)} ${unit}`
}

export function formatTotalWeight(grams: number, unit: Preferences['weight']): string {
  if (unit === 'oz') {
    const ounces = grams / GRAMS_PER_OUNCE
    if (ounces >= 16) {
      const pounds = Math.floor(ounces / 16)
      const rest = round(ounces - pounds * 16, 1)
      return rest >= 16 ? `${pounds + 1} lb` : rest > 0 ? `${pounds} lb ${rest} oz` : `${pounds} lb`
    }
    return `${group(round(ounces, 1))} oz`
  }
  if (grams >= 1000) return `${group(round(grams / 1000, 2))} kg`
  return `${group(round(grams))} g`
}

export function formatPercent(percent: number): string {
  if (percent === 0) return '0%'
  if (percent >= 10) return `${group(round(percent, 1))}%`
  if (percent >= 1) return `${round(percent, 1)}%`
  if (percent >= 0.1) return `${round(percent, 2)}%`
  return `${round(percent, 3)}%`
}

export function temperatureNumber(celsius: number, unit: Preferences['temperature']): number {
  return unit === 'f' ? round(toFahrenheit(celsius)) : round(celsius, Number.isInteger(round(celsius, 1)) ? 0 : 1)
}

export function formatTemperature(celsius: number, unit: Preferences['temperature']): string {
  return `${temperatureNumber(celsius, unit)}°${unit === 'f' ? 'F' : 'C'}`
}

function ovenNumber(celsius: number, unit: Preferences['temperature']): number {
  return Math.round((unit === 'f' ? toFahrenheit(celsius) : celsius) / 5) * 5
}

export function formatOvenTemperature(celsius: number, unit: Preferences['temperature']): string {
  return `${ovenNumber(celsius, unit)}°${unit === 'f' ? 'F' : 'C'}`
}

export function formatOvenRange([low, high]: [number, number], unit: Preferences['temperature']): string {
  return `${ovenNumber(low, unit)}–${ovenNumber(high, unit)}°${unit === 'f' ? 'F' : 'C'}`
}

export function formatLength(cm: number, unit: Preferences['length']): string {
  if (unit === 'in') return `${round(cm / CM_PER_INCH, cm / CM_PER_INCH >= 10 ? 0 : 1)}″`
  return `${round(cm)} cm`
}

export function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const wholeHours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (wholeHours >= 48 && minutes === 0 && wholeHours % 24 === 0) return `${wholeHours / 24} days`
  return minutes ? `${wholeHours} h ${minutes} min` : `${wholeHours} h`
}

export type SpoonIngredient = 'instant' | 'active' | 'sugar' | 'oil' | SaltType

export const gramsPerTeaspoon: Record<SpoonIngredient, number> = {
  instant: 3.1,
  active: 3.1,
  sugar: 4.2,
  oil: 4.5,
  fine: 5.7,
  table: 6,
  diamond: 2.8,
  morton: 4.8,
}

const eighths = ['', '⅛', '¼', '⅜', '½', '⅝', '¾', '⅞']

function spoonText(amount: number, unit: 'tsp' | 'tbsp'): string {
  const total = Math.round(amount * 8)
  const whole = Math.floor(total / 8)
  const part = eighths[total % 8] ?? ''
  const number = whole > 0 ? (part ? `${whole} ${part}` : `${whole}`) : part
  return `${number} ${unit}`
}

export function formatSpoons(grams: number, ingredient: SpoonIngredient): string | null {
  const teaspoons = grams / gramsPerTeaspoon[ingredient]
  if (!Number.isFinite(teaspoons) || teaspoons <= 0) return null
  if (teaspoons < 1 / 16) return 'a pinch'
  if (teaspoons >= 3) {
    const tablespoons = teaspoons / 3
    if (tablespoons > 8) return null
    return spoonText(tablespoons, 'tbsp')
  }
  return spoonText(teaspoons, 'tsp')
}

import { limits } from './recipe'
import type { Preferences } from './types'
import { CM_PER_INCH, formatDuration, GRAMS_PER_OUNCE, round, toCelsius, toFahrenheit } from './units'

export interface Scale {
  min: number
  max: number
  step: number
  major: number
  toDisplay: (value: number) => number
  fromDisplay: (value: number) => number
  format: (value: number) => string
}

const same = (value: number) => value

export function weightScale(unit: Preferences['weight'], range: readonly [number, number] = limits.weight): Scale {
  if (unit === 'oz') {
    return {
      min: Math.ceil((range[0] / GRAMS_PER_OUNCE) * 4) / 4,
      max: Math.floor((range[1] / GRAMS_PER_OUNCE) * 4) / 4,
      step: 0.25,
      major: 4,
      toDisplay: (grams) => grams / GRAMS_PER_OUNCE,
      fromDisplay: (ounces) => ounces * GRAMS_PER_OUNCE,
      format: (ounces) => `${round(ounces, 2)} oz`,
    }
  }
  return { min: range[0], max: range[1], step: 5, major: 10, toDisplay: same, fromDisplay: same, format: (grams) => `${round(grams)} g` }
}

export function lengthScale(unit: Preferences['length'], range: readonly [number, number]): Scale {
  if (unit === 'in') {
    return {
      min: Math.ceil((range[0] / CM_PER_INCH) * 2) / 2,
      max: Math.floor((range[1] / CM_PER_INCH) * 2) / 2,
      step: 0.5,
      major: 4,
      toDisplay: (cm) => cm / CM_PER_INCH,
      fromDisplay: (inches) => inches * CM_PER_INCH,
      format: (inches) => `${round(inches, 1)}″`,
    }
  }
  return { min: range[0], max: range[1], step: 1, major: 5, toDisplay: same, fromDisplay: same, format: (cm) => `${round(cm)} cm` }
}

export function temperatureScale(unit: Preferences['temperature'], range: readonly [number, number]): Scale {
  if (unit === 'f') {
    return {
      min: Math.ceil(toFahrenheit(range[0])),
      max: Math.floor(toFahrenheit(range[1])),
      step: 1,
      major: 10,
      toDisplay: toFahrenheit,
      fromDisplay: toCelsius,
      format: (fahrenheit) => `${round(fahrenheit)}°F`,
    }
  }
  return { min: range[0], max: range[1], step: 0.5, major: 10, toDisplay: same, fromDisplay: same, format: (celsius) => `${round(celsius, 1)}°C` }
}

const OUNCES_PER_SQUARE_INCH = CM_PER_INCH ** 2 / GRAMS_PER_OUNCE

export function loadingScale(unit: Preferences['length'], range: readonly [number, number] = limits.loading): Scale {
  if (unit === 'in') {
    return {
      min: Math.ceil(range[0] * OUNCES_PER_SQUARE_INCH * 500) / 500,
      max: Math.floor(range[1] * OUNCES_PER_SQUARE_INCH * 500) / 500,
      step: 0.002,
      major: 5,
      toDisplay: (value) => value * OUNCES_PER_SQUARE_INCH,
      fromDisplay: (value) => value / OUNCES_PER_SQUARE_INCH,
      format: (value) => `${value.toFixed(3)} oz/in²`,
    }
  }
  return { min: range[0], max: range[1], step: 0.01, major: 5, toDisplay: same, fromDisplay: same, format: (value) => `${value.toFixed(2)} g/cm²` }
}

export const hoursScale = (range: readonly [number, number] = limits.stageHours): Scale => ({
  min: range[0],
  max: range[1],
  step: 0.5,
  major: 4,
  toDisplay: same,
  fromDisplay: same,
  format: formatDuration,
})

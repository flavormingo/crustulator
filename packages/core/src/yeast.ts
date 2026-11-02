import type { Margin, Preferment, Stage, StageStep, YeastType } from './types'

export const FRIDGE_LIMIT = 10

export const model = {
  ready: { base: 2.116, ceiling: 38.25, power: -0.56, decay: 0.17, floor: 3.25 },
  exponent: 1.389,
  reference: 0.1,
  warmup: { bulk: 4, balls: 1.8, pan: 1.2 } satisfies Record<StageStep, number>,
  step: 1 / 30,
  margins: { tight: 1, balanced: 1.5, relaxed: 2.25 } satisfies Record<Margin, number>,
  preferment: { scale: 1.3, decay: 0.23, reference: 21, biga: 0.5, growth: 2, max: 1 },
  starter: { intercept: 0.6014, slope: 5.368, bacteria: 0.5, norm: 0.54648, coldFloor: 0.35, coldReference: 15 },
  formula: { hydration: 65, salt: 2, fat: 2, min: 0.7, max: 2.5 },
}

export const yeastFactor: Record<Exclude<YeastType, 'sourdough'>, number> = {
  instant: 1,
  active: 1.3,
  fresh: 3,
}

export function hoursToReady(temp: number): number {
  const { base, ceiling, power, decay, floor } = model.ready
  const distance = Math.max(ceiling - Math.min(temp, 35), floor)
  return base * distance ** power * Math.exp(decay * distance)
}

function heatPenalty(temp: number): number {
  if (temp <= 40) return 1
  return Math.max(0, (55 - temp) / 15)
}

function yeastRate(temp: number): number {
  if (temp <= -2 || temp >= 55) return 0
  return heatPenalty(temp) / hoursToReady(temp)
}

function cultureRate(temp: number): number {
  const t = Math.min(temp, 35)
  const yeast = 0.0124 * (36 - t) ** 2.981 * Math.exp(-0.3355 * (36 - t))
  const bacteria = 0.1267 * (41 - t) ** 1.5404 * Math.exp(-0.1931 * (41 - t))
  return (heatPenalty(temp) * (yeast + model.starter.bacteria * bacteria)) / model.starter.norm
}

function starterRate(temp: number): number {
  if (temp <= -2 || temp >= 50) return 0
  const { coldFloor, coldReference } = model.starter
  const share = coldFloor + (1 - coldFloor) * (Math.min(Math.max(temp, 0), coldReference) / coldReference)
  return Math.max(cultureRate(temp), cultureRate(coldReference) * share)
}

export function fermentationRate(temp: number): number {
  return yeastRate(temp) / yeastRate(24)
}

export interface Activity {
  effective: number
  temp: number
}

export function simulate(stages: Stage[], startTemp: number, rate: (temp: number) => number = yeastRate): Activity {
  let temp = startTemp
  let effective = 0
  for (const stage of stages) {
    let remaining = Math.max(0, stage.hours)
    if (stage.temp <= temp) temp = stage.temp
    const lag = model.warmup[stage.step]
    while (remaining > 1e-9) {
      const hours = Math.min(model.step, remaining)
      const next = temp < stage.temp ? stage.temp + (temp - stage.temp) * Math.exp(-hours / lag) : stage.temp
      effective += rate((temp + next) / 2) * hours
      temp = next
      remaining -= hours
    }
  }
  return { effective, temp }
}

export interface FormulaInput {
  hydration: number
  salt: number
  oil: number
}

function formulaDrag({ hydration, salt, oil }: FormulaInput): number {
  const water = Math.max(hydration, 1) / 100
  const saltPerLiter = (salt * 10) / water
  const fatPerLiter = (oil * 10) / water
  const h = Math.min(Math.max(hydration, 45), 100)
  const hydrationTerm = 4.2 * h - 80 - 0.0305 * h * h
  return ((1 + saltPerLiter / 200) * (1 + fatPerLiter / 300)) / hydrationTerm
}

export function formulaModifier(input: FormulaInput): number {
  const { hydration, salt, fat, min, max } = model.formula
  const ratio = formulaDrag(input) / formulaDrag({ hydration, salt, oil: fat })
  return Math.min(max, Math.max(min, ratio))
}

export interface YeastOptions {
  margin?: Margin
  formula?: FormulaInput
}

function multiplier(options: YeastOptions, spread = 1): number {
  return model.margins[options.margin ?? 'balanced'] ** spread * (options.formula ? formulaModifier(options.formula) : 1)
}

export function instantYeastFor(stages: Stage[], startTemp: number, options: YeastOptions = {}): number {
  const { effective } = simulate(stages, startTemp)
  if (effective <= 0) return Number.POSITIVE_INFINITY
  return model.reference * effective ** -model.exponent * multiplier(options)
}

export function starterFor(stages: Stage[], startTemp: number, starterHydration: number, options: YeastOptions = {}): number {
  const { effective } = simulate(stages, startTemp, starterRate)
  const { intercept, slope } = model.starter
  const craig = Math.min(1, Math.exp(-(intercept + effective) / slope) * multiplier(options, 0.5))
  return (100 * craig) / (1 + craig / (1 + starterHydration / 100))
}

export interface PrefermentYeast {
  percent: number
  carry: number
}

export function prefermentYeastFor(preferment: Preferment): PrefermentYeast {
  const { scale, decay, reference, biga, growth, max } = model.preferment
  const speed = preferment.type === 'biga' ? biga : 1
  const hours = preferment.hours * (yeastRate(preferment.temp) / yeastRate(reference)) * speed
  const percent = Math.min(max, scale * Math.exp(-decay * hours))
  return { percent, carry: percent * growth }
}

export function convertYeast(instantPercent: number, type: Exclude<YeastType, 'sourdough'>): number {
  return instantPercent * yeastFactor[type]
}

export function toInstant(percent: number, type: Exclude<YeastType, 'sourdough'>): number {
  return percent / yeastFactor[type]
}

import type { Recipe, Shape, YeastType } from './types'
import { convertYeast, instantYeastFor, prefermentYeastFor, starterFor, toInstant, yeastFactor } from './yeast'

export type IngredientKey = 'flour' | 'water' | 'salt' | 'oil' | 'sugar' | 'yeast' | 'starter' | 'preferment'

export interface Line {
  key: IngredientKey
  grams: number
  percent: number
}

export interface Group {
  key: 'preferment' | 'dough'
  lines: Line[]
}

export type WarningCode =
  | 'yeast-heavy'
  | 'yeast-light'
  | 'starter-heavy'
  | 'starter-light'
  | 'starter-water'
  | 'preferment-water'
  | 'no-time'

export interface Dough {
  ball: number
  total: number
  flour: number
  water: number
  salt: number
  oil: number
  sugar: number
  yeast: number
  yeastPercent: number
  mixPercent: number
  instantPercent: number
  auto: boolean
  starter: { weight: number; flour: number; water: number } | null
  preferment: { flour: number; water: number; yeast: number; weight: number } | null
  groups: Group[]
  warnings: WarningCode[]
}

export const MAX_INSTANT = 3
export const MAX_STARTER = 60
export const MIN_STARTER = 1

export function yeastLimit(yeast: YeastType): number {
  return yeast === 'sourdough' ? MAX_STARTER : Math.ceil(MAX_INSTANT * yeastFactor[yeast] * 100) / 100
}
export const MAX_YEAST_WARNING = 1

export function area(shape: Shape): number {
  if (shape.kind === 'round') return Math.PI * (shape.diameter / 2) ** 2
  if (shape.kind === 'pan') return shape.width * shape.length
  return 0
}

export function ballWeight(recipe: Pick<Recipe, 'shape' | 'loading'>): number {
  const { shape, loading } = recipe
  return shape.kind === 'ball' ? shape.weight : area(shape) * loading
}

export function diameterFor(weight: number, loading: number): number {
  return 2 * Math.sqrt(weight / loading / Math.PI)
}

export function totalHours(recipe: Pick<Recipe, 'stages'>): number {
  return recipe.stages.reduce((sum, stage) => sum + Math.max(0, stage.hours), 0)
}

export function calculate(recipe: Recipe): Dough {
  const warnings: WarningCode[] = []
  const ball = ballWeight(recipe)
  const total = ball * recipe.count * (1 + recipe.residue / 100)
  const sourdough = recipe.yeast === 'sourdough'
  const commercial = recipe.yeast === 'sourdough' ? 'instant' : recipe.yeast
  const preferment = !sourdough && recipe.preferment.type !== 'none' ? recipe.preferment : null
  const hours = totalHours(recipe)
  const auto = recipe.yeastPercent === null
  const options = { margin: recipe.margin, formula: { hydration: recipe.hydration, salt: recipe.salt, oil: recipe.oil } }

  if (hours <= 0) warnings.push('no-time')

  let mainPercent = 0
  let mainInstant = 0
  let prefermentInstant = 0

  if (sourdough) {
    const starter = hours > 0 ? starterFor(recipe.stages, recipe.doughTemp, recipe.starterHydration, options) : MAX_STARTER
    mainPercent = auto ? Math.min(MAX_STARTER, starter) : (recipe.yeastPercent ?? 0)
    if (mainPercent > 35) warnings.push('starter-heavy')
    if (mainPercent < MIN_STARTER) warnings.push('starter-light')
  } else {
    const needed = hours > 0 ? instantYeastFor(recipe.stages, recipe.doughTemp, options) : MAX_INSTANT
    const prefermentYeast = preferment ? prefermentYeastFor(preferment) : null
    const share = preferment ? preferment.flour / 100 : 0
    prefermentInstant = prefermentYeast ? prefermentYeast.percent * share : 0
    const carried = prefermentYeast ? prefermentYeast.carry * share : 0
    mainInstant = auto ? Math.min(MAX_INSTANT, Math.max(0, needed - carried)) : toInstant(recipe.yeastPercent ?? 0, commercial)
    mainPercent = convertYeast(mainInstant, commercial)
    if (mainInstant >= MAX_YEAST_WARNING) warnings.push('yeast-heavy')
    if (!preferment && mainInstant > 0 && mainInstant < 0.01) warnings.push('yeast-light')
  }

  const prefermentPercent = convertYeast(prefermentInstant, commercial)
  const commercialPercent = sourdough ? 0 : mainPercent + prefermentPercent
  const sum = 100 + recipe.hydration + recipe.salt + recipe.oil + recipe.sugar + commercialPercent
  const flour = (total * 100) / sum
  const water = (flour * recipe.hydration) / 100
  const salt = (flour * recipe.salt) / 100
  const oil = (flour * recipe.oil) / 100
  const sugar = (flour * recipe.sugar) / 100
  const pct = (grams: number) => (flour > 0 ? (grams / flour) * 100 : 0)

  let starter: Dough['starter'] = null
  let prefermentAmounts: Dough['preferment'] = null
  let mixFlour = flour
  let mixWater = water
  const mainYeast = sourdough ? 0 : (flour * mainPercent) / 100

  if (sourdough) {
    const weight = (flour * mainPercent) / 100
    const starterFlour = (weight * 100) / (100 + recipe.starterHydration)
    let starterWater = weight - starterFlour
    if (starterWater > water) {
      warnings.push('starter-water')
      starterWater = water
    }
    starter = { weight: starterFlour + starterWater, flour: starterFlour, water: starterWater }
    mixFlour = Math.max(0, flour - starterFlour)
    mixWater = Math.max(0, water - starterWater)
  }

  if (preferment) {
    const prefFlour = (flour * preferment.flour) / 100
    let prefWater = (prefFlour * preferment.hydration) / 100
    if (prefWater > water) {
      warnings.push('preferment-water')
      prefWater = water
    }
    const prefYeast = (flour * prefermentPercent) / 100
    prefermentAmounts = { flour: prefFlour, water: prefWater, yeast: prefYeast, weight: prefFlour + prefWater + prefYeast }
    mixFlour = Math.max(0, flour - prefFlour)
    mixWater = Math.max(0, water - prefWater)
  }

  const yeast = sourdough ? 0 : mainYeast + (prefermentAmounts?.yeast ?? 0)
  const groups: Group[] = []

  if (prefermentAmounts) {
    groups.push({
      key: 'preferment',
      lines: [
        { key: 'flour', grams: prefermentAmounts.flour, percent: pct(prefermentAmounts.flour) },
        { key: 'water', grams: prefermentAmounts.water, percent: pct(prefermentAmounts.water) },
        { key: 'yeast', grams: prefermentAmounts.yeast, percent: pct(prefermentAmounts.yeast) },
      ],
    })
  }

  const doughLines: Line[] = []
  if (prefermentAmounts) doughLines.push({ key: 'preferment', grams: prefermentAmounts.weight, percent: pct(prefermentAmounts.weight) })
  if (starter) doughLines.push({ key: 'starter', grams: starter.weight, percent: pct(starter.weight) })
  doughLines.push({ key: 'flour', grams: mixFlour, percent: pct(mixFlour) })
  doughLines.push({ key: 'water', grams: mixWater, percent: pct(mixWater) })
  doughLines.push({ key: 'salt', grams: salt, percent: recipe.salt })
  if (recipe.oil > 0) doughLines.push({ key: 'oil', grams: oil, percent: recipe.oil })
  if (recipe.sugar > 0) doughLines.push({ key: 'sugar', grams: sugar, percent: recipe.sugar })
  if (!sourdough && (mainYeast > 0 || !prefermentAmounts)) doughLines.push({ key: 'yeast', grams: mainYeast, percent: pct(mainYeast) })
  groups.push({ key: 'dough', lines: doughLines })

  return {
    ball,
    total,
    flour,
    water,
    salt,
    oil,
    sugar,
    yeast,
    yeastPercent: sourdough ? mainPercent : pct(yeast),
    mixPercent: mainPercent,
    instantPercent: sourdough ? 0 : mainInstant + prefermentInstant,
    auto,
    starter,
    preferment: prefermentAmounts,
    groups,
    warnings,
  }
}

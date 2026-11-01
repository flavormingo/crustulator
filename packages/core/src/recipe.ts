import { ballWeight, diameterFor } from './dough'
import { defaultStyle, getStyle, styleIds } from './styles'
import type { Margin, Preferment, PrefermentType, Recipe, Shape, Stage, StageStep, StyleId, YeastType } from './types'

export const limits = {
  count: [1, 99],
  weight: [60, 3000],
  diameter: [10, 60],
  side: [10, 80],
  loading: [0.1, 1.5],
  hydration: [40, 110],
  salt: [0, 5],
  oil: [0, 25],
  sugar: [0, 10],
  yeastPercent: [0, 50],
  starterHydration: [40, 200],
  prefermentFlour: [5, 100],
  prefermentHydration: [40, 150],
  prefermentHours: [1, 72],
  temp: [1, 40],
  stageHours: [0, 240],
  residue: [0, 10],
  doughTemp: [10, 35],
  stages: [1, 6],
} as const satisfies Record<string, readonly [number, number]>

export type Limit = keyof typeof limits

const yeastTypes: YeastType[] = ['instant', 'active', 'fresh', 'sourdough']
const prefermentTypes: PrefermentType[] = ['none', 'poolish', 'biga']
const margins: Margin[] = ['tight', 'balanced', 'relaxed']
const steps: StageStep[] = ['bulk', 'balls', 'pan']

export function clamp(value: number, [min, max]: readonly [number, number]): number {
  return Math.min(max, Math.max(min, value))
}

function number(value: unknown, fallback: number, range: readonly [number, number]): number {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, range) : fallback
}

function pick<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

export function defaultRecipe(style: StyleId = defaultStyle): Recipe {
  return structuredCloneRecipe(getStyle(style).recipe)
}

export function structuredCloneRecipe(recipe: Recipe): Recipe {
  return {
    ...recipe,
    shape: { ...recipe.shape },
    preferment: { ...recipe.preferment },
    stages: recipe.stages.map((stage) => ({ ...stage })),
  }
}

function normalizeShape(value: unknown, fallback: Shape): Shape {
  const shape = record(value)
  if (shape.kind === 'ball') {
    return { kind: 'ball', weight: number(shape.weight, fallback.kind === 'ball' ? fallback.weight : 250, limits.weight) }
  }
  if (shape.kind === 'round') {
    return { kind: 'round', diameter: number(shape.diameter, fallback.kind === 'round' ? fallback.diameter : 30, limits.diameter) }
  }
  if (shape.kind === 'pan') {
    return {
      kind: 'pan',
      width: number(shape.width, fallback.kind === 'pan' ? fallback.width : 25, limits.side),
      length: number(shape.length, fallback.kind === 'pan' ? fallback.length : 35, limits.side),
    }
  }
  return { ...fallback }
}

function normalizeStage(value: unknown): Stage | null {
  const stage = record(value)
  if (typeof stage.hours !== 'number' || typeof stage.temp !== 'number') return null
  return {
    step: pick(stage.step, steps, 'bulk'),
    hours: number(stage.hours, 1, limits.stageHours),
    temp: number(stage.temp, 22, limits.temp),
  }
}

function normalizePreferment(value: unknown, fallback: Preferment): Preferment {
  const preferment = record(value)
  return {
    type: pick(preferment.type, prefermentTypes, fallback.type),
    flour: number(preferment.flour, fallback.flour, limits.prefermentFlour),
    hydration: number(preferment.hydration, fallback.hydration, limits.prefermentHydration),
    hours: number(preferment.hours, fallback.hours, limits.prefermentHours),
    temp: number(preferment.temp, fallback.temp, limits.temp),
  }
}

export function normalizeRecipe(value: unknown): Recipe {
  const input = record(value)
  const style = pick(input.style, styleIds, defaultStyle)
  const base = defaultRecipe(style)
  const stages = Array.isArray(input.stages)
    ? input.stages.map(normalizeStage).filter((stage): stage is Stage => stage !== null).slice(0, limits.stages[1])
    : []
  const yeast = pick(input.yeast, yeastTypes, base.yeast)
  const preferment = normalizePreferment(input.preferment, base.preferment)
  return {
    style,
    count: Math.round(number(input.count, base.count, limits.count)),
    shape: normalizeShape(input.shape, base.shape),
    loading: number(input.loading, base.loading, limits.loading),
    hydration: number(input.hydration, base.hydration, limits.hydration),
    salt: number(input.salt, base.salt, limits.salt),
    oil: number(input.oil, base.oil, limits.oil),
    sugar: number(input.sugar, base.sugar, limits.sugar),
    yeast,
    yeastPercent: input.yeastPercent === null || input.yeastPercent === undefined
      ? null
      : number(input.yeastPercent, 0, limits.yeastPercent),
    margin: pick(input.margin, margins, base.margin),
    starterHydration: number(input.starterHydration, base.starterHydration, limits.starterHydration),
    preferment: yeast === 'sourdough' ? { ...preferment, type: 'none' } : preferment,
    stages: stages.length ? stages : base.stages,
    residue: number(input.residue, base.residue, limits.residue),
    doughTemp: number(input.doughTemp, base.doughTemp, limits.doughTemp),
  }
}

export function applyStyle(current: Recipe, style: StyleId): Recipe {
  const next = defaultRecipe(style)
  next.yeast = current.yeast
  next.margin = current.margin
  if (current.yeast === 'sourdough') next.preferment = { ...next.preferment, type: 'none' }
  return next
}

export function setShapeKind(recipe: Recipe, kind: Shape['kind']): Recipe {
  if (recipe.shape.kind === kind) return recipe
  const weight = ballWeight(recipe)
  if (kind === 'ball') {
    return { ...recipe, shape: { kind, weight: clamp(Math.round(weight), limits.weight) } }
  }
  if (kind === 'round') {
    return { ...recipe, shape: { kind, diameter: clamp(Math.round(diameterFor(weight, recipe.loading)), limits.diameter) } }
  }
  const area = weight / recipe.loading
  const width = Math.sqrt((area * 3) / 4)
  return {
    ...recipe,
    shape: { kind, width: clamp(Math.round(width), limits.side), length: clamp(Math.round(area / width), limits.side) },
  }
}

export function setYeast(recipe: Recipe, yeast: YeastType): Recipe {
  return {
    ...recipe,
    yeast,
    yeastPercent: null,
    preferment: yeast === 'sourdough' ? { ...recipe.preferment, type: 'none' } : recipe.preferment,
  }
}

export function setPrefermentType(recipe: Recipe, type: PrefermentType): Recipe {
  const defaults: Record<PrefermentType, Partial<Preferment>> = {
    none: {},
    poolish: { hydration: 100, flour: 30, hours: 16, temp: 20 },
    biga: { hydration: 45, flour: 50, hours: 18, temp: 18 },
  }
  const yeast = type !== 'none' && recipe.yeast === 'sourdough' ? 'active' : recipe.yeast
  return {
    ...recipe,
    yeast,
    yeastPercent: null,
    preferment: { ...recipe.preferment, ...defaults[type], type },
  }
}

export interface SchedulePreset {
  id: 'same-day' | 'overnight' | 'counter-24' | 'fridge-48' | 'fridge-72'
  name: string
  hint: string
  stages: Stage[]
}

export const schedulePresets: SchedulePreset[] = [
  {
    id: 'same-day',
    name: 'Same day',
    hint: 'About 6 hours on the counter',
    stages: [
      { step: 'bulk', hours: 2, temp: 24 },
      { step: 'balls', hours: 4, temp: 24 },
    ],
  },
  {
    id: 'overnight',
    name: 'Overnight',
    hint: 'Mix tonight and bake tomorrow',
    stages: [
      { step: 'bulk', hours: 1, temp: 22 },
      { step: 'balls', hours: 14, temp: 4 },
      { step: 'balls', hours: 3, temp: 22 },
    ],
  },
  {
    id: 'counter-24',
    name: '24 hours',
    hint: 'A slow day on a cool counter',
    stages: [
      { step: 'bulk', hours: 2, temp: 20 },
      { step: 'balls', hours: 22, temp: 20 },
    ],
  },
  {
    id: 'fridge-48',
    name: '2 days cold',
    hint: 'Deeper flavor from the fridge',
    stages: [
      { step: 'bulk', hours: 1, temp: 22 },
      { step: 'balls', hours: 44, temp: 4 },
      { step: 'balls', hours: 3, temp: 22 },
    ],
  },
  {
    id: 'fridge-72',
    name: '3 days cold',
    hint: 'Maximum flavor for planners',
    stages: [
      { step: 'bulk', hours: 1, temp: 22 },
      { step: 'balls', hours: 68, temp: 4 },
      { step: 'balls', hours: 3, temp: 22 },
    ],
  },
]

export function isPanStyle(recipe: Recipe): boolean {
  return getStyle(recipe.style).recipe.stages.some((stage) => stage.step === 'pan')
}

export function applySchedule(recipe: Recipe, id: SchedulePreset['id']): Recipe {
  const preset = schedulePresets.find((item) => item.id === id)
  if (!preset) return recipe
  const pan = isPanStyle(recipe)
  const stages = preset.stages.map((stage, index, all) => ({
    ...stage,
    step: pan && stage.step === 'balls' ? (index === all.length - 1 ? 'pan' : 'bulk') : stage.step,
  })) as Stage[]
  return { ...recipe, stages, yeastPercent: null }
}

export function matchSchedule(recipe: Recipe): SchedulePreset['id'] | null {
  const pan = isPanStyle(recipe)
  for (const preset of schedulePresets) {
    const candidate = applySchedule({ ...recipe, stages: [] }, preset.id).stages
    if (
      candidate.length === recipe.stages.length &&
      candidate.every((stage, index) => {
        const other = recipe.stages[index]
        return other && other.hours === stage.hours && other.temp === stage.temp && (pan || other.step === stage.step)
      })
    ) {
      return preset.id
    }
  }
  return null
}

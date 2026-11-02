import { totalHours, type Dough } from './dough'
import type { Oven, Preferences, Recipe, Stage } from './types'
import { formatDuration, formatOvenRange, formatOvenTemperature, formatTemperature, formatWeight } from './units'
import { waterTemperature } from './water'
import { FRIDGE_LIMIT } from './yeast'

export const HOUR = 3_600_000
export const MINUTE = 60_000

export type EventKind = 'preferment' | 'mix' | 'divide' | 'pan' | 'fridge' | 'counter' | 'rest' | 'preheat' | 'bake'

export interface PlanEvent {
  kind: EventKind
  at: number
  stage: Stage | null
}

export type Anchor = { bake: number } | { start: number }

export const isCold = (temp: number) => temp <= FRIDGE_LIMIT

export function hasPreferment(recipe: Pick<Recipe, 'yeast' | 'preferment'>): boolean {
  return recipe.yeast !== 'sourdough' && recipe.preferment.type !== 'none'
}

export function planHours(recipe: Recipe): number {
  return (hasPreferment(recipe) ? recipe.preferment.hours : 0) + totalHours(recipe)
}

function kindFor(previous: Stage | undefined, stage: Stage): EventKind {
  if (!previous) return 'mix'
  if (stage.step !== previous.step) return stage.step === 'pan' ? 'pan' : 'divide'
  if (isCold(stage.temp) && !isCold(previous.temp)) return 'fridge'
  if (!isCold(stage.temp) && isCold(previous.temp)) return 'counter'
  return 'rest'
}

export function buildPlan(recipe: Recipe, oven: Oven, anchor: Anchor): PlanEvent[] {
  const length = planHours(recipe) * HOUR
  const start = 'start' in anchor ? anchor.start : anchor.bake - length
  const bake = start + length
  const events: PlanEvent[] = []
  let cursor = start
  if (hasPreferment(recipe)) {
    events.push({ kind: 'preferment', at: cursor, stage: null })
    cursor += recipe.preferment.hours * HOUR
  }
  const resting = recipe.stages.filter((stage) => stage.hours > 0)
  if (resting.length === 0) {
    events.push({ kind: 'mix', at: cursor, stage: null })
  } else {
    resting.forEach((stage, index) => {
      events.push({ kind: kindFor(resting[index - 1], stage), at: cursor, stage })
      cursor += stage.hours * HOUR
    })
  }
  events.push({ kind: 'preheat', at: Math.max(bake - oven.preheat * MINUTE, cursor === start ? start : start + 1), stage: null })
  events.push({ kind: 'bake', at: bake, stage: null })
  return events.sort((a, b) => a.at - b.at || order(a.kind) - order(b.kind))
}

function order(kind: EventKind): number {
  return kind === 'preheat' ? 1 : kind === 'bake' ? 2 : 0
}

export interface EventContext {
  recipe: Recipe
  dough: Dough
  oven: Oven
  preferences: Preferences
}

export interface EventCopy {
  title: string
  detail: string
}

export function mixWaterTemperature(recipe: Recipe): number {
  const room = recipe.stages.find((stage) => !isCold(stage.temp))?.temp ?? 22
  return Math.min(45, Math.max(1, waterTemperature({ doughTemp: recipe.doughTemp, flourTemp: room, roomTemp: room, method: 'hand' })))
}

function place(stage: Stage, preferences: Preferences): string {
  return isCold(stage.temp)
    ? 'in the fridge'
    : `on the counter at about ${formatTemperature(stage.temp, preferences.temperature)}`
}

export function describeEvent(event: PlanEvent, context: EventContext): EventCopy {
  const { recipe, dough, oven, preferences } = context
  const weight = (grams: number) => formatWeight(grams, preferences.weight)
  const stage = event.stage
  const count = recipe.count
  const pieces = recipe.shape.kind === 'pan' || stage?.step === 'pan' ? (count === 1 ? 'pan' : 'pans') : count === 1 ? 'ball' : 'balls'
  const rest = stage ? `${place(stage, preferences)} for ${formatDuration(stage.hours)}` : ''

  switch (event.kind) {
    case 'preferment': {
      const name = recipe.preferment.type === 'biga' ? 'biga' : 'poolish'
      const amounts = dough.preferment
      return {
        title: `Mix the ${name}`,
        detail: amounts
          ? `Combine ${weight(amounts.flour)} flour, ${weight(amounts.water)} water and ${weight(amounts.yeast)} yeast. Cover and leave it at about ${formatTemperature(recipe.preferment.temp, preferences.temperature)} for ${formatDuration(recipe.preferment.hours)}.`
          : `Cover and leave it for ${formatDuration(recipe.preferment.hours)}.`,
      }
    }
    case 'mix': {
      const water = `Mixing by hand, start with water at about ${formatTemperature(mixWaterTemperature(recipe), preferences.temperature)}.`
      const knead = !stage
        ? `Knead until smooth, then shape ${count} ${pieces} of ${weight(dough.ball)}. Give the dough some resting time for a better crust.`
        : stage.step === 'balls'
          ? `Knead until smooth, shape ${count} ${pieces} of ${weight(dough.ball)} and rest them ${rest}.`
          : stage.step === 'pan'
            ? `Knead until smooth, press into ${count} oiled ${pieces} and proof ${rest}.`
            : `Knead until smooth and elastic. Let it rise in one piece ${rest}.`
      return { title: 'Mix the dough', detail: `${water} ${knead}` }
    }
    case 'divide':
      return {
        title: stage && isCold(stage.temp) ? 'Ball it and chill' : 'Divide and ball',
        detail: `Shape ${count} ${pieces} of ${weight(dough.ball)}. Cover and rest ${rest}.`,
      }
    case 'pan':
      return {
        title: 'Into the pan',
        detail: `Oil ${count === 1 ? 'the pan' : `${count} pans`}, stretch the dough to the corners and proof ${rest}.`,
      }
    case 'fridge':
      return {
        title: 'Into the fridge',
        detail: `Cover tightly and let the cold do the work for ${stage ? formatDuration(stage.hours) : 'a while'}.`,
      }
    case 'counter':
      return {
        title: 'Out of the fridge',
        detail: `Let the dough wake up ${rest}. It should look puffy and feel soft.`,
      }
    case 'rest':
      return {
        title: 'Keep resting',
        detail: `Leave it be ${rest}.`,
      }
    case 'preheat':
      return {
        title: 'Preheat the oven',
        detail: `Crank it to ${formatOvenTemperature(oven.temp[1], preferences.temperature)} so the stone or steel gets properly hot.`,
      }
    case 'bake':
      return {
        title: 'Bake',
        detail: `${bakeTime(oven)} at ${formatOvenRange(oven.temp, preferences.temperature)}. Then do a little jig.`,
      }
  }
}

export function bakeTime(oven: Oven): string {
  const [low, high] = oven.minutes
  if (high < 3) return `${Math.round(low * 60)}–${Math.round(high * 60)} seconds`
  return `${low}–${high} minutes`
}

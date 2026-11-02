import type { Dough, IngredientKey, WarningCode } from './dough'
import { isCold, planHours } from './schedule'
import { getStyle } from './styles'
import type { Margin, Preferences, PrefermentType, Recipe, SaltType, Shape, Stage, StageStep, YeastType } from './types'
import { formatDuration, formatTemperature, formatTotalWeight, formatWeight } from './units'

export const yeastNames: Record<YeastType, string> = {
  instant: 'Instant dry',
  active: 'Active dry',
  fresh: 'Fresh',
  sourdough: 'Sourdough',
}

export const yeastLongNames: Record<YeastType, string> = {
  instant: 'Instant dry yeast',
  active: 'Active dry yeast',
  fresh: 'Fresh yeast',
  sourdough: 'Sourdough starter',
}

export const prefermentNames: Record<PrefermentType, string> = {
  none: 'None',
  poolish: 'Poolish',
  biga: 'Biga',
}

export const prefermentHints: Record<PrefermentType, string> = {
  none: 'Everything goes in at once.',
  poolish: 'A wet preferment for an open, crackly crumb.',
  biga: 'A stiff preferment for structure and depth.',
}

export const marginNames: Record<Margin, string> = {
  tight: 'Just in time',
  balanced: 'A bit early',
  relaxed: 'Well ahead',
}

export const marginHints: Record<Margin, string> = {
  tight: 'The least yeast that gets there by bake time. Best flavor with no wiggle room.',
  balanced: 'A little extra yeast so the dough is ready with time to spare.',
  relaxed: 'Plenty of yeast for cool kitchens, sleepy starters or runaway schedules.',
}

export const stepNames: Record<StageStep, string> = {
  bulk: 'Bulk',
  balls: 'Balls',
  pan: 'Pan',
}

export function stageTitle(stage: Stage): string {
  return stage.step === 'pan' ? 'In the pan' : stepNames[stage.step]
}

export function stagePlace(stage: Stage, preferences: Preferences): string {
  const where = isCold(stage.temp) ? 'in the fridge' : 'on the counter'
  return `${where} at ${formatTemperature(stage.temp, preferences.temperature)}`
}


export const saltNames: Record<SaltType, string> = {
  fine: 'Fine sea salt',
  table: 'Table salt',
  diamond: 'Diamond Crystal kosher',
  morton: 'Morton kosher',
}

export function ingredientName(key: IngredientKey, recipe: Pick<Recipe, 'yeast' | 'preferment'>): string {
  switch (key) {
    case 'flour':
      return 'Flour'
    case 'water':
      return 'Water'
    case 'salt':
      return 'Salt'
    case 'oil':
      return 'Olive oil'
    case 'sugar':
      return 'Sugar'
    case 'yeast':
      return yeastLongNames[recipe.yeast === 'sourdough' ? 'instant' : recipe.yeast]
    case 'starter':
      return 'Starter'
    case 'preferment':
      return prefermentNames[recipe.preferment.type === 'biga' ? 'biga' : 'poolish']
  }
}

export function shortIngredientName(key: IngredientKey, recipe: Pick<Recipe, 'yeast' | 'preferment'>): string {
  if (key === 'yeast') return 'Yeast'
  if (key === 'oil') return 'Oil'
  return ingredientName(key, recipe)
}

export const warningCopy: Record<WarningCode, string> = {
  'yeast-heavy': 'That is a lot of yeast. A longer schedule tastes better.',
  'yeast-light': 'That is a tiny amount of yeast. Dissolve 1 g in 100 g of water and weigh out the solution instead.',
  'starter-heavy': 'Sourdough needs more time than this. Try a longer schedule.',
  'starter-light': 'That is barely any starter. A shorter or cooler schedule gives you something you can weigh.',
  'starter-water': 'The starter brings more water than this hydration allows.',
  'preferment-water': 'The preferment needs more water than this hydration allows.',
  'no-time': 'Give the dough some time to rise.',
}

export interface Vibe {
  label: string
  note: string
}

export function hydrationVibe(hydration: number): Vibe {
  if (hydration < 55) return { label: 'Stiff', note: 'Rolls out thin and bakes up crackly.' }
  if (hydration < 61) return { label: 'Classic', note: 'Easy to handle with a tender chew.' }
  if (hydration < 66) return { label: 'Supple', note: 'Soft and stretchy with a bit more air.' }
  if (hydration < 71) return { label: 'Jiggly', note: 'Open and bubbly. Wet hands help.' }
  if (hydration < 78) return { label: 'Wobbly', note: 'Airy and sticky. Coil folds are your friend.' }
  return { label: 'Cloud', note: 'Pan pizza territory. Handle with care.' }
}

export function pieceName(recipe: Pick<Recipe, 'shape' | 'count'>, count = recipe.count): string {
  if (recipe.shape.kind === 'pan') return count === 1 ? 'pan' : 'pans'
  return count === 1 ? 'pizza' : 'pizzas'
}

export function recipeTitle(recipe: Recipe): string {
  return `${getStyle(recipe.style).name} for ${recipe.count} ${pieceName(recipe)}`
}

export function summaryText(recipe: Recipe, dough: Dough, preferences: Preferences, name?: string | null): string {
  const lines = [name?.trim() || recipeTitle(recipe), '']
  for (const group of dough.groups) {
    if (dough.groups.length > 1) {
      lines.push(group.key === 'preferment' ? `${prefermentNames[recipe.preferment.type]} (${formatDuration(recipe.preferment.hours)} ahead)` : 'Final dough')
    }
    for (const line of group.lines) {
      lines.push(`${ingredientName(line.key, recipe)}: ${formatWeight(line.grams, preferences.weight)}`)
    }
    if (dough.groups.length > 1) lines.push('')
  }
  if (dough.groups.length === 1) lines.push('')
  lines.push(`Total: ${formatTotalWeight(dough.total, preferences.weight)} over ${formatDuration(planHours(recipe))}`)
  return lines.join('\n')
}

export function patienceVibe(hours: number): Vibe {
  if (hours < 8) return { label: 'Speedy', note: 'Pizza tonight.' }
  if (hours < 20) return { label: 'Relaxed', note: 'Mix today and bake tomorrow.' }
  if (hours < 40) return { label: 'Patient', note: 'A full day of flavor building.' }
  return { label: 'Zen', note: 'Deep flavor for the planners.' }
}

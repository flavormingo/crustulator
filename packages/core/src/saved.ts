import { normalizeRecipe } from './recipe'
import type { Preferences, Recipe, SaltType } from './types'

export interface SavedRecipe {
  id: string
  name: string
  recipe: Recipe
  notes: string
  rating: number
  created: number
  updated: number
}

const saltTypes: SaltType[] = ['fine', 'table', 'diamond', 'morton']

export function makeId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function createSaved(name: string, recipe: Recipe, now = Date.now()): SavedRecipe {
  return { id: makeId(), name: name.trim() || 'Untitled dough', recipe, notes: '', rating: 0, created: now, updated: now }
}

export function parseSaved(value: unknown): SavedRecipe[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string') return []
    const now = Date.now()
    return [{
      id: item.id,
      name: typeof item.name === 'string' && item.name.trim() ? item.name : 'Untitled dough',
      recipe: normalizeRecipe(item.recipe),
      notes: typeof item.notes === 'string' ? item.notes : '',
      rating: typeof item.rating === 'number' ? Math.max(0, Math.min(5, Math.round(item.rating))) : 0,
      created: typeof item.created === 'number' ? item.created : now,
      updated: typeof item.updated === 'number' ? item.updated : now,
    }]
  })
}

export function parsePreferences(value: unknown, fallback: Preferences): Preferences {
  const input = (value && typeof value === 'object' ? value : {}) as Partial<Preferences>
  return {
    weight: input.weight === 'oz' || input.weight === 'g' ? input.weight : fallback.weight,
    temperature: input.temperature === 'f' || input.temperature === 'c' ? input.temperature : fallback.temperature,
    length: input.length === 'in' || input.length === 'cm' ? input.length : fallback.length,
    salt: saltTypes.includes(input.salt as SaltType) ? (input.salt as SaltType) : fallback.salt,
  }
}

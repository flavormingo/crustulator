import {
  calculate,
  createSaved,
  nextBake,
  normalizeRecipe,
  parsePreferences,
  parseSaved,
  planHours,
  preferencesFor,
  type Dough,
  type Preferences,
  type Recipe,
  type SavedRecipe,
} from '@crustulator/core'
import { getLocales } from 'expo-localization'
import { createContext, use, useEffect, useState, type ReactNode } from 'react'

import { readJson, writeJson } from './storage'

export type { SavedRecipe }

export interface Plan {
  bake: number
  reminders: boolean
  done: number[]
}

export interface Settings {
  haptics: boolean
}

interface Store {
  recipe: Recipe
  dough: Dough
  setRecipe: (next: Recipe | ((current: Recipe) => Recipe)) => void
  preferences: Preferences
  setPreferences: (patch: Partial<Preferences>) => void
  saved: SavedRecipe[]
  saveRecipe: (name: string, recipe?: Recipe) => SavedRecipe
  updateSaved: (id: string, patch: Partial<Omit<SavedRecipe, 'id' | 'created'>>) => void
  removeSaved: (id: string) => void
  plan: Plan
  setPlan: (patch: Partial<Plan>) => void
  settings: Settings
  setSettings: (patch: Partial<Settings>) => void
}

const StoreContext = createContext<Store | null>(null)

const regionalPreferences = () => preferencesFor(getLocales()[0]?.regionCode)

function parsePlan(value: unknown, recipe: Recipe): Plan {
  const input = (value && typeof value === 'object' ? value : {}) as Partial<Plan>
  return {
    bake: typeof input.bake === 'number' ? input.bake : nextBake(planHours(recipe)),
    reminders: input.reminders === true,
    done: Array.isArray(input.done) ? input.done.filter((item): item is number => typeof item === 'number') : [],
  }
}

function parseSettings(value: unknown): Settings {
  const input = (value && typeof value === 'object' ? value : {}) as Partial<Settings>
  return { haptics: input.haptics !== false }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [recipe, setRecipeState] = useState<Recipe>(() => readJson('recipe', normalizeRecipe, normalizeRecipe(null)))
  const [preferences, setPreferencesState] = useState<Preferences>(() =>
    readJson('preferences', (value) => parsePreferences(value, regionalPreferences()), regionalPreferences()),
  )
  const [saved, setSaved] = useState<SavedRecipe[]>(() => readJson('saved', parseSaved, []))
  const [plan, setPlanState] = useState<Plan>(() => readJson('plan', (value) => parsePlan(value, recipe), parsePlan(null, recipe)))
  const [settings, setSettingsState] = useState<Settings>(() => readJson('settings', parseSettings, parseSettings(null)))

  useEffect(() => writeJson('recipe', recipe, 400), [recipe])
  useEffect(() => writeJson('preferences', preferences), [preferences])
  useEffect(() => writeJson('saved', saved), [saved])
  useEffect(() => writeJson('plan', plan), [plan])
  useEffect(() => writeJson('settings', settings), [settings])

  const dough = calculate(recipe)

  const store: Store = {
    recipe,
    dough,
    setRecipe: (next) => setRecipeState((current) => (typeof next === 'function' ? next(current) : next)),
    preferences,
    setPreferences: (patch) => setPreferencesState((current) => ({ ...current, ...patch })),
    saved,
    saveRecipe: (name, source = recipe) => {
      const entry = createSaved(name, source)
      setSaved((current) => [entry, ...current])
      return entry
    },
    updateSaved: (id, patch) =>
      setSaved((current) => current.map((item) => (item.id === id ? { ...item, ...patch, updated: Date.now() } : item))),
    removeSaved: (id) => setSaved((current) => current.filter((item) => item.id !== id)),
    plan,
    setPlan: (patch) => setPlanState((current) => ({ ...current, ...patch })),
    settings,
    setSettings: (patch) => setSettingsState((current) => ({ ...current, ...patch })),
  }

  return <StoreContext value={store}>{children}</StoreContext>
}

export function useStore(): Store {
  const store = use(StoreContext)
  if (!store) throw new Error('useStore must be used inside StoreProvider')
  return store
}

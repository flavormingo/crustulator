export type StyleId =
  | 'neapolitan'
  | 'contemporary'
  | 'new-york'
  | 'new-haven'
  | 'detroit'
  | 'sicilian'
  | 'grandma'
  | 'roman-teglia'
  | 'roman-tonda'
  | 'tavern'
  | 'deep-dish'
  | 'cast-iron'

export type YeastType = 'instant' | 'active' | 'fresh' | 'sourdough'

export type PrefermentType = 'none' | 'poolish' | 'biga'

export type Margin = 'tight' | 'balanced' | 'relaxed'

export type StageStep = 'bulk' | 'balls' | 'pan'

export type Shape =
  | { kind: 'ball'; weight: number }
  | { kind: 'round'; diameter: number }
  | { kind: 'pan'; width: number; length: number }

export interface Stage {
  step: StageStep
  hours: number
  temp: number
}

export interface Preferment {
  type: PrefermentType
  flour: number
  hydration: number
  hours: number
  temp: number
}

export interface Recipe {
  style: StyleId
  count: number
  shape: Shape
  loading: number
  hydration: number
  salt: number
  oil: number
  sugar: number
  yeast: YeastType
  yeastPercent: number | null
  margin: Margin
  starterHydration: number
  preferment: Preferment
  stages: Stage[]
  residue: number
  doughTemp: number
}

export interface Preferences {
  weight: 'g' | 'oz'
  temperature: 'c' | 'f'
  length: 'cm' | 'in'
  salt: SaltType
}

export type SaltType = 'fine' | 'table' | 'diamond' | 'morton'

export interface Oven {
  name: string
  temp: [number, number]
  minutes: [number, number]
  preheat: number
}

export interface Style {
  id: StyleId
  name: string
  short: string
  origin: string
  tagline: string
  description: string
  flour: string
  oven: Oven
  recipe: Recipe
  tips: string[]
}

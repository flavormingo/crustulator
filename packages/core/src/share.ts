import { normalizeRecipe } from './recipe'
import type { Recipe, StageStep } from './types'

export const SHARE_ORIGIN = 'https://crustulator.com'
export const SHARE_PATH = '/r'

export interface SharedRecipe {
  recipe: Recipe
  name: string | null
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const stepCodes: Record<StageStep, string> = { bulk: 'b', balls: 'd', pan: 'p' }
const stepNames: Record<string, StageStep> = { b: 'bulk', d: 'balls', p: 'pan' }

const trim = (value: number) => Math.round(value * 1000) / 1000

export function toBase64Url(bytes: Uint8Array): string {
  let output = ''
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] ?? 0
    const b = bytes[index + 1]
    const c = bytes[index + 2]
    const triple = (a << 16) | ((b ?? 0) << 8) | (c ?? 0)
    output += alphabet[(triple >> 18) & 63]
    output += alphabet[(triple >> 12) & 63]
    if (b !== undefined) output += alphabet[(triple >> 6) & 63]
    if (c !== undefined) output += alphabet[triple & 63]
  }
  return output
}

export function fromBase64Url(text: string): Uint8Array | null {
  const values = [...text.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')].map((char) => alphabet.indexOf(char))
  if (values.some((value) => value < 0) || values.length % 4 === 1) return null
  const bytes: number[] = []
  for (let index = 0; index < values.length; index += 4) {
    const [a = 0, b = 0, c, d] = values.slice(index, index + 4)
    const triple = (a << 18) | (b << 12) | ((c ?? 0) << 6) | (d ?? 0)
    bytes.push((triple >> 16) & 255)
    if (c !== undefined) bytes.push((triple >> 8) & 255)
    if (d !== undefined) bytes.push(triple & 255)
  }
  return new Uint8Array(bytes)
}

export function pack(recipe: Recipe, name?: string | null): unknown {
  const { shape, preferment } = recipe
  return {
    v: 1,
    s: recipe.style,
    n: recipe.count,
    k: shape.kind === 'ball' ? [0, trim(shape.weight)] : shape.kind === 'round' ? [1, trim(shape.diameter)] : [2, trim(shape.width), trim(shape.length)],
    l: trim(recipe.loading),
    f: [recipe.hydration, recipe.salt, recipe.oil, recipe.sugar].map(trim),
    y: [recipe.yeast, recipe.yeastPercent === null ? null : trim(recipe.yeastPercent), trim(recipe.starterHydration), recipe.margin],
    p: [preferment.type, preferment.flour, preferment.hydration, preferment.hours, preferment.temp].map((value) => typeof value === 'number' ? trim(value) : value),
    t: recipe.stages.map((stage) => [stepCodes[stage.step], trim(stage.hours), trim(stage.temp)]),
    r: [trim(recipe.residue), trim(recipe.doughTemp)],
    ...(name ? { m: name.slice(0, 80) } : {}),
  }
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function unpack(value: unknown): SharedRecipe | null {
  if (!value || typeof value !== 'object') return null
  const data = value as Record<string, unknown>
  if (data.v !== 1) return null
  const [kind, first, second] = list(data.k)
  const [hydration, salt, oil, sugar] = list(data.f)
  const [yeast, yeastPercent, starterHydration, margin] = list(data.y)
  const [type, flour, prefermentHydration, hours, temp] = list(data.p)
  const [residue, doughTemp] = list(data.r)
  const shape = kind === 0 ? { kind: 'ball', weight: first } : kind === 1 ? { kind: 'round', diameter: first } : kind === 2 ? { kind: 'pan', width: first, length: second } : null
  const recipe = normalizeRecipe({
    style: data.s,
    count: data.n,
    shape,
    loading: data.l,
    hydration,
    salt,
    oil,
    sugar,
    yeast,
    yeastPercent,
    margin,
    starterHydration,
    preferment: { type, flour, hydration: prefermentHydration, hours, temp },
    stages: list(data.t).map((stage) => {
      const [step, stageHours, stageTemp] = list(stage)
      return { step: stepNames[String(step)], hours: stageHours, temp: stageTemp }
    }),
    residue,
    doughTemp,
  })
  const name = typeof data.m === 'string' && data.m.trim() ? data.m.trim().slice(0, 80) : null
  return { recipe, name }
}

export function encodeRecipe(recipe: Recipe, name?: string | null): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(pack(recipe, name))))
}

export function decodeRecipe(code: string): SharedRecipe | null {
  const bytes = fromBase64Url(code.trim())
  if (!bytes) return null
  try {
    return unpack(JSON.parse(new TextDecoder().decode(bytes)))
  } catch {
    return null
  }
}

export function shareUrl(recipe: Recipe, name?: string | null, origin = SHARE_ORIGIN): string {
  return `${origin}${SHARE_PATH}?d=${encodeRecipe(recipe, name)}`
}

export function readShareUrl(url: string): SharedRecipe | null {
  const match = /[?&#]d=([A-Za-z0-9_\-+/=]+)/.exec(url)
  return match?.[1] ? decodeRecipe(match[1]) : null
}

import { describe, expect, it } from 'vitest'
import {
  decodeRecipe,
  defaultRecipe,
  encodeRecipe,
  fromBase64Url,
  readShareUrl,
  shareUrl,
  styles,
  toBase64Url,
  type Recipe,
} from '../src'

describe('base64url', () => {
  it('round trips arbitrary bytes', () => {
    for (let length = 0; length < 40; length++) {
      const bytes = new Uint8Array(Array.from({ length }, (_, index) => (index * 97 + length) % 256))
      expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes)
    }
  })

  it('rejects garbage', () => {
    expect(fromBase64Url('abc$')).toBeNull()
    expect(fromBase64Url('a')).toBeNull()
  })
})

describe('share links', () => {
  it('round trips every style', () => {
    for (const style of styles) {
      const shared = decodeRecipe(encodeRecipe(style.recipe, style.name))
      expect(shared?.recipe).toEqual(style.recipe)
      expect(shared?.name).toBe(style.name)
    }
  })

  it('keeps edits, emoji names and sourdough settings', () => {
    const recipe: Recipe = {
      ...defaultRecipe('detroit'),
      count: 3,
      hydration: 72.5,
      yeast: 'sourdough',
      yeastPercent: 18,
      starterHydration: 80,
      stages: [
        { step: 'bulk', hours: 4, temp: 25 },
        { step: 'pan', hours: 2.5, temp: 26 },
      ],
    }
    const url = shareUrl(recipe, 'Friday night 🍕')
    expect(url.startsWith('https://crustulator.com/r?d=')).toBe(true)
    const shared = readShareUrl(url)
    expect(shared?.recipe).toEqual(recipe)
    expect(shared?.name).toBe('Friday night 🍕')
  })

  it('reads app deep links and fragments', () => {
    const code = encodeRecipe(defaultRecipe('new-york'))
    expect(readShareUrl(`crustulator://r?d=${code}`)?.recipe.style).toBe('new-york')
    expect(readShareUrl(`https://crustulator.com/r#d=${code}`)?.recipe.style).toBe('new-york')
  })

  it('survives tampered payloads by clamping', () => {
    const payload = { v: 1, s: 'nope', n: 5000, k: [0, -4], f: [900, 'salty', null, 2], t: [['x', 5, 99]] }
    const code = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
    const shared = decodeRecipe(code)
    expect(shared?.recipe.style).toBe('new-york')
    expect(shared?.recipe.count).toBe(99)
    expect(shared?.recipe.shape).toEqual({ kind: 'ball', weight: 60 })
    expect(shared?.recipe.hydration).toBe(110)
    expect(shared?.recipe.stages).toEqual([{ step: 'bulk', hours: 5, temp: 40 }])
  })

  it('returns null for nonsense', () => {
    expect(decodeRecipe('not-a-recipe')).toBeNull()
    expect(readShareUrl('https://crustulator.com/r')).toBeNull()
    expect(decodeRecipe(toBase64Url(new TextEncoder().encode('{"v":2}')))).toBeNull()
  })
})

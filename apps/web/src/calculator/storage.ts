import { preferencesFor, type Preferences } from '@crustulator/core'
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'

const PREFIX = 'crustulator:'

export function readStored<T>(key: string, parse: (value: unknown) => T, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : parse(JSON.parse(raw))
  } catch {
    return fallback
  }
}

export function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {}
}

export function usePersistent<T>(
  key: string,
  initial: T,
  hydrate: (stored: T | null) => T,
  parse: (value: unknown) => T,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState(initial)
  const [ready, setReady] = useState(false)
  const first = useRef(true)

  useEffect(() => {
    setValue(hydrate(readStored<T | null>(key, parse, null)))
    setReady(true)
  }, [key])

  useEffect(() => {
    if (!ready) return
    if (first.current) {
      first.current = false
      return
    }
    writeStored(key, value)
  }, [key, value, ready])

  return [value, setValue, ready]
}

export function browserPreferences(): Preferences {
  const locale = typeof navigator === 'undefined' ? '' : navigator.language
  const region = locale.split('-')[1]?.toUpperCase() ?? null
  return preferencesFor(region)
}

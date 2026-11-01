import Storage from 'expo-sqlite/kv-store'

const pending = new Map<string, ReturnType<typeof setTimeout>>()

export function readJson<T>(key: string, parse: (value: unknown) => T, fallback: T): T {
  try {
    const raw = Storage.getItemSync(key)
    return raw === null ? fallback : parse(JSON.parse(raw))
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown, delay = 0) {
  const existing = pending.get(key)
  if (existing) clearTimeout(existing)
  const write = () => {
    pending.delete(key)
    try {
      Storage.setItemSync(key, JSON.stringify(value))
    } catch {}
  }
  if (delay <= 0) write()
  else pending.set(key, setTimeout(write, delay))
}

import { useEffect, useState } from 'react'

export function useNow(interval: number | null = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (interval === null) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(timer)
  }, [interval])
  return now
}

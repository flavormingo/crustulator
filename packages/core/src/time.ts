const DAY = 86_400_000

const clockFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const longWeekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'long' })
const longDayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
const shortDateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

function startOfDay(time: number): number {
  const date = new Date(time)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export function dayOffset(time: number, now: number): number {
  return Math.round((startOfDay(time) - startOfDay(now)) / DAY)
}

export function formatClock(time: number): string {
  return clockFormat.format(time)
}

export function formatDay(time: number, now: number): string {
  const offset = dayOffset(time, now)
  if (offset === 0) return 'Today'
  if (offset === 1) return 'Tomorrow'
  if (offset === -1) return 'Yesterday'
  return longDayFormat.format(time)
}

export function formatWhen(time: number, now: number): string {
  const offset = dayOffset(time, now)
  const clock = formatClock(time)
  if (offset === 0) return `Today ${clock}`
  if (offset === 1) return `Tomorrow ${clock}`
  if (offset === -1) return `Yesterday ${clock}`
  if (offset > 1 && offset < 7) return `${weekdayFormat.format(time)} ${clock}`
  return `${shortDateFormat.format(time)} ${clock}`
}

export function formatWhenInline(time: number, now: number): string {
  const offset = dayOffset(time, now)
  const clock = formatClock(time)
  if (offset === 0) return `today at ${clock}`
  if (offset === 1) return `tomorrow at ${clock}`
  if (offset > 1 && offset < 7) return `${longWeekdayFormat.format(time)} at ${clock}`
  return `${shortDateFormat.format(time)} at ${clock}`
}

export function roundUp(time: number, minutes: number): number {
  const size = minutes * 60_000
  return Math.ceil(time / size) * size
}

export function nextBake(hours: number, now = Date.now()): number {
  const earliest = now + hours * 3_600_000 + 3_600_000
  const evening = new Date(earliest)
  evening.setHours(18, 0, 0, 0)
  if (evening.getTime() < earliest) evening.setDate(evening.getDate() + 1)
  return evening.getTime()
}

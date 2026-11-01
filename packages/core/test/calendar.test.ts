import { describe, expect, it } from 'vitest'
import { calendarFile } from '../src'

describe('calendar export', () => {
  it('writes a valid calendar with escaped text and folded lines', () => {
    const at = Date.UTC(2026, 8, 19, 17, 30)
    const file = calendarFile(
      [{ at, title: 'Mix the dough', detail: 'Combine flour, water and salt; knead until smooth. '.repeat(3) }],
      'Neapolitan for 4 pizzas',
      Date.UTC(2026, 8, 15, 12, 0),
    )
    const lines = file.split('\r\n')
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(lines.at(-2)).toBe('END:VCALENDAR')
    expect(file).toContain('DTSTART:20260919T173000Z')
    expect(file).toContain('DTEND:20260919T174500Z')
    expect(file).toContain('flour\\, water and salt\\; knead')
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(75)
    expect(file.match(/BEGIN:VEVENT/g)).toHaveLength(1)
  })
})

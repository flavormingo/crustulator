import { MINUTE } from './schedule'

export interface CalendarEvent {
  at: number
  title: string
  detail: string
}

function stamp(time: number): string {
  return new Date(time).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n|\u2028|\u2029/g, '\\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
}

function fold(line: string): string {
  const encoder = new TextEncoder()
  const parts: string[] = []
  let current = ''
  let octets = 0
  for (const character of line) {
    const size = encoder.encode(character).length
    if (octets + size > 74) {
      parts.push(current)
      current = ' '
      octets = 1
    }
    current += character
    octets += size
  }
  parts.push(current)
  return parts.join('\r\n')
}

export function calendarFile(events: CalendarEvent[], name: string, now = Date.now()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Crustulator//Bake plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(name)}`,
  ]
  events.forEach((event, index) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.at.toString(36)}-${index}@crustulator.com`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(event.at)}`,
      `DTEND:${stamp(event.at + 15 * MINUTE)}`,
      `SUMMARY:${escapeText(event.title)}`,
      `DESCRIPTION:${escapeText(event.detail)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:PT0M',
      `DESCRIPTION:${escapeText(event.title)}`,
      'END:VALARM',
      'END:VEVENT',
    )
  })
  lines.push('END:VCALENDAR')
  return `${lines.map(fold).join('\r\n')}\r\n`
}

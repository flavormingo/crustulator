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
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

function fold(line: string): string {
  const parts: string[] = []
  let rest = line
  while (rest.length > 74) {
    parts.push(rest.slice(0, 74))
    rest = ` ${rest.slice(74)}`
  }
  parts.push(rest)
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

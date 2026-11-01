import {
  buildPlan,
  calendarFile,
  describeEvent,
  formatDuration,
  formatWhen,
  formatWhenInline,
  getStyle,
  HOUR,
  MINUTE,
  planHours,
  recipeTitle,
  roundUp,
  type Dough,
  type Preferences,
  type Recipe,
} from '@crustulator/core'
import { CalendarPlus } from 'iconoir-react'
import { useEffect, useState } from 'react'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function toLocalInput(time: number): string {
  const date = new Date(time)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromLocalInput(value: string): number | null {
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

export function useNow(interval = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(timer)
  }, [interval])
  return now
}

interface PlanProps {
  recipe: Recipe
  dough: Dough
  preferences: Preferences
  bake: number
  onBakeChange: (bake: number) => void
}

export function Plan({ recipe, dough, preferences, bake, onBakeChange }: PlanProps) {
  const now = useNow()
  const style = getStyle(recipe.style)
  const hours = planHours(recipe)
  const events = buildPlan(recipe, style.oven, { bake })
  const start = events[0]?.at ?? bake
  const late = start < now - 5 * MINUTE
  const earliest = roundUp(now + hours * HOUR, 15)
  const context = { recipe, dough, oven: style.oven, preferences }

  const download = () => {
    const title = recipeTitle(recipe)
    const file = calendarFile(
      events.map((event) => ({ at: event.at, ...describeEvent(event, context) })),
      title,
    )
    const url = URL.createObjectURL(new Blob([file], { type: 'text/calendar' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <section id="plan" aria-labelledby="plan-title">
      <h2 id="plan-title">Bake plan</h2>
      <p>{`${recipeTitle(recipe)} over ${formatDuration(hours)}`}</p>
      <label>
        <span>Pizza time</span>
        <input
          type="datetime-local"
          value={toLocalInput(bake)}
          step={900}
          onChange={(event) => {
            const next = fromLocalInput(event.currentTarget.value)
            if (next !== null) onBakeChange(next)
          }}
        />
      </label>
      {late ? (
        <p role="status">
          {`There is not enough time left for this schedule. Start now and pizza is ready ${formatWhenInline(earliest, now)}.`}
          <button type="button" onClick={() => onBakeChange(earliest)}>
            Start now
          </button>
        </p>
      ) : null}
      <ol>
        {events.map((event) => {
          const copy = describeEvent(event, context)
          return (
            <li key={`${event.kind}-${event.at}`}>
              <time dateTime={new Date(event.at).toISOString()}>{formatWhen(event.at, now)}</time>
              <h3>{copy.title}</h3>
              <p>{copy.detail}</p>
            </li>
          )
        })}
      </ol>
      <button type="button" onClick={download}>
        <CalendarPlus aria-hidden="true" />
        Add the steps to your calendar
      </button>
    </section>
  )
}

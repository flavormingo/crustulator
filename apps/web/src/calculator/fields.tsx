import type { Scale } from '@crustulator/core'
import { Minus, Plus } from 'iconoir-react'
import { useId, type CSSProperties, type ReactNode } from 'react'

interface RulerProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  major?: number
  format: (value: number) => string
  onChange: (value: number) => void
  note?: ReactNode
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const snap = (value: number, step: number) => Math.round(Math.round(value / step) * step * 1000) / 1000

export function Ruler({ label, value, min, max, step, major = 10, format, onChange, note }: RulerProps) {
  const id = useId()
  const steps = Math.round((max - min) / step)
  const every = Math.max(1, Math.ceil(steps / 60))
  const ticks = steps / every
  const visualMajor = every === 1 ? major : 10
  const half = visualMajor % 2 === 0 ? visualMajor / 2 : visualMajor
  const shown = clamp(snap(value, step), min, max)
  return (
    <label htmlFor={`${id}-input`}>
      <span id={`${id}-label`}>{label}</span>
      <output htmlFor={`${id}-input`} aria-hidden="true">
        {format(value)}
      </output>
      <input
        id={`${id}-input`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={shown}
        aria-labelledby={`${id}-label`}
        aria-valuetext={format(value)}
        aria-describedby={note ? `${id}-note` : undefined}
        style={{ '--ticks': ticks, '--major': visualMajor, '--half': half } as CSSProperties}
        onChange={(event) => onChange(snap(Number(event.currentTarget.value), step))}
      />
      {note ? <small id={`${id}-note`}>{note}</small> : null}
    </label>
  )
}

export function ScaledRuler({ label, scale, value, onChange, note }: { label: string; scale: Scale; value: number; onChange: (value: number) => void; note?: ReactNode }) {
  return (
    <Ruler
      label={label}
      value={scale.toDisplay(value)}
      min={scale.min}
      max={scale.max}
      step={scale.step}
      major={scale.major}
      format={scale.format}
      onChange={(next) => onChange(scale.fromDisplay(next))}
      note={note}
    />
  )
}

interface ChoiceProps<T extends string> {
  legend: string
  name: string
  value: T | null
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  hideLegend?: boolean
  children?: ReactNode
}

export function Choice<T extends string>({ legend, name, value, options, onChange, hideLegend, children }: ChoiceProps<T>) {
  const id = useId()
  return (
    <fieldset>
      <legend hidden={hideLegend}>{legend}</legend>
      {options.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name={`${name}-${id}`}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
      {children}
    </fieldset>
  )
}

interface StepperProps {
  label: string
  value: number
  min: number
  max: number
  unit: (value: number) => string
  onChange: (value: number) => void
}

export function Stepper({ label, value, min, max, unit, onChange }: StepperProps) {
  return (
    <div role="group">
      <button type="button" aria-label={`Fewer ${unit(2)}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
        <Minus aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-label={label}
        onChange={(event) => {
          const parsed = Number.parseInt(event.currentTarget.value, 10)
          if (Number.isFinite(parsed)) onChange(Math.min(max, Math.max(min, parsed)))
        }}
      />
      <button type="button" aria-label={`More ${unit(2)}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        <Plus aria-hidden="true" />
      </button>
    </div>
  )
}

export function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label>
      <input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} />
      {label}
    </label>
  )
}

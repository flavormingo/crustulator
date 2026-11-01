import type { Scale } from '@crustulator/core'

import { Ruler } from '@/components/ruler'

interface MeasureRulerProps {
  label: string
  scale: Scale
  value: number
  onChange: (value: number) => void
  note?: string
}

export function MeasureRuler({ label, scale, value, onChange, note }: MeasureRulerProps) {
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

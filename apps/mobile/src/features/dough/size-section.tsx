import { diameterFor, formatLength, formatWeight, lengthScale, limits, pieceName, setShapeKind, weightScale, type Shape } from '@crustulator/core'

import { Section, Segmented, Stepper } from '@/components/controls'
import { MeasureRuler } from '@/components/measure-ruler'
import { useStore } from '@/state/store'

const shapeOptions: { value: Shape['kind']; label: string }[] = [
  { value: 'round', label: 'Round' },
  { value: 'ball', label: 'Weight' },
  { value: 'pan', label: 'Pan' },
]

export function SizeSection() {
  const { recipe, dough, setRecipe, preferences } = useStore()
  const { shape } = recipe
  const pieces = pieceName(recipe, 2)

  return (
    <Section title={pieces.charAt(0).toUpperCase() + pieces.slice(1)}>
      <Stepper
        label={`Number of ${pieces}`}
        value={recipe.count}
        min={1}
        max={99}
        unit={(count) => pieceName(recipe, count)}
        onChange={(count) => setRecipe((current) => ({ ...current, count }))}
      />
      <Segmented
        label="Size by"
        value={shape.kind}
        options={shapeOptions}
        onChange={(kind) => setRecipe((current) => setShapeKind(current, kind))}
      />
      {shape.kind === 'ball' ? (
        <MeasureRuler
          label="Dough ball"
          scale={weightScale(preferences.weight)}
          value={shape.weight}
          onChange={(weight) => setRecipe((current) => ({ ...current, shape: { kind: 'ball', weight } }))}
          note={`Stretches to about ${formatLength(diameterFor(shape.weight, recipe.loading), preferences.length)} across.`}
        />
      ) : null}
      {shape.kind === 'round' ? (
        <MeasureRuler
          label="Diameter"
          scale={lengthScale(preferences.length, limits.diameter)}
          value={shape.diameter}
          onChange={(diameter) => setRecipe((current) => ({ ...current, shape: { kind: 'round', diameter } }))}
          note={`About ${formatWeight(dough.ball, preferences.weight)} of dough each.`}
        />
      ) : null}
      {shape.kind === 'pan' ? (
        <>
          <MeasureRuler
            label="Pan width"
            scale={lengthScale(preferences.length, limits.side)}
            value={shape.width}
            onChange={(width) => setRecipe((current) => (current.shape.kind === 'pan' ? { ...current, shape: { ...current.shape, width } } : current))}
          />
          <MeasureRuler
            label="Pan length"
            scale={lengthScale(preferences.length, limits.side)}
            value={shape.length}
            onChange={(length) => setRecipe((current) => (current.shape.kind === 'pan' ? { ...current, shape: { ...current.shape, length } } : current))}
            note={`About ${formatWeight(dough.ball, preferences.weight)} of dough per pan.`}
          />
        </>
      ) : null}
    </Section>
  )
}

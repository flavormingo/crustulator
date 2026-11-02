import { formatPercent, formatTemperature, isCold, limits, loadingScale, temperatureScale, waterTemperature } from '@crustulator/core'

import { Section } from '@/components/controls'
import { MeasureRuler } from '@/components/measure-ruler'
import { Ruler } from '@/components/ruler'
import { useStore } from '@/state/store'

export function TuningSection() {
  const { recipe, setRecipe, preferences } = useStore()
  const room = recipe.stages.find((stage) => !isCold(stage.temp))?.temp ?? 22
  const water = waterTemperature({ doughTemp: recipe.doughTemp, flourTemp: room, roomTemp: room, method: 'hand' })

  return (
    <Section title="Fine tuning" collapsible>
      <MeasureRuler
        label="Dough temperature"
        scale={temperatureScale(preferences.temperature, limits.doughTemp)}
        value={recipe.doughTemp}
        onChange={(doughTemp) => setRecipe((current) => ({ ...current, doughTemp }))}
        note={`Kneading by hand in a ${formatTemperature(room, preferences.temperature)} kitchen? Use water at about ${formatTemperature(Math.max(1, water), preferences.temperature)}.`}
      />
      <MeasureRuler
        label="Thickness"
        scale={loadingScale(preferences.length)}
        value={recipe.loading}
        onChange={(loading) => setRecipe((current) => ({ ...current, loading }))}
        note="Dough per area. Higher numbers bake up thicker."
      />
      <Ruler
        label="Bowl residue"
        value={recipe.residue}
        min={limits.residue[0]}
        max={limits.residue[1]}
        step={0.5}
        major={2}
        format={formatPercent}
        onChange={(residue) => setRecipe((current) => ({ ...current, residue }))}
        note="A little extra for the dough that sticks to your hands and bowl."
      />
    </Section>
  )
}

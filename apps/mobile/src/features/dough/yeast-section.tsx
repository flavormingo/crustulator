import {
  formatPercent,
  limits,
  yeastLimit,
  marginHints,
  marginNames,
  hoursScale,
  temperatureScale,
  prefermentHints,
  prefermentNames,
  round,
  setPrefermentType,
  setYeast,
  yeastNames,
  type Margin,
  type PrefermentType,
  type YeastType,
} from '@crustulator/core'
import { View } from 'react-native'

import { Section, Segmented, Toggle } from '@/components/controls'
import { MeasureRuler } from '@/components/measure-ruler'
import { Ruler } from '@/components/ruler'
import { Body } from '@/components/type'
import { useStore } from '@/state/store'
import { space } from '@/theme/tokens'

const yeastOptions = (['active', 'instant', 'fresh', 'sourdough'] as YeastType[]).map((value) => ({
  value,
  label: value === 'instant' ? 'Instant' : value === 'active' ? 'Active' : yeastNames[value],
}))

const marginOptions = (['tight', 'balanced', 'relaxed'] as Margin[]).map((value) => ({ value, label: marginNames[value] }))

const prefermentOptions = (['none', 'poolish', 'biga'] as PrefermentType[]).map((value) => ({ value, label: prefermentNames[value] }))

export function YeastSection() {
  const { recipe, dough, setRecipe, preferences } = useStore()
  const sourdough = recipe.yeast === 'sourdough'
  const manual = recipe.yeastPercent !== null
  const preferment = recipe.preferment
  const prefermentName = prefermentNames[preferment.type]

  const autoNote = sourdough
    ? `Use ${formatPercent(dough.mixPercent)} ripe starter. Worked out from your schedule.`
    : dough.preferment
      ? dough.mixPercent > 0
        ? `The ${prefermentName.toLowerCase()} does most of the work. Add ${formatPercent(dough.mixPercent)} more yeast to the final dough.`
        : `The ${prefermentName.toLowerCase()} brings all the yeast the final dough needs.`
      : `${formatPercent(dough.yeastPercent)} of the flour weight. Worked out from your time and temperatures.`

  return (
    <Section title="Yeast">
      <Segmented label="Yeast type" value={recipe.yeast} options={yeastOptions} onChange={(yeast) => setRecipe((current) => setYeast(current, yeast))} />
      {manual ? null : (
        <View style={{ gap: space.sm }}>
          <Body bold>Dough is ready</Body>
          <Segmented label="Dough is ready" value={recipe.margin} options={marginOptions} onChange={(margin) => setRecipe((current) => ({ ...current, margin }))} />
          <Body muted>{marginHints[recipe.margin]}</Body>
        </View>
      )}
      {manual ? (
        <Ruler
          label={sourdough ? 'Starter' : dough.preferment ? 'Yeast in the final dough' : 'Yeast'}
          value={recipe.yeastPercent ?? 0}
          min={0}
          max={yeastLimit(recipe.yeast)}
          step={sourdough ? 0.5 : 0.01}
          major={10}
          format={formatPercent}
          onChange={(yeastPercent) => setRecipe((current) => ({ ...current, yeastPercent }))}
        />
      ) : (
        <Body muted>{autoNote}</Body>
      )}
      <Toggle
        label="Set the amount myself"
        value={manual}
        onChange={(next) =>
          setRecipe((current) => ({ ...current, yeastPercent: next ? round(dough.mixPercent, sourdough ? 1 : 3) : null }))
        }
      />
      {sourdough ? (
        <Ruler
          label="Starter hydration"
          value={recipe.starterHydration}
          min={limits.starterHydration[0]}
          max={limits.starterHydration[1]}
          step={5}
          major={10}
          format={formatPercent}
          onChange={(starterHydration) => setRecipe((current) => ({ ...current, starterHydration }))}
          note="Water in your starter as a share of its flour. Most starters are 100%."
        />
      ) : (
        <View style={{ gap: space.lg }}>
          <Body bold>Preferment</Body>
          <Segmented label="Preferment" value={preferment.type} options={prefermentOptions} onChange={(type) => setRecipe((current) => setPrefermentType(current, type))} />
          <Body muted>{prefermentHints[preferment.type]}</Body>
          {preferment.type !== 'none' ? (
            <>
              <Ruler
                label={`Flour in the ${prefermentName.toLowerCase()}`}
                value={preferment.flour}
                min={limits.prefermentFlour[0]}
                max={limits.prefermentFlour[1]}
                step={5}
                major={2}
                format={formatPercent}
                onChange={(flour) => setRecipe((current) => ({ ...current, preferment: { ...current.preferment, flour } }))}
              />
              <Ruler
                label={`${prefermentName} hydration`}
                value={preferment.hydration}
                min={limits.prefermentHydration[0]}
                max={limits.prefermentHydration[1]}
                step={5}
                major={2}
                format={formatPercent}
                onChange={(hydration) => setRecipe((current) => ({ ...current, preferment: { ...current.preferment, hydration } }))}
              />
              <MeasureRuler
                label={`${prefermentName} time`}
                scale={hoursScale(limits.prefermentHours)}
                value={preferment.hours}
                onChange={(hours) => setRecipe((current) => ({ ...current, preferment: { ...current.preferment, hours } }))}
              />
              <MeasureRuler
                label={`${prefermentName} temperature`}
                scale={temperatureScale(preferences.temperature, limits.temp)}
                value={preferment.temp}
                onChange={(temp) => setRecipe((current) => ({ ...current, preferment: { ...current.preferment, temp } }))}
                note={`Mix it with ${formatPercent(dough.preferment ? (dough.preferment.yeast / dough.preferment.flour) * 100 : 0)} yeast by flour weight.`}
              />
            </>
          ) : null}
        </View>
      )}
    </Section>
  )
}

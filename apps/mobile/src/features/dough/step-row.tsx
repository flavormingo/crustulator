import {
  formatDuration,
  hoursScale,
  isCold,
  limits,
  stagePlace,
  stageTitle,
  temperatureScale,
  type Preferences,
  type Stage,
  type StageStep,
} from '@crustulator/core'
import { Fridge, NavArrowDown, SunLight, Trash } from 'iconoir-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'

import { Button, Segmented } from '@/components/controls'
import { MeasureRuler } from '@/components/measure-ruler'
import { Body, Display } from '@/components/type'
import { tick } from '@/lib/haptics'
import { space, stroke } from '@/theme/tokens'
import { usePalette } from '@/theme/use-palette'

const stepOptions: { value: StageStep; label: string }[] = [
  { value: 'bulk', label: 'One piece' },
  { value: 'balls', label: 'Balls' },
  { value: 'pan', label: 'In the pan' },
]

const placeOptions: { value: 'counter' | 'fridge'; label: string }[] = [
  { value: 'counter', label: 'Counter' },
  { value: 'fridge', label: 'Fridge' },
]

interface StepRowProps {
  stage: Stage
  preferences: Preferences
  canRemove: boolean
  open: boolean
  onToggle: () => void
  onChange: (patch: Partial<Stage>) => void
  onRemove: () => void
}

export function StepRow({ stage, preferences, canRemove, open, onToggle, onChange, onRemove }: StepRowProps) {
  const palette = usePalette()
  const cold = isCold(stage.temp)
  const place = stagePlace(stage, preferences)

  return (
    <View style={[styles.row, { borderColor: palette.line, backgroundColor: palette.raised }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${stageTitle(stage)} ${place}, ${formatDuration(stage.hours)}`}
        onPress={() => {
          tick()
          onToggle()
        }}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        {cold ? (
          <Fridge width={26} height={26} color={palette.accent} strokeWidth={2} />
        ) : (
          <SunLight width={26} height={26} color={palette.accent} strokeWidth={2} />
        )}
        <View style={styles.text}>
          <Body bold size={17}>{stageTitle(stage)}</Body>
          <Body muted size={14}>{place}</Body>
        </View>
        <Display size={24}>{formatDuration(stage.hours)}</Display>
        <NavArrowDown
          width={22}
          height={22}
          color={palette.accent}
          strokeWidth={2.4}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(150)} style={[styles.body, { borderTopColor: palette.line }]}>
          <Segmented label="Dough shape" value={stage.step} options={stepOptions} onChange={(step) => onChange({ step })} />
          <Segmented
            label="Where it rests"
            value={cold ? 'fridge' : 'counter'}
            options={placeOptions}
            onChange={(next) => onChange({ temp: next === 'fridge' ? 4 : 22 })}
          />
          <MeasureRuler label="Time" scale={hoursScale()} value={stage.hours} onChange={(hours) => onChange({ hours })} />
          <MeasureRuler
            label="Temperature"
            scale={temperatureScale(preferences.temperature, limits.temp)}
            value={stage.temp}
            onChange={(temp) => onChange({ temp })}
          />
          <Button label="Remove this step" icon={Trash} size="small" disabled={!canRemove} onPress={onRemove} style={styles.remove} />
        </Animated.View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    borderWidth: stroke,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  text: {
    flex: 1,
  },
  body: {
    gap: space.lg,
    padding: space.lg,
    borderTopWidth: 2,
  },
  remove: {
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.6,
  },
})

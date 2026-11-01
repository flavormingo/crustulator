import { shortIngredientName, weightNumber, type Dough, type Preferences, type Recipe } from '@crustulator/core'
import { StyleSheet, View } from 'react-native'
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Body, Display } from '@/components/type'
import { gutter, space, stroke } from '@/theme/tokens'
import { usePalette } from '@/theme/use-palette'

interface PeekBarProps {
  recipe: Recipe
  dough: Dough
  preferences: Preferences
}

export function PeekBar({ recipe, dough, preferences }: PeekBarProps) {
  const insets = useSafeAreaInsets()
  const palette = usePalette()
  const lines = dough.groups.find((group) => group.key === 'dough')?.lines ?? []
  const shown = (lines.length > 4 ? lines.filter((line) => line.key !== 'oil' && line.key !== 'sugar') : lines).slice(0, 4)

  const content = (
    <View style={styles.row}>
      {shown.map((line) => (
        <View key={line.key} style={styles.cell}>
          <View style={styles.amount}>
            <Display size={19} numberOfLines={1} adjustsFontSizeToFit>{weightNumber(line.grams, preferences.weight)}</Display>
            <Body bold size={11} color={palette.accent}>{preferences.weight}</Body>
          </View>
          <Body bold muted size={11} numberOfLines={1}>{shortIngredientName(line.key, recipe)}</Body>
        </View>
      ))}
    </View>
  )

  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(160)}
      pointerEvents="none"
      style={[styles.wrap, { top: insets.top + space.xs }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.surface, { backgroundColor: palette.ground, borderColor: palette.accent, shadowColor: palette.ink }]}>{content}</View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: gutter - 6,
    right: gutter - 6,
  },
  surface: {
    borderRadius: 24,
    borderWidth: stroke,
    paddingVertical: space.sm + 2,
    paddingHorizontal: space.lg,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  amount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
})

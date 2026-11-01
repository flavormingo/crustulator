import {
  formatPercent,
  formatSpoons,
  formatTotalWeight,
  formatDuration,
  ingredientName,
  prefermentNames,
  weightNumber,
  type Dough,
  type Line,
  type Preferences,
  type Recipe,
} from '@crustulator/core'
import { StyleSheet, View } from 'react-native'
import Svg, { Line as SvgLine } from 'react-native-svg'

import { Body, Display } from '@/components/type'
import { space } from '@/theme/tokens'
import { usePalette } from '@/theme/use-palette'

interface WeighInProps {
  recipe: Recipe
  dough: Dough
  preferences: Preferences
}

function spoonHint(line: Line, recipe: Recipe, preferences: Preferences): string | null {
  if (line.key === 'salt') return formatSpoons(line.grams, preferences.salt)
  if (line.key === 'sugar') return formatSpoons(line.grams, 'sugar')
  if (line.key === 'oil') return formatSpoons(line.grams, 'oil')
  if (line.key === 'yeast' && (recipe.yeast === 'instant' || recipe.yeast === 'active')) return formatSpoons(line.grams, recipe.yeast)
  return null
}

function Leader() {
  const palette = usePalette()
  return (
    <Svg height={4} style={styles.leader}>
      <SvgLine x1="2" y1="2" x2="100%" y2="2" stroke={palette.accent} strokeOpacity={0.5} strokeWidth={2.5} strokeDasharray="0 7" strokeLinecap="round" />
    </Svg>
  )
}

export function WeighIn({ recipe, dough, preferences }: WeighInProps) {
  const palette = usePalette()
  const split = dough.groups.length > 1
  return (
    <View style={styles.root} accessibilityLabel="Ingredients">
      {dough.groups.map((group) => (
        <View key={group.key} style={styles.group}>
          {split ? (
            <Body bold muted size={15}>
              {group.key === 'preferment'
                ? `${prefermentNames[recipe.preferment.type]}, ${formatDuration(recipe.preferment.hours)} ahead`
                : 'Final dough'}
            </Body>
          ) : null}
          {group.lines.map((line) => {
            const hint = spoonHint(line, recipe, preferences)
            const unit = preferences.weight
            return (
              <View
                key={`${group.key}-${line.key}`}
                style={styles.row}
                accessible
                accessibilityLabel={`${ingredientName(line.key, recipe)}, ${weightNumber(line.grams, unit)} ${unit === 'g' ? 'grams' : 'ounces'}`}
              >
                <View style={styles.name}>
                  <Body bold size={18}>{ingredientName(line.key, recipe)}</Body>
                  <Body size={14} muted>
                    {formatPercent(line.percent)}
                    {hint ? `  ≈ ${hint}` : ''}
                  </Body>
                </View>
                <Leader />
                <View style={styles.amount}>
                  <Display size={30}>{weightNumber(line.grams, unit)}</Display>
                  <Body bold size={16} color={palette.accent}>{unit}</Body>
                </View>
              </View>
            )
          })}
        </View>
      ))}
      <View style={[styles.total, { borderTopColor: palette.accent }]}>
        <Body bold size={18}>Total dough</Body>
        <Display size={22} color={palette.ink}>{formatTotalWeight(dough.total, preferences.weight)}</Display>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: space.lg,
  },
  group: {
    gap: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  name: {
    flexShrink: 0,
  },
  leader: {
    flex: 1,
    marginTop: 8,
    minWidth: 16,
  },
  amount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  total: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 2.5,
    paddingTop: space.md,
  },
})

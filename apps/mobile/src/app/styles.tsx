import { applyStyle, ballWeight, formatDuration, formatOvenTemperature, formatWeight, planHours, styles as pizzaStyles } from '@crustulator/core'
import { useRouter } from 'expo-router'
import { CheckCircleSolid, Droplet, FireFlame, Timer } from 'iconoir-react-native'
import type { ComponentType } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import { Body, Display } from '@/components/type'
import { thud } from '@/lib/haptics'
import { useStore } from '@/state/store'
import { gutter, space } from '@/theme/tokens'
import { usePalette } from '@/theme/use-palette'

function Stat({ icon: Icon, text }: { icon: ComponentType<SvgProps>; text: string }) {
  const palette = usePalette()
  return (
    <View style={styles.stat}>
      <Icon width={16} height={16} color={palette.accent} strokeWidth={2} />
      <Body bold size={14}>{text}</Body>
    </View>
  )
}

export default function StylesSheet() {
  const router = useRouter()
  const palette = usePalette()
  const { recipe, setRecipe, preferences } = useStore()

  return (
    <ScrollView style={{ backgroundColor: palette.ground }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Display size={30} color={palette.ink} accessibilityRole="header">Pick a style</Display>
        <Body muted>Each style sets smart starting numbers. Tweak anything after.</Body>
      </View>
      {pizzaStyles.map((style) => {
        const selected = style.id === recipe.style
        const weight = ballWeight(style.recipe)
        return (
          <Pressable
            key={style.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${style.name}. ${style.tagline}`}
            onPress={() => {
              thud()
              setRecipe((current) => applyStyle(current, style.id))
              router.back()
            }}
            style={({ pressed }) => [styles.item, { borderTopColor: palette.line }, pressed && styles.pressed]}
          >
            <View style={styles.titleRow}>
              <Display size={28} color={selected ? palette.accent : palette.ink} style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
                {style.name}
              </Display>
              {selected ? <CheckCircleSolid width={28} height={28} color={palette.accent} /> : null}
            </View>
            <Body bold muted size={15}>{style.origin}</Body>
            <Body>{style.tagline}</Body>
            <View style={styles.stats}>
              <Stat icon={Droplet} text={`${style.recipe.hydration}%`} />
              <Stat icon={Timer} text={formatDuration(planHours(style.recipe))} />
              <Stat icon={FireFlame} text={formatOvenTemperature(style.oven.temp[1], preferences.temperature)} />
              <Body bold muted size={14}>{`${formatWeight(weight, preferences.weight)} ${style.recipe.shape.kind === 'pan' ? 'per pan' : 'per pizza'}`}</Body>
            </View>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: gutter,
    paddingTop: space.xxl,
    paddingBottom: space.huge,
    gap: 0,
  },
  header: {
    gap: space.xs,
    paddingBottom: space.xl,
  },
  item: {
    gap: 4,
    paddingVertical: space.lg,
    borderTopWidth: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  title: {
    flexShrink: 1,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: space.lg,
    rowGap: space.xs,
    marginTop: space.xs,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pressed: {
    opacity: 0.6,
  },
})

import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import Svg, { Defs, Line, LinearGradient, Pattern, Rect, Stop } from 'react-native-svg'

import { Body, Display } from '@/components/type'
import { tick } from '@/lib/haptics'
import { space } from '@/theme/tokens'
import { usePalette } from '@/theme/use-palette'

const SPACING = 11
const HEIGHT = 46
const FADE = 56

interface RulerProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  major?: number
  format: (value: number) => string
  onChange: (value: number) => void
  note?: string
  prompt?: string
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const snap = (value: number, step: number) => Math.round(Math.round(value / step) * step * 1000) / 1000

export function Ruler({ label, value, min, max, step, major = 10, format, onChange, note, prompt }: RulerProps) {
  const palette = usePalette()
  const scroll = useRef<ScrollView>(null)
  const active = useRef(false)
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null)
  const count = Math.round((max - min) / step)
  const index = clamp(Math.round((value - min) / step), 0, count)
  const shown = useRef(index)
  const [width, setWidth] = useState(0)
  const patternId = `ticks-${major}`
  const fadeId = `fade-${palette.scheme}`

  useEffect(() => {
    if (!width || active.current || shown.current === index) return
    shown.current = index
    scroll.current?.scrollTo({ x: index * SPACING, animated: false })
  }, [index, width])

  const commit = (next: number) => {
    if (next === shown.current) return
    shown.current = next
    tick()
    onChange(snap(min + next * step, step))
  }

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!active.current) return
    commit(clamp(Math.round(event.nativeEvent.contentOffset.x / SPACING), 0, count))
  }

  const release = () => {
    if (settle.current) clearTimeout(settle.current)
    settle.current = setTimeout(() => {
      active.current = false
    }, 120)
  }

  const hold = () => {
    if (settle.current) clearTimeout(settle.current)
    active.current = true
  }

  const nudge = (direction: 1 | -1) => {
    const next = clamp(index + direction, 0, count)
    if (next === index) return
    onChange(snap(min + next * step, step))
  }

  const ask = () => {
    Alert.prompt(
      prompt ?? label,
      undefined,
      (text) => {
        const parsed = Number.parseFloat(text.replace(',', '.'))
        if (Number.isFinite(parsed)) onChange(snap(clamp(parsed, min, max), step))
      },
      'plain-text',
      String(snap(value, step)),
      'decimal-pad',
    )
  }

  const period = SPACING * major
  const half = Math.round(major / 2)

  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') nudge(1)
        if (event.nativeEvent.actionName === 'decrement') nudge(-1)
        if (event.nativeEvent.actionName === 'activate') ask()
      }}
    >
      <View style={styles.header}>
        <Body bold>{label}</Body>
        <Pressable onPress={ask} hitSlop={12} style={({ pressed }) => pressed && styles.pressed}>
          <Display size={26}>{format(value)}</Display>
        </Pressable>
      </View>
      <View style={styles.track} onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))}>
        {width > 0 && (
          <ScrollView
            ref={scroll}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SPACING}
            decelerationRate="fast"
            scrollEventThrottle={16}
            contentOffset={{ x: index * SPACING, y: 0 }}
            contentContainerStyle={{ paddingHorizontal: width / 2 }}
            onScroll={onScroll}
            onScrollBeginDrag={hold}
            onMomentumScrollBegin={hold}
            onScrollEndDrag={release}
            onMomentumScrollEnd={release}
          >
            <Svg width={count * SPACING + SPACING} height={HEIGHT} style={{ marginLeft: -SPACING / 2 }}>
              <Defs>
                <Pattern id={patternId} patternUnits="userSpaceOnUse" x={0} y={0} width={period} height={HEIGHT}>
                  {Array.from({ length: major }, (_, tickIndex) => {
                    const length = tickIndex === 0 ? 26 : tickIndex === half ? 18 : 11
                    return (
                      <Line
                        key={tickIndex}
                        x1={SPACING / 2 + tickIndex * SPACING}
                        x2={SPACING / 2 + tickIndex * SPACING}
                        y1={4}
                        y2={4 + length}
                        stroke={palette.accent}
                        strokeOpacity={tickIndex === 0 ? 1 : 0.55}
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                    )
                  })}
                </Pattern>
              </Defs>
              <Rect x={0} y={0} width={count * SPACING + SPACING} height={HEIGHT} fill={`url(#${patternId})`} />
            </Svg>
          </ScrollView>
        )}
        <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={`${fadeId}-left`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={palette.ground} stopOpacity={1} />
              <Stop offset="1" stopColor={palette.ground} stopOpacity={0} />
            </LinearGradient>
            <LinearGradient id={`${fadeId}-right`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={palette.ground} stopOpacity={0} />
              <Stop offset="1" stopColor={palette.ground} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={FADE} height={HEIGHT + 8} fill={`url(#${fadeId}-left)`} />
          <Rect x={Math.max(0, width - FADE)} y={0} width={FADE} height={HEIGHT + 8} fill={`url(#${fadeId}-right)`} />
          <Line x1={width / 2} x2={width / 2} y1={2} y2={HEIGHT + 4} stroke={palette.accent} strokeWidth={4} strokeLinecap="round" />
        </Svg>
      </View>
      {note ? <Body size={15} muted style={styles.note}>{note}</Body> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: space.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.md,
  },
  track: {
    height: HEIGHT + 8,
    justifyContent: 'flex-start',
  },
  note: {
    marginTop: -2,
  },
  pressed: {
    opacity: 0.6,
  },
})

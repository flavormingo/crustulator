import { Minus, NavArrowDown, Plus } from 'iconoir-react-native'
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import type { SvgProps } from 'react-native-svg'

import { Body, Display } from '@/components/type'
import { tap, tick } from '@/lib/haptics'
import { space, stroke } from '@/theme/tokens'
import { usePalette } from '@/theme/use-palette'

type Icon = ComponentType<SvgProps>

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string
  icon?: Icon
  variant?: 'solid' | 'outline' | 'quiet'
  size?: 'regular' | 'small'
  style?: StyleProp<ViewStyle>
}

export function Button({ label, icon: IconComponent, variant = 'outline', size = 'regular', style, onPress, ...props }: ButtonProps) {
  const palette = usePalette()
  const solid = variant === 'solid'
  const small = size === 'small'
  const color = solid ? palette.onAccent : palette.accent
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...props}
      onPress={(event) => {
        tap()
        onPress?.(event)
      }}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        {
          backgroundColor: solid ? palette.accent : 'transparent',
          borderColor: variant === 'quiet' ? 'transparent' : palette.accent,
          opacity: pressed ? 0.7 : props.disabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {IconComponent ? <IconComponent width={small ? 18 : 22} height={small ? 18 : 22} color={color} strokeWidth={2} /> : null}
      <Body bold size={small ? 15 : 17} color={color}>
        {label}
      </Body>
    </Pressable>
  )
}

interface RoundButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  icon: Icon
  label: string
  filled?: boolean
  size?: number
}

export function RoundButton({ icon: IconComponent, label, filled, size = 44, onPress, ...props }: RoundButtonProps) {
  const palette = usePalette()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      {...props}
      onPress={(event) => {
        tap()
        onPress?.(event)
      }}
      accessibilityState={{ disabled: props.disabled === true }}
      style={({ pressed }) => [
        styles.round,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: palette.accent,
          backgroundColor: filled || pressed ? palette.accent : 'transparent',
          opacity: props.disabled ? 0.35 : 1,
        },
      ]}
    >
      {({ pressed }) => (
        <IconComponent width={size * 0.5} height={size * 0.5} strokeWidth={2.2} color={filled || pressed ? palette.onAccent : palette.accent} />
      )}
    </Pressable>
  )
}

interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  icon: Icon
  label: string
  size?: number
}

export function IconButton({ icon: IconComponent, label, size = 28, onPress, ...props }: IconButtonProps) {
  const palette = usePalette()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={14}
      {...props}
      onPress={(event) => {
        tap()
        onPress?.(event)
      }}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <IconComponent width={size} height={size} strokeWidth={2} color={palette.accent} />
    </Pressable>
  )
}

interface StepperProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  unit: (value: number) => string
}

export function Stepper({ label, value, min, max, onChange, unit }: StepperProps) {
  const repeat = useRef<ReturnType<typeof setInterval> | null>(null)
  const latest = useRef(value)
  latest.current = value

  const change = (direction: 1 | -1) => {
    const next = Math.min(max, Math.max(min, latest.current + direction))
    if (next !== latest.current) {
      latest.current = next
      tick()
      onChange(next)
    }
  }

  const startRepeat = (direction: 1 | -1) => {
    stopRepeat()
    repeat.current = setInterval(() => change(direction), 110)
  }

  const stopRepeat = () => {
    if (repeat.current) clearInterval(repeat.current)
    repeat.current = null
  }

  useEffect(() => stopRepeat, [])

  const ask = () => {
    Alert.prompt(
      `How many ${unit(2)}?`,
      undefined,
      (text) => {
        const parsed = Number.parseInt(text, 10)
        if (Number.isFinite(parsed)) onChange(Math.min(max, Math.max(min, parsed)))
      },
      'plain-text',
      String(value),
      'number-pad',
    )
  }

  return (
    <View
      style={styles.stepper}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: `${value} ${unit(value)}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'activate') ask()
        else change(event.nativeEvent.actionName === 'increment' ? 1 : -1)
      }}
    >
      <RoundButton icon={Minus} label={`Fewer ${label}`} disabled={value <= min} onPress={() => change(-1)} onLongPress={() => startRepeat(-1)} onPressOut={stopRepeat} size={52} />
      <Pressable onPress={ask} hitSlop={10} style={({ pressed }) => [styles.stepperValue, pressed && styles.pressedHeader]}>
        <Display size={44}>{value}</Display>
      </Pressable>
      <RoundButton icon={Plus} label={`More ${label}`} disabled={value >= max} onPress={() => change(1)} onLongPress={() => startRepeat(1)} onPressOut={stopRepeat} size={52} />
    </View>
  )
}

interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  const palette = usePalette()
  const dense = options.length > 3
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.segmented, { borderColor: palette.accent }]}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) {
                tick()
                onChange(option.value)
              }
            }}
            style={({ pressed }) => [
              styles.segment,
              { backgroundColor: selected ? palette.accent : pressed ? palette.faint : 'transparent' },
            ]}
          >
            <Body
              bold
              size={15}
              numberOfLines={2}
              adjustsFontSizeToFit={dense}
              minimumFontScale={0.85}
              color={selected ? palette.onAccent : palette.accent}
            >
              {option.label}
            </Body>
          </Pressable>
        )
      })}
    </View>
  )
}

interface ChipsProps<T extends string> {
  label: string
  value: T | null
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

export function Chips<T extends string>({ label, value, options, onChange }: ChipsProps<T>) {
  const palette = usePalette()
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={styles.chipsScroll}
      contentContainerStyle={styles.chips}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              tick()
              onChange(option.value)
            }}
            style={({ pressed }) => [
              styles.chip,
              {
                borderColor: palette.accent,
                backgroundColor: selected ? palette.accent : pressed ? palette.faint : 'transparent',
              },
            ]}
          >
            <Body bold size={15} color={selected ? palette.onAccent : palette.accent}>
              {option.label}
            </Body>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

interface SectionProps {
  title: string
  aside?: ReactNode
  children: ReactNode
  collapsible?: boolean
  style?: StyleProp<ViewStyle>
}

export function Section({ title, aside, children, collapsible, style }: SectionProps) {
  const palette = usePalette()
  const [open, setOpen] = useState(false)

  if (!collapsible) {
    return (
      <View style={[styles.section, { borderTopColor: palette.line }, style]}>
        <View style={styles.sectionHeader}>
          <Display size={22} color={palette.ink} accessibilityRole="header">
            {title}
          </Display>
          {aside}
        </View>
        {children}
      </View>
    )
  }

  return (
    <View style={[styles.section, { borderTopColor: palette.line }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        onPress={() => {
          tick()
          setOpen(!open)
        }}
        style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressedHeader]}
      >
        <Display size={22} color={palette.ink}>{title}</Display>
        <NavArrowDown
          width={26}
          height={26}
          color={palette.accent}
          strokeWidth={2.4}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(160)} style={styles.sectionBody}>
          {children}
        </Animated.View>
      ) : null}
    </View>
  )
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  const palette = usePalette()
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => {
        tick()
        onChange(!value)
      }}
      style={styles.toggleRow}
    >
      <Body bold style={styles.toggleLabel}>{label}</Body>
      <View style={[styles.toggleTrack, { borderColor: palette.accent, backgroundColor: value ? palette.accent : 'transparent' }]}>
        <View style={[styles.toggleKnob, { backgroundColor: value ? palette.onAccent : palette.accent, alignSelf: value ? 'flex-end' : 'flex-start' }]} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: 52,
    paddingHorizontal: space.xl,
    borderRadius: 26,
    borderWidth: stroke,
  },
  buttonSmall: {
    minHeight: 44,
    paddingHorizontal: space.lg,
    borderRadius: 20,
  },
  round: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: stroke,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
  stepperValue: {
    minWidth: 72,
    alignItems: 'center',
  },
  segmented: {
    flexDirection: 'row',
    borderWidth: stroke,
    borderRadius: 24,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  chipsScroll: {
    marginHorizontal: -20,
  },
  chips: {
    paddingHorizontal: 20,
    gap: space.sm,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: space.lg,
    borderRadius: 20,
    borderWidth: stroke,
    justifyContent: 'center',
  },
  section: {
    gap: space.lg,
    paddingTop: space.xl,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  pressed: {
    opacity: 0.6,
  },
  pressedHeader: {
    opacity: 0.6,
  },
  sectionBody: {
    gap: space.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
    minHeight: 44,
  },
  toggleLabel: {
    flex: 1,
  },
  toggleTrack: {
    width: 56,
    height: 32,
    borderRadius: 16,
    borderWidth: stroke,
    padding: 3,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 21,
    height: 21,
    borderRadius: 11,
  },
})

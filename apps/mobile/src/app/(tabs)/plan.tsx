import {
  buildPlan,
  describeEvent,
  formatClock,
  formatDay,
  formatDuration,
  formatWhen,
  formatWhenInline,
  getStyle,
  HOUR,
  planHours,
  recipeTitle,
  roundUp,
  type PlanEvent,
} from '@crustulator/core'
import { DatePicker, Host } from '@expo/ui/swift-ui'
import { tint } from '@expo/ui/swift-ui/modifiers'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { useIsFocused } from 'expo-router'
import { Check } from 'iconoir-react-native'
import { useEffect } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg'

import { Button, Toggle } from '@/components/controls'
import { Notice } from '@/components/notice'
import { Screen } from '@/components/screen'
import { Body, Display } from '@/components/type'
import { tick } from '@/lib/haptics'
import { requestReminders } from '@/lib/reminders'
import { useNow } from '@/lib/time'
import { useStore } from '@/state/store'
import { space, stroke } from '@/theme/tokens'
import { usePalette } from '@/theme/use-palette'

function Rail({ last }: { last: boolean }) {
  const palette = usePalette()
  if (last) return null
  return (
    <Svg width={16} style={styles.railLine}>
      <Defs>
        <Pattern id="rail" patternUnits="userSpaceOnUse" width={16} height={10}>
          <Line x1={8} y1={0} x2={8} y2={10} stroke={palette.accent} strokeWidth={2.5} strokeOpacity={0.45} />
          <Line x1={4} y1={5} x2={12} y2={5} stroke={palette.accent} strokeWidth={2} strokeLinecap="round" strokeOpacity={0.45} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width={16} height="100%" fill="url(#rail)" />
    </Svg>
  )
}

export default function PlanScreen() {
  const palette = usePalette()
  const now = useNow()
  const { recipe, dough, preferences, plan, setPlan } = useStore()
  const style = getStyle(recipe.style)
  const hours = planHours(recipe)
  const events = buildPlan(recipe, style.oven, { bake: plan.bake })
  const start = events[0]?.at ?? plan.bake
  const late = start < now - 5 * 60_000
  const earliest = roundUp(now + hours * HOUR, 15)
  const focused = useIsFocused()
  const busy = focused && events.some((event) => Math.abs(event.at - now) < HOUR)

  useEffect(() => {
    if (!busy) return
    activateKeepAwakeAsync('plan').catch(() => {})
    return () => {
      deactivateKeepAwake('plan').catch(() => {})
    }
  }, [busy])

  const toggleReminders = async (next: boolean) => {
    if (next && !(await requestReminders())) {
      Alert.alert('Notifications are off', 'Allow notifications for Crustulator in the Settings app to get a nudge at each step.')
      return
    }
    setPlan({ reminders: next })
  }

  const toggleDone = (event: PlanEvent) => {
    tick()
    setPlan({ done: plan.done.includes(event.at) ? plan.done.filter((at) => at !== event.at) : [...plan.done, event.at] })
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Display size={36} accessibilityRole="header">Bake plan</Display>
        <Body muted>{`${recipeTitle(recipe)} over ${formatDuration(hours)}`}</Body>
      </View>

      <View style={[styles.when, { borderColor: palette.accent }]}>
        <Body bold>Pizza time</Body>
        <Display size={48}>{formatClock(plan.bake)}</Display>
        <Display size={20} color={palette.ink}>{formatDay(plan.bake, now)}</Display>
        <View style={styles.picker}>
          <Host matchContents>
            <DatePicker
              selection={new Date(plan.bake)}
              displayedComponents={['date', 'hourAndMinute']}
              range={{ start: new Date(now) }}
              onDateChange={(date) => setPlan({ bake: date.getTime(), done: [] })}
              modifiers={[tint(palette.accent)]}
            />
          </Host>
        </View>
      </View>

      {late ? (
        <Notice action={<Button label="Start now" size="small" variant="solid" onPress={() => setPlan({ bake: earliest, done: [] })} style={styles.start} />}>
          {`There is not enough time left for this schedule. Start now and pizza is ready ${formatWhenInline(earliest, now)}.`}
        </Notice>
      ) : null}

      <Toggle label="Remind me at each step" value={plan.reminders} onChange={toggleReminders} />

      <View accessibilityLabel="Steps">
        {events.map((event, index) => {
          const copy = describeEvent(event, { recipe, dough, oven: style.oven, preferences })
          const done = plan.done.includes(event.at)
          const past = event.at < now
          return (
            <View key={`${event.kind}-${event.at}`} style={styles.event}>
              <View style={styles.rail}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: done }}
                  accessibilityLabel={`Mark ${copy.title} as done`}
                  hitSlop={10}
                  onPress={() => toggleDone(event)}
                  style={[styles.node, { borderColor: palette.accent, backgroundColor: done ? palette.accent : palette.ground }]}
                >
                  {done ? <Check width={18} height={18} color={palette.onAccent} strokeWidth={3} /> : null}
                </Pressable>
                <Rail last={index === events.length - 1} />
              </View>
              <View style={[styles.eventBody, (done || (past && !late)) && styles.dim]}>
                <Body bold muted size={15}>{formatWhen(event.at, now)}</Body>
                <Display size={22} color={palette.ink}>{copy.title}</Display>
                <Body>{copy.detail}</Body>
              </View>
            </View>
          )
        })}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: space.xl,
  },
  header: {
    gap: space.xs,
  },
  when: {
    borderWidth: stroke,
    borderRadius: 28,
    padding: space.xl,
    gap: space.xs,
  },
  picker: {
    marginTop: space.md,
    alignItems: 'flex-start',
  },
  start: {
    alignSelf: 'flex-start',
  },
  event: {
    flexDirection: 'row',
    gap: space.lg,
  },
  rail: {
    width: 30,
    alignItems: 'center',
  },
  railLine: {
    flex: 1,
    marginVertical: 6,
  },
  node: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: stroke,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventBody: {
    flex: 1,
    gap: 4,
    paddingBottom: space.xxl,
  },
  dim: {
    opacity: 0.5,
  },
})

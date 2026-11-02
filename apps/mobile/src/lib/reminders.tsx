import { buildPlan, describeEvent, getStyle } from '@crustulator/core'
import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'

import { useStore } from '@/state/store'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function requestReminders(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync()
  if (current.granted) return true
  const next = await Notifications.requestPermissionsAsync()
  return next.granted
}

export function ReminderSync() {
  const { recipe, dough, preferences, plan } = useStore()

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      if (cancelled) return
      await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {})
      if (!plan.reminders || cancelled) return
      const permission = await Notifications.getPermissionsAsync()
      if (!permission.granted || cancelled) return
      const style = getStyle(recipe.style)
      const events = buildPlan(recipe, style.oven, { bake: plan.bake })
      for (const [index, event] of events.entries()) {
        if (cancelled) break
        if (event.at <= Date.now() + 10_000 || plan.done.includes(index)) continue
        const copy = describeEvent(event, { recipe, dough, oven: style.oven, preferences })
        await Notifications.scheduleNotificationAsync({
          content: { title: copy.title, body: copy.detail },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(event.at) },
        }).catch(() => {})
      }
    }, 800)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [recipe, dough, preferences, plan.bake, plan.reminders, plan.done])

  return null
}

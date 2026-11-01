import * as Haptics from 'expo-haptics'

let enabled = true

export function setHapticsEnabled(value: boolean) {
  enabled = value
}

export function tick() {
  if (enabled) Haptics.selectionAsync().catch(() => {})
}

export function tap() {
  if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
}

export function thud() {
  if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
}

export function success() {
  if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
}

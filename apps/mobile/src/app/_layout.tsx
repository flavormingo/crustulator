import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { IconoirProvider } from 'iconoir-react-native'
import { useEffect } from 'react'

import { setHapticsEnabled } from '@/lib/haptics'
import { ReminderSync } from '@/lib/reminders'
import { StoreProvider, useStore } from '@/state/store'
import { usePalette } from '@/theme/use-palette'

SplashScreen.preventAutoHideAsync()

function Shell() {
  const palette = usePalette()
  const { settings } = useStore()
  const base = palette.scheme === 'dark' ? DarkTheme : DefaultTheme

  useEffect(() => {
    setHapticsEnabled(settings.haptics)
  }, [settings.haptics])

  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  const sheet = {
    presentation: 'formSheet' as const,
    sheetGrabberVisible: true,
    sheetAllowedDetents: [0.92],
    sheetCornerRadius: 28,
    contentStyle: { backgroundColor: palette.ground },
  }

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: { ...base.colors, background: palette.ground, card: palette.ground, text: palette.ink, primary: palette.accent, border: palette.line },
      }}
    >
      <IconoirProvider iconProps={{ color: palette.accent, strokeWidth: 2, width: 24, height: 24 }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.ground } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="styles" options={sheet} />
          <Stack.Screen name="settings" options={sheet} />
          <Stack.Screen name="r" options={sheet} />
        </Stack>
        <ReminderSync />
        <StatusBar style={palette.scheme === 'dark' ? 'light' : 'dark'} />
      </IconoirProvider>
    </ThemeProvider>
  )
}

export default function RootLayout() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

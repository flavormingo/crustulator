import { saltNames, type Preferences, type SaltType } from '@crustulator/core'
import Constants from 'expo-constants'
import * as WebBrowser from 'expo-web-browser'
import { Globe } from 'iconoir-react-native'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { Button, Chips, Section, Segmented, Toggle } from '@/components/controls'
import { Logo } from '@/components/logo'
import { Body, Display } from '@/components/type'
import { useStore } from '@/state/store'
import { gutter, space } from '@/theme/tokens'
import { usePalette } from '@/theme/use-palette'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Body bold>{label}</Body>
      {children}
    </View>
  )
}

export default function SettingsSheet() {
  const palette = usePalette()
  const { preferences, setPreferences, settings, setSettings } = useStore()

  return (
    <ScrollView style={{ backgroundColor: palette.ground }} contentContainerStyle={styles.content}>
      <Display size={30} color={palette.ink} accessibilityRole="header">Settings</Display>

      <Section title="Units">
        <Field label="Weight">
          <Segmented<Preferences['weight']>
            label="Weight"
            value={preferences.weight}
            options={[{ value: 'g', label: 'Grams' }, { value: 'oz', label: 'Ounces' }]}
            onChange={(weight) => setPreferences({ weight })}
          />
        </Field>
        <Field label="Temperature">
          <Segmented<Preferences['temperature']>
            label="Temperature"
            value={preferences.temperature}
            options={[{ value: 'c', label: 'Celsius' }, { value: 'f', label: 'Fahrenheit' }]}
            onChange={(temperature) => setPreferences({ temperature })}
          />
        </Field>
        <Field label="Size">
          <Segmented<Preferences['length']>
            label="Size"
            value={preferences.length}
            options={[{ value: 'cm', label: 'Centimeters' }, { value: 'in', label: 'Inches' }]}
            onChange={(length) => setPreferences({ length })}
          />
        </Field>
      </Section>

      <Section title="Salt">
        <Body muted>Teaspoon estimates depend on the salt in your cupboard.</Body>
        <Chips<SaltType>
          label="Salt type"
          value={preferences.salt}
          options={(Object.keys(saltNames) as SaltType[]).map((value) => ({ value, label: saltNames[value] }))}
          onChange={(salt) => setPreferences({ salt })}
        />
      </Section>

      <Section title="Feel">
        <Toggle label="Haptic ticks on rulers" value={settings.haptics} onChange={(haptics) => setSettings({ haptics })} />
      </Section>

      <Section title="About">
        <View style={styles.about}>
          <Logo size={48} />
          <View style={styles.aboutText}>
            <Display size={20} color={palette.ink}>Crustulator</Display>
            <Body muted size={15}>{`Version ${Constants.expoConfig?.version ?? '1.0.0'}`}</Body>
          </View>
        </View>
        <Body muted>
          Yeast amounts come from a fermentation model and make a great starting point. Flour, starters and kitchens all differ, so watch the dough more than the clock.
        </Body>
        <Button label="Crustulator on the web" icon={Globe} onPress={() => WebBrowser.openBrowserAsync('https://crustulator.com')} />
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="made with love by mazz.digital"
          onPress={() => WebBrowser.openBrowserAsync('https://mazz.digital')}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Body muted size={15}>
            made with love by <Body size={15} bold color={palette.accent}>mazz.digital</Body>
          </Body>
        </Pressable>
      </Section>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: gutter,
    paddingTop: space.xxl,
    paddingBottom: space.huge,
    gap: space.xl,
  },
  field: {
    gap: space.sm,
  },
  about: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
  aboutText: {
    gap: 2,
  },
  pressed: {
    opacity: 0.6,
  },
})

import { NativeTabs } from 'expo-router/unstable-native-tabs'

import { fonts } from '@/theme/tokens'
import { usePalette } from '@/theme/use-palette'

export default function TabsLayout() {
  const palette = usePalette()
  const label = { fontFamily: fonts.bold, fontSize: 11 }
  return (
    <NativeTabs
      tintColor={palette.accent}
      iconColor={{ default: palette.muted, selected: palette.accent }}
      labelStyle={{ default: { ...label, color: palette.muted }, selected: { ...label, color: palette.accent } }}
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Dough</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabs/dough.png')} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="plan">
        <NativeTabs.Trigger.Label>Plan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabs/plan.png')} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="recipes">
        <NativeTabs.Trigger.Label>Recipes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabs/recipes.png')} renderingMode="template" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}

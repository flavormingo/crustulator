import { calculate, decodeRecipe, recipeTitle } from '@crustulator/core'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Bookmark, Check } from 'iconoir-react-native'
import { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

import { Button } from '@/components/controls'
import { Logo } from '@/components/logo'
import { Body, Display } from '@/components/type'
import { WeighIn } from '@/components/weigh-in'
import { success, thud } from '@/lib/haptics'
import { useStore } from '@/state/store'
import { gutter, space } from '@/theme/tokens'
import { usePalette } from '@/theme/use-palette'

export default function SharedRecipeSheet() {
  const router = useRouter()
  const palette = usePalette()
  const { d } = useLocalSearchParams<{ d?: string }>()
  const { setRecipe, saveRecipe, preferences } = useStore()
  const [saved, setSaved] = useState(false)
  const shared = typeof d === 'string' ? decodeRecipe(d) : null

  if (!shared) {
    return (
      <View style={[styles.empty, { backgroundColor: palette.ground }]}>
        <Logo size={96} color={palette.line} />
        <Display size={24} color={palette.ink} style={styles.center}>This link has no dough in it</Display>
        <Body muted style={styles.center}>Ask for a fresh share link and try again.</Body>
        <Button label="Close" onPress={() => router.back()} />
      </View>
    )
  }

  const title = shared.name ?? recipeTitle(shared.recipe)
  const dough = calculate(shared.recipe)

  return (
    <ScrollView style={{ backgroundColor: palette.ground }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Body bold muted>Shared with you</Body>
        <Display size={30} color={palette.ink}>{title}</Display>
        {shared.name ? <Body muted>{recipeTitle(shared.recipe)}</Body> : null}
      </View>
      <WeighIn recipe={shared.recipe} dough={dough} preferences={preferences} />
      <View style={styles.actions}>
        <Button
          label="Use this dough"
          variant="solid"
          onPress={() => {
            thud()
            setRecipe(shared.recipe)
            router.dismissTo('/')
          }}
        />
        <Button
          label={saved ? 'Saved to recipes' : 'Save to recipes'}
          icon={saved ? Check : Bookmark}
          disabled={saved}
          onPress={() => {
            saveRecipe(title, shared.recipe)
            success()
            setSaved(true)
          }}
        />
      </View>
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
  header: {
    gap: space.xs,
  },
  actions: {
    gap: space.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    padding: gutter,
  },
  center: {
    textAlign: 'center',
  },
})

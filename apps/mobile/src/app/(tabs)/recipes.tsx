import { calculate, formatDuration, formatPercent, formatTotalWeight, planHours, recipeTitle, shareUrl, summaryText } from '@crustulator/core'
import { useRouter } from 'expo-router'
import { MoreHoriz, Plus } from 'iconoir-react-native'
import { ActionSheetIOS, Alert, Platform, Pressable, Share, StyleSheet, View } from 'react-native'

import { Button, RoundButton } from '@/components/controls'
import { Logo } from '@/components/logo'
import { Screen } from '@/components/screen'
import { Body, Display } from '@/components/type'
import { thud } from '@/lib/haptics'
import { useStore, type SavedRecipe } from '@/state/store'
import { space } from '@/theme/tokens'
import { usePalette } from '@/theme/use-palette'

export default function RecipesScreen() {
  const router = useRouter()
  const palette = usePalette()
  const { saved, setRecipe, removeSaved, updateSaved, preferences } = useStore()

  const load = (item: SavedRecipe) => {
    thud()
    setRecipe(item.recipe)
    router.navigate('/')
  }

  const share = (item: SavedRecipe) => {
    const url = shareUrl(item.recipe, item.name)
    const message = summaryText(item.recipe, calculate(item.recipe), preferences, item.name)
    Share.share(Platform.OS === 'ios' ? { message, url } : { message: `${message}\n\n${url}` }).catch(() => {})
  }

  const rename = (item: SavedRecipe) => {
    Alert.prompt('Rename', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Save', onPress: (name?: string) => name?.trim() && updateSaved(item.id, { name: name.trim() }) },
    ], 'plain-text', item.name)
  }

  const remove = (item: SavedRecipe) => {
    Alert.alert(`Delete ${item.name}?`, 'This removes it from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeSaved(item.id) },
    ])
  }

  const more = (item: SavedRecipe) => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: item.name,
        options: ['Use this dough', 'Rename', 'Share', 'Delete', 'Cancel'],
        destructiveButtonIndex: 3,
        cancelButtonIndex: 4,
        tintColor: palette.accent,
      },
      (index) => [load, rename, share, remove][index]?.(item),
    )
  }

  return (
    <Screen contentStyle={[styles.content, !saved.length && styles.grow]}>
      <Display size={36} accessibilityRole="header">Recipes</Display>
      {saved.length === 0 ? (
        <View style={styles.empty}>
          <Logo size={120} color={palette.line} />
          <Display size={26} color={palette.ink} style={styles.center}>No saved doughs yet</Display>
          <Body muted style={styles.center}>Dial in a dough and tap Save. It will be waiting here next time.</Body>
          <Button label="Make a dough" icon={Plus} variant="solid" onPress={() => router.navigate('/')} />
        </View>
      ) : (
        <View>
          {saved.map((item) => {
            const dough = calculate(item.recipe)
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}. Use this dough`}
                onPress={() => load(item)}
                onLongPress={() => more(item)}
                style={({ pressed }) => [styles.row, { borderTopColor: palette.line }, pressed && styles.pressed]}
              >
                <View style={styles.rowText}>
                  <Display size={22} color={palette.ink} numberOfLines={2}>{item.name}</Display>
                  <Body muted size={15}>{recipeTitle(item.recipe)}</Body>
                  <Body size={15}>
                    {`${formatTotalWeight(dough.total, preferences.weight)} of dough at ${formatPercent(item.recipe.hydration)} over ${formatDuration(planHours(item.recipe))}`}
                  </Body>
                </View>
                <RoundButton icon={MoreHoriz} label={`More for ${item.name}`} size={40} onPress={() => more(item)} />
              </Pressable>
            )
          })}
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: space.xl,
  },
  grow: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    paddingBottom: space.huge,
  },
  center: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: space.lg,
    borderTopWidth: 2,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.6,
  },
})

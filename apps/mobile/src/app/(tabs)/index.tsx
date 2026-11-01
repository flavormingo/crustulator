import { getStyle, recipeTitle, shareUrl, summaryText, warningCopy } from '@crustulator/core'
import { useRouter } from 'expo-router'
import { Bookmark, BookmarkSolid, NavArrowDown, Settings, ShareIos, Timer } from 'iconoir-react-native'
import { useRef, useState } from 'react'
import { Alert, Platform, Pressable, Share, StyleSheet, View } from 'react-native'

import { Button, IconButton } from '@/components/controls'
import { Logo } from '@/components/logo'
import { Notice } from '@/components/notice'
import { PeekBar } from '@/components/peek-bar'
import { Screen } from '@/components/screen'
import { Body, Display } from '@/components/type'
import { WeighIn } from '@/components/weigh-in'
import { FormulaSection } from '@/features/dough/formula-section'
import { ScheduleSection } from '@/features/dough/schedule-section'
import { SizeSection } from '@/features/dough/size-section'
import { TuningSection } from '@/features/dough/tuning-section'
import { YeastSection } from '@/features/dough/yeast-section'
import { success } from '@/lib/haptics'
import { useStore } from '@/state/store'
import { space } from '@/theme/tokens'
import { usePalette } from '@/theme/use-palette'

export default function DoughScreen() {
  const router = useRouter()
  const palette = usePalette()
  const { recipe, dough, preferences, saveRecipe } = useStore()
  const style = getStyle(recipe.style)
  const [savedName, setSavedName] = useState<string | null>(null)
  const [peek, setPeek] = useState(false)
  const threshold = useRef(Number.POSITIVE_INFINITY)

  const save = () => {
    Alert.prompt(
      'Save this dough',
      'Give it a name you will recognize later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (name?: string) => {
            const entry = saveRecipe(name ?? recipeTitle(recipe))
            success()
            setSavedName(entry.name)
            setTimeout(() => setSavedName(null), 2400)
          },
        },
      ],
      'plain-text',
      recipeTitle(recipe),
    )
  }

  const share = () => {
    const url = shareUrl(recipe)
    const message = summaryText(recipe, dough, preferences)
    Share.share(Platform.OS === 'ios' ? { message, url } : { message: `${message}\n\n${url}` }).catch(() => {})
  }

  return (
    <Screen
      contentStyle={styles.content}
      onScroll={(event) => setPeek(event.nativeEvent.contentOffset.y + event.nativeEvent.contentInset.top > threshold.current)}
      overlay={peek ? <PeekBar recipe={recipe} dough={dough} preferences={preferences} /> : null}
    >
      <View style={styles.topBar}>
        <Logo size={34} />
        <IconButton icon={Settings} label="Settings" onPress={() => router.push('/settings')} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${style.name}. Change pizza style`}
        onPress={() => router.push('/styles')}
        style={({ pressed }) => [styles.styleTrigger, pressed && styles.pressed]}
      >
        <View style={styles.styleName}>
          <Display size={40} numberOfLines={1} adjustsFontSizeToFit style={styles.shrink}>
            {style.name}
          </Display>
          <NavArrowDown width={30} height={30} color={palette.accent} strokeWidth={2.6} />
        </View>
        <Body italic muted size={18}>{style.tagline}</Body>
      </Pressable>

      <View
        onLayout={(event) => {
          threshold.current = event.nativeEvent.layout.y + event.nativeEvent.layout.height
        }}
      >
        <WeighIn recipe={recipe} dough={dough} preferences={preferences} />
      </View>

      {dough.warnings.map((warning) => (
        <Notice key={warning}>{warningCopy[warning]}</Notice>
      ))}

      <View style={styles.actions}>
        <Button label="Plan the bake" icon={Timer} variant="solid" onPress={() => router.navigate('/plan')} />
        <View style={styles.actionRow}>
          <Button
            label={savedName ? 'Saved' : 'Save'}
            icon={savedName ? BookmarkSolid : Bookmark}
            onPress={save}
            style={styles.grow}
          />
          <Button label="Share" icon={ShareIos} onPress={share} style={styles.grow} />
        </View>
      </View>

      <SizeSection />
      <YeastSection />
      <ScheduleSection />
      <FormulaSection />
      <TuningSection />
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: space.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  styleTrigger: {
    gap: space.sm,
  },
  styleName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  shrink: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.6,
  },
  actions: {
    gap: space.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: space.md,
  },
  grow: {
    flex: 1,
  },
})

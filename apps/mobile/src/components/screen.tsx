import type { ReactNode } from 'react'
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'

import { gutter, space } from '@/theme/tokens'
import { usePalette } from '@/theme/use-palette'

interface ScreenProps {
  children: ReactNode
  contentStyle?: StyleProp<ViewStyle>
  overlay?: ReactNode
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
}

export function Screen({ children, contentStyle, overlay, onScroll }: ScreenProps) {
  const insets = useSafeAreaInsets()
  const palette = usePalette()
  const fade = insets.top + 18

  return (
    <View style={[styles.root, { backgroundColor: palette.ground }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, contentStyle]}
        onScroll={onScroll}
        scrollEventThrottle={onScroll ? 32 : undefined}
      >
        {children}
      </ScrollView>
      <Svg pointerEvents="none" style={[styles.scrim, { height: fade }]}>
        <Defs>
          <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.ground} stopOpacity={1} />
            <Stop offset={insets.top / fade} stopColor={palette.ground} stopOpacity={0.94} />
            <Stop offset="1" stopColor={palette.ground} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height={fade} fill="url(#scrim)" />
      </Svg>
      {overlay}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: gutter,
    paddingTop: space.sm,
    paddingBottom: space.huge,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
})

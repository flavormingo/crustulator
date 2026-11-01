import { WarningTriangle } from 'iconoir-react-native'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { Body } from '@/components/type'
import { space, stroke } from '@/theme/tokens'
import { usePalette } from '@/theme/use-palette'

export function Notice({ children, action }: { children: string; action?: ReactNode }) {
  const palette = usePalette()
  return (
    <View style={[styles.root, { borderColor: palette.accent, backgroundColor: palette.raised }]} accessibilityRole="alert">
      <WarningTriangle width={22} height={22} color={palette.accent} strokeWidth={2} />
      <View style={styles.text}>
        <Body size={15}>{children}</Body>
        {action}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    borderRadius: 18,
    borderWidth: stroke,
  },
  text: {
    flex: 1,
    gap: space.md,
  },
})

import { Text, type TextProps } from 'react-native'

import { fonts } from '@/theme/tokens'
import { usePalette } from '@/theme/use-palette'

interface DisplayProps extends TextProps {
  size?: number
  color?: string
}

export function Display({ size = 34, color, style, ...props }: DisplayProps) {
  const palette = usePalette()
  return (
    <Text
      maxFontSizeMultiplier={1.3}
      {...props}
      style={[
        {
          fontFamily: fonts.wide,
          fontSize: size,
          lineHeight: Math.round(size * 1.12),
          letterSpacing: -size * 0.015,
          color: color ?? palette.accent,
          fontVariant: ['tabular-nums'],
        },
        style,
      ]}
    />
  )
}

interface BodyProps extends TextProps {
  size?: number
  bold?: boolean
  italic?: boolean
  muted?: boolean
  color?: string
}

export function Body({ size = 17, bold, italic, muted, color, style, ...props }: BodyProps) {
  const palette = usePalette()
  const family = bold ? (italic ? fonts.boldItalic : fonts.bold) : italic ? fonts.italic : fonts.regular
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      {...props}
      style={[
        {
          fontFamily: family,
          fontSize: size,
          lineHeight: Math.round(size * 1.35),
          color: color ?? (muted ? palette.muted : palette.ink),
        },
        style,
      ]}
    />
  )
}

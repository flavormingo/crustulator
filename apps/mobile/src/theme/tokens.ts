export const brand = {
  butter: '#FFF888',
  sauce: '#FB3A44',
  sauceDeep: '#C9202B',
  oven: '#2A0D0F',
} as const

export interface Palette {
  scheme: 'light' | 'dark'
  ground: string
  raised: string
  ink: string
  muted: string
  accent: string
  onAccent: string
  line: string
  faint: string
}

export const palettes: Record<'light' | 'dark', Palette> = {
  light: {
    scheme: 'light',
    ground: brand.butter,
    raised: '#FFFCC7',
    ink: '#4A1215',
    muted: '#7E4B3A',
    accent: brand.sauceDeep,
    onAccent: brand.butter,
    line: 'rgba(201, 32, 43, 0.35)',
    faint: 'rgba(74, 18, 21, 0.12)',
  },
  dark: {
    scheme: 'dark',
    ground: brand.oven,
    raised: '#3A1417',
    ink: brand.butter,
    muted: '#D9C98A',
    accent: brand.sauce,
    onAccent: brand.oven,
    line: 'rgba(251, 58, 68, 0.5)',
    faint: 'rgba(255, 248, 136, 0.14)',
  },
}

export const fonts = {
  wide: 'HKGroteskWide-ExtraBold',
  regular: 'HKGrotesk-Regular',
  italic: 'HKGrotesk-Italic',
  bold: 'HKGrotesk-Bold',
  boldItalic: 'HKGrotesk-BoldItalic',
} as const

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  huge: 48,
} as const

export const stroke = 2.5

export const gutter = 20

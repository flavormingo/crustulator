export type MixMethod = 'hand' | 'stand' | 'spiral' | 'processor'

export const frictionFactor: Record<MixMethod, number> = {
  hand: 2,
  stand: 12,
  spiral: 10,
  processor: 14,
}

export const mixMethodNames: Record<MixMethod, string> = {
  hand: 'By hand',
  stand: 'Stand mixer',
  spiral: 'Spiral mixer',
  processor: 'Food processor',
}

export interface WaterInput {
  doughTemp: number
  flourTemp: number
  roomTemp: number
  method: MixMethod
  prefermentTemp?: number | null
}

export function waterTemperature(input: WaterInput): number {
  const hasPreferment = typeof input.prefermentTemp === 'number'
  const factors = hasPreferment ? 4 : 3
  return (
    input.doughTemp * factors -
    input.flourTemp -
    input.roomTemp -
    frictionFactor[input.method] -
    (hasPreferment ? (input.prefermentTemp as number) : 0)
  )
}

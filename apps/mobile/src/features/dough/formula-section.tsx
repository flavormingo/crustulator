import { formatPercent, hydrationVibe } from '@crustulator/core'

import { Section } from '@/components/controls'
import { Ruler } from '@/components/ruler'
import { useStore } from '@/state/store'

export function FormulaSection() {
  const { recipe, setRecipe } = useStore()
  const vibe = hydrationVibe(recipe.hydration)
  const set = (key: 'hydration' | 'salt' | 'oil' | 'sugar') => (value: number) => setRecipe((current) => ({ ...current, [key]: value }))

  return (
    <Section title="The formula" collapsible>
      <Ruler
        label="Hydration"
        value={recipe.hydration}
        min={45}
        max={100}
        step={0.5}
        major={10}
        format={formatPercent}
        onChange={set('hydration')}
        note={`${vibe.label}. ${vibe.note}`}
      />
      <Ruler label="Salt" value={recipe.salt} min={0} max={5} step={0.1} major={10} format={formatPercent} onChange={set('salt')} />
      <Ruler label="Olive oil" value={recipe.oil} min={0} max={20} step={0.5} major={10} format={formatPercent} onChange={set('oil')} />
      <Ruler label="Sugar" value={recipe.sugar} min={0} max={6} step={0.25} major={4} format={formatPercent} onChange={set('sugar')} />
    </Section>
  )
}

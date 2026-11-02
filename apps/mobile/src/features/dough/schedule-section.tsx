import {
  applySchedule,
  formatDuration,
  limits,
  matchSchedule,
  patienceVibe,
  planHours,
  schedulePresets,
  type Stage,
  type StageStep,
} from '@crustulator/core'
import { Plus } from 'iconoir-react-native'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { Button, Chips, Section } from '@/components/controls'
import { Body } from '@/components/type'
import { StepRow } from '@/features/dough/step-row'
import { useStore } from '@/state/store'
import { space } from '@/theme/tokens'

export function ScheduleSection() {
  const { recipe, setRecipe, preferences } = useStore()
  const [openStep, setOpenStep] = useState<number | null>(null)
  const hours = planHours(recipe)
  const vibe = patienceVibe(hours)

  const updateStage = (index: number, patch: Partial<Stage>) =>
    setRecipe((current) => ({
      ...current,
      stages: current.stages.map((stage, stageIndex) => (stageIndex === index ? { ...stage, ...patch } : stage)),
    }))

  const removeStage = (index: number) => {
    setOpenStep((current) => (current === null || current < index ? current : current === index ? null : current - 1))
    setRecipe((current) => (current.stages.length > 1 ? { ...current, stages: current.stages.filter((_, stageIndex) => stageIndex !== index) } : current))
  }

  const addStage = () =>
    setRecipe((current) => {
      if (current.stages.length >= limits.stages[1]) return current
      const last = current.stages.at(-1)
      const step: StageStep = last?.step === 'bulk' ? 'balls' : (last?.step ?? 'balls')
      return { ...current, stages: [...current.stages, { step, hours: 2, temp: 22 }] }
    })

  return (
    <Section title="Schedule" aside={<Body bold muted>{formatDuration(hours)}</Body>}>
      <Chips
        label="Quick picks"
        value={matchSchedule(recipe)}
        options={schedulePresets.map((preset) => ({ value: preset.id, label: preset.name }))}
        onChange={(id) => setRecipe((current) => applySchedule(current, id))}
      />
      <View style={styles.steps}>
        {recipe.stages.map((stage, index) => (
          <StepRow
            key={index}
            stage={stage}
            preferences={preferences}
            canRemove={recipe.stages.length > 1}
            open={openStep === index}
            onToggle={() => setOpenStep(openStep === index ? null : index)}
            onChange={(patch) => updateStage(index, patch)}
            onRemove={() => removeStage(index)}
          />
        ))}
      </View>
      <Button
        label="Add a step"
        icon={Plus}
        size="small"
        disabled={recipe.stages.length >= limits.stages[1]}
        onPress={addStage}
        style={styles.add}
      />
      <Body muted>{`${vibe.label}. ${vibe.note}`}</Body>
    </Section>
  )
}

const styles = StyleSheet.create({
  steps: {
    gap: space.sm,
  },
  add: {
    alignSelf: 'flex-start',
  },
})

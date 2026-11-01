import {
  formatDuration,
  formatPercent,
  formatSpoons,
  formatTotalWeight,
  ingredientName,
  prefermentNames,
  warningCopy,
  weightNumber,
  type Dough,
  type Line,
  type Preferences,
  type Recipe,
} from '@crustulator/core'
import { WarningTriangle } from 'iconoir-react'
import type { ReactNode } from 'react'

function spoonHint(line: Line, recipe: Recipe, preferences: Preferences): string | null {
  if (line.key === 'salt') return formatSpoons(line.grams, preferences.salt)
  if (line.key === 'sugar') return formatSpoons(line.grams, 'sugar')
  if (line.key === 'oil') return formatSpoons(line.grams, 'oil')
  if (line.key === 'yeast' && (recipe.yeast === 'instant' || recipe.yeast === 'active')) return formatSpoons(line.grams, recipe.yeast)
  return null
}

function Lines({ lines, recipe, preferences }: { lines: Line[]; recipe: Recipe; preferences: Preferences }) {
  const unit = preferences.weight
  return (
    <dl>
      {lines.map((line) => {
        const hint = spoonHint(line, recipe, preferences)
        return (
          <div key={line.key}>
            <dt>
              {ingredientName(line.key, recipe)}
              <small>
                {formatPercent(line.percent)}
                {hint ? ` ≈ ${hint}` : ''}
              </small>
            </dt>
            <dd>
              <data value={Math.round(line.grams * 100) / 100}>{weightNumber(line.grams, unit)}</data>
              <abbr title={unit === 'g' ? 'grams' : 'ounces'}>{unit}</abbr>
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

interface WeighInProps {
  recipe: Recipe
  dough: Dough
  preferences: Preferences
  title?: string
  children?: ReactNode
}

export function WeighIn({ recipe, dough, preferences, title = 'Your dough', children }: WeighInProps) {
  const split = dough.groups.length > 1
  return (
    <aside aria-labelledby="weigh-in">
      <h2 id="weigh-in">{title}</h2>
      {dough.groups.map((group) =>
        split ? (
          <section key={group.key} aria-label={group.key === 'preferment' ? prefermentNames[recipe.preferment.type] : 'Final dough'}>
            <h3>
              {group.key === 'preferment'
                ? `${prefermentNames[recipe.preferment.type]}, ${formatDuration(recipe.preferment.hours)} ahead`
                : 'Final dough'}
            </h3>
            <Lines lines={group.lines} recipe={recipe} preferences={preferences} />
          </section>
        ) : (
          <Lines key={group.key} lines={group.lines} recipe={recipe} preferences={preferences} />
        ),
      )}
      <p>
        <strong>Total dough</strong>
        <output>{formatTotalWeight(dough.total, preferences.weight)}</output>
      </p>
      {dough.warnings.map((warning) => (
        <p key={warning} role="status">
          <WarningTriangle aria-hidden="true" />
          {warningCopy[warning]}
        </p>
      ))}
      {children}
    </aside>
  )
}

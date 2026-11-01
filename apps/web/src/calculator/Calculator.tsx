import {
  applyStyle,
  calculate,
  createSaved,
  defaultPreferences,
  defaultRecipe,
  formatDuration,
  formatOvenTemperature,
  formatWeight,
  ballWeight,
  getStyle,
  HOUR,
  nextBake,
  normalizeRecipe,
  parsePreferences,
  parseSaved,
  planHours,
  recipeTitle,
  saltNames,
  shareUrl,
  styles,
  summaryText,
  type Preferences,
  type Recipe,
  type SaltType,
  type StyleId,
} from '@crustulator/core'
import { Bookmark, NavArrowDown, ShareIos, Timer, Xmark } from 'iconoir-react'
import { useRef, useState } from 'react'

import { Choice } from './fields'
import { Plan } from './Plan'
import { FormulaFields, ScheduleFields, SizeFields, TuningFields, YeastFields } from './sections'
import { browserPreferences, readStored, usePersistent, writeStored } from './storage'
import { WeighIn } from './WeighIn'

interface CalculatorProps {
  style?: StyleId
}

export default function Calculator({ style: pageStyle }: CalculatorProps) {
  const initial = defaultRecipe(pageStyle)
  const [recipe, setRecipe, ready] = usePersistent<Recipe>(
    'recipe',
    initial,
    (stored) => (!stored ? initial : !pageStyle || stored.style === pageStyle ? stored : applyStyle(stored, pageStyle)),
    normalizeRecipe,
  )
  const [preferences, setPreferences] = usePersistent<Preferences>(
    'preferences',
    defaultPreferences,
    (stored) => stored ?? browserPreferences(),
    (value) => parsePreferences(value, browserPreferences()),
  )
  const [bake, setBake] = usePersistent<number>(
    'bake',
    0,
    (stored) => (stored && stored > Date.now() - 12 * HOUR ? stored : nextBake(planHours(initial))),
    (value) => (typeof value === 'number' ? value : 0),
  )
  const [message, setMessage] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const dough = calculate(recipe)
  const style = getStyle(recipe.style)
  const update = (next: (current: Recipe) => Recipe) => setRecipe(next)

  const say = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage((current) => (current === text ? '' : current)), 4000)
  }

  const choose = (id: StyleId) => {
    setRecipe((current) => applyStyle(current, id))
    if (pageStyle) window.history.replaceState(null, '', `/styles/${id}`)
  }

  const save = () => {
    const name = window.prompt('Name this dough', recipeTitle(recipe))
    if (name === null) return
    const saved = readStored('saved', parseSaved, [])
    const entry = createSaved(name, recipe)
    writeStored('saved', [entry, ...saved])
    say(`Saved “${entry.name}” to your recipes.`)
  }

  const share = async () => {
    const url = shareUrl(recipe, null, window.location.origin)
    const text = summaryText(recipe, dough, preferences)
    try {
      if (navigator.share) {
        await navigator.share({ title: recipeTitle(recipe), text, url })
        return
      }
      await navigator.clipboard.writeText(url)
      say('Link copied. Paste it anywhere to share this dough.')
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') say('Sharing did not work. Try copying the address bar instead.')
    }
  }

  const sectionProps = { recipe, dough, preferences, update }

  return (
    <article aria-labelledby="style-name">
      <header>
        <h1 id="style-name">
          <button type="button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
            {style.name}
            <NavArrowDown aria-hidden="true" />
          </button>
        </h1>
        <p>{style.tagline}</p>
      </header>

      <WeighIn recipe={recipe} dough={dough} preferences={preferences}>
        <menu>
          <li>
            <a href="#plan">
              <Timer aria-hidden="true" />
              Plan the bake
            </a>
          </li>
          <li>
            <button type="button" onClick={save}>
              <Bookmark aria-hidden="true" />
              Save
            </button>
          </li>
          <li>
            <button type="button" onClick={share}>
              <ShareIos aria-hidden="true" />
              Share
            </button>
          </li>
        </menu>
        <p aria-live="polite">{message}</p>
      </WeighIn>

      <form aria-label="Dough settings" onSubmit={(event) => event.preventDefault()}>
        <SizeFields {...sectionProps} />
        <YeastFields {...sectionProps} />
        <ScheduleFields {...sectionProps} />
        <FormulaFields {...sectionProps} />
        <TuningFields {...sectionProps} />
        <details>
          <summary>
            Units
            <NavArrowDown aria-hidden="true" />
          </summary>
          <Choice<Preferences['weight']>
            legend="Weight"
            name="weight"
            value={preferences.weight}
            options={[{ value: 'g', label: 'Grams' }, { value: 'oz', label: 'Ounces' }]}
            onChange={(weight) => setPreferences((current) => ({ ...current, weight }))}
          />
          <Choice<Preferences['temperature']>
            legend="Temperature"
            name="temperature"
            value={preferences.temperature}
            options={[{ value: 'c', label: 'Celsius' }, { value: 'f', label: 'Fahrenheit' }]}
            onChange={(temperature) => setPreferences((current) => ({ ...current, temperature }))}
          />
          <Choice<Preferences['length']>
            legend="Size"
            name="length"
            value={preferences.length}
            options={[{ value: 'cm', label: 'Centimeters' }, { value: 'in', label: 'Inches' }]}
            onChange={(length) => setPreferences((current) => ({ ...current, length }))}
          />
          <Choice<SaltType>
            legend="Salt for teaspoon estimates"
            name="salt"
            value={preferences.salt}
            options={(Object.keys(saltNames) as SaltType[]).map((value) => ({ value, label: saltNames[value] }))}
            onChange={(salt) => setPreferences((current) => ({ ...current, salt }))}
          />
        </details>
      </form>

      {ready ? <Plan recipe={recipe} dough={dough} preferences={preferences} bake={bake} onBakeChange={setBake} /> : null}

      <dialog ref={dialog} aria-labelledby="style-picker" onClick={(event) => event.target === dialog.current && dialog.current.close()}>
        <form method="dialog">
          <h2 id="style-picker">Pick a style</h2>
          <button type="submit" value="" aria-label="Close">
            <Xmark aria-hidden="true" />
          </button>
          <ul>
            {styles.map((item) => (
              <li key={item.id}>
                <button type="submit" value={item.id} aria-current={item.id === recipe.style ? 'true' : undefined} onClick={() => choose(item.id)}>
                  <strong>{item.name}</strong>
                  <small>{item.origin}</small>
                  <span>{item.tagline}</span>
                  <small>
                    {`${item.recipe.hydration}% hydration, ${formatDuration(planHours(item.recipe))}, ${formatOvenTemperature(item.oven.temp[1], preferences.temperature)} oven, ${formatWeight(ballWeight(item.recipe), preferences.weight)} ${item.recipe.shape.kind === 'pan' ? 'per pan' : 'per pizza'}`}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        </form>
      </dialog>
    </article>
  )
}

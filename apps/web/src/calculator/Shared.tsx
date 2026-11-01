import { calculate, createSaved, parsePreferences, parseSaved, readShareUrl, recipeTitle } from '@crustulator/core'
import { Bookmark, Check } from 'iconoir-react'
import { useState } from 'react'

import { browserPreferences, readStored, writeStored } from './storage'
import { WeighIn } from './WeighIn'

export default function Shared() {
  const [shared] = useState(() => readShareUrl(window.location.href))
  const [saved, setSaved] = useState(false)
  const preferences = readStored('preferences', (value) => parsePreferences(value, browserPreferences()), browserPreferences())

  if (!shared) {
    return (
      <article aria-labelledby="shared-title">
        <h1 id="shared-title">This link has no dough in it</h1>
        <p>Ask for a fresh share link and try again.</p>
        <p>
          <a href="/">Open the calculator</a>
        </p>
      </article>
    )
  }

  const title = shared.name ?? recipeTitle(shared.recipe)
  const dough = calculate(shared.recipe)

  const use = () => {
    writeStored('recipe', shared.recipe)
    window.location.assign(`/styles/${shared.recipe.style}`)
  }

  const save = () => {
    writeStored('saved', [createSaved(title, shared.recipe), ...readStored('saved', parseSaved, [])])
    setSaved(true)
  }

  return (
    <article aria-labelledby="shared-title">
      <header>
        <p>Shared with you</p>
        <h1 id="shared-title">{title}</h1>
        {shared.name ? <p>{recipeTitle(shared.recipe)}</p> : null}
      </header>
      <WeighIn recipe={shared.recipe} dough={dough} preferences={preferences} title="Ingredients">
        <menu>
          <li>
            <button type="button" onClick={use}>
              Use this dough
            </button>
          </li>
          <li>
            <button type="button" onClick={save} disabled={saved}>
              {saved ? <Check aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
              {saved ? 'Saved to your recipes' : 'Save to my recipes'}
            </button>
          </li>
        </menu>
      </WeighIn>
    </article>
  )
}

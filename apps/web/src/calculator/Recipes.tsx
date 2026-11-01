import {
  calculate,
  formatDuration,
  formatPercent,
  formatTotalWeight,
  parsePreferences,
  parseSaved,
  planHours,
  recipeTitle,
  shareUrl,
  type SavedRecipe,
} from '@crustulator/core'
import { Bin, EditPencil, Plus, ShareIos } from 'iconoir-react'
import { useState } from 'react'

import { browserPreferences, readStored, writeStored } from './storage'

const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

export default function Recipes() {
  const [saved, setSaved] = useState<SavedRecipe[]>(() => readStored('saved', parseSaved, []))
  const [message, setMessage] = useState('')
  const preferences = readStored('preferences', (value) => parsePreferences(value, browserPreferences()), browserPreferences())

  const persist = (next: SavedRecipe[]) => {
    setSaved(next)
    writeStored('saved', next)
  }

  const use = (item: SavedRecipe) => {
    writeStored('recipe', item.recipe)
    window.location.assign('/')
  }

  const rename = (item: SavedRecipe) => {
    const name = window.prompt('Rename this dough', item.name)?.trim()
    if (name) persist(saved.map((entry) => (entry.id === item.id ? { ...entry, name, updated: Date.now() } : entry)))
  }

  const share = async (item: SavedRecipe) => {
    const url = shareUrl(item.recipe, item.name, window.location.origin)
    try {
      if (navigator.share) await navigator.share({ title: item.name, url })
      else {
        await navigator.clipboard.writeText(url)
        setMessage(`Link to “${item.name}” copied.`)
      }
    } catch {}
  }

  const remove = (item: SavedRecipe) => {
    if (window.confirm(`Delete “${item.name}” from this browser?`)) persist(saved.filter((entry) => entry.id !== item.id))
  }

  return (
    <article aria-labelledby="recipes-title">
      <h1 id="recipes-title">Recipes</h1>
      {saved.length === 0 ? (
        <section aria-labelledby="recipes-empty">
          <h2 id="recipes-empty">No saved doughs yet</h2>
          <p>Dial in a dough and press Save. It will be waiting here the next time you visit in this browser.</p>
          <p>
            <a href="/">
              <Plus aria-hidden="true" />
              Make a dough
            </a>
          </p>
        </section>
      ) : (
        <ul>
          {saved.map((item) => {
            const dough = calculate(item.recipe)
            return (
              <li key={item.id}>
                <h2>{item.name}</h2>
                <p>{recipeTitle(item.recipe)}</p>
                <p>{`${formatTotalWeight(dough.total, preferences.weight)} of dough at ${formatPercent(item.recipe.hydration)} hydration over ${formatDuration(planHours(item.recipe))}`}</p>
                <p>
                  Saved <time dateTime={new Date(item.created).toISOString()}>{dateFormat.format(item.created)}</time>
                </p>
                <menu>
                  <li>
                    <button type="button" onClick={() => use(item)}>Use this dough</button>
                  </li>
                  <li>
                    <button type="button" onClick={() => rename(item)}>
                      <EditPencil aria-hidden="true" />
                      Rename
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => share(item)}>
                      <ShareIos aria-hidden="true" />
                      Share
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => remove(item)}>
                      <Bin aria-hidden="true" />
                      Delete
                    </button>
                  </li>
                </menu>
              </li>
            )
          })}
        </ul>
      )}
      <p aria-live="polite">{message}</p>
    </article>
  )
}

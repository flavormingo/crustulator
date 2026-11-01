import { Bell, Bookmark, ShareIos, Xmark } from 'iconoir-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { readStored, writeStored } from './storage'

const APP_STORE_URL = ''
const SITE_URL = 'https://crustulator.app'
const SEEN_KEY = 'promo'
const SEEN_VERSION = 1
const DELAY = 1400

export default function AppPromo({ children }: { children?: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const seen = readStored<number>(SEEN_KEY, (value) => (typeof value === 'number' ? value : 0), 0)
    if (seen >= SEEN_VERSION) return
    const timer = window.setTimeout(() => {
      writeStored(SEEN_KEY, SEEN_VERSION)
      setReady(true)
    }, DELAY)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!ready || !dialog.current) return
    dialog.current.showModal()
    dialog.current.focus()
  }, [ready])

  if (!ready) return null

  return (
    <dialog ref={dialog} tabIndex={-1} aria-labelledby="promo-title" onClick={(event) => event.target === dialog.current && dialog.current.close()}>
      <article>
        {children}
        <h2 id="promo-title">Download the app</h2>
        <ul>
          <li>
            <Bell aria-hidden="true" />
            Reminders for prep steps
          </li>
          <li>
            <Bookmark aria-hidden="true" />
            Recipes right from your pocket
          </li>
          <li>
            <ShareIos aria-hidden="true" />
            Share your ideas wherever you chat
          </li>
        </ul>
        <menu>
          <li>
            <a href={APP_STORE_URL || SITE_URL}>{APP_STORE_URL ? 'Get it on the App Store' : 'Get the iPhone app'}</a>
          </li>
          <li>
            <button type="button" onClick={() => dialog.current?.close()}>
              Keep using the web app
            </button>
          </li>
        </menu>
        <button type="button" aria-label="Close" onClick={() => dialog.current?.close()}>
          <Xmark aria-hidden="true" />
        </button>
      </article>
    </dialog>
  )
}

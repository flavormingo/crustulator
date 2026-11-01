import react from '@astrojs/react'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://crustulator.app',
  integrations: [react()],
  server: { port: 4322 },
})

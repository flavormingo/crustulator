import react from '@astrojs/react'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://crustulator.com',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  integrations: [react()],
  devToolbar: {
    enabled: false,
  },
})

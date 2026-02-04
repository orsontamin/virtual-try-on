import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['ai.eventzflow.com']
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
    css: true,
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const api = `http://localhost:${process.env.API_PORT || 8000}`

export default defineConfig({
  plugins: [react()],
  server: { port: Number(process.env.PORT) || 5173, proxy: { '/api': api } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
    css: false,
    server: { deps: { inline: [/@carbon/] } },
    alias: [{ find: /^@carbon\/react$/, replacement: '@carbon/react/es/index.js' }],
  },
})

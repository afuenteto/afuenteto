import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base relativa: funciona tanto en localhost como en GitHub Pages
// (https://usuario.github.io/nombre-repo/) sin tener que tocar nada.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true,
  },
})

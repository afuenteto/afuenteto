import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const resolvePath = path => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  base: './',
  server: { port: 5174, strictPort: true },
  preview: { port: 4174, strictPort: true },
  build: {
    rollupOptions: {
      input: {
        main: resolvePath('./index.html'),
        descarga: resolvePath('./descarga.html'),
      },
    },
  },
})

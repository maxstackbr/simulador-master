import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Para GitHub Pages em subpasta: BASE_PATH=/nome-do-repo/ npm run build
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? '/',
})

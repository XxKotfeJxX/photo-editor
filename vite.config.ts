import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Use relative paths so the build works on GitHub Pages/subfolders
  base: './',
  // Emit into docs/ so GitHub Pages can serve it directly
  build: {
    outDir: 'docs',
  },
  plugins: [react()],
})

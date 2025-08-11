import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set the base to "/<REPO>/" for GitHub Pages project sites.
const base = process.env.VITE_BASE || '/' // replace in CI for Pages

export default defineConfig({
  plugins: [react()],
  base,
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// `base` must match the repository name so assets resolve correctly when
// served from https://<user>.github.io/dailyTilawah/.
export default defineConfig({
  base: '/dailyTilawah/',
  plugins: [react()],
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// `base` is the path the app is served from. Defaults to the GitHub Pages
// project path so https://<user>.github.io/dailyTilawah/ keeps working; set
// VITE_BASE=/ in the Cloudflare Pages build so the custom domain serves at root.
export default defineConfig({
  base: process.env.VITE_BASE || '/dailyTilawah/',
  plugins: [react()],
})

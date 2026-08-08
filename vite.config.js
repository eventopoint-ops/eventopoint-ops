import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // autoUpdate: the service worker swaps in a new version in the
      // background and takes over on next load -- no more "rename the JS
      // bundle or Netlify silently skips the deploy" workaround needed.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-16.png', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'EVENToPOINT.ops',
        short_name: 'EVENToPOINT',
        description:
          'Real-time event operations OS. AI run-of-show, team coordination, staff check-in.',
        theme_color: '#0D0D0D',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache only the built app shell (JS/CSS/HTML/icons) so the
        // standard SPA navigate-fallback covers every path, including
        // /checkin/:token (useful if staff open the link on spotty venue
        // wifi). Supabase API calls are intentionally left un-cached
        // (NetworkOnly is the default for anything not matched below) --
        // this is a live multi-tenant data app, stale cached reads of
        // another session's data would be a real bug, not a convenience.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})

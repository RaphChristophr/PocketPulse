import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), VitePWA({
    injectRegister: null,
    useCredentials: true,
    manifest: {
      name: 'PocketPulse',
      short_name: 'PocketPulse',
      description: 'Catatan keuangan dan budget pribadi',
      lang: 'id',
      theme_color: '#f7f7f9',
      background_color: '#f7f7f9',
      display: 'standalone',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    workbox: { importScripts: ['/push-reminders.js'], globPatterns: ['**/*.{js,css,html}'], cleanupOutdatedCaches: true, clientsClaim: true },
  })],
})

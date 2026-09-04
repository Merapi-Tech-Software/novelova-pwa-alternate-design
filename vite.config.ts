import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // injectManifest: service worker ditulis tangan di src/sw.ts, Workbox hanya
      // menyuntikkan daftar precache. Strategi lengkapnya di architecture.md §10.2.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: null,
      manifest: {
        name: 'Novelova',
        short_name: 'Novelova',
        description: 'Baca novel Indonesia, satu bab setiap hari.',
        lang: 'id',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#d09a93',
        background_color: '#f4efea',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'Perpustakaan', url: '/pustaka' },
          { name: 'Isi Koin', url: '/koin' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
      devOptions: { enabled: true, type: 'module' },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    // Seam API memilih implementasinya lewat `await import()` di tingkat modul
    // (`api/client.ts`), dan target bawaan Vite ("baseline") masih melarang
    // top-level await. `es2022` adalah target pertama yang mengizinkannya:
    // Chrome 89+, Edge 89+, Firefox 89+, Safari 15+ — semuanya sudah lama jadi
    // syarat minimum PWA ini.
    target: 'es2022',
  },
  server: { port: 5173, host: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    css: false,
  },
})

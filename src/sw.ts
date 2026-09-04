/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

// App shell: precache + CacheFirst (architecture.md §10.2).
precacheAndRoute(self.__WB_MANIFEST)

// Update tidak pernah skipWaiting diam-diam — layar tidak boleh berubah di tengah
// bab. Halaman mengirim SKIP_WAITING setelah pengguna menekan "Muat ulang".
self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | undefined)?.type === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})

// ponytail: hanya precache app shell untuk sekarang. Runtime caching per-jenis
// (font CacheFirst, cover StaleWhileRevalidate, isi bab CacheFirst, navigasi →
// offline.html) menyusul di Fase 14 bersama Background Sync — lihat §10.2/§10.3.

/// <reference lib="webworker" />
import { BackgroundSyncPlugin } from 'workbox-background-sync'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import type { WorkboxPlugin } from 'workbox-core'
import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import { matchPrecache, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute, setCatchHandler } from 'workbox-routing'
import { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

/**
 * Pembungkus tipe untuk plugin Workbox.
 *
 * `exactOptionalPropertyTypes: true` menolaknya: kelas-kelas plugin Workbox
 * mendeklarasikan kaitnya sebagai properti opsional yang **boleh bernilai
 * `undefined`**, sementara antarmuka `WorkboxPlugin` menuntut properti yang ada
 * itu bertipe fungsi. Keduanya benar; yang bentrok cuma ketegasan opsionalnya.
 *
 * Satu tempat, bukan satu `as` per pemakaian — dan kalau Workbox kelak
 * memperbaiki tipenya, yang dihapus satu fungsi.
 */
function plugin(p: object): WorkboxPlugin {
  return p as WorkboxPlugin
}

/**
 * Service worker · architecture.md §10.2 · §10.3 · §10.4.
 *
 * Ditulis tangan (`injectManifest`), bukan `generateSW`: strateginya berbeda per
 * jenis aset, dan dua di antaranya punya aturan yang tidak bisa dinyatakan lewat
 * konfigurasi — **mutasi tidak pernah dicache**, dan **update tidak pernah
 * `skipWaiting` diam-diam**.
 */

/**
 * Mengambil alih halaman yang **sudah terbuka** saat aktif · §10.2.
 *
 * Ini bukan `skipWaiting`, dan keduanya sering dikira sama. Service worker baru
 * tetap **menunggu** sampai pengguna menekan "Muat ulang" — janji "tidak ada
 * update diam-diam" utuh. Yang berubah cuma pemasangan **pertama**: tanpa ini ia
 * baru mengendalikan apa pun pada kunjungan berikutnya, jadi pembaca yang
 * memasang aplikasi lalu langsung kehilangan sinyal tidak dilindungi apa pun —
 * padahal itulah kunjungan yang paling mungkin diikuti perjalanan.
 */
clientsClaim()

// ── app shell ───────────────────────────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST)

const OFFLINE_URL = '/offline.html'

/**
 * Update **tidak pernah `skipWaiting` sendiri** — layar tidak boleh berubah di
 * tengah bab. Halaman mengirim pesan ini setelah pengguna menekan "Muat ulang".
 */
self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | undefined)?.type === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})

// `offline.html` masuk cache saat SW dipasang, bukan saat dibutuhkan: yang
// dibutuhkan saat jaringan mati tidak bisa diambil saat jaringan mati.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('nv-offline').then((cache) => cache.add(OFFLINE_URL)))
})

// ── font · CacheFirst, satu tahun ──────────────────────────────────────────
// Self-host dan ber-hash; isinya tidak pernah berubah untuk URL yang sama.
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'nv-font',
    plugins: [plugin(new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }))],
  }),
)

// ── sampul & gambar · StaleWhileRevalidate, maks 200 ───────────────────────
// Boleh sedikit basi: sampul yang tertinggal satu versi tetap sampul yang benar.
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'nv-gambar',
    plugins: [
      plugin(new CacheableResponsePlugin({ statuses: [0, 200] })),
      plugin(new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 })),
    ],
  }),
)

/**
 * Mutasi **tidak pernah dicache**, dan yang gagal karena offline diantre ·
 * §10.2.
 *
 * `NetworkOnly` + Background Sync: uang tidak boleh disajikan dari cache, tetapi
 * permintaan yang gagal karena sinyal putus juga tidak boleh hilang begitu saja.
 * Antreannya coba lagi sendiri saat jaringan kembali — pengguna tidak menekan
 * apa pun.
 *
 * Didaftarkan **sebelum** rute `GET` di bawah karena Workbox memakai yang
 * pertama cocok.
 */
registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/') && request.method !== 'GET',
  new NetworkOnly({
    plugins: [plugin(new BackgroundSyncPlugin('nv-mutasi', { maxRetentionTime: 24 * 60 }))],
  }),
  'POST',
)

// ── isi bab · CacheFirst ───────────────────────────────────────────────────
// Baca offline adalah nilai utama PWA untuk aplikasi novel (§10.3), dan bab yang
// sudah pernah dibuka **wajib** tetap terbaca (FR-CORE-03).
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/chapters/') && url.pathname.endsWith('/content'),
  new CacheFirst({
    cacheName: 'nv-bab',
    plugins: [
      plugin(new CacheableResponsePlugin({ statuses: [0, 200] })),
      // Batas 50 bab, LRU — Workbox membuang yang paling lama tidak dipakai.
      plugin(new ExpirationPlugin({ maxEntries: 50, purgeOnQuotaError: true })),
    ],
  }),
)

// ── GET discovery · NetworkFirst, timeout 3 detik ──────────────────────────
// Feed boleh basi saat sinyal buruk; yang tidak boleh adalah menunggu selamanya.
registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
  new NetworkFirst({
    cacheName: 'nv-api',
    networkTimeoutSeconds: 3,
    plugins: [plugin(new CacheableResponsePlugin({ statuses: [0, 200] }))],
  }),
)

/**
 * Navigasi yang gagal jatuh ke `offline.html`, **bukan layar error peramban** ·
 * §10.2.
 *
 * `NetworkFirst` lebih dulu supaya halaman selalu segar saat online; yang
 * menangkap kegagalannya `setCatchHandler` di bawah.
 */
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'nv-navigasi',
      networkTimeoutSeconds: 3,
    }),
  ),
)

/**
 * Navigasi yang gagal jatuh ke **kerangka aplikasi** dulu, `offline.html`
 * belakangan · §10.2 · §10.3.
 *
 * Urutannya penting, dan sempat terbalik. Rute dalam seperti
 * `/cerita/s1/bab/s1-c5` adalah entri cache tersendiri bagi `NetworkFirst`, jadi
 * membuka bab tersimpan **langsung dari layar utama ponsel** — yang justru cara
 * paling wajar memakainya — dulu berakhir di `offline.html`: halaman yang
 * menawarkan "buka bab tersimpan" padahal bab itulah yang sedang diminta.
 *
 * Kerangkanya sudah ada di precache, dan begitu ia jalan, routernya sendiri yang
 * menangani URL-nya — beserta layar offline aplikasi yang bisa menyebut bab mana
 * saja yang tersimpan. `offline.html` tetap ada untuk keadaan yang benar-benar
 * terakhir: service worker sudah terpasang tetapi kerangkanya tidak ada.
 */
setCatchHandler(async ({ request }) => {
  if (request.mode === 'navigate') {
    const shell = await matchPrecache('/index.html')
    if (shell) return shell
    const cached = await caches.match(OFFLINE_URL)
    if (cached) return cached
  }
  return Response.error()
})

// ── push · §10.4 · FR-NOTIF-05 ─────────────────────────────────────────────

interface PushIsi {
  title: string
  body: string
  deepLink: string
  tag?: string
}

self.addEventListener('push', (event) => {
  if (!event.data) return

  let isi: PushIsi
  try {
    isi = event.data.json() as PushIsi
  } catch {
    // Payload yang tidak terbaca tetap jadi notifikasi, bukan senyap: pengguna
    // yang tidak diberi tahu apa pun tidak punya cara tahu ada yang salah.
    isi = { title: 'Novelova', body: event.data.text(), deepLink: '/notifikasi' }
  }

  event.waitUntil(
    self.registration.showNotification(isi.title, {
      body: isi.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      // `tag` menggabungkan push sejenis di baki notifikasi, sejalan dengan
      // penggabungan 24 jam di server-mock (FR-NOTIF-02).
      ...(isi.tag ? { tag: isi.tag } : {}),
      data: { deepLink: isi.deepLink },
    }),
  )
})

/**
 * Menekan push membuka **tujuan spesifiknya**, bukan beranda · FR-NOTIF-05.
 *
 * Kalau aplikasinya sudah terbuka, tabnya difokuskan dan diarahkan lewat pesan —
 * membuka tab kedua untuk aplikasi yang sudah berjalan adalah cara tercepat
 * kehilangan posisi baca.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const tujuan = (event.notification.data as { deepLink?: string } | undefined)?.deepLink ?? '/'

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of clients) {
        if ('focus' in client) {
          client.postMessage({ type: 'NAVIGATE', to: tujuan })
          return client.focus()
        }
      }
      return self.clients.openWindow(tujuan)
    })(),
  )
})

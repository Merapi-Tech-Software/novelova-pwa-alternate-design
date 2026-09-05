import { registerSW } from 'virtual:pwa-register'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initApi } from './api/client'
import { applyReaderSettings } from './stores/readerSettings'
import './styles/base.css'

// Pengaturan baca dipasang **sebelum** React merender apa pun (FR-READ-04):
// pembaca bertema gelap tidak boleh melihat kedipan putih tiap membuka aplikasi.
applyReaderSettings()

const root = document.getElementById('root')
if (!root) throw new Error('#root tidak ditemukan di index.html')

/*
 * Seam API dimuat **sebelum** render pertama, dan sengaja lewat `.then()` —
 * bukan `await` di tingkat modul. Top-level `await` di sini akan menghidupkan
 * kembali lingkar chunk yang mematikan seluruh build produksi (lihat
 * `api/client.ts`); `.then()` melakukan hal yang sama tanpa membuat modul ini
 * jadi modul asinkron.
 */
void initApi().then(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

// SW tidak pernah mengambil alih diam-diam — layar tidak boleh berubah di tengah
// bab (architecture.md §10.2).
// ponytail: untuk sekarang pembaruan hanya dicatat. Toast "Versi baru tersedia —
// Muat ulang" menyusul di Fase 14, saat ToastProvider sudah ada.
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.warn('[pwa] versi baru siap; menunggu pengguna memuat ulang')
  },
})

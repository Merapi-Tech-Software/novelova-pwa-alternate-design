import { registerSW } from 'virtual:pwa-register'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initApi } from './api/client'
import { usePwa } from './stores/pwa'
import { applyReaderSettings } from './stores/readerSettings'
import './styles/base.css'

// Pengaturan baca dipasang **sebelum** React merender apa pun (FR-READ-04):
// pembaca bertema gelap tidak boleh melihat kedipan putih tiap membuka aplikasi.
applyReaderSettings()

/*
 * Berapa kali aplikasi ini dibuka di perangkat ini · dipakai ajakan "Pasang
 * aplikasi" di profil, yang baru muncul setelah tiga kunjungan.
 *
 * Di sini, bukan di React: `StrictMode` merender dua kali di pengembangan, dan
 * penghitung yang hidup di dalam efek akan naik dua per kunjungan. Kegagalan
 * menulis (mode privat, kuota penuh) ditelan — ajakan yang tidak muncul jauh
 * lebih murah daripada aplikasi yang tidak menyala.
 */
try {
  const kunci = 'novelova:visit-count'
  const lalu = Number.parseInt(localStorage.getItem(kunci) ?? '0', 10) || 0
  localStorage.setItem(kunci, String(lalu + 1))
} catch {
  // sengaja diabaikan
}

const root = document.getElementById('root')
if (!root) throw new Error('#root tidak ditemukan di index.html')

/*
 * Seam API dimuat **sebelum** render pertama, dan sengaja lewat `.then()` —
 * bukan `await` di tingkat modul. Top-level `await` di sini akan menghidupkan
 * kembali lingkar chunk yang mematikan seluruh build produksi (lihat
 * `api/client.ts`); `.then()` melakukan hal yang sama tanpa membuat modul ini
 * jadi modul asinkron.
 */
/**
 * Layar gagal terakhir · architecture.md §1.4 · §1.32.
 *
 * DOM polos, tanpa React dan tanpa token: yang dijaga di sini justru keadaan
 * ketika lapisan-lapisan itu tidak bisa dipakai. Kalimatnya tetap tiga hal
 * berurutan — apa yang terjadi, apakah yang tersimpan aman, satu tindakan.
 */
function layarGagal(kode: string): void {
  if (!root || root.innerHTML.length > 0) return
  // Token, bukan hex — `base.css` adalah `<link>` tersendiri dan tetap terpasang
  // walau JS gagal. Kalau ia pun gagal, layarnya jadi hitam-putih bawaan
  // peramban: tidak indah, tetap terbaca.
  root.innerHTML = `
    <div style="min-height:100dvh;display:grid;place-items:center;padding:24px;text-align:center;font:500 14px/1.55 system-ui,sans-serif;color:var(--nv-text);background:var(--nv-bg)">
      <div style="max-width:30rem">
        <h1 style="margin:0 0 8px;font:600 24px/1.2 Georgia,serif">Aplikasi gagal dimulai</h1>
        <p style="margin:0 0 6px;color:var(--nv-text-2)">Peramban ini tidak bisa membuka penyimpanan lokal Novelova.</p>
        <p style="margin:0 0 6px;color:var(--nv-gold);font-weight:600">Bacaan dan saldomu tidak hilang — semuanya tersimpan di akunmu.</p>
        <a href="/" style="display:inline-flex;min-height:44px;align-items:center;margin-top:20px;padding:0 20px;border-radius:999px;background:var(--nv-accent);color:var(--nv-card);font-weight:700;text-decoration:none">Coba lagi</a>
        <p style="margin-top:18px;font-size:12px;color:var(--nv-muted)">${kode}</p>
      </div>
    </div>`
}

/*
 * **Layar putih tanpa error adalah kegagalan terburuk yang mungkin** — §1.32
 * pernah membiarkannya hidup selama satu fase penuh. Karena itu seam API di
 * sini tidak cuma di-`then`: penolakannya ditangkap, dan diamnya diberi batas
 * waktu.
 *
 * Batas waktunya nyata, bukan teoretis: di mesin WebKit yang tidak mendukung
 * indeks IndexedDB majemuk/multiEntry, `seedIfNeeded()` tidak melempar apa pun —
 * ia **menggantung**, dan tanpa batas ini aplikasinya diam selamanya dengan nol
 * pesan di konsol. Terukur di Playwright WebKit saat audit Fase 14.
 */
const BATAS_MULAI_MS = 20_000
const jamPasir = setTimeout(() => layarGagal('APP-INIT-TIMEOUT'), BATAS_MULAI_MS)

void initApi()
  .then(() => {
    clearTimeout(jamPasir)
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  .catch((error: unknown) => {
    clearTimeout(jamPasir)
    console.error('[novelova] seam API gagal dimuat', error)
    layarGagal('APP-INIT-FAILED')
  })

/*
 * SW tidak pernah mengambil alih diam-diam — layar tidak boleh berubah di tengah
 * bab (architecture.md §10.2).
 *
 * `registerSW` mengembalikan fungsi yang **benar-benar menerapkan** pembaruannya;
 * ia disimpan ke store supaya `PwaBridge` bisa menawarkannya lewat toast. Yang
 * memutuskan kapan halaman berganti tetap pengguna.
 */
const terapkanUpdate = registerSW({
  immediate: true,
  onNeedRefresh() {
    usePwa.getState().setUpdateSiap(() => {
      void terapkanUpdate(true)
    })
  },
})

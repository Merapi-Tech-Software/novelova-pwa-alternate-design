/**
 * Pemeriksaan hasil **build**, bukan server dev.
 *
 * Ada karena satu cacat yang mahal: `api/client.ts` dulu memuat implementasinya
 * lewat top-level `await`, dan di bundel produksi itu membentuk lingkar chunk
 * (entry → client → mock → entry) yang tidak pernah selesai dievaluasi. Hasilnya
 * halaman putih dengan **nol error di konsol** dan seluruh berkas JS berstatus
 * 200 — dan 83 test e2e tidak melihatnya sama sekali, karena `playwright.config`
 * menjalankan `npm run dev`.
 *
 * Yang diperiksa di sini sengaja sedikit dan kasar: apakah aplikasinya
 * **benar-benar terpasang** dari `dist/`, dan apakah halaman dev ikut terkirim.
 * Sisanya sudah dijaga suite e2e.
 *
 * Jalankan: `npm run check:build`
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { chromium } from '@playwright/test'

// Jalur langsung, bukan `require.resolve`: `vite/bin/vite.js` tidak ada di
// `exports` paketnya, jadi resolver ESM menolaknya. Skrip ini selalu dijalankan
// dari akar proyek lewat npm.
const VITE_BIN = 'node_modules/vite/bin/vite.js'

// Port sendiri: tunnel Cloudflare memakai 1311, dan pemeriksaan ini tidak boleh
// merebutnya dari `vite preview` yang sedang menyajikan aplikasi ke publik.
const PORT = 4311
const BASE = `http://localhost:${PORT}`

if (!existsSync('dist/index.html')) {
  console.error('dist/ belum ada — jalankan `npm run build` lebih dulu.')
  process.exit(1)
}

const gagal = []

// 1. Halaman dev tidak boleh ikut ke bundel publik.
const devChunks = readdirSync('dist/assets').filter((f) => /kitchen/i.test(f))
if (devChunks.length > 0) gagal.push(`halaman dev ikut terkirim: ${devChunks.join(', ')}`)

/*
 * Vite dipanggil **langsung lewat node**, tanpa `npx` dan tanpa shell.
 *
 * Dengan shell, `server.pid` adalah pid `cmd.exe`, dan begitu shell itu keluar
 * lebih dulu, `taskkill /T` tidak menemukan anak yang harus ikut mati — proses
 * `vite preview`-nya tetap hidup memegang portnya. Terukur dua kali sebelum
 * cara ini dipakai. Tanpa shell, pid yang dipegang adalah pid Vite itu sendiri.
 */
const server = spawn(
  process.execPath,
  [VITE_BIN, 'preview', '--port', String(PORT), '--strictPort'],
  {
    stdio: 'ignore',
  },
)

/**
 * Mematikan server preview **beserta anak-anaknya**.
 *
 * `server.kill()` saja tidak cukup di Windows: `shell: true` membuat yang
 * dibunuh cuma `cmd.exe`-nya, dan `vite preview` di dalamnya tetap hidup
 * memegang portnya. Terukur — pemeriksaan ini pernah meninggalkan satu proses
 * yatim di 4311 setelah selesai.
 *
 * `spawnSync`, bukan `spawn`: skrip ini memanggil `process.exit()` tepat
 * sesudahnya, dan `taskkill` yang asinkron ikut mati sebelum sempat bekerja —
 * terukur, percobaan pertama tetap meninggalkan yatimnya.
 */
function matikan(proc) {
  if (proc.pid === undefined) return
  if (process.platform === 'win32') {
    // `/T` ikut anak-anaknya, `/F` paksa.
    spawnSync('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { stdio: 'ignore' })
  } else {
    proc.kill()
  }
}

/** Menunggu server preview menjawab, bukan menunggu waktu tetap. */
async function tungguSiap() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const r = await fetch(BASE, { signal: AbortSignal.timeout(1000) })
      if (r.ok) return true
    } catch {
      /* belum siap */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

let kode = 0
try {
  if (!(await tungguSiap())) throw new Error(`vite preview tidak menjawab di ${BASE}`)

  const browser = await chromium.launch()
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 })
  // Aplikasi ini memuat seam API-nya sebelum render pertama, jadi `#root` terisi
  // satu tick setelah jaringan tenang.
  await page
    .waitForFunction(() => (document.getElementById('root')?.innerHTML.length ?? 0) > 0, {
      timeout: 15_000,
    })
    .catch(() => {})

  const isi = await page.evaluate(() => document.getElementById('root')?.innerHTML.length ?? 0)
  if (isi === 0) {
    gagal.push('#root kosong — aplikasi tidak terpasang dari hasil build')
  }
  if (errors.length > 0) gagal.push(`error saat memuat: ${errors.join(' | ')}`)

  await browser.close()
} catch (error) {
  gagal.push(String(error instanceof Error ? error.message : error))
} finally {
  matikan(server)
}

if (gagal.length > 0) {
  for (const g of gagal) console.error(`✗ ${g}`)
  kode = 1
} else {
  console.log('✓ build: aplikasi terpasang dari dist/, halaman dev tidak ikut terkirim')
}

process.exit(kode)

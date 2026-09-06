import { expect, test } from '@playwright/test'

/**
 * Alur kritis #4 · Fase 14 · FR-CORE-03 · architecture.md §10.3.
 *
 * *"Instal PWA → putus jaringan → baca bab tersimpan."*
 *
 * **Apa yang benar-benar dibuktikan di sini, dan apa yang tidak.** Pemasangan
 * PWA sungguhan tidak bisa diotomatiskan — `beforeinstallprompt` milik peramban,
 * bukan halaman, dan Chromium headless tidak memunculkannya. Yang bisa diperiksa
 * adalah **syarat-syaratnya**: manifest terkirim, ikonnya benar-benar ada, dan
 * service worker-nya mengendalikan halaman. Ketiganya diperiksa; pemasangannya
 * sendiri disebut apa adanya sebagai yang tidak diuji.
 *
 * Sisanya perilaku produk yang bisa diuji utuh: bab ditandai, jaringan diputus,
 * babnya tetap terbaca, bilah offline muncul, lalu **hilang sendiri** saat
 * jaringan kembali — tanpa pengguna menekan apa pun.
 *
 * Yang sengaja **tidak** dilakukan di sini: memuat ulang halaman saat offline.
 * Suite ini berjalan di `npm run dev`, tempat tiap modul adalah permintaan
 * tersendiri dan precache Workbox kosong — memuat ulang di sana gagal karena
 * mode dev-nya, bukan karena produknya. Jalur itu diperiksa `npm run check:build`
 * terhadap hasil `vite build` yang punya precache sungguhan.
 */

const BAB = '/cerita/s1/bab/s1-c5'

test('instal → putus jaringan → bab tersimpan tetap terbaca', async ({ page, context }) => {
  // Service worker + font + transform pertama; ambang bawaan bisa kalah.
  test.setTimeout(120_000)

  // ── syarat pemasangan ────────────────────────────────────────────────────
  const manifest = await page.request.get('/manifest.webmanifest')
  expect(manifest.ok()).toBe(true)
  const isi = (await manifest.json()) as {
    icons: Array<{ src: string; purpose?: string }>
    display: string
    start_url: string
  }
  expect(isi.display).toBe('standalone')
  expect(isi.start_url).toBe('/')
  // Manifest yang menyebut ikon yang tidak ada tetap manifest yang sah — dan
  // aplikasinya tetap tidak bisa dipasang. Kelima ikon pernah 404 sekaligus.
  expect(isi.icons.some((i) => i.purpose === 'maskable')).toBe(true)
  for (const ikon of isi.icons) {
    const r = await page.request.get(ikon.src)
    expect(r.status(), `ikon ${ikon.src}`).toBe(200)
  }

  await page.goto(BAB)
  await page.waitForLoadState('networkidle')

  // Service worker **mengendalikan** halaman, bukan sekadar terdaftar: yang
  // terdaftar tetapi belum mengendalikan tidak menjawab satu pun permintaan.
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, {
    timeout: 60_000,
  })

  // ── menandai babnya ──────────────────────────────────────────────────────
  // Ruang baca membuka kontrolnya dengan **ketukan**, bukan menampilkannya terus
  // (§1.25). Titik (5,5) sengaja: itu padding `<article>` sendiri, jadi ketukan
  // tidak mendarat di tautan, iklan, atau tombol mana pun.
  const bukaKontrol = async () => {
    if (await page.getByRole('button', { name: /offline/ }).count()) return
    await page.locator('article').click({ position: { x: 5, y: 5 } })
  }
  await bukaKontrol()

  const simpan = page.getByRole('button', { name: 'Simpan offline' })
  await expect(simpan).toBeVisible()
  await simpan.click()
  await expect(page.getByRole('button', { name: 'Hapus dari offline' })).toBeVisible()

  // Penandanya ikut muncul di rak — satu kueri bersama, bukan status per layar.
  await page.goto('/pustaka')
  await expect(page.getByText('Tersedia offline').first()).toBeVisible()

  // ── jaringan diputus, di halaman babnya ───────────────────────────
  await page.goto(BAB)
  await page.waitForLoadState('networkidle')
  await context.setOffline(true)

  await expect(page.getByText('Tidak ada koneksi. Bab tersimpan tetap bisa dibaca.')).toBeVisible()

  // Isinya benar-benar terbaca, bukan kerangka atau layar gagal — dan kontrolnya
  // masih menjawab ketukan, jadi yang tersisa memang aplikasi, bukan potretnya.
  await expect(page.getByText('Dua Tanda Tangan').first()).toBeVisible()
  const panjang = await page.evaluate(() => document.body.innerText.length)
  expect(panjang).toBeGreaterThan(500)
  await bukaKontrol()
  await expect(page.getByRole('button', { name: 'Hapus dari offline' })).toBeVisible()

  /*
   * Berpindah **rute** saat offline sengaja tidak diuji di sini.
   *
   * `npm run dev` menyajikan tiap modul sebagai permintaan tersendiri dan
   * precache Workbox-nya kosong, jadi `import()` rute berikutnya gagal dengan
   * *"Failed to fetch dynamically imported module"* — kegagalan mode dev, bukan
   * kegagalan produk. Di hasil `vite build` potongan rutenya ikut precache.
   * Jalur itu diperiksa `npm run check:build`, terhadap bundel sungguhan.
   */

  // ── jaringan kembali ─────────────────────────────────────────────────────
  // Tidak ada tombol yang ditekan: bilahnya hilang sendiri lewat `online`.
  await context.setOffline(false)
  await expect(page.getByText('Tidak ada koneksi. Bab tersimpan tetap bisa dibaca.')).toBeHidden()

  // Bersih-bersih supaya urutan test lain tidak mewarisi bab tersimpan.
  await page.getByRole('button', { name: 'Hapus dari offline' }).click()
  await expect(page.getByRole('button', { name: 'Simpan offline' })).toBeVisible()
})

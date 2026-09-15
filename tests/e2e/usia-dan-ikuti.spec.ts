import { expect, type Page, test } from '@playwright/test'

/**
 * Rating usia (A1) & mengikuti penulis (A2) · todo-incoming-features.md.
 *
 * Satu fungsi alur, dua lebar — pola `karya-dua-lebar.spec.ts`. Yang dibuktikan:
 *
 * 1. Bab 18+ **tidak memperlihatkan satu paragraf pun** ke akun yang belum
 *    terverifikasi — bukan cuma menampilkan gerbang di bawah pratinjau.
 * 2. Alur verifikasi utuh: ajukan → menunggu → disetujui (lewat kitchen-sink,
 *    karena pengguna tidak boleh memverifikasi dirinya) → bab terbaca.
 * 3. Sakelar "tampilkan cerita 18+" menaruhnya di beranda **hanya sesudah**
 *    terverifikasi.
 * 4. Section "Dari Penulis yang Kamu Ikuti" ada, dan notifikasi `cerita-baru`
 *    dari seed menuju ceritanya.
 *
 * Cerita 18+ contohnya `s16` "Malam Tanpa Rembulan" (ditulis di `catalog.ts`).
 */

const BAB = '/cerita/s16/bab/s16-c1'

async function alurUsia(page: Page) {
  // ── 1 · gerbang usia, tanpa satu paragraf pun ───────────────────────────
  await page.goto(BAB)
  await expect(page.getByRole('heading', { name: 'Bab ini untuk 18+' })).toBeVisible()
  await expect(page.getByText('Tidak ada koin yang terpotong.')).toBeVisible()
  // Naskah bab tidak boleh ada di DOM sama sekali — juga bukan diburamkan.
  await expect(page.locator('article').getByText(/Ia berhenti di ambang pintu/)).toHaveCount(0)

  // Halaman detailnya berlencana 18+ dan menjelaskan (mode `gated`).
  await page.getByRole('link', { name: 'Kembali ke cerita' }).click()
  await expect(page).toHaveURL(/\/cerita\/s16$/)
  await expect(page.getByText('Cerita ini untuk 18+')).toBeVisible()

  // ── 2 · verifikasi: ajukan → menunggu ───────────────────────────────────
  await page.getByRole('link', { name: 'Verifikasi usia' }).first().click()
  await expect(page).toHaveURL(/\/pengaturan\/verifikasi-usia$/)
  await expect(page.getByText('Belum diverifikasi')).toBeVisible()

  await page.getByLabel('Tanggal lahir').fill('1998-04-12')
  await page.locator('#berkas-ktp').setInputFiles({
    name: 'ktp.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('bukan-jpeg-sungguhan'),
  })
  await page.getByRole('button', { name: 'Ajukan verifikasi' }).click()
  await expect(page.getByText('Menunggu tinjauan')).toBeVisible({ timeout: 10_000 })
  // Formulirnya hilang: dua dokumen tidak boleh antre untuk satu akun.
  await expect(page.getByRole('button', { name: 'Ajukan verifikasi' })).toHaveCount(0)

  // Masih tertahan selama ditinjau.
  await page.goto(BAB)
  await expect(page.getByText('Dokumenmu sedang ditinjau.', { exact: false })).toBeVisible()

  // ── keputusan peninjau (kitchen-sink) ───────────────────────────────────
  // Tombolnya memuat ulang halaman; daftarkan `load` **sebelum** mengklik
  // (CLAUDE.md §8), lalu tunggu.
  await page.goto('/dev/kitchen-sink')
  const dimuatUlang = page.waitForEvent('load')
  await page.getByRole('button', { name: 'Setujui verifikasi usia' }).click()
  await dimuatUlang

  await page.goto('/pengaturan/verifikasi-usia')
  await expect(page.getByText('Terverifikasi', { exact: true })).toBeVisible()
  await expect(page.getByText(/Usiamu tercatat 28 tahun/)).toBeVisible()

  // ── bab terbuka ─────────────────────────────────────────────────────────
  await page.goto(BAB)
  await expect(page.getByRole('heading', { name: 'Bab ini untuk 18+' })).toHaveCount(0)
  await expect(page.locator('article')).toContainText(/Ia berhenti di ambang pintu/)

  // ── 3 · sakelar beranda ─────────────────────────────────────────────────
  await page.goto('/')
  await expect(page.getByRole('link', { name: /Malam Tanpa Rembulan/ })).toHaveCount(0)

  await page.goto('/pengaturan/bahasa')
  await page.getByRole('switch', { name: 'Tampilkan cerita 18+' }).click()
  await expect(page.getByText('Pengaturan konten disimpan.')).toBeVisible()

  await page.goto('/')
  await expect(page.getByRole('link', { name: /Malam Tanpa Rembulan/ }).first()).toBeVisible()
}

async function alurIkuti(page: Page) {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Dari Penulis yang Kamu Ikuti', exact: true }),
  ).toBeVisible()

  // Notifikasi jenis kedua belas menuju ceritanya, bukan beranda.
  await page.goto('/notifikasi')
  await page.getByRole('link', { name: /Rani Kusuma merilis cerita baru/ }).click()
  await expect(page).toHaveURL(/\/cerita\/s2$/)

  // A7: dari cerita itu, nama penanya membawa ke profil penulisnya — jalan
  // paling wajar menuju profil publik, yang sebelumnya tidak ada.
  await page.getByRole('link', { name: 'Rani Kusuma', exact: true }).first().click()
  await expect(page).toHaveURL(/\/pengguna\/a2$/)
  await expect(page.getByRole('button', { name: /Mengikuti|Ikuti/ }).first()).toBeVisible()

  // A8: baris aktivitas koneksi kini bervariasi — diturunkan dari progres nyata.
  await page.goto('/profil/koneksi')
  await expect(page.getByText('21 bab selesai')).toBeVisible()
  await expect(page.getByText('Belum ada bab selesai').first()).toBeVisible()
}

for (const [nama, viewport] of [
  ['HP', { width: 390, height: 844 }],
  ['desktop', { width: 1280, height: 800 }],
] as const) {
  test.describe(`layar ${nama}`, () => {
    test.use({ viewport })
    test('bab 18+ tertahan sampai usia terverifikasi, lalu terbuka', async ({ page }) => {
      test.setTimeout(180_000)
      await alurUsia(page)
    })
    test('penulis yang diikuti punya section dan notifikasinya', async ({ page }) => {
      await alurIkuti(page)
    })
  })
}

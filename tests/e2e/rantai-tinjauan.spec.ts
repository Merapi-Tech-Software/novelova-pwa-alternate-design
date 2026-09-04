import { expect, type Page, test } from '@playwright/test'

/**
 * Alur kritis #3 · architecture.md §14.
 *
 * Rantai penuh seorang penulis: **tulis bab dwibahasa → atur akses → kirim
 * terbit → tinjau → tayang.** Sejak Fase 8d rantai ini hanya bisa dijalankan
 * separuh; layar akses (8e) dan antrean tinjauan (8f) menutup sisanya.
 *
 * Langkah "tinjau" memakai `/dev/kitchen-sink`. Itu disengaja: penulis tidak
 * boleh menyetujui karyanya sendiri, jadi keputusan admin bukan metode seam —
 * dan tanpa cara menjalankannya, rantai ini tidak akan pernah bisa diuji sampai
 * ujung.
 */
const JUDUL = 'Bab Rantai Penuh'

async function rantaiPenulis(page: Page) {
  // Rantainya melewati lima layar, dan `/dev/kitchen-sink` mengimpor seluruh
  // design system sekaligus — di server dev, transform pertamanya sendiri sudah
  // beberapa detik. 30 detik bawaan terlalu sempit untuk alur sepanjang ini.
  test.setTimeout(90_000)

  // 1 — Tulis bab dwibahasa.
  await page.goto('/karya/ms1/bab/baru')
  await page.getByLabel('Judul bab').fill(JUDUL)
  await page.getByLabel('Isi bab').fill('Paragraf pertama.\n\nParagraf kedua.')

  await page.getByRole('tab', { name: 'English' }).click({ timeout: 5_000 })
  await page.getByRole('button', { name: 'Mulai Tulis English' }).click({ timeout: 5_000 })
  await page.getByLabel('English title').fill('Full Chain')
  await page.getByLabel('English content').fill('First paragraph of the chain.')

  await page.getByRole('button', { name: 'Simpan ke draf' }).click({ timeout: 5_000 })

  // 2 — Atur akses, dibuka dari menu aksi babnya.
  await page.goto('/karya/ms1/bab?tab=draft')
  const row = page.locator('article', { hasText: JUDUL }).first()
  await expect(row).toBeVisible({ timeout: 15_000 })
  await row.getByRole('button', { name: /Menu aksi/ }).click({ timeout: 5_000 })
  await page.getByRole('dialog').getByRole('link', { name: 'Atur Akses' }).click({ timeout: 5_000 })

  await expect(page.getByText(new RegExp(`· ${JUDUL}$`))).toBeVisible()
  await page.getByRole('button', { name: /^Berbayar/ }).click({ timeout: 5_000 })
  await page.getByRole('button', { name: 'Tambah harga' }).click({ timeout: 5_000 })
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click({ timeout: 5_000 })
  await expect(page.getByRole('button', { name: 'Tidak ada perubahan' })).toBeDisabled({
    timeout: 15_000,
  })

  // 3 — Kirim terbit. Naskah baru **tidak langsung tayang**; ia masuk tinjauan.
  await page.goto('/karya/ms1/bab?tab=draft')
  const draftRow = page.locator('article', { hasText: JUDUL }).first()
  await draftRow.getByRole('button', { name: 'Terbitkan' }).click({ timeout: 5_000 })

  await page.goto('/karya/ms1/bab?tab=in_review')
  await expect(page.locator('article', { hasText: JUDUL }).first()).toBeVisible({ timeout: 15_000 })

  // 4 — Tinjau: babnya muncul di antrean, dan pembaca belum melihatnya.
  await page.goto('/karya/tinjauan')
  await expect(page.getByText(JUDUL).first()).toBeVisible({ timeout: 15_000 })

  await page.goto('/dev/kitchen-sink')
  // Tombolnya memuat ulang halaman setelah keputusan admin tersimpan. Tanpa
  // menunggu muat ulang itu, `goto` berikutnya membatalkannya di tengah jalan
  // dan gagal sebagai `net::ERR_ABORTED` — bukan sebagai cacat produk.
  const dimuatUlang = page.waitForEvent('load')
  await page.getByRole('button', { name: 'Setujui seluruh antrean' }).click({ timeout: 30_000 })
  await dimuatUlang

  // 5 — Tayang. Antreannya kosong dari bab ini, dan ia ada di tab Publish.
  await page.goto('/karya/ms1/bab?tab=published')
  await expect(page.locator('article', { hasText: JUDUL }).first()).toBeVisible({ timeout: 15_000 })

  await page.goto('/karya/tinjauan')
  await expect(page.getByText(JUDUL)).toHaveCount(0)
}

test.describe('layar HP', () => {
  test.use({ viewport: { width: 412, height: 915 } })
  test('rantai penulis: tulis → atur akses → kirim terbit → tinjau → tayang', async ({ page }) => {
    await rantaiPenulis(page)
  })
})

test.describe('layar desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } })
  test('rantai penulis: tulis → atur akses → kirim terbit → tinjau → tayang', async ({ page }) => {
    await rantaiPenulis(page)
  })
})

import { expect, type Page, test } from '@playwright/test'

/**
 * Alur kritis #5 · architecture.md §14.
 *
 * Rantai penuh pembaca: **baca bab → beri rating → tulis ulasan → misi hadiah
 * selesai.** Sebelum Fase 10, tiga dari empat langkahnya tidak punya layar sama
 * sekali, dan misinya menjanjikan koin yang mustahil diklaim.
 *
 * Langkah terakhir diperiksa lewat `/dev/kitchen-sink`: pusat hadiah baru
 * dibangun di Fase 12, jadi progres misinya belum punya layar sendiri.
 */
async function rantaiUlasan(page: Page) {
  test.setTimeout(90_000)

  // 1 — Baca satu bab. Ini syarat kelayakan menilai (FR-SOCIAL-01).
  await page.goto('/cerita/ms1')
  // Label tombolnya berubah menurut progres: "Mulai dari Bab 1" bila belum
  // pernah dibaca, "Lanjut …" bila sudah.
  await page
    .getByRole('link', { name: /Mulai dari Bab|Lanjut/ })
    .first()
    .click({ timeout: 10_000 })
  await expect(page).toHaveURL(/\/bab\//, { timeout: 15_000 })
  // Ditunggu sampai isinya benar-benar termuat: server mencatat "bab dibuka"
  // saat `getChapter` selesai, dan pindah halaman lebih cepat dari itu membuat
  // jejaknya tidak pernah tertulis.
  await expect(page.getByRole('link', { name: /komentar/i }).first()).toBeVisible({
    timeout: 15_000,
  })

  // 2 — Beri rating dari halaman ulasan cerita itu.
  await page.goto('/cerita/ms1/ulasan')
  await expect(page.getByText(/dari \d+ penilai/)).toBeVisible({ timeout: 15_000 })
  await page
    .getByRole('button', { name: /^Beri rating$|^Sunting$/ })
    .first()
    .click({ timeout: 5_000 })

  const sheet = page.getByRole('dialog')
  await sheet.locator('label:has(input[value="5"])').click({ timeout: 5_000 })
  await expect(page.getByText(/Rating 5★ tersimpan/)).toBeVisible({ timeout: 15_000 })

  // 3 — Ulasan ditawarkan, bukan diwajibkan; kita menerimanya.
  await sheet.getByRole('button', { name: 'Tulis ulasan' }).click({ timeout: 5_000 })
  await sheet
    .getByLabel('Tulis ulasanmu')
    .fill('Bab pembukanya menahan saya sampai pagi, dan konfliknya tidak pernah kendur.')
  await sheet
    .getByRole('button', { name: /Kirim ulasan|Perbarui ulasan/ })
    .click({ timeout: 5_000 })
  await expect(page.getByRole('heading', { name: 'Ulasanmu' })).toBeVisible({ timeout: 15_000 })

  // 4 — Misi "Tulis satu ulasan" kini 100% dan dapat diklaim.
  await page.goto('/dev/kitchen-sink')
  await expect(page.getByText(/Tulis satu ulasan · 1\/1/)).toBeVisible({ timeout: 30_000 })
}

test.describe('layar HP', () => {
  test.use({ viewport: { width: 412, height: 915 } })
  test('rantai pembaca: baca bab → rating → ulasan → misi selesai', async ({ page }) => {
    await rantaiUlasan(page)
  })
})

test.describe('layar desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } })
  test('rantai pembaca: baca bab → rating → ulasan → misi selesai', async ({ page }) => {
    await rantaiUlasan(page)
  })
})

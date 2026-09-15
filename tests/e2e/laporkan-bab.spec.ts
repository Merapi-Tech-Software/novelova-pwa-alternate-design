import { expect, type Page, test } from '@playwright/test'

/**
 * Laporan bisa menyasar bab · A5 · todo-incoming-features.md.
 *
 * Dari ujung bab, pembaca melaporkan **bab ini** — bukan seluruh ceritanya.
 * Lembarnya menyebut babnya, dan laporan kedua ditolak server dengan kalimat
 * yang menyebut laporannya sudah masuk. Satu fungsi alur, dua lebar.
 */
async function alurLaporkan(page: Page) {
  await page.goto('/cerita/s1/bab/s1-c5')
  await expect(page.locator('article')).toContainText(/Lift itu berhenti/)

  // Tombol laporkan hidup di baris reaksi ujung bab, di samping "Suka".
  const laporkan = page.getByRole('button', { name: 'Laporkan', exact: true })
  await laporkan.scrollIntoViewIfNeeded()
  await laporkan.click()

  // Lembarnya menyebut **babnya**, bukan ceritanya.
  await expect(page.getByRole('heading', { name: 'Laporkan Bab 5' })).toBeVisible()
  await page.getByRole('radio', { name: /Spoiler/ }).check()
  await page.getByRole('button', { name: 'Kirim laporan' }).click()
  await expect(page.getByText(/Laporanmu diterima/)).toBeVisible({ timeout: 10_000 })

  // Satu laporan per pasangan — yang kedua ditolak **server**, bahkan setelah
  // halaman dimuat ulang, dengan kalimat yang menyebut laporannya sudah masuk.
  //
  // `goto`, bukan `reload`: menggulir ke ujung bab 5 membuat bab 6 masuk layar
  // dan URL ikut bergeser ke `/bab/s1-c6` (§1.25) — bab berbayar yang tidak
  // punya baris reaksi. `reload` akan memuat bab yang salah.
  await page.goto('/cerita/s1/bab/s1-c5')
  await expect(page.locator('article')).toContainText(/Lift itu berhenti/)
  await laporkan.scrollIntoViewIfNeeded()
  await laporkan.click()
  await page.getByRole('radio', { name: /Spoiler/ }).check()
  await page.getByRole('button', { name: 'Kirim laporan' }).click()
  await expect(page.getByText(/sudah masuk/)).toBeVisible({ timeout: 10_000 })
}

for (const [nama, viewport] of [
  ['HP', { width: 390, height: 844 }],
  ['desktop', { width: 1280, height: 800 }],
] as const) {
  test.describe(`layar ${nama}`, () => {
    test.use({ viewport })
    test('laporkan bab dari ujung bab', async ({ page }) => {
      await alurLaporkan(page)
    })
  })
}

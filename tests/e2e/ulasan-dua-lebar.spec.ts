import { expect, type Page, test } from '@playwright/test'

/**
 * Rating & ulasan di dua lebar · FR-SOCIAL-01..04.
 *
 * Alur ini memproduksi angka yang selama ini hanya dikonsumsi: rata-rata cerita
 * berubah begitu ada yang menilai. Karena itu yang diperiksa bukan sekadar
 * "lembarnya terbuka", melainkan **angka di ringkasan ikut bergerak**.
 */
async function alurUlasan(page: Page) {
  // Baca satu bab dulu — syarat kelayakan menilai (FR-SOCIAL-01).
  await page.goto('/cerita/s1')
  await page
    .getByRole('link', { name: /Mulai baca|Lanjut/ })
    .first()
    .click({ timeout: 10_000 })
  await expect(page).toHaveURL(/\/bab\//, { timeout: 15_000 })

  await page.goto('/cerita/s1/ulasan')
  await expect(page.getByText(/dari \d+ penilai/)).toBeVisible({ timeout: 15_000 })

  const sebaran = page.getByRole('list', { name: 'Sebaran bintang' })
  await expect(sebaran).toBeVisible()

  // Saringan menyaring di server: penghitungnya ikut berubah.
  const jumlah = page.getByText(/^\d+ ulasan$/)
  const sebelum = Number(((await jumlah.textContent()) ?? '').split(' ')[0])
  await page.getByRole('tab', { name: 'Ada teksnya' }).click({ timeout: 5_000 })
  await expect
    .poll(async () => Number(((await jumlah.textContent()) ?? '').split(' ')[0]))
    .toBeLessThan(sebelum)

  // Pengguna contoh **sudah** punya ulasan di seed, jadi lembarnya terbuka
  // dalam mode sunting. `.first()`: tombol "Sunting" sengaja ada dua — satu di
  // kartu ulasan sendiri, satu sebagai aksi utama di bawah daftar.
  await page
    .getByRole('button', { name: /^Beri rating$|^Sunting$/ })
    .first()
    .click({ timeout: 5_000 })
  const sheet = page.getByRole('dialog')

  // Bintang bisa diubah kapan saja, dan perubahannya langsung tersimpan.
  // Diklik lewat **label**-nya: `<input type="radio">` sengaja `sr-only`, dan
  // itu pula yang ditekan pengguna sungguhan — glyph di dalam labelnya.
  await sheet.locator('label:has(input[value="4"])').click({ timeout: 5_000 })
  await expect(page.getByText(/Rating 4★ tersimpan/)).toBeVisible({ timeout: 15_000 })

  // Tombol kirim tertahan sampai panjangnya cukup — bukan menolak setelah
  // ditekan (FR-SOCIAL-02).
  const kirim = sheet.getByRole('button', { name: /Kirim ulasan|Perbarui ulasan/ })
  await sheet.getByLabel('Tulis ulasanmu').fill('pendek')
  await expect(kirim).toBeDisabled()

  await sheet
    .getByLabel('Ulasanmu')
    .fill('Ketegangannya dibangun lewat percakapan yang tidak pernah menyebut inti masalahnya.')
  await sheet.getByRole('button', { name: 'slow burn' }).click({ timeout: 5_000 })
  await expect(kirim).toBeEnabled()
  await kirim.click({ timeout: 5_000 })

  // Ulasan sendiri naik ke atas dengan tombol suntingnya.
  await expect(page.getByRole('heading', { name: 'Ulasanmu' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Sunting' }).first()).toBeVisible()
}

test.describe('layar HP · ulasan', () => {
  test.use({ viewport: { width: 412, height: 915 } })
  test('alur beri rating & tulis ulasan', async ({ page }) => {
    await alurUlasan(page)
  })
})

test.describe('layar desktop · ulasan', () => {
  test.use({ viewport: { width: 1280, height: 900 } })
  test('alur beri rating & tulis ulasan', async ({ page }) => {
    await alurUlasan(page)
  })
})

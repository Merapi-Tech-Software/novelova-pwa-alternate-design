import { expect, type Page, test } from '@playwright/test'

/**
 * Komentar bab di dua lebar · FR-SOCIAL-05 & FR-SOCIAL-06.
 *
 * Utas dengan balasan menjorok adalah bentuk yang paling mudah pecah di 390px:
 * indentasi menambah lebar, dan tombol aksinya berbaris di bawah teks yang
 * panjang. Karena itu tombolnya benar-benar **ditekan** di kedua lebar.
 */
async function alurKomentar(page: Page) {
  await page.goto('/cerita/s1/bab/s1-c5/komentar')
  await expect(page.getByText(/komentar di bab ini/)).toBeVisible({ timeout: 15_000 })

  // Lencana penulis dan tirai spoiler hadir dari data, bukan dari contoh statis.
  await expect(page.getByText('Penulis').first()).toBeVisible()
  const tirai = page.getByRole('button', { name: /Spoiler —/ }).first()
  await expect(tirai).toBeVisible()
  await tirai.click({ timeout: 5_000 })
  await expect(page.getByRole('button', { name: /Spoiler —/ })).toHaveCount(0)

  // Menulis: tombolnya tertahan sampai ada isinya.
  const kirim = page.getByRole('button', { name: 'Kirim' })
  await expect(kirim).toBeDisabled()
  await page.getByPlaceholder(/Bagikan pendapatmu/).fill('Bab ini menutup pertanyaan dari bab 30.')
  await expect(kirim).toBeEnabled()
  await kirim.click({ timeout: 5_000 })
  await expect(page.getByText(/menutup pertanyaan dari bab 30/)).toBeVisible({ timeout: 15_000 })

  // Membalas: sasarannya disebut, dan balasannya mendarat menjorok satu tingkat.
  await page.getByRole('button', { name: 'Balas' }).first().click({ timeout: 5_000 })
  await expect(page.getByText(/^Membalas /)).toBeVisible()
  await page.getByPlaceholder(/Bagikan pendapatmu/).fill('Setuju, terutama bagian parkirannya.')
  await page.getByRole('button', { name: 'Kirim' }).click({ timeout: 5_000 })
  await expect(page.getByText(/terutama bagian parkirannya/)).toBeVisible({ timeout: 15_000 })

  // Urutan menyaring di server.
  await page.getByLabel('Urutkan komentar').selectOption('liked')
  await expect(page.getByText(/komentar di bab ini/)).toBeVisible({ timeout: 15_000 })
}

test.describe('layar HP · komentar', () => {
  test.use({ viewport: { width: 412, height: 915 } })
  test('alur komentar bab', async ({ page }) => {
    await alurKomentar(page)
  })
})

test.describe('layar desktop · komentar', () => {
  test.use({ viewport: { width: 1280, height: 900 } })
  test('alur komentar bab', async ({ page }) => {
    await alurKomentar(page)
  })
})

/**
 * Laporkan & blokir, di dua lebar · FR-SOCIAL-07.
 *
 * Lembar laporan punya enam pilihan alasan plus kolom keterangan — bentuk yang
 * mudah melebihi tinggi layar 390px, dan tombol kirimnya berakhir di bawah
 * lipatan. Karena itu tombolnya benar-benar **ditekan** di kedua lebar.
 */
async function alurLaporan(page: Page) {
  await page.goto('/cerita/s1/bab/s1-c5/komentar')
  await expect(page.getByText(/komentar di bab ini/)).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: 'Laporkan' }).first().click({ timeout: 5_000 })
  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible()

  // Alasannya `<input type="radio">` sungguhan, bukan tombol. "Lainnya"
  // menuntut keterangan — tanpa itu laporannya tidak bisa ditindaklanjuti dan
  // hanya menumpuk di antrean.
  const kirim = sheet.getByRole('button', { name: /Kirim laporan/ })
  await expect(kirim).toBeDisabled()

  await sheet.getByRole('radio', { name: /Lainnya/ }).check({ timeout: 5_000 })
  await expect(kirim).toBeDisabled()

  await sheet.getByRole('radio', { name: /Spam/ }).check({ timeout: 5_000 })
  await expect(kirim).toBeEnabled()
  await kirim.click({ timeout: 5_000 })

  // Konfirmasi diterima — **dan** menyatakan tidak ada kabar hasilnya.
  await expect(page.getByText(/Laporanmu diterima/)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/tidak mengabari hasilnya/)).toBeVisible()

  // Blokir menyembunyikan komentarnya dari tampilan ini.
  const nama = await page.locator('article').first().locator('span').first().textContent()
  await page.getByRole('button', { name: 'Blokir pengguna' }).first().click({ timeout: 5_000 })
  await expect(page.getByText(/disembunyikan dari tampilanmu/)).toBeVisible({ timeout: 15_000 })
  if (nama) await expect(page.getByText(nama, { exact: true })).toHaveCount(0)
}

test.describe('layar HP · laporan', () => {
  test.use({ viewport: { width: 412, height: 915 } })
  test('alur laporkan & blokir', async ({ page }) => {
    await alurLaporan(page)
  })
})

test.describe('layar desktop · laporan', () => {
  test.use({ viewport: { width: 1280, height: 900 } })
  test('alur laporkan & blokir', async ({ page }) => {
    await alurLaporan(page)
  })
})

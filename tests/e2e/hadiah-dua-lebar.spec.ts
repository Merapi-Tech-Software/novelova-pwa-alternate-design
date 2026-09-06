import { expect, type Page, test } from '@playwright/test'

/**
 * Alur pusat hadiah yang sama, dijalankan di **dua lebar layar** · Fase 12.
 *
 * Bukan dua test yang kebetulan mirip: satu fungsi alur, dipanggil dua kali.
 * Yang paling mungkin menyimpang antara keduanya: **kalender tujuh sel** yang di
 * 412px menyusut sampai hampir setengah lebarnya, dan **lembar pemilih cerita**
 * yang jadi dialog terpusat di `≥640`.
 */

async function alurHadiah(page: Page) {
  // Masuk lewat beranda · FR-CORE-05 — bukan lewat URL langsung.
  await page.goto('/')
  await page.getByRole('link', { name: 'Pusat hadiah', exact: true }).click()
  await expect(page).toHaveURL(/\/hadiah$/)

  // Ringkasan tiga angka · FR-RWD-01. Yang pertama **bukan saldo kedua**, dan
  // keterangannya menyebut itu terang — kalimat itu yang diperiksa, bukan
  // angkanya, karena angkanya bergerak tiap kali test lain mengklaim sesuatu.
  await expect(page.getByText(/Bukan saldo kedua/)).toBeVisible()
  await expect(page.getByText('Koin hadiah bulan ini')).toBeVisible()
  await expect(page.getByText('Voucher aktif')).toBeVisible()
  await expect(page.getByText('Streak', { exact: true })).toBeVisible()

  // Kalender tujuh hari · FR-RWD-02. Yang dihitung **labelnya**, bukan selnya:
  // teks sel memuat angka koinnya juga (`"10H1"`), jadi menyaring baris dengan
  // `/^H1$/` hanya mengenai hari ketujuh — satu-satunya sel tanpa angka.
  await expect(page.getByText(/^H[1-7]$/)).toHaveCount(7)

  // Klaim check-in benar-benar menambah koin dan menutup tombolnya · FR-RWD-07.
  await page.getByRole('button', { name: 'Klaim', exact: true }).first().click({ timeout: 5_000 })
  await expect(page.getByText('Sudah diklaim hari ini')).toBeVisible({ timeout: 15_000 })

  // **Klaim kedua tidak mungkin lagi**, bahkan setelah halaman dimuat ulang —
  // itu bedanya dari prototipe, yang cukup disegarkan untuk diklaim ulang.
  await page.reload()
  await expect(page.getByText('Sudah diklaim hari ini')).toBeVisible({ timeout: 15_000 })

  // Perolehannya tercatat di buku besar dompet, bukan hanya di riwayat klaim.
  await expect(page.getByRole('link', { name: 'Buka dompet' })).toBeVisible()
}

/**
 * Voucher · FR-RWD-06.
 *
 * Dua aturan yang paling mudah dilanggar diam-diam, dan keduanya **ditekan**:
 * voucher terkunci tidak boleh bisa dipilih, dan "Gunakan" harus membuka
 * pemilih cerita — bukan `#` seperti prototipe.
 */
async function alurVoucher(page: Page) {
  await page.goto('/hadiah')

  // Voucher terkunci menyebut syaratnya, dan tidak punya tombol sama sekali.
  const terkunci = page.getByRole('listitem').filter({ hasText: /Terkunci ·/ })
  await expect(terkunci.first()).toBeVisible({ timeout: 15_000 })
  await expect(terkunci.first().getByRole('button', { name: 'Gunakan' })).toHaveCount(0)

  // "Gunakan" pada voucher yang tidak terkunci membuka pemilih cerita.
  await page.getByRole('button', { name: 'Gunakan' }).first().click({ timeout: 5_000 })
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText(/Hanya cerita yang voucher ini benar-benar berlaku/)).toBeVisible()

  // Tiap pilihan menyebut **berapa bab yang akan terbuka** — bukan sekadar judul.
  await expect(page.getByText(/bab akan terbuka/).first()).toBeVisible()
}

test.describe('layar HP', () => {
  test.use({ viewport: { width: 412, height: 915 } })

  test('alur pusat hadiah · /hadiah', async ({ page }) => {
    await alurHadiah(page)
  })

  test('voucher & pemilih cerita · /hadiah', async ({ page }) => {
    await alurVoucher(page)
  })
})

test.describe('layar desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('alur pusat hadiah · /hadiah', async ({ page }) => {
    await alurHadiah(page)
  })

  test('voucher & pemilih cerita · /hadiah', async ({ page }) => {
    await alurVoucher(page)
  })
})

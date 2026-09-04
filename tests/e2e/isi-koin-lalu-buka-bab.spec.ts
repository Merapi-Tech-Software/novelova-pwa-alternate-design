import { expect, test } from '@playwright/test'

/**
 * Alur kritis #2 · **M2** · architecture.md §14.
 *
 * Bab terkunci → saldo kurang → isi koin membawa konteksnya → bayar → **kembali
 * ke bab yang sama**, dan babnya terbuka. Inilah loop ekonomi yang menutup;
 * kalau ia putus, aplikasinya tidak bisa didemokan sebagai produk.
 *
 * Saldo awal akun contoh 15.300 koin, jadi dua pembelian di awal bukan basa-basi
 * — itulah cara sah menurunkan saldo ke bawah harga satu bab lewat antarmuka,
 * tanpa menyentuh basis data dari luar.
 */
test('bab terkunci → saldo kurang → isi koin → kembali ke bab yang sama', async ({ page }) => {
  await page.goto('/cerita/s1/bab/s1-c8')

  // Gerbang bab: tiga pilihan berbayar, angkanya dari server.
  await expect(page.getByText('Lanjutkan membaca bab ini')).toBeVisible()

  // 15.300 − 12.000 = 3.300.
  await page.getByRole('button', { name: /Buka 10 bab sekaligus/ }).click()
  await expect(page.getByText('Lanjutkan membaca bab ini')).toBeHidden()

  // Dua bab satuan lagi: 3.300 − 1.500 − 1.500 = 300 koin.
  for (const chapter of ['s1-c20', 's1-c21']) {
    await page.goto(`/cerita/s1/bab/${chapter}`)
    await page.getByRole('button', { name: /Buka bab ini/ }).click()
    await expect(page.getByText('Lanjutkan membaca bab ini')).toBeHidden()
  }

  // Bab 22 berharga 1.800 — di atas saldo yang tersisa.
  await page.goto('/cerita/s1/bab/s1-c22')
  await page.getByRole('button', { name: /Buka bab ini/ }).click()

  // Lembar saldo kurang menyatakan kekurangannya dan menawarkan isi koin.
  await expect(page.getByText(/Kurang \d/)).toBeVisible()
  await page.getByRole('link', { name: 'Isi koin' }).click()

  // Konteksnya ikut: kekurangan disebut, dan paket terkecil yang mencukupi
  // sudah tersorot beserta keterangannya.
  await expect(page).toHaveURL(/\/koin\?return=.*chapter_id=s1-c22&need=/)
  await expect(page.getByText('Cukup untuk membuka bab ini')).toBeVisible()

  await page.getByRole('button', { name: /^QRIS/ }).click()
  await page.getByRole('button', { name: /^Bayar/ }).click()
  await page.getByRole('button', { name: 'Cek status' }).click()

  // `exact` bukan kerewelan: nama lembarnya menggabungkan kicker dan judul
  // ("Pembayaran berhasil · Koin sudah masuk"), jadi pencocokan longgar
  // mengenai dua elemen dan gagal seketika.
  await expect(page.getByRole('heading', { name: 'Koin sudah masuk', exact: true })).toBeVisible()

  // Tombol utamanya menyesuaikan konteks — bukan "Mulai baca" ke beranda.
  await page.getByRole('button', { name: 'Lanjutkan membaca' }).click()
  await expect(page).toHaveURL(/\/cerita\/s1\/bab\/s1-c22$/)

  // Dan sekarang babnya benar-benar bisa dibuka.
  await page.getByRole('button', { name: /Buka bab ini/ }).click()
  await expect(page.getByText('Lanjutkan membaca bab ini')).toBeHidden()
})

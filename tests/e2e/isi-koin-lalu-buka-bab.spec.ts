import { expect, test } from '@playwright/test'

/**
 * Alur kritis #2 · **M2** · architecture.md §14 · diperbarui di **R4**.
 *
 * Bab terkunci → **buka otomatis mengalir sendiri** → koin habis → isi koin
 * membawa konteksnya → bayar → **kembali ke bab yang sama**, dan babnya terbuka.
 * Inilah loop ekonomi yang menutup; kalau ia putus, aplikasinya tidak bisa
 * didemokan sebagai produk.
 *
 * **Bentuknya berubah di R4** (`architecture.md` §1.19 & §1.21). Dulu tiap bab
 * dibeli satu per satu lewat gerbangnya masing-masing; sekarang gerbang muncul
 * **sekali per cerita**, izinnya tercentang bawaan, dan bab berbayar berikutnya
 * terbuka sendiri sampai saldonya tidak cukup. Itu sebabnya test ini berjalan
 * maju sampai lembar saldo kurang muncul, alih-alih menghitung bab di muka:
 * jumlah bab yang muat di saldo 15.300 bergantung harga tiap bab, dan angka yang
 * ditulis di sini akan lapuk pada perubahan harga berikutnya.
 */
test('bab terkunci → buka otomatis → koin habis → isi koin → kembali ke bab yang sama', async ({
  page,
}) => {
  const gerbang = page.getByLabel('Locked continuation gate')

  await page.goto('/cerita/s1/bab/s1-c8')
  await expect(gerbang).toBeVisible()

  // Izinnya tercentang bawaan — pembaca menyetujuinya sekali, di sini.
  await expect(page.getByRole('switch', { name: 'Buka otomatis untuk cerita ini' })).toBeChecked()

  // 15.300 − 12.000 = 3.300, dan izin buka-otomatis ikut menyala.
  await page.getByRole('button', { name: /10 chapter/ }).click()
  await expect(gerbang).toBeHidden()
  await expect(page.getByRole('button', { name: 'Matikan' })).toBeVisible()

  /*
   * Bab-bab berikutnya terbuka **sendiri**, tanpa satu pun ketukan, sampai
   * saldonya tidak cukup — dan saat itu lembar `7z` yang muncul, bukan diam.
   * Batas 30 hanya penjaga supaya kegagalan berhenti sebagai kegagalan, bukan
   * sebagai loop tak berujung.
   */
  const kurang = page.getByText(/^Kurang /)
  let sampai: string | null = null

  for (let nomor = 20; nomor < 50 && sampai === null; nomor++) {
    const id = `s1-c${nomor}`
    await page.goto(`/cerita/s1/bab/${id}`)
    await page.waitForLoadState('networkidle')

    if (await kurang.isVisible().catch(() => false)) {
      sampai = id
      break
    }
    // Bab yang tidak berbayar tidak membuktikan apa pun — dilewati.
  }

  expect(sampai, 'saldo tidak pernah habis sampai bab ke-50').not.toBeNull()

  // Lembar saldo kurang menawarkan **tiga** jalan keluar, bukan satu buntu.
  const lembar = page.getByRole('dialog')
  await expect(lembar.getByRole('link', { name: /Isi koin/ })).toBeVisible()
  await expect(lembar.getByRole('button', { name: /Pakai voucher/ })).toBeVisible()

  await lembar.getByRole('link', { name: /Isi koin/ }).click()

  // Konteksnya ikut: kekurangan disebut, dan paket terkecil yang mencukupi
  // sudah tersorot beserta keterangannya.
  await expect(page).toHaveURL(new RegExp(`/koin\\?return=.*chapter_id=${sampai}&need=`))
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
  await expect(page).toHaveURL(new RegExp(`/cerita/s1/bab/${sampai}$`))

  // Dan sekarang babnya benar-benar terbuka — otomatis, karena izinnya masih
  // menyala dan saldonya sudah cukup lagi.
  await expect(gerbang).toBeHidden()
})

import { expect, test } from '@playwright/test'

/**
 * Alur kritis #1 · architecture.md §14.
 *
 * Beranda → detail cerita → membaca bab gratis. Ini alur yang harus tetap hidup
 * setelah perubahan apa pun: kalau ia putus, tidak ada gunanya sisa aplikasi
 * berfungsi.
 *
 * Perangkat memulai dalam keadaan sudah masuk sebagai akun contoh, jadi langkah
 * masuk dan onboarding tidak diulang di sini — keduanya punya testnya sendiri di
 * `tests/unit/`.
 */
test('beranda → detail cerita → baca bab gratis', async ({ page }) => {
  await page.goto('/')

  // Beranda: tiga section pertama selalu ada.
  await expect(page.getByRole('heading', { name: 'Populer' })).toBeVisible()

  // Masuk ke detail lewat kartu ceritanya. `level: 1` bukan kerewelan: judul
  // cerita muncul juga sebagai `h3` di tiap kartu beranda, dan locator yang
  // cocok dengan enam elemen gagal seketika tanpa menunggu perpindahan halaman.
  await page
    .getByRole('link', { name: /Cinta di Balik Kontrak/ })
    .first()
    .click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Cinta di Balik Kontrak' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Daftar bab' })).toBeVisible()

  // Bab pertama gratis: dibuka tanpa gerbang, isinya langsung terbaca.
  await page
    .getByRole('link', { name: /Perjanjian Malam Itu/ })
    .first()
    .click()
  await expect(page.getByRole('heading', { level: 1, name: 'Perjanjian Malam Itu' })).toBeVisible()
  await expect(page.getByText('Lanjutkan membaca bab ini')).toBeHidden()

  // **Type A: kontrolnya tersembunyi sampai teks diketuk** (`7u`/`7v`). Ini yang
  // dilakukan pembaca, jadi ini juga yang dilakukan test — bukan mencari bilah
  // yang memang belum ada.
  await page.getByRole('article').click({ position: { x: 60, y: 300 } })

  /*
   * **Dibalik dari test lama** · §1.25. Sampai R4 bilah ini membawa tombol bab
   * sebelumnya/berikutnya, dan test ini menekan yang kedua untuk pindah bab.
   * Sejak R4b bacaannya mengalir: tidak ada tombol lompat, dan bab berikutnya
   * datang sendiri saat digulir.
   */
  await expect(page.getByRole('button', { name: 'Bab sebelumnya' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Bab berikutnya' })).toBeHidden()

  // Nomor babnya tetap ada — satu tempat untuk tahu sedang di mana.
  await expect(page.getByText(/^Bab \d+ \/ \d+$/)).toBeVisible()

  // Dan menggulir terus membawa pembaca ke bab berikutnya tanpa satu pun ketukan.
  for (let i = 0; i < 12; i++) {
    await page.mouse.wheel(0, 2500)
    await page.waitForTimeout(180)
  }
  await expect(page).toHaveURL(/\/bab\/s1-c[2-9]/)
})

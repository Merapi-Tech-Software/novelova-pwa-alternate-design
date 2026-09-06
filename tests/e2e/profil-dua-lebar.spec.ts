import { expect, type Page, test } from '@playwright/test'

/**
 * Alur profil & pengaturan yang sama, dijalankan di **dua lebar layar** · Fase 13.
 *
 * Yang paling mungkin menyimpang antara keduanya: **dialog hapus akun** yang
 * jadi dialog terpusat di `≥640`, dan **daftar sesi** yang barisnya membawa
 * tombol di sebelah teks panjang.
 */

async function alurPrivasi(page: Page) {
  await page.goto('/profil/ubah')

  // Indikator berubah mengikuti keadaan · FR-PROF-04.
  await expect(page.getByText('SEMUA PUBLIK')).toBeVisible({ timeout: 15_000 })

  // **Mematikan Books menghilangkan tabnya**, bukan mengosongkannya (FR-PROF-10).
  await page.getByRole('switch', { name: /Perpustakaan dan cerita tersimpan/ }).click()
  await expect(page.getByText('KUSTOM')).toBeVisible({ timeout: 15_000 })

  await page.goto('/pengguna/u1')
  await expect(page.getByRole('tab', { name: 'Aktivitas', exact: true })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByRole('tab', { name: 'Buku', exact: true })).toHaveCount(0)

  // Kembalikan supaya test lain tidak mewarisi keadaan ini.
  await page.goto('/profil/ubah')
  await page.getByRole('switch', { name: /Perpustakaan dan cerita tersimpan/ }).click()
  await expect(page.getByText('SEMUA PUBLIK')).toBeVisible({ timeout: 15_000 })
}

/**
 * Dompet **tidak pernah** tampil di profil orang lain · FR-PROF-10.
 *
 * Sakelarnya tetap dirender di halaman ubah profil — dan **mati permanen**:
 * sakelar yang hilang sama sekali membuat pengguna mencarinya di tempat yang
 * tidak ada.
 */
async function alurDompetTersembunyi(page: Page) {
  await page.goto('/profil/ubah')
  const dompet = page.getByRole('switch', { name: /Dompet|Koin|transaksi/ })
  if ((await dompet.count()) > 0) {
    await expect(dompet.first()).toBeDisabled()
    await expect(dompet.first()).toHaveAttribute('aria-checked', 'false')
  }

  await page.goto('/pengguna/f1?tab=visibility')
  await expect(page.getByText(/Disembunyikan pemiliknya/).first()).toBeVisible({ timeout: 15_000 })
}

/** Keamanan · FR-SET-02 · FR-SET-03 · FR-SET-05. */
async function alurKeamanan(page: Page) {
  await page.goto('/pengaturan/keamanan')

  // Skor dari faktor nyata, dan **kelima bobotnya tampil**.
  await expect(page.getByText(/dari 100/)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Kata sandi kuat')).toBeVisible()
  await expect(page.getByText('Verifikasi dua langkah')).toBeVisible()

  // Sesi yang sedang dipakai **tidak punya tombol Cabut**; yang lain punya.
  const barisSekarang = page.getByRole('listitem').filter({ hasText: 'Perangkat ini' })
  await expect(barisSekarang).toHaveCount(1)
  await expect(barisSekarang.getByRole('button', { name: 'Cabut' })).toHaveCount(0)

  // Ekspor menolak permintaan tanpa kategori — dan pesannya menyebut alasannya.
  await page.getByRole('button', { name: 'Minta berkas' }).click({ timeout: 5_000 })
  await expect(page.getByText(/Pilih minimal satu kategori/)).toBeVisible({ timeout: 15_000 })

  /*
   * **Penghapusan ditahan** · FR-SET-05.
   *
   * Data contoh punya satu pengajuan pencairan berstatus Ditinjau, jadi akun ini
   * memang belum boleh dihapus — dan yang tampil bukan tombol, melainkan alasan
   * penahanannya. Itu justru keadaan yang paling penting diuji: penolakan tanpa
   * alasan tidak bisa ditindaklanjuti.
   */
  await expect(page.getByText('Belum bisa dihapus')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/pencairan masih diproses/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Hapus akun', exact: true })).toHaveCount(0)
}

/** Bantuan & legal · FR-HELP-01 · FR-HELP-03 · FR-CORE-05. */
async function alurBantuan(page: Page) {
  await page.goto('/bantuan')

  // Pencariannya **nyata** — menyaring kategori dan FAQ yang benar-benar ada.
  await page.getByRole('searchbox').fill('cetak')
  // Peran tautannya, bukan `getByText`: kata yang sama juga muncul di **jawaban
  // FAQ**, dan itu gagal sebagai strict mode violation yang terlihat seperti
  // cacat produk.
  await expect(page.getByRole('link', { name: /^Cetak cerita/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Pembayaran/ })).toHaveCount(0)

  await page.getByRole('searchbox').fill('zzzz')
  await expect(page.getByText('Tidak ada artikel yang cocok')).toBeVisible()

  // Kategori menautkan ke **halaman nyata**, bukan artikel buntu.
  await page.getByRole('searchbox').fill('')
  await page.getByRole('link', { name: /Keamanan/ }).click({ timeout: 5_000 })
  await expect(page).toHaveURL(/\/pengaturan\/keamanan$/)

  // Legal: pasal kelima ada, dan hak menautkan ke alurnya.
  await page.goto('/legal/ketentuan')
  await expect(page.getByRole('listitem').filter({ hasText: /^5\./ })).toHaveCount(1)

  await page.goto('/legal/privasi')
  await expect(page.getByRole('link', { name: /Menghapus riwayat membaca/ })).toBeVisible()
}

for (const [nama, viewport] of [
  ['layar HP', { width: 412, height: 915 }],
  ['layar desktop', { width: 1280, height: 900 }],
] as const) {
  test.describe(nama, () => {
    test.use({ viewport })

    test('privasi mengendalikan tab profil publik', async ({ page }) => {
      await alurPrivasi(page)
    })

    test('dompet tidak pernah publik', async ({ page }) => {
      await alurDompetTersembunyi(page)
    })

    test('keamanan · skor, sesi, data & akun', async ({ page }) => {
      await alurKeamanan(page)
    })

    test('bantuan & legal', async ({ page }) => {
      await alurBantuan(page)
    })
  })
}

import { devices, expect, test } from '@playwright/test'

/**
 * Regresi · bilah aksi vs bilah navigasi bawah.
 *
 * Di `<1024` ada **dua bilah yang sama-sama menempel di dasar layar**: navigasi
 * utama dan tombol bayar. Yang satu menutupi yang lain, dan di lebar desktop
 * cacatnya tidak terlihat sama sekali karena navigasinya pindah jadi sidebar.
 *
 * Test ini menekan tombolnya — bukan sekadar memeriksa ia ada. Elemen yang
 * tertutup tetap "terlihat" bagi assertion biasa, tetapi klik ke elemen yang
 * tertutup gagal, dan itulah yang benar-benar dialami pengguna.
 */
test.use({ ...devices['Pixel 7'] })

test('layar HP: tombol bayar tidak tertutup bilah navigasi bawah', async ({ page }) => {
  await page.goto('/koin')

  await page.getByRole('button', { name: /250/ }).click()
  await page.getByRole('button', { name: /^QRIS/ }).click()

  const pay = page.getByRole('button', { name: /^Bayar/ })
  await expect(pay).toBeInViewport()

  // Gagal dengan "intercepts pointer events" bila bilah navigasi menutupinya.
  await pay.click({ timeout: 5_000 })
  await expect(page.getByRole('button', { name: 'Cek status' })).toBeVisible()
})

/**
 * Sapuan lebar: tidak ada halaman yang menggeser badan halaman ke samping —
 * **di lima lebar telepon**, bukan satu.
 *
 * Gulir horizontal di HP hampir selalu tidak disengaja, dan hampir selalu
 * datang dari satu elemen yang lebih lebar daripada layarnya.
 *
 * Sebelumnya ini hanya diuji di lebar Pixel 7 (412px) — dan 412 justru lebar
 * yang **paling pemaaf**. Sapuan Langkah 44 menemukan sepuluh kombinasi rusak,
 * semuanya di 320–390px dan **tidak satu pun** di 412 ke atas: di lebar
 * sempitlah strip empat sel, baris aksi, dan deretan chip mulai tidak muat.
 * Menambah lebar di sini, bukan halaman, yang membuat test ini menangkapnya.
 *
 * Lima lebar dalam satu test per halaman, bukan lima test: pesan gagalnya sudah
 * menyebut lebar mana yang rusak, dan memecahnya jadi 110 test membuat suite ini
 * lima kali lebih lambat tanpa memberi tahu apa pun yang baru.
 */
const LEBAR_HP = [320, 360, 390, 412, 430] as const

for (const path of [
  '/',
  '/pustaka',
  '/koin',
  '/koin/transaksi',
  '/cari',
  '/jelajah/populer',
  '/cerita/s1',
  '/cerita/s1/bab/s1-c5',
  '/karya',
  '/karya/daftar-penulis',
  '/karya/ms1/bab',
  '/karya/baru',
  '/karya/ms1/ubah',
  '/karya/ms1/bab/baru',
  '/karya/ms1/bab/ms1-c51/ubah',
  '/karya/ms1/bab/ms1-c47/akses',
  '/karya/jadwal',
  '/karya/tinjauan',
  '/karya/ms1/analitik',
  '/karya/cetak',
  '/penulis/analitik',
  '/penulis/penarikan',
  '/penulis/penarikan/riwayat',
  '/cerita/s1/ulasan',
  '/cerita/s1/bab/s1-c5/komentar',
]) {
  test(`layar HP: ${path} tidak menggeser halaman ke samping`, async ({ page }) => {
    for (const width of LEBAR_HP) {
      await page.setViewportSize({ width, height: 844 })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      // **Tunggu fontnya, bukan cuma jaringannya.** Lora dan Plus Jakarta Sans
      // masuk di putaran 7, dan `networkidle` bisa tercapai saat keduanya masih
      // menukar diri dari font fallback — pada saat itu lebar tiap teks masih
      // memakai metrik yang salah. Gejalanya: dua halaman gagal hanya saat suite
      // penuh berjalan paralel, dan lulus bersih saat dijalankan sendirian.
      await page.evaluate(() => document.fonts.ready)

      // **Diukur berulang sampai tenang, bukan sekali.** `networkidle` dan
      // `fonts.ready` sama-sama bisa tercapai saat React Query masih menukar
      // kerangka dengan isinya, dan luberan sesaat di tengah pertukaran itu
      // bukan cacat yang dilihat siapa pun. Gejalanya khas: gagal **hanya** saat
      // suite penuh berjalan paralel, lulus bersih saat dijalankan sendirian,
      // dan tiga spec berbeda kena bergantian.
      //
      // `toPass` tidak melemahkan pemeriksaannya — luberan sungguhan tetap
      // gagal sampai batas waktunya habis. Yang berubah cuma: yang diperiksa
      // adalah **tata letak yang sudah tenang**, dan itu memang yang dijanjikan.
      await expect
        .poll(
          () =>
            page.evaluate(
              () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
            ),
          { message: `${path} meluber di lebar ${width}px`, timeout: 5_000 },
        )
        .toBeLessThanOrEqual(0)
    }
  })
}

test('layar HP: aksi utama kartu perpustakaan bisa ditekan', async ({ page }) => {
  await page.goto('/pustaka')

  // Kartu terakhir yang paling berisiko tertutup bilah bawah.
  const read = page.getByRole('link', { name: /Lanjut Baca|Mulai Baca|Baca Ulang/ }).last()
  await expect(read).toBeVisible()
  await read.click({ timeout: 5_000 })

  await expect(page).toHaveURL(/\/cerita\/[^/]+\/bab\//)
})

test('layar HP: alur studio sama dengan desktop — jadwalkan dan hapus bisa ditekan', async ({
  page,
}) => {
  await page.goto('/karya?tab=draft')

  // Aksi kartu ada di ujung bawah kartu terakhir — tempat paling berisiko
  // tertutup bilah navigasi.
  const schedule = page.getByRole('button', { name: 'Jadwalkan' }).last()
  await schedule.click({ timeout: 5_000 })

  // Lembar bawah harus berada di atas bilah navigasi, bukan di baliknya.
  await expect(page.getByText(/bukan bab tertentu/)).toBeVisible()
  // Tanggal tiga hari ke depan: memakai hari ini membuat testnya bergantung jam
  // dinding — lewat jam yang dipilih, server menolaknya sebagai waktu lewat.
  const at = new Date(Date.now() + 3 * 86_400_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  await page
    .getByLabel('2 · Tanggal terbit')
    .fill(`${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`)
  await page.getByRole('button', { name: '21:00' }).click({ timeout: 5_000 })
  await page.getByRole('button', { name: 'Simpan jadwal' }).click({ timeout: 5_000 })
  await expect(page.getByText(/bukan bab tertentu/)).toBeHidden()

  // Dan tombol hapus — yang membuka dialog peramban — juga benar-benar terjangkau.
  page.once('dialog', (dialog) => void dialog.dismiss())
  await page.goto('/karya?tab=rejected')
  await page.getByRole('button', { name: 'Hapus' }).last().click({ timeout: 5_000 })
})

test('layar HP: lembar cetak dua tab terjangkau seluruhnya', async ({ page }) => {
  await page.goto('/karya?tab=completed')

  await page.getByRole('button', { name: 'Cetak PDF' }).last().click({ timeout: 5_000 })
  await expect(page.getByRole('tab', { name: 'Hardcopy' })).toBeVisible()

  await page.getByRole('tab', { name: 'Hardcopy' }).click({ timeout: 5_000 })
  // Formulir pengiriman panjang; tombol ajukan tetap harus bisa ditekan.
  await expect(page.getByRole('button', { name: 'Ajukan pesanan' })).toBeVisible()
  await page.getByLabel('Nama penerima').fill('Amelia Putri')
  await page.getByLabel('Nomor telepon').fill('081234567890')
  await page.getByLabel('Kota').fill('Yogyakarta')
  await page.getByLabel('Kode pos').fill('55281')
  await page.getByLabel('Alamat lengkap').fill('Jalan Kaliurang KM 5 No. 12, Sleman')
  await page.getByRole('button', { name: 'Ajukan pesanan' }).click({ timeout: 5_000 })

  await expect(page.getByText(/Menunggu konfirmasi admin/)).toBeVisible()
})

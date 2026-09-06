import { expect, type Page, test } from '@playwright/test'

/**
 * Alur notifikasi yang sama, dijalankan di **dua lebar layar** · Fase 11.
 *
 * Bukan dua test yang kebetulan mirip: satu fungsi alur, dipanggil dua kali.
 * Yang paling mungkin menyimpang antara keduanya ada dua, dan keduanya ditekan
 * di sini: **lembar preferensi** yang jadi dialog terpusat di `≥640`, dan
 * **lima tab** yang di 412px hanya sebagian terlihat sehingga harus digulir
 * sebelum bisa ditekan.
 */

/**
 * Lonceng beranda beserta lencananya · FR-NOTIF-03.
 *
 * **Diperiksa berulang sampai tenang**, dan itu bukan menaikkan timeout: menekan
 * notifikasi menyalakan mutasi `markRead` sekaligus berpindah halaman, dan
 * `page.goto` di sini adalah **muat-ulang keras** yang merobohkan konteks JS.
 * Tulisan IndexedDB yang belum sempat rampung ikut hilang bersamanya, dan
 * gejalanya khas: lulus di 1280, gagal di 412, tanpa ada yang berbeda selain
 * kecepatan. Yang diperiksa adalah angka yang **sudah mengendap**, dan angka
 * yang salah tetap gagal sampai batas waktunya habis.
 */
async function lencanaBeranda(page: Page, harapan: string | null) {
  await page.goto('/')

  // Tunggu **loncengnya ada** lebih dulu, di luar poll. Kalau navigasinya ikut
  // masuk ke dalam poll, tiap percobaan menanggung satu muat halaman penuh —
  // dan di bawah suite paralel satu muat bisa memakan detik, sehingga batas
  // waktunya habis setelah dua tiga percobaan tanpa pernah sempat mengukur
  // apa pun. Yang lambat di sini halamannya, bukan angkanya.
  const bell = page.getByRole('link', { name: /^Notifikasi/ })
  await expect(bell).toBeVisible({ timeout: 20_000 })

  /*
   * Angkanya datang dari kueri terpisah, jadi ia menyusul render pertama. Ini
   * yang benar-benar perlu ditunggu sampai tenang.
   *
   * **`count()` dulu, baru `textContent()`** — dan itu bukan gaya penulisan.
   * `textContent()` sendirian *menunggu elemennya muncul*, jadi kasus "lencana
   * memang tidak ada" tidak akan pernah bisa diamati: ia menggantung sampai
   * poll kehabisan waktu, lalu gagal dengan pesan yang menyebut batas waktu —
   * bukan menyebut bahwa nilainya sudah benar. Justru kasus **nol** yang paling
   * penting di sini (FR-NOTIF-03: nol berarti tidak dirender).
   */
  const badge = bell.locator('span[aria-hidden]')
  await expect
    .poll(async () => ((await badge.count()) === 0 ? null : await badge.textContent()), {
      timeout: 15_000,
    })
    .toBe(harapan)
}

async function alurNotifikasi(page: Page) {
  // Seed membawa tiga yang belum dibaca; lencananya harus menyebut angka itu.
  await lencanaBeranda(page, '3')

  await page.getByRole('link', { name: /Notifikasi, 3 belum dibaca/ }).click()
  await expect(page).toHaveURL(/\/notifikasi$/)

  // Kepala hari · FR-NOTIF-01. `exact` karena "Hari ini" juga muncul sebagai
  // bagian kalimat di keterangan baris lain.
  await expect(page.getByRole('heading', { name: 'Hari ini', exact: true })).toBeVisible()

  // Saringan **menyaring di server**: memilih Dompet menyisakan baris dompet
  // saja, dan baris cerita benar-benar hilang — bukan disembunyikan CSS.
  await page.getByRole('tab', { name: 'Dompet', exact: true }).click()
  await expect(page).toHaveURL(/f=dompet/)
  await expect(page.getByText('Top-up 500 koin berhasil')).toBeVisible()
  await expect(page.getByText('3 bab baru di Cinta di Balik Kontrak')).toHaveCount(0)

  await page.getByRole('tab', { name: 'Semua', exact: true }).click()
  await expect(page.getByText('3 bab baru di Cinta di Balik Kontrak')).toBeVisible()

  // Tiga penanda "Belum dibaca" sebelum apa pun ditekan · FR-NOTIF-03.
  await expect(page.getByText('Belum dibaca')).toHaveCount(3)

  // Menekan notifikasi melakukan **dua hal** · FR-NOTIF-01: menandainya terbaca
  // dan membuka tujuannya. Yang diperiksa keduanya — membuka tujuan saja tidak
  // membuktikan penandanya hilang.
  await page.getByText('Top-up 500 koin berhasil').click()
  await expect(page).toHaveURL(/\/koin\/transaksi\//)

  /*
   * Kembali lewat **navigasi aplikasi**, bukan `goto`.
   *
   * `page.goto` adalah muat-ulang keras yang merobohkan konteks JS, dan mutasi
   * `markRead` yang baru saja menyala bisa ikut hilang bersamanya — tulisannya
   * tidak pernah sampai ke IndexedDB, jadi polling pun tidak bisa
   * memulihkannya. Gejalanya khas dan menyesatkan: lulus di 1280, gagal di 412,
   * tanpa ada yang berbeda selain kecepatan.
   *
   * Kembali lewat riwayat peramban membuat aplikasinya tetap hidup, dan
   * membaca ulang barisnya sekaligus **membuktikan penandanya benar-benar
   * tersimpan** — bukan cuma hilang dari layar.
   */
  await page.goBack()
  await expect(page).toHaveURL(/\/notifikasi$/)
  await expect(page.getByText('Belum dibaca')).toHaveCount(2)

  await lencanaBeranda(page, '2')

  // "Tandai semua terbaca" mengosongkan lencana sepenuhnya · FR-NOTIF-03:
  // nol berarti **tidak dirender**, bukan menulis `0`.
  await page.goto('/notifikasi')
  await page.getByRole('button', { name: 'Tandai semua terbaca' }).click({ timeout: 5_000 })
  await expect(page.getByRole('button', { name: 'Tandai semua terbaca' })).toHaveCount(0)
  await lencanaBeranda(page, null)
}

/**
 * Lembar preferensi · FR-NOTIF-04.
 *
 * **Rute modal**: dibuka langsung lewat URL-nya — persis seperti saat ditautkan
 * dari profil — dan halaman notifikasi harus benar-benar ada di bawahnya.
 * Lembar yang melayang di atas layar kosong bukan modal, itu halaman yang salah
 * gambar.
 */
async function alurPreferensi(page: Page) {
  await page.goto('/notifikasi/pengaturan')

  await expect(page.getByRole('dialog')).toBeVisible()
  // Yang di bawah lembarnya: pusat notifikasi, bukan halaman kosong.
  await expect(page.getByRole('tab', { name: 'Semua', exact: true })).toBeAttached()

  // Empat kelompok FR-NOTIF-04 — **bukan** kelima saringan.
  for (const nama of ['Cerita', 'Dompet & Hadiah', 'Karya saya', 'Sistem & Keamanan']) {
    await expect(page.getByRole('group', { name: new RegExp(nama) })).toBeVisible()
  }

  const keamanan = page.getByRole('group', { name: /Sistem & Keamanan/ })

  // **Notifikasi keamanan tidak dapat dimatikan.** Sakelarnya ditekan sungguhan;
  // memeriksa `disabled` saja tidak membuktikan keadaannya bertahan.
  const dalamAplikasi = keamanan.getByRole('switch', { name: 'Dalam aplikasi' })
  await expect(dalamAplikasi).toHaveAttribute('aria-checked', 'true')
  await dalamAplikasi.click({ force: true })
  await expect(dalamAplikasi).toHaveAttribute('aria-checked', 'true')

  // Email di kelompok yang sama **boleh** dimatikan: ia salinannya, bukan
  // peringatannya — dan itu bedanya dari sekadar "seluruh kelompok terkunci".
  const email = keamanan.getByRole('switch', { name: 'Email' })
  await email.click({ timeout: 5_000 })
  await expect(email).toHaveAttribute('aria-checked', 'false')

  // Tersimpan di server, jadi bertahan setelah halaman dimuat ulang.
  await page.reload()
  await expect(
    page.getByRole('group', { name: /Sistem & Keamanan/ }).getByRole('switch', { name: 'Email' }),
  ).toHaveAttribute('aria-checked', 'false')

  // Menutupnya mendarat di pusat notifikasi, bukan di halaman putih.
  await page.getByRole('button', { name: /Tutup|Close/ }).click({ timeout: 5_000 })
  await expect(page).toHaveURL(/\/notifikasi$/)
}

test.describe('layar HP', () => {
  test.use({ viewport: { width: 412, height: 915 } })

  test('alur notifikasi · /notifikasi', async ({ page }) => {
    await alurNotifikasi(page)
  })

  test('preferensi notifikasi · /notifikasi/pengaturan', async ({ page }) => {
    await alurPreferensi(page)
  })
})

test.describe('layar desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('alur notifikasi · /notifikasi', async ({ page }) => {
    await alurNotifikasi(page)
  })

  test('preferensi notifikasi · /notifikasi/pengaturan', async ({ page }) => {
    await alurPreferensi(page)
  })
})

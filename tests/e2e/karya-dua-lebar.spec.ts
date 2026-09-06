import { expect, type Page, test } from '@playwright/test'

/**
 * Alur studio yang sama, dijalankan di **dua lebar layar**.
 *
 * Bukan dua test yang kebetulan mirip: satu fungsi alur, dipanggil dua kali.
 * Kalau kelak salah satu lebar menyimpang — tombol tertutup bilah navigasi,
 * lembar yang tidak muat, kontrol yang hilang di bawah `sm:` — yang gagal
 * adalah lebar itu saja, dan namanya langsung menyebut mana.
 */
/** Tanggal lokal tiga hari ke depan, `YYYY-MM-DD`. */
function threeDaysFromNow(): string {
  const at = new Date(Date.now() + 3 * 86_400_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`
}

async function alurStudio(page: Page) {
  await page.goto('/karya')

  // Ringkasan empat metrik, dan metrik Koin adalah tautan (FR-EARN-10).
  //
  // Namanya **label lalu angka** sejak audit Fase 14: strip metriknya kini
  // `<dl>` yang sah (tiap sel `<div><dt><dd>`), jadi tautannya cuma membungkus
  // angkanya — dan tautan bernama "1,2rb" tidak mengatakan apa pun. `aria-label`
  // di sisi kode mengembalikan labelnya, di depan. Angkanya tetap ikut
  // dijangkar: `/koin$/i` saja juga mengenai tautan "Isi Koin" di bilah
  // navigasi, dan itu gagal sebagai strict mode violation yang terlihat seperti
  // cacat produk.
  await expect(page.getByRole('link', { name: /^Koin [\d.,rbjt]+$/i })).toHaveAttribute(
    'href',
    '/penulis/analitik',
  )

  // Menyaring ke draf: tab bekerja di kedua lebar.
  await page.getByRole('tab', { name: 'Draf', exact: true }).click()
  await expect(page.getByText('Musim yang Tidak Kembali')).toBeVisible()

  // Aksi kondisional: draf punya Jadwalkan, tidak punya Cetak PDF.
  await expect(page.getByRole('button', { name: 'Jadwalkan' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cetak PDF' })).toHaveCount(0)

  // Penjadwal terbuka dan tombol simpannya benar-benar bisa ditekan.
  await page.getByRole('button', { name: 'Jadwalkan' }).first().click({ timeout: 5_000 })
  await expect(page.getByText(/bukan bab tertentu/)).toBeVisible()
  await page.getByLabel('2 · Tanggal terbit').fill(threeDaysFromNow())
  await page.getByRole('button', { name: '19:00' }).click({ timeout: 5_000 })
  await page.getByRole('button', { name: 'Simpan jadwal' }).click({ timeout: 5_000 })
  await expect(page.getByText(/bukan bab tertentu/)).toBeHidden({ timeout: 15_000 })

  // Pencarian hanya judul (FR-STUDIO-03): nama genre tidak menghasilkan apa pun.
  await page.goto('/karya')
  await page.getByRole('searchbox').fill('drama')
  await expect(page.getByText('Tidak ada story yang cocok')).toBeVisible()
  await page.getByRole('button', { name: 'Hapus saringan' }).click({ timeout: 5_000 })
  await expect(page.getByText('Velvet Alibi')).toBeVisible()
}

test.describe('layar HP', () => {
  // `viewport` saja, bukan preset perangkat: opsi perangkat harus di tingkat
  // berkas, sedangkan yang menentukan tata letak di sini memang lebarnya.
  test.use({ viewport: { width: 412, height: 915 } })
  test('alur studio · /karya', async ({ page }) => {
    await alurStudio(page)
  })
})

test.describe('layar desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } })
  test('alur studio · /karya', async ({ page }) => {
    await alurStudio(page)
  })
})

/**
 * Alur kelola bab, juga di dua lebar.
 *
 * Halaman ini punya tiga hal yang paling mudah pecah di layar sempit: penghitung
 * yang merangkap pintasan saringan, lembar menu aksi, dan lembar penjadwal yang
 * dibuka **dari dalam** lembar menu. Ketiganya ditekan, bukan sekadar dilihat.
 */
async function alurKelolaBab(page: Page) {
  await page.goto('/karya/ms1/bab')

  // Penghitung adalah pintasan saringan, dan tabnya ikut menyorot.
  await page.getByRole('button', { name: /^Draf · / }).click({ timeout: 5_000 })
  await expect(page.getByRole('tab', { name: 'Draf' })).toHaveAttribute('aria-selected', 'true')

  // Menu aksi: dibangun per status, dan "Hapus" ada di ujungnya.
  await page
    .getByRole('button', { name: /Menu aksi/ })
    .first()
    .click({ timeout: 5_000 })
  const menu = page.getByRole('dialog')
  await expect(menu.getByText('Bab ini masih draf.')).toBeVisible()

  // Penjadwal dibuka dari dalam menu — lembar di atas lembar, tempat paling
  // mudah tertutup bilah navigasi di layar sempit.
  await menu.getByRole('button', { name: 'Jadwalkan' }).click({ timeout: 5_000 })
  await expect(page.getByText(/Yang dijadwalkan hanya bab ini/)).toBeVisible()

  // Tanggalnya **tiga hari ke depan**, bukan hari ini. Hari ini bikin testnya
  // bergantung jam dinding dalam dua arah sekaligus: lewat jam yang dipilih,
  // server menolaknya sebagai waktu yang sudah lewat; sebelum jam itu, babnya
  // masuk pemberitahuan "terbit dalam 24 jam" dan judulnya muncul dua kali.
  await page.getByLabel('Tanggal terbit').fill(threeDaysFromNow())
  await page.getByRole('button', { name: '19:00' }).click({ timeout: 5_000 })
  await page.getByRole('button', { name: 'Simpan jadwal' }).click({ timeout: 5_000 })

  // Menyimpan menunggu server, lalu membatalkan tiga kueri sekaligus (daftar,
  // penghitung, pemberitahuan). Di bawah beban paralel itu bisa lewat ambang
  // bawaan lima detik — yang diuji di sini tata letaknya, bukan kecepatannya.
  await expect(page.getByText(/Yang dijadwalkan hanya bab ini/)).toBeHidden({ timeout: 15_000 })

  // Dan babnya benar-benar pindah ke tab Terjadwal.
  await page.getByRole('tab', { name: 'Terjadwal' }).click({ timeout: 5_000 })
  await expect(page.getByRole('heading', { name: 'Sarapan Pukul Empat Pagi' })).toBeVisible({
    timeout: 15_000,
  })
}

test.describe('layar HP · kelola bab', () => {
  test.use({ viewport: { width: 412, height: 915 } })
  test('alur kelola bab · /karya/:id/bab', async ({ page }) => {
    await alurKelolaBab(page)
  })
})

test.describe('layar desktop · kelola bab', () => {
  test.use({ viewport: { width: 1280, height: 900 } })
  test('alur kelola bab · /karya/:id/bab', async ({ page }) => {
    await alurKelolaBab(page)
  })
})

/**
 * Formulir cerita, juga di dua lebar.
 *
 * Layar terpanjang di seluruh aplikasi: lima section, dua tombol simpan, dan
 * zona bahaya di dasarnya. Yang paling mudah pecah di layar sempit adalah dua
 * ujungnya — tombol simpan atas yang berbagi baris dengan judul halaman, dan
 * zona bahaya yang berada tepat di atas bilah navigasi.
 */
async function alurFormulirBaru(page: Page) {
  await page.goto('/karya/baru')

  // Kedua tombol simpan nonaktif sampai ada perubahan nyata.
  const saves = page.getByRole('button', { name: 'Simpan' })
  await expect(saves).toHaveCount(2)
  await expect(saves.first()).toBeDisabled()

  await page.getByLabel('Judul story').fill('Naskah Dua Lebar')
  await expect(saves.first()).toBeEnabled()

  // Validasi berurutan: sinopsis dulu, baru nama pena.
  await saves.first().click({ timeout: 5_000 })
  await expect(page.getByText('Sinopsis minimal 50 karakter')).toBeVisible()

  await page
    .getByLabel('Sinopsis')
    .fill('Kalimat pembuka yang cukup panjang untuk lolos ambang lima puluh karakter.')
  await page.getByLabel('Nama pena').fill('Amelia Putri')

  // Tombol simpan **bawah** yang ditekan — yang paling berisiko tertutup.
  await saves.last().click({ timeout: 5_000 })

  await expect(page.getByText('Cerita dibuat')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('link', { name: 'Tulis bab pertama' })).toBeVisible()
}

/** Zona bahaya ada di dasar formulir sunting — dan harus benar-benar terjangkau. */
async function alurZonaBahaya(page: Page) {
  await page.goto('/karya/ms1/ubah')

  await expect(page.getByText('Zona bahaya')).toBeVisible()
  await page.getByRole('button', { name: 'Lanjutkan' }).last().click({ timeout: 5_000 })

  // Satu pola konfirmasi untuk ketiganya: ketik ulang judulnya.
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: 'Hapus permanen' })).toBeDisabled()
  await dialog.getByRole('textbox').fill('Velvet Alibi')
  await expect(dialog.getByRole('button', { name: 'Hapus permanen' })).toBeEnabled()
}

test.describe('layar HP · formulir cerita', () => {
  test.use({ viewport: { width: 412, height: 915 } })
  test('alur formulir baru · /karya/baru', async ({ page }) => {
    await alurFormulirBaru(page)
  })
  test('zona bahaya · /karya/:id/ubah', async ({ page }) => {
    await alurZonaBahaya(page)
  })
})

test.describe('layar desktop · formulir cerita', () => {
  test.use({ viewport: { width: 1280, height: 900 } })
  test('alur formulir baru · /karya/baru', async ({ page }) => {
    await alurFormulirBaru(page)
  })
  test('zona bahaya · /karya/:id/ubah', async ({ page }) => {
    await alurZonaBahaya(page)
  })
})

/**
 * Editor bab dwibahasa, di dua lebar.
 *
 * Alur kritis #4: tulis Indonesia → tambah English → terbitkan → babnya tayang
 * di daftar. Yang paling mudah pecah di layar sempit ada tiga: bilah alat yang
 * menempel di atas, dua lembar bertingkat pada alur terbit, dan tombol terbit
 * yang berada di dasar naskah sepanjang apa pun.
 */
async function alurEditorBab(page: Page) {
  await page.goto('/karya/ms1/bab/baru')

  // Kepala halaman menyebut cerita induknya (FR-STUDIO-35).
  await expect(page.getByText(/Untuk "/)).toBeVisible()
  await expect(page.getByText('ID 0 kata')).toBeVisible()

  await page.getByLabel('Judul bab').fill('Bab Dua Lebar')
  await page.getByLabel('Isi bab').fill('Paragraf pertama naskah uji.\n\nParagraf kedua.')
  await expect(page.getByText('ID 6 kata')).toBeVisible()

  // Panel English mulai dari kartu ajakan, bukan kolom kosong.
  await page.getByRole('tab', { name: 'English' }).click({ timeout: 5_000 })
  await expect(page.getByText('Belum ada versi English')).toBeVisible()
  await page.getByRole('button', { name: 'Mulai Tulis English' }).click({ timeout: 5_000 })
  await page.getByLabel('English title').fill('Two Widths')
  await page.getByLabel('English content').fill('First paragraph of the test draft.')

  // Label tombol terbit berubah begitu versi English ada.
  const publish = page.getByRole('button', { name: 'Terbitkan ID + EN' })
  await expect(publish).toBeVisible()
  await publish.click({ timeout: 5_000 })

  // Lembar pilihan; kedua versi lengkap, jadi tidak ada konfirmasi tambahan.
  const sheet = page.getByRole('dialog')
  await sheet.getByRole('button', { name: 'Terbitkan', exact: true }).click({ timeout: 5_000 })

  await expect(page).toHaveURL(/\/karya\/ms1\/bab$/)
  await expect(page.getByText('Bab Dua Lebar')).toBeVisible({ timeout: 15_000 })
}

test.describe('layar HP · editor bab', () => {
  test.use({ viewport: { width: 412, height: 915 } })
  test('alur editor bab dwibahasa', async ({ page }) => {
    await alurEditorBab(page)
  })
})

test.describe('layar desktop · editor bab', () => {
  test.use({ viewport: { width: 1280, height: 900 } })
  test('alur editor bab dwibahasa', async ({ page }) => {
    await alurEditorBab(page)
  })
})

/**
 * Akses bab, di dua lebar.
 *
 * Tiga kartu tipe, panel yang berganti mengikutinya, dan dialog konfirmasi —
 * di layar sempit ketiganya menumpuk vertikal, dan tombol simpan berakhir di
 * dasar halaman tepat di atas bilah navigasi.
 */
async function alurAksesBab(page: Page) {
  await page.goto('/karya/ms1/bab/ms1-c47/akses')

  // Halaman tahu bab mana yang sedang diatur (FR-STUDIO-36).
  await expect(page.getByText(/^Bab 47 · /)).toBeVisible()

  // Tombol simpan mati sampai ada perubahan nyata.
  await expect(page.getByRole('button', { name: 'Tidak ada perubahan' })).toBeDisabled()

  // Berbayar → Gratis adalah transisi berisiko: ditahan konfirmasi berisi
  // jumlah pembeli yang nyata.
  await page.getByRole('button', { name: /^Gratis/ }).click({ timeout: 5_000 })
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText(/pembeli tidak mendapat pengembalian koin/)).toBeVisible()
  await dialog.getByRole('button', { name: 'Ya, lanjutkan' }).click({ timeout: 5_000 })

  // Tombol simpan hidup, dan benar-benar bisa ditekan di kedua lebar.
  const save = page.getByRole('button', { name: 'Simpan pengaturan' })
  await expect(save).toBeEnabled()
  await save.click({ timeout: 5_000 })

  // Sesudah tersimpan, opsi Berbayar ditahan tujuh hari — beserta alasannya.
  await expect(page.getByText(/dalam 7 hari lagi/)).toBeVisible({ timeout: 15_000 })
}

test.describe('layar HP · akses bab', () => {
  test.use({ viewport: { width: 412, height: 915 } })
  test('alur akses bab · /karya/:id/bab/:babId/akses', async ({ page }) => {
    await alurAksesBab(page)
  })
})

test.describe('layar desktop · akses bab', () => {
  test.use({ viewport: { width: 1280, height: 900 } })
  test('alur akses bab · /karya/:id/bab/:babId/akses', async ({ page }) => {
    await alurAksesBab(page)
  })
})

/**
 * Jadwal terpadu & antrean tinjauan, di dua lebar.
 *
 * Layar jadwal menumpuk banyak: tiga metrik, dua sisipan peringatan, tiga tab,
 * lalu daftar entri yang tiap barisnya punya dua aksi. Di layar sempit semuanya
 * berbaris vertikal, dan tombol batalkan berakhir jauh di bawah.
 */
async function alurJadwalDanTinjauan(page: Page) {
  await page.goto('/karya/jadwal')
  await expect(page.getByText(/Semua yang akan terbit/)).toBeVisible()

  // Tiga tab, dan "Perlu tindakan" menggabungkan celah dengan bentrok.
  await page.getByRole('tab', { name: 'Perlu tindakan' }).click({ timeout: 5_000 })
  await expect(page.getByRole('tab', { name: 'Perlu tindakan' })).toHaveAttribute(
    'aria-selected',
    'true',
  )

  // Antrean tinjauan: alasan penolakan tampil di barisnya sendiri.
  await page.goto('/karya/tinjauan')
  await expect(page.getByText(/sedang menunggu keputusan/).first()).toBeVisible()
  await expect(page.getByText('Alasan penolakan').first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Perbaiki & kirim ulang' }).first()).toBeVisible()
}

test.describe('layar HP · jadwal & tinjauan', () => {
  test.use({ viewport: { width: 412, height: 915 } })
  test('alur jadwal & antrean tinjauan', async ({ page }) => {
    await alurJadwalDanTinjauan(page)
  })
})

test.describe('layar desktop · jadwal & tinjauan', () => {
  test.use({ viewport: { width: 1280, height: 900 } })
  test('alur jadwal & antrean tinjauan', async ({ page }) => {
    await alurJadwalDanTinjauan(page)
  })
})

/**
 * Analitik cerita & riwayat cetak, di dua lebar.
 *
 * Dua layar paling padat di studio: yang satu punya grafik SVG, kalender, dan
 * daftar performa; yang satu lagi lini masa enam tahap yang harus muat di 390px
 * tanpa memotong label tahapnya.
 */
async function alurAnalitikDanCetak(page: Page) {
  await page.goto('/karya/ms1/analitik')
  await expect(page.getByText(/7 hari terakhir/)).toBeVisible({ timeout: 15_000 })

  // Rentang menyaring di server: labelnya ikut berubah, bukan hanya chipnya.
  await page.getByRole('tab', { name: '30H', exact: true }).click({ timeout: 5_000 })
  await expect(page.getByText(/30 hari terakhir/)).toBeVisible({ timeout: 15_000 })

  // Lapisan terakhir ditahan — grafiknya tidak pernah jadi kotak kosong.
  await page.getByRole('button', { name: 'Views', exact: true }).click({ timeout: 5_000 })
  await page.getByRole('button', { name: 'Pembaca', exact: true }).click({ timeout: 5_000 })
  await expect(page.getByText(/Minimal satu lapisan harus menyala/)).toBeVisible()

  // Kartu bab membuka sheet detail — dan tombolnya benar-benar bisa ditekan,
  // bukan sekadar terlihat di bawah bilah aksi.
  await page.getByRole('button', { name: /^#1/ }).first().click({ timeout: 5_000 })
  await expect(page.getByRole('dialog').getByText(/Retensi/)).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: /Tutup/ }).click({ timeout: 5_000 })

  await page.goto('/karya/cetak')
  // `PRINT-402` menghentikan halaman sampai penulis memutuskan — dan jalan
  // keluarnya ada.
  await expect(page.getByText('Biaya cetak berubah')).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Lihat riwayat dulu' }).click({ timeout: 5_000 })

  await page.getByRole('tab', { name: 'Hardcopy' }).click({ timeout: 5_000 })
  // Baris pesanan bukan `.nv-card` lagi sejak R6 — kartu diganti baris
  // berpembatas (`7o`–`7r`, brief §4).
  const printing = page.locator('article', { hasText: '#HDC-20260822-001' }).first()
  await expect(printing.getByText('Dicetak').first()).toBeVisible({ timeout: 15_000 })

  // Tombol batal tetap ada setelah produksi; yang menolak servernya, dan
  // penolakannya menyebut biayanya.
  await printing.getByRole('button', { name: 'Batalkan pesanan' }).click({ timeout: 5_000 })
  await expect(page.getByText(/tidak bisa dibatalkan/)).toBeVisible({ timeout: 15_000 })
}

test.describe('layar HP · analitik & cetak', () => {
  test.use({ viewport: { width: 412, height: 915 } })
  test('alur analitik cerita & riwayat cetak', async ({ page }) => {
    await alurAnalitikDanCetak(page)
  })
})

test.describe('layar desktop · analitik & cetak', () => {
  test.use({ viewport: { width: 1280, height: 900 } })
  test('alur analitik cerita & riwayat cetak', async ({ page }) => {
    await alurAnalitikDanCetak(page)
  })
})

/**
 * Penghasilan penulis, di dua lebar.
 *
 * Layar ini punya dua baris pil yang mudah bertabrakan di 390px — rentang waktu
 * dan sudut pandang — lalu isi yang **berganti seluruhnya** menurut pil kedua.
 * Di desktop keduanya muat sebaris; di HP keduanya harus tetap bisa ditekan.
 */
async function alurPenghasilan(page: Page) {
  await page.goto('/penulis/analitik')
  await expect(page.getByText(/30 hari terakhir/)).toBeVisible({ timeout: 15_000 })

  // Kurs koin → rupiah dinyatakan terang; tanpa ini koin dan rupiah tidak
  // pernah bertemu di mana pun.
  await expect(page.getByText(/1 koin = Rp/)).toBeVisible()

  // Rentang menyaring di server.
  await page.getByRole('tab', { name: '7H', exact: true }).click({ timeout: 5_000 })
  await expect(page.getByText(/7 hari terakhir/)).toBeVisible({ timeout: 15_000 })

  // Sudut pandang benar-benar mengganti isi. Dicari sebagai **judul**, bukan
  // teks bebas: pencocokan teks Playwright tidak peka huruf besar-kecil, dan
  // keterangan tiap sudut pandang memuat frasa yang sama ("…titik berhenti per
  // bab"), jadi `getByText` mengenai dua elemen sekaligus.
  const judul = (name: string) => page.getByRole('heading', { name, exact: true })

  await expect(judul('Kurva pendapatan')).toBeVisible()
  await page.getByRole('tab', { name: 'Retensi', exact: true }).click({ timeout: 5_000 })
  await expect(judul('Titik berhenti')).toBeVisible({ timeout: 15_000 })
  await expect(judul('Kurva pendapatan')).toHaveCount(0)

  await page.getByRole('tab', { name: 'Traffic', exact: true }).click({ timeout: 5_000 })
  await expect(judul('Sumber pembaca')).toBeVisible({ timeout: 15_000 })

  // Corong pembaca menyebut ceritanya, dan heatmap punya sel terpanas yang
  // konsisten dengan rekomendasinya.
  await page.getByRole('tab', { name: 'Retensi', exact: true }).click({ timeout: 5_000 })
  await expect(judul('Corong pembaca')).toBeVisible({ timeout: 15_000 })

  await page.getByRole('tab', { name: 'Traffic', exact: true }).click({ timeout: 5_000 })
  const heat = page.getByRole('table', { name: /peta panas/i })
  await expect(heat).toBeVisible({ timeout: 15_000 })
  // Tabel lebar di 390px harus menggulir **di dalam wadahnya**, bukan menggeser
  // badan halaman — itu yang dijaga sapuan HP.
  await expect(heat.getByText(/Sab 17–22 · paling ramai/)).toBeAttached()

  // Rekomendasi yang bisa dijalankan: tautannya membuka penjadwal.
  await page.getByRole('link', { name: /Buka penjadwal/ }).click({ timeout: 5_000 })
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 })
  await page.getByRole('dialog').getByRole('button', { name: 'Batal' }).click({ timeout: 5_000 })

  // Riwayat pencairan: rantai koin → rupiah dijelaskan utuh.
  await page.goto('/penulis/penarikan/riwayat')
  await expect(judul('Bagaimana koin jadi rupiah')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/Kurs berlaku: 1 koin = Rp/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Unduh bukti transfer' })).toBeVisible()

  await page.goto('/penulis/analitik')
  // Pintu masuknya dua arah: dari studio ke sini, dan dari sini kembali.
  await page.getByRole('link', { name: 'Kelola cerita' }).click({ timeout: 5_000 })
  await expect(page.getByRole('link', { name: 'Penghasilan', exact: true })).toBeVisible({
    timeout: 15_000,
  })
}

test.describe('layar HP · penghasilan', () => {
  test.use({ viewport: { width: 412, height: 915 } })
  test('alur penghasilan penulis', async ({ page }) => {
    await alurPenghasilan(page)
  })
})

test.describe('layar desktop · penghasilan', () => {
  test.use({ viewport: { width: 1280, height: 900 } })
  test('alur penghasilan penulis', async ({ page }) => {
    await alurPenghasilan(page)
  })
})

/**
 * Pengajuan pencairan, di dua lebar.
 *
 * Layar uang dengan **dok bawah**: di HP tombolnya berisiko tertutup bilah
 * navigasi, dan itu persis cacat yang pernah dilaporkan pengguna pada layar
 * bayar (CLAUDE.md §8). Karena itu tombolnya benar-benar **ditekan** di sini,
 * bukan sekadar dipastikan terlihat.
 */
async function alurPencairan(page: Page) {
  await page.goto('/penulis/penarikan')
  await expect(page.getByText('Saldo tersedia')).toBeVisible({ timeout: 15_000 })

  // Kedua syarat tampil sebelum formulir · FR-EARN-06. Dicari `.first()`:
  // "1–3 hari kerja" sengaja muncul dua kali — sebagai syarat di kepala halaman
  // dan sebagai janji di teks status bawah.
  await expect(page.getByText('Minimum', { exact: true })).toBeVisible()
  await expect(page.getByText('1–3 hari kerja').first()).toBeVisible()
  await expect(page.getByText('**** 4481')).toBeVisible()

  const submit = page.getByRole('button', { name: 'Ajukan penarikan' })
  await expect(submit).toBeDisabled()

  // Tangga validasi berhenti pada kesalahan pertama, dan tombolnya tetap mati.
  const jumlah = page.getByLabel('Jumlah penarikan')
  await jumlah.fill('50.000')
  await expect(page.getByRole('alert')).toContainText('Penarikan minimum Rp 100.000')
  await expect(submit).toBeDisabled()

  // Titik diabaikan, dan bersihnya dihitung tiap ketikan · FR-EARN-08.
  await jumlah.fill('1.000.000')
  // `.first()`: bersihnya sengaja tampil dua kali — di ringkasan dan di dok
  // bawah, supaya penulis melihat angkanya tanpa menggulir kembali ke atas.
  // Regex `\s` menjaga terhadap non-breaking space milik `formatRupiah` (§8).
  await expect(page.getByText(/Rp\s995\.000/).first()).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)

  // "Tarik semua" mengisi seluruh saldo tersedia · FR-EARN-11.
  await page.getByRole('button', { name: 'Tarik semua' }).click({ timeout: 5_000 })
  await expect(submit).toBeEnabled()

  // Ditekan sungguhan: dok bawah tidak boleh tertutup apa pun di 390px.
  await jumlah.fill('150000')
  await submit.click({ timeout: 5_000 })
  await expect(page.getByText(/masuk antrean verifikasi/)).toBeVisible({ timeout: 15_000 })

  // Saldo tersedia langsung ditahan — dana yang sama tidak bisa diajukan dua kali.
  await expect(page.getByText(/sudah diajukan dan menunggu keputusan/)).toBeVisible()
}

test.describe('layar HP · pencairan', () => {
  test.use({ viewport: { width: 412, height: 915 } })
  test('alur pengajuan pencairan', async ({ page }) => {
    await alurPencairan(page)
  })
})

test.describe('layar desktop · pencairan', () => {
  test.use({ viewport: { width: 1280, height: 900 } })
  test('alur pengajuan pencairan', async ({ page }) => {
    await alurPencairan(page)
  })
})

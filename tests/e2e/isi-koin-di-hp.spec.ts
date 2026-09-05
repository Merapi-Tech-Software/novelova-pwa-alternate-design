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
  // Bab **terkunci** — gerbang Type B `7x` beserta strip pilihan dan pratinjau
  // buramnya semuanya baru di R4, dan tidak satu pun ada di bab gratis di atas.
  '/cerita/s1/bab/s1-c8',
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
  // Halaman baru / ditata ulang di R5–R6.
  '/profil',
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

/**
 * Beranda susunan baru · `architecture.md` §1.22 — **ditekan di lima lebar**.
 *
 * Sapuan di atas cuma membuktikan halamannya tidak menggeser ke samping. Yang
 * ditambahkan §1.22 adalah dua hal yang bisa rusak tanpa meluber sedikit pun:
 * susunan bloknya, dan sebuah lapisan yang menutupi layar. Lapisan yang
 * tombolnya tertutup tetap lolos `toBeVisible()` — jadi tombolnya **ditekan**.
 */
test('layar HP: susunan beranda dan zoom sampul bekerja di lima lebar + desktop', async ({
  page,
}) => {
  // **Lebar desktop ikut**, mengikuti pola `karya-dua-lebar.spec.ts`: satu alur
  // dijalankan di beberapa lebar, bukan beberapa test yang kebetulan mirip.
  // Yang dijanjikan §1.22 adalah perilaku yang sama di HP dan di layar lebar,
  // dan satu-satunya cara janji itu tidak bisa lapuk adalah alurnya sendiri
  // dijalankan di sana.
  for (const width of [...LEBAR_HP, 1280]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready)

    // 1. Susunan: tiga section prioritas mendahului tab genre.
    const populer = page.getByRole('heading', { name: 'Populer', exact: true })
    const tabFantasy = page.getByRole('button', { name: 'Fantasy', exact: true })
    await expect(populer).toBeVisible()
    await expect(tabFantasy).toBeVisible()

    const posisi = await page.evaluate(() => {
      const judul = [...document.querySelectorAll('h2')].find((h) => h.textContent === 'Populer')
      const tab = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Fantasy')
      if (!judul || !tab) return null
      return { judul: judul.getBoundingClientRect().top, tab: tab.getBoundingClientRect().top }
    })
    expect(posisi, `susunan tidak terbaca di ${width}px`).not.toBeNull()
    expect(posisi?.judul, `Populer harus di atas tab genre di ${width}px`).toBeLessThan(
      posisi?.tab ?? 0,
    )

    // 2. Tepi kiri rel sejajar kepala section-nya, dan judulnya tidak lebih dari
    //    dua baris. Keduanya cacat yang pernah terjadi dan tidak meluber sedikit
    //    pun (`bugs/bugs_home_content_01.png`).
    const ukur = await page.evaluate(() => {
      const sec = [...document.querySelectorAll('section')].find(
        (el) => el.querySelector('h2')?.textContent === 'Populer',
      )
      const rel = sec?.querySelector('.overflow-x-auto') as HTMLElement | null
      const kartu = rel?.firstElementChild as HTMLElement | null
      const judul = [...document.querySelectorAll('button[aria-label^="Perbesar sampul"]')]
        .map((b) => b.parentElement?.querySelector('a > span') as HTMLElement | null)
        .filter((el): el is HTMLElement => el !== null)
      const tinggi = [...new Set(judul.map((el) => Math.round(el.getBoundingClientRect().height)))]
      return {
        kepala: Math.round(sec?.querySelector('h2')?.getBoundingClientRect().left ?? -1),
        kartu: Math.round(kartu?.getBoundingClientRect().left ?? -1),
        gulir: rel?.scrollLeft ?? -1,
        tinggiJudul: tinggi,
      }
    })
    // Sampul pertama mulai di garis yang sama dengan kepala section-nya.
    expect(ukur.kartu, `tepi kiri rel di ${width}px`).toBe(ukur.kepala)
    // Rel tidak boleh menggulir sendiri saat dimuat — itu yang dulu memakan
    // padding kirinya (`snap-x` tanpa `scroll-px-4`).
    expect(ukur.gulir, `rel tergulir sendiri di ${width}px`).toBe(0)
    // Semua judul setinggi sama, dan tingginya paling banyak dua baris.
    expect(ukur.tinggiJudul.length, `judul tidak seragam di ${width}px`).toBe(1)
    expect(ukur.tinggiJudul[0] ?? 999, `judul lebih dari dua baris di ${width}px`).toBeLessThan(50)

    // 3. Sampul ditekan → lapisan terbuka.
    const sampul = page.getByRole('button', { name: /^Perbesar sampul / }).first()
    await sampul.click({ timeout: 5_000 })

    const lapisan = page.getByRole('dialog')
    await expect(lapisan).toBeVisible()

    // 4. Sampulnya **benar-benar besar**, dan statistiknya ikut. Angka 240px
    //    adalah ukuran lamanya; lapisan yang mengecil lagi ke sana berarti
    //    penjepit tinggi/lebarnya rusak (`bugs/feedback_home_content_01.png`).
    const isi = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]') as HTMLElement
      const p = d.firstElementChild as HTMLElement
      const c = (p.querySelector('span') as HTMLElement).getBoundingClientRect()
      return { lebarSampul: Math.round(c.width), teks: p.textContent ?? '' }
    })
    expect(isi.lebarSampul, `sampul mengecil di ${width}px`).toBeGreaterThanOrEqual(240)
    expect(isi.teks, `statistik hilang di ${width}px`).toMatch(/\d,\d/)
    expect(isi.teks).toMatch(/baca/)

    // 5. Lapisannya sendiri tidak boleh meluber di lebar tersempit.
    await expect
      .poll(
        () =>
          page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          ),
        { message: `lapisan sampul meluber di lebar ${width}px`, timeout: 5_000 },
      )
      .toBeLessThanOrEqual(0)

    // 6. `Buka cerita` benar-benar bisa ditekan — bukan sekadar terlihat.
    const buka = page.getByRole('link', { name: 'Buka cerita' })
    await expect(buka).toBeInViewport()
    await buka.click({ timeout: 5_000 })
    await expect(page).toHaveURL(/\/cerita\//)

    // 7. Kembali, lalu Escape menutup lapisan tanpa berpindah halaman.
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page
      .getByRole('button', { name: /^Perbesar sampul / })
      .first()
      .click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page).toHaveURL(/\/$/)
  }
})

/**
 * Alur ekonomi buka bab · R4 · mockup `7x` `7y` `7z` `7aa`.
 *
 * Dijalankan di **dua lebar** mengikuti pola `karya-dua-lebar.spec.ts`: satu
 * fungsi alur dipanggil dua kali, bukan dua test yang kebetulan mirip. Yang
 * dijanjikan §1.19 dan §1.21 adalah perilaku yang sama di HP dan layar lebar,
 * dan janji itu hanya tidak bisa lapuk kalau alurnya sendiri dijalankan di sana.
 */
async function alurBukaBab(page: import('@playwright/test').Page) {
  await page.goto('/cerita/s1/bab/s1-c8')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)

  // 1. Gerbangnya ada, bernama, dan bilah atasnya terlihat **tanpa diketuk**.
  const gerbang = page.getByLabel('Locked continuation gate')
  await expect(gerbang).toBeVisible()
  await expect(page.getByRole('button', { name: 'Kembali' })).toBeVisible()

  // 2. Saldo diulang di dalam gerbang — keputusannya diambil di sini.
  await expect(gerbang.getByText('Saldo kamu')).toBeVisible()

  // 3. Izin buka-otomatis tercentang bawaan.
  const izin = page.getByRole('switch', { name: 'Buka otomatis untuk cerita ini' })
  await expect(izin).toBeVisible()
  await expect(izin).toBeChecked()

  // 4. Tombolnya **ditekan**, bukan sekadar dilihat: elemen yang tertutup tetap
  //    lolos `toBeVisible()`, yang gagal adalah kliknya.
  const beli = page.getByRole('button', { name: /Chapter ini/ })
  await expect(beli).toBeInViewport()
  await beli.click({ timeout: 5_000 })

  // 5. Babnya terbuka: gerbangnya hilang dan lencana `7y` menggantikannya.
  await expect(gerbang).toBeHidden()
  await expect(page.getByText('Chapter terbuka')).toBeVisible()

  // 6. Baris status izin muncul, dan tombol matikannya bisa ditekan.
  const matikan = page.getByRole('button', { name: 'Matikan' })
  await expect(matikan).toBeVisible()
  await matikan.click({ timeout: 5_000 })
  await expect(matikan).toBeHidden()
}

for (const width of [390, 1280]) {
  test(`buka bab: gerbang → beli → izin, di lebar ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await alurBukaBab(page)
  })
}

/**
 * Target ketuk ≥44px · R7 · `CLAUDE.md` §2 butir 8.
 *
 * **Yang diukur kotak sentuhnya, bukan kotak yang terlihat.** Tombol `sm` dan
 * tab teks sengaja tetap 36–38px supaya hierarki visualnya utuh; yang diperluas
 * `::after` yang tidak terlihat. Mengukur `getBoundingClientRect()` saja akan
 * menyatakan keduanya gagal padahal jarinya mengenai.
 *
 * Ini pemeriksaan yang tidak bisa dilakukan mata: kotak sentuh tidak terlihat
 * sama sekali, dan satu-satunya cara mengetahui ia hilang adalah mengukurnya.
 */
const HITUNG_TARGET = `(() => {
  const kecil = []
  const kandidat = 'button, a[href], [role="button"], [role="switch"], [role="tab"]'
  for (const el of document.querySelectorAll(kandidat)) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue

    const after = getComputedStyle(el, '::after')
    let h = r.height
    let w = r.width
    if (after.content && after.content !== 'none' && after.position === 'absolute') {
      const t = Number.parseFloat(after.top) || 0
      const b = Number.parseFloat(after.bottom) || 0
      const l = Number.parseFloat(after.left) || 0
      const rr = Number.parseFloat(after.right) || 0
      if (t < 0 || b < 0) h = r.height - t - b
      if (l < 0 || rr < 0) w = r.width - l - rr
    }

    if (h < 43.5 || w < 43.5) {
      kecil.push((el.textContent || el.getAttribute('aria-label') || '?').trim().slice(0, 24) +
        ' (' + Math.round(w) + '×' + Math.round(h) + ')')
    }
  }
  return kecil
})()`

for (const path of ['/', '/pustaka', '/cari', '/jelajah/populer', '/cerita/s1', '/profil']) {
  test(`target ketuk ≥44px di ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready)

    /*
     * Diukur berulang sampai tenang, sama seperti sapuan luberan di atas:
     * `networkidle` dan `fonts.ready` sama-sama bisa tercapai saat React Query
     * masih menukar kerangka dengan isinya, dan tombol yang sedang dirender
     * sebagian sesaat lebih pendek daripada seharusnya (`CLAUDE.md` §8).
     */
    await expect
      .poll(async () => (await page.evaluate(HITUNG_TARGET)) as string[], {
        message: `${path} punya target di bawah 44px`,
        timeout: 5_000,
      })
      .toEqual([])
  })
}

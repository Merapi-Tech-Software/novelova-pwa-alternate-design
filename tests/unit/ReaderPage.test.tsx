import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { emptyReaderPrefs } from '@/api/mock/defaults'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { ToastProvider } from '@/components/ui/Toast'
import ReaderPage from '@/features/reader/pages/ReaderPage'

function renderReader(chapterId: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/cerita/s1/bab/${chapterId}`]}>
          <Routes>
            <Route path="/cerita/:storyId/bab/:chapterId" element={<ReaderPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

/**
 * Putaran 7 Type A: chrome **tersembunyi sejak awal**, dan satu ketukan pada
 * teks membukanya (`7u`/`7v`). Bilah atas dan navigasi bawah karena itu tidak
 * ada sampai layar diketuk — test yang mencarinya harus mengetuk lebih dulu,
 * persis seperti pembacanya.
 *
 * Bab **terkunci** dikecualikan: bilah atasnya selalu terlihat (`7x`), jadi
 * test bab terkunci tidak perlu memanggil ini.
 */
async function bukaKontrol() {
  const badan = await screen.findByRole('article')
  fireEvent.click(badan)
}

describe('ruang baca · FR-READ-01 sampai FR-READ-06', () => {
  it('bab gratis tampil utuh beserta bilah atasnya', async () => {
    renderReader('s1-c1')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Perjanjian Malam Itu' }),
    ).toBeInTheDocument()

    // Sebelum diketuk, kontrolnya memang belum ada — itu inti Type A.
    expect(screen.queryByRole('button', { name: 'Pengaturan baca' })).not.toBeInTheDocument()

    await bukaKontrol()
    expect(screen.getByRole('button', { name: 'Pengaturan baca' })).toBeInTheDocument()
    // Posisinya tetap tampil dua kali (FR-READ-15), tetapi **formatnya berbeda**
    // sejak `7v`: bilah atas membawa judul cerita + posisi + durasi, navigasi
    // bawah membawa posisi ringkasnya. Dua kalimat berbeda untuk dua tempat yang
    // menjawab pertanyaan berbeda — "aku di buku mana, berapa lagi" versus
    // "aku bisa ke mana".
    expect(screen.getByText('Bab 1 dari 120 · 8 menit')).toBeInTheDocument()
    expect(screen.getByText('Cinta di Balik Kontrak')).toBeInTheDocument()
    expect(screen.getByText('Bab 1 / 120')).toBeInTheDocument()
  })

  it('bab terkunci hanya mengirim pratinjau, bukan naskah lengkap', async () => {
    const chapter = await api.getChapter('s1', 's1-c8')

    expect(chapter.owned).toBe(false)
    expect(chapter.content).toEqual([])
    expect(chapter.preview.length).toBeGreaterThan(0)
  })

  it('panel pengaturan tertutup benar-benar hilang, dan aria-expanded ikut', async () => {
    renderReader('s1-c1')
    await bukaKontrol()
    const toggle = await screen.findByRole('button', { name: 'Pengaturan baca' })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByLabelText('Pengaturan baca', { selector: 'fieldset' })).not.toBeVisible()

    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('switch', { name: 'Tema gelap' })).toBeInTheDocument()
  })

  it('mengubah ukuran huruf langsung menempel ke elemen akar', async () => {
    renderReader('s1-c1')
    await bukaKontrol()
    await userEvent.click(await screen.findByRole('button', { name: 'Pengaturan baca' }))

    // `fireEvent`, bukan `userEvent`: jsdom tidak menggeser `input[type=range]`
    // lewat papan tik seperti peramban sungguhan.
    fireEvent.change(screen.getByRole('slider', { name: 'Ukuran huruf' }), {
      target: { value: '21' },
    })

    expect(document.documentElement.style.getPropertyValue('--reader-font-size')).toBe('21px')
  })
})

describe('gerbang bab terkunci · FR-READ-06 · FR-READ-07 · FR-READ-17', () => {
  it('menawarkan tiga pilihan berbayar dengan angka dari server', async () => {
    renderReader('s1-c8')

    expect(await screen.findByText(/Bagian di bawah tersensor/)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Chapter ini/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /10 chapter/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Buka sampai tamat/ })).toBeInTheDocument()
  })

  it('naskah bab terkunci tidak pernah dirender, bahkan tersembunyi', async () => {
    renderReader('s1-c8')
    await screen.findByText(/Bagian di bawah tersensor/)

    const full = await api.getChapter('s1', 's1-c8')
    expect(full.content).toEqual([])

    /*
     * **Paragraf pembukanya terbaca**, sisanya tersensor (`7x`, R4c). Kalau
     * seluruhnya diburamkan, pembaca tidak pernah tahu ia sedang membaca cerita
     * yang mana — dan halaman yang isinya blok abu-abu seluruhnya terbaca
     * sebagai kerusakan, bukan sebagai batas berbayar.
     */
    const gratis = full.preview[0] ?? ''
    expect(screen.getByText(gratis).closest('[aria-hidden="true"]')).toBeNull()

    // Yang tersensor ada di layar tetapi tidak dibacakan pembaca layar.
    const tersensor = full.preview[1] ?? ''
    expect(screen.getByText(tersensor).closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('saldo kurang membuka lembar berisi kekurangannya, bukan toast', async () => {
    await db.wallets.put({
      userId: CURRENT_USER_ID,
      balance: 0,
      bonus: 0,
      updatedAt: new Date().toISOString(),
    })
    renderReader('s1-c8')

    await userEvent.click(await screen.findByRole('button', { name: /Chapter ini/ }))

    expect(await screen.findByText(/^Kurang /)).toBeInTheDocument()
    expect(screen.getByText('Kurang 2.000 koin')).toBeInTheDocument()
    // Jalan keluarnya membawa konteks kembali ke bab yang sama.
    expect(screen.getByRole('link', { name: /Isi koin/ })).toHaveAttribute(
      'href',
      expect.stringContaining('chapter_id=s1-c8'),
    )
  })
})

describe('gulir menerus · §1.25 · R4b', () => {
  it('tidak ada tombol bab sebelumnya/berikutnya di mana pun', async () => {
    renderReader('s1-c1')
    await screen.findByRole('heading', { level: 1, name: 'Perjanjian Malam Itu' })
    await bukaKontrol()

    /*
     * **Dibalik dari test lama.** Sampai R4 keduanya wajib ada — yang pertama
     * mati di bab pertama, yang kedua membawa judul tujuannya. Sejak §1.25
     * bacaannya mengalir, dan tombol lompat justru mengajarkan pembaca bahwa
     * ada batas bab yang perlu dilewati — persis yang alur ini hilangkan.
     */
    expect(screen.queryByRole('button', { name: 'Bab sebelumnya' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Bab berikutnya' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Bab berikutnya:/ })).not.toBeInTheDocument()

    // Nomor babnya tetap ada — pembaca tetap punya satu tempat untuk tahu ia
    // sedang di mana.
    expect(screen.getAllByText(/^Bab \d+ \/ \d+$/).length).toBeGreaterThan(0)
  })

  it('hanya bab pertama yang punya pembuka; sambungannya garis polos', async () => {
    const { container } = renderReader('s1-c1')
    await screen.findByRole('heading', { level: 1, name: 'Perjanjian Malam Itu' })

    // Satu `<h1>` saja, walau beberapa bab bisa tersambung: pembuka bab besar
    // adalah jeda visual, dan sambungannya tidak boleh punya jeda.
    expect(container.querySelectorAll('h1')).toHaveLength(1)
  })
})

describe('komentar di ruang baca · brief §7', () => {
  it('komentar hanya di bilah bawah, tidak pernah di akhir bab', async () => {
    renderReader('s1-c1')

    // Reaksi tetap di akhir bab — yang pindah hanya komentarnya.
    expect(await screen.findByRole('button', { name: 'Suka' })).toBeInTheDocument()

    // Brief §7: **satu-satunya** tempatnya baris kedua bilah bawah. Komentar di
    // ujung teks hanya bisa dicapai dengan menggulir melewati seluruh bab, dan
    // pembaca yang sampai ke sana sudah kehilangan tempatnya.
    expect(screen.queryByRole('link', { name: /komentar/i })).not.toBeInTheDocument()

    // Dan di overlay ia **tombol yang membuka lembar**, bukan tautan yang
    // berpindah halaman (`7w`): posisi baca tidak pernah hilang karena ruang
    // bacanya tetap terpasang di belakang lembarnya.
    await bukaKontrol()
    const tombol = screen.getByRole('button', { name: /komentar bab/i })
    expect(tombol).toBeInTheDocument()

    await userEvent.click(tombol)
    expect(await screen.findByRole('dialog', { name: /komentar bab/i })).toBeInTheDocument()
    expect(screen.getByRole('article')).toBeInTheDocument()
  })
})

describe('auto-unlock per cerita · FR-READ-09 · §1.19', () => {
  it('tanpa izin cerita ini, bab terkunci tetap menampilkan gerbangnya', async () => {
    await db.readerPrefs.put(emptyReaderPrefs(CURRENT_USER_ID))
    renderReader('s1-c8')

    expect(await screen.findByText(/Bagian di bawah tersensor/)).toBeInTheDocument()
  })

  it('izin cerita ini menyala dan saldo cukup: babnya terbuka sendiri tanpa ketukan', async () => {
    await db.wallets.put({
      userId: CURRENT_USER_ID,
      balance: 50_000,
      bonus: 0,
      updatedAt: new Date().toISOString(),
    })
    await db.ownerships.where('userId').equals(CURRENT_USER_ID).delete()
    // Izinnya **per cerita, di server** — bukan sakelar global di `stores/`,
    // yang dicabut di R4b karena melanggar aturan struktur #5.
    await db.readerPrefs.put({
      ...emptyReaderPrefs(CURRENT_USER_ID),
      autoUnlockStoryIds: ['s1'],
    })

    renderReader('s1-c8')

    /*
     * Tanpa satu pun klik, isi babnya muncul. Yang **tidak** lagi diperiksa:
     * "tidak ada gerbang di mana pun" — sejak §1.25 rantainya menyambung bab
     * berikutnya sampai menemui bab terkunci berikutnya, dan gerbang di ujung
     * rantai itu benar. Yang dijaga di sini: bab **tempat pembaca masuk**
     * terbuka sendiri, dan gerbangnya paling banyak satu (dindingnya).
     */
    expect(await screen.findByRole('button', { name: 'Suka' })).toBeInTheDocument()
    expect(screen.queryAllByText(/Bagian di bawah tersensor/).length).toBeLessThanOrEqual(1)

    await db.readerPrefs.put(emptyReaderPrefs(CURRENT_USER_ID))
  })

  it('izin cerita LAIN tidak membuka bab cerita ini', async () => {
    await db.wallets.put({
      userId: CURRENT_USER_ID,
      balance: 50_000,
      bonus: 0,
      updatedAt: new Date().toISOString(),
    })
    await db.ownerships.where('userId').equals(CURRENT_USER_ID).delete()
    await db.readerPrefs.put({
      ...emptyReaderPrefs(CURRENT_USER_ID),
      autoUnlockStoryIds: ['s3'],
    })

    renderReader('s1-c8')

    // Inti §1.19: izinnya milik satu cerita, bukan sakelar yang berlaku umum.
    expect(await screen.findByText(/Bagian di bawah tersensor/)).toBeInTheDocument()

    await db.readerPrefs.put(emptyReaderPrefs(CURRENT_USER_ID))
  })
})

it('membuka lewat iklan juga menyimpan izinnya — sakelarnya tidak dibuang diam-diam', async () => {
  await db.ownerships.where('userId').equals(CURRENT_USER_ID).delete()
  await db.readerPrefs.put(emptyReaderPrefs(CURRENT_USER_ID))

  const spy = vi.spyOn(api, 'unlockChapter')
  renderReader('s1-c8')
  await screen.findByText(/Bagian di bawah tersensor/)

  await userEvent.click(await screen.findByRole('button', { name: /Tonton iklan/ }))

  /*
   * Terukur sebelum perbaikan ini: jalur koin menyimpan `["s1"]`, jalur iklan
   * menyimpan `[]`. Pembaca sudah menyetujui di gerbang dan menonton sampai
   * habis, lalu bab berikutnya bergerbang lagi seolah ia tidak pernah setuju.
   */
  await vi.waitFor(
    () => {
      const panggilan = spy.mock.calls.find((c) => c[0]?.source === 'ad')
      expect(panggilan?.[0]).toMatchObject({ source: 'ad', enableAutoUnlock: true })
    },
    { timeout: 10_000 },
  )

  spy.mockRestore()
  await db.readerPrefs.put(emptyReaderPrefs(CURRENT_USER_ID))
}, 15_000) // Layar iklannya berhitung mundur **lima detik sungguhan** — itu memang
// yang dialami pembaca, dan memalsukannya dengan timer semu berarti menguji
// timer, bukan alurnya.

describe('saldo kurang · mockup `7z` · R4e', () => {
  it('lembar membawa TIGA jalan keluar, bukan satu tombol buntu', async () => {
    await db.wallets.put({
      userId: CURRENT_USER_ID,
      balance: 300,
      bonus: 0,
      updatedAt: new Date().toISOString(),
    })
    await db.ownerships.where('userId').equals(CURRENT_USER_ID).delete()
    await db.readerPrefs.put(emptyReaderPrefs(CURRENT_USER_ID))

    renderReader('s1-c8')
    await userEvent.click(await screen.findByRole('button', { name: /Chapter ini/ }))

    /*
     * Permintaan produk 4 September menyebut dua jalan; voucher tetap ada karena
     * ia satu-satunya yang tidak menuntut uang **maupun** menonton iklan, dan
     * lembar buntu yang menawarkan lebih sedikit melanggar §1.4.
     */
    // Dicari **di dalam lembarnya**: gerbang di belakangnya juga punya tombol
    // "Tonton iklan", dan mencarinya di seluruh dokumen mengenai keduanya.
    const lembar = await screen.findByRole('dialog')
    expect(within(lembar).getByRole('link', { name: /Isi koin/ })).toBeInTheDocument()
    expect(within(lembar).getByRole('button', { name: /Pakai voucher/ })).toBeInTheDocument()
    expect(within(lembar).getByRole('button', { name: /Tonton iklan/ })).toBeInTheDocument()

    // Dan menyatakan terang bahwa membatalkan tidak menghilangkan apa pun.
    expect(within(lembar).getByText(/gerbangnya masih terbuka/)).toBeInTheDocument()
  })

  it('saldo TIDAK diperiksa klien — servernya yang menolak, lembarnya dibuka dari kekurangannya', async () => {
    await db.wallets.put({
      userId: CURRENT_USER_ID,
      balance: 300,
      bonus: 0,
      updatedAt: new Date().toISOString(),
    })
    await db.ownerships.where('userId').equals(CURRENT_USER_ID).delete()
    await db.readerPrefs.put(emptyReaderPrefs(CURRENT_USER_ID))

    const spy = vi.spyOn(api, 'unlockChapter')
    renderReader('s1-c8')
    await userEvent.click(await screen.findByRole('button', { name: /Chapter ini/ }))

    /*
     * Tombolnya **tetap memanggil server** walau saldonya jelas kurang. Harga
     * ada di `Chapter.priceCoins` dan berbeda per bab; klien yang memeriksa
     * sendiri harus menebak harganya, dan tebakan di layar uang adalah cacat
     * yang ditagih pengguna belakangan (§1.21).
     */
    await vi.waitFor(() => expect(spy).toHaveBeenCalled())
    expect(await screen.findByText(/^Kurang /)).toBeInTheDocument()

    spy.mockRestore()
  })
})

describe('gerbang Type B · mockup `7x` · R4c', () => {
  it('bilah atas tetap terlihat tanpa diketuk — Type A menyembunyikannya, Type B tidak', async () => {
    await db.readerPrefs.put(emptyReaderPrefs(CURRENT_USER_ID))
    renderReader('s1-c8')
    await screen.findByText(/Bagian di bawah tersensor/)

    // Tanpa ini bab terkunci tidak punya tombol kembali sampai pembaca menebak
    // bahwa layarnya bisa diketuk.
    expect(screen.getByRole('button', { name: 'Kembali' })).toBeInTheDocument()
  })

  it('pratinjaunya aria-hidden, tetapi labelnya tetap terbaca', async () => {
    await db.readerPrefs.put(emptyReaderPrefs(CURRENT_USER_ID))
    const { container } = renderReader('s1-c8')
    await screen.findByText(/Bagian di bawah tersensor/)

    // Labelnya menjelaskan kenapa ada blok abu-abu di tengah halaman.
    expect(screen.getByText('Pratinjau tersensor')).toBeInTheDocument()
    // Isinya tidak dibacakan pembaca layar: potongan kalimat yang tidak lengkap
    // bukan informasi.
    expect(container.querySelector('[aria-hidden="true"] .blur-\\[4px\\]')).not.toBeNull()
  })

  it('gerbangnya bernama, dan saldonya diulang di dalamnya', async () => {
    await db.readerPrefs.put(emptyReaderPrefs(CURRENT_USER_ID))
    renderReader('s1-c8')
    await screen.findByText(/Bagian di bawah tersensor/)

    const gerbang = screen.getByLabelText('Locked continuation gate')
    // Saldo diulang supaya keputusan membeli tidak menuntut melihat ke ujung layar.
    expect(gerbang.textContent).toMatch(/Saldo kamu/i)
  })

  it('izin buka-otomatis ada di gerbang dan tercentang bawaan', async () => {
    await db.readerPrefs.put(emptyReaderPrefs(CURRENT_USER_ID))
    renderReader('s1-c8')
    await screen.findByText(/Bagian di bawah tersensor/)

    const izin = screen.getByRole('switch', { name: 'Buka otomatis untuk cerita ini' })
    expect(izin).toBeChecked()
  })

  it('menekan `Chapter ini` mengirim satu panggilan berisi izinnya sekaligus', async () => {
    await db.wallets.put({
      userId: CURRENT_USER_ID,
      balance: 50_000,
      bonus: 0,
      updatedAt: new Date().toISOString(),
    })
    await db.ownerships.where('userId').equals(CURRENT_USER_ID).delete()
    await db.readerPrefs.put(emptyReaderPrefs(CURRENT_USER_ID))

    const spy = vi.spyOn(api, 'unlockChapter')
    renderReader('s1-c8')
    await screen.findByText(/Bagian di bawah tersensor/)

    // Pilihannya datang dari server, jadi ditunggu — bukan dibaca seketika.
    await userEvent.click(await screen.findByRole('button', { name: /Chapter ini/ }))

    /*
     * **Satu panggilan, bukan dua.** Di gerbang itu memang satu tindakan
     * pembaca, dan memecahnya membuka keadaan "koin terpotong, izin gagal
     * tersimpan" (§1.21).
     */
    await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1))
    expect(spy.mock.calls[0]?.[0]).toMatchObject({ source: 'coin', enableAutoUnlock: true })

    spy.mockRestore()
    await db.readerPrefs.put(emptyReaderPrefs(CURRENT_USER_ID))
  })
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { ToastProvider } from '@/components/ui/Toast'
import ReaderPage from '@/features/reader/pages/ReaderPage'
import { useReaderSettings } from '@/stores/readerSettings'

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

    expect(await screen.findByText('Lanjutkan membaca bab ini')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Buka bab ini/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Buka 10 bab sekaligus/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Baca sampai tamat/ })).toBeInTheDocument()
  })

  it('naskah bab terkunci tidak pernah dirender, bahkan tersembunyi', async () => {
    renderReader('s1-c8')
    await screen.findByText('Lanjutkan membaca bab ini')

    const full = await api.getChapter('s1', 's1-c8')
    expect(full.content).toEqual([])

    // Pratinjaunya ada di layar tetapi tidak dibacakan pembaca layar.
    const preview = full.preview[0] ?? ''
    expect(screen.getByText(preview).closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('saldo kurang membuka lembar berisi kekurangannya, bukan toast', async () => {
    await db.wallets.put({
      userId: CURRENT_USER_ID,
      balance: 0,
      bonus: 0,
      updatedAt: new Date().toISOString(),
    })
    renderReader('s1-c8')

    await userEvent.click(await screen.findByRole('button', { name: /Buka bab ini/ }))

    expect(await screen.findByText('Saldo koinmu belum cukup')).toBeInTheDocument()
    expect(screen.getByText('Kurang 2.000 koin')).toBeInTheDocument()
    // Jalan keluarnya membawa konteks kembali ke bab yang sama.
    expect(screen.getByRole('link', { name: 'Isi koin' })).toHaveAttribute(
      'href',
      expect.stringContaining('chapter_id=s1-c8'),
    )
  })
})

describe('navigasi bab · FR-READ-15', () => {
  it('bab pertama menonaktifkan "sebelumnya", bukan menyembunyikannya', async () => {
    renderReader('s1-c1')
    await screen.findByRole('heading', { level: 1, name: 'Perjanjian Malam Itu' })

    // Ada, tetapi mati — tata letaknya tetap sama di bab mana pun.
    await bukaKontrol()
    expect(screen.getByRole('button', { name: 'Bab sebelumnya' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Bab berikutnya' })).toBeEnabled()
  })

  it('penutup bab menyebutkan judul tujuannya', async () => {
    renderReader('s1-c1')

    expect(
      await screen.findByRole('button', { name: /Bab berikutnya: Kopi yang Selalu Dingin/ }),
    ).toBeInTheDocument()
  })

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

describe('auto-unlock · FR-READ-09', () => {
  it('mati secara bawaan: bab terkunci tetap menampilkan gerbangnya', async () => {
    useReaderSettings.setState({ autoUnlock: false })
    renderReader('s1-c8')

    expect(await screen.findByText('Lanjutkan membaca bab ini')).toBeInTheDocument()
  })

  it('menyala dan saldo cukup: babnya terbuka sendiri tanpa ketukan', async () => {
    await db.wallets.put({
      userId: CURRENT_USER_ID,
      balance: 50_000,
      bonus: 0,
      updatedAt: new Date().toISOString(),
    })
    await db.ownerships.where('userId').equals(CURRENT_USER_ID).delete()
    useReaderSettings.setState({ autoUnlock: true })

    renderReader('s1-c8')

    // Tanpa satu pun klik, isinya muncul — dan gerbangnya menghilang.
    expect(await screen.findByRole('button', { name: 'Suka' })).toBeInTheDocument()
    expect(screen.queryByText('Lanjutkan membaca bab ini')).not.toBeInTheDocument()

    useReaderSettings.setState({ autoUnlock: false })
  })
})

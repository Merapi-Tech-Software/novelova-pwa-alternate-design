import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { ToastProvider } from '@/components/ui/Toast'
import LibraryPage from '@/features/library/pages/LibraryPage'

function renderLibrary() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/pustaka']}>
          <Routes>
            <Route path="/pustaka" element={<LibraryPage />} />
            <Route path="/cerita/:storyId" element={<p>detail cerita</p>} />
            <Route path="/cerita/:storyId/bab/:chapterId" element={<p>ruang baca</p>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

beforeEach(async () => {
  await db.libraryEntries.where('userId').equals(CURRENT_USER_ID).delete()
  await db.progress.where('userId').equals(CURRENT_USER_ID).delete()

  for (const [storyId, savedAt] of [
    ['s1', '2026-08-20'],
    ['s3', '2026-08-18'],
  ] as const) {
    await db.libraryEntries.put({
      id: `lib-${CURRENT_USER_ID}-${storyId}`,
      userId: CURRENT_USER_ID,
      storyId,
      savedAt,
      notify: true,
      removed: false,
    })
  }

  const chapters = (await db.chapters.where('storyId').equals('s1').toArray()).sort(
    (a, b) => a.number - b.number,
  )
  await db.progress.put({
    scrollByChapter: {},
    finishedAt: {},
    id: `${CURRENT_USER_ID}-s1`,
    userId: CURRENT_USER_ID,
    storyId: 's1',
    lastChapterId: chapters[44]?.id ?? null,
    scrollPct: 1,
    finishedChapterIds: chapters.slice(0, 45).map((c) => c.id),
    updatedAt: new Date().toISOString(),
  })
})

describe('perpustakaan · FR-LIB-01 · FR-LIB-02 · FR-LIB-03', () => {
  it('empat metrik tampil dengan urutan Disimpan–Dibaca–Selesai–Baru', async () => {
    renderLibrary()

    const labels = (await screen.findAllByRole('term')).map((el) => el.textContent)
    expect(labels).toEqual(['Disimpan', 'Dibaca', 'Selesai', 'Baru'])
  })

  it('kartu menampilkan progres dari data nyata, bukan angka yang ditulis di markup', async () => {
    renderLibrary()

    // 45 dari 120 bab = 38%.
    expect(await screen.findByText(/Bab 45 dari 120/)).toBeInTheDocument()
    expect(screen.getByText('38%')).toBeInTheDocument()
    // Cerita yang belum dibaca punya kalimatnya sendiri, bukan "Bab 0 dari …".
    expect(screen.getByText(/Belum dimulai/)).toBeInTheDocument()
  })

  it('pencarian menyaring di server dan tidak peka huruf besar', async () => {
    renderLibrary()
    const story = await db.stories.get('s1')
    await screen.findByText(story?.title ?? '')

    await userEvent.type(
      screen.getByRole('searchbox'),
      (story?.penName ?? '').slice(0, 5).toUpperCase(),
    )

    // Yang ditunggu adalah baris yang **hilang**, bukan baris yang bertahan: `s1`
    // ada di daftar lama maupun daftar tersaring, jadi menunggunya selesai
    // seketika — sementara `keepPreviousData` masih menahan daftar lama yang
    // berisi `s3` (CLAUDE.md §8).
    const other = await db.stories.get('s3')
    await waitFor(() => expect(screen.queryByText(other?.title ?? '')).not.toBeInTheDocument())
    expect(screen.getByText(story?.title ?? '')).toBeInTheDocument()
  })

  it('ringkasan koleksi tidak ikut berubah saat mencari', async () => {
    renderLibrary()

    // Dua tersimpan, satu sedang dibaca — ditunggu sampai angkanya turun dari
    // server, bukan dipotret saat masih nol.
    const values = async () =>
      (await screen.findAllByRole('definition')).map((el) => el.textContent)
    await vi.waitFor(async () => expect(await values()).toEqual(['2', '1', '0', '1']))

    await userEvent.type(screen.getByRole('searchbox'), 'zzz-tidak-ada')
    await screen.findByText('Tidak ada cerita yang cocok')

    // Daftarnya kosong, ringkasannya tidak: yang satu penghitung hasil, yang
    // lain agregat koleksi (FR-LIB-01).
    expect(await values()).toEqual(['2', '1', '0', '1'])
  })
})

describe('tab, urutan, dan aksi kartu · FR-LIB-04..09', () => {
  it('empat tab menyaring di server dan penghitung ikut berubah', async () => {
    renderLibrary()
    expect(await screen.findByText('2 cerita')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Sedang Dibaca' }))

    expect(await screen.findByText('1 cerita')).toBeInTheDocument()
    const other = await db.stories.get('s3')
    expect(screen.queryByText(other?.title ?? '')).not.toBeInTheDocument()
  })

  it('saringan status tetap berlaku saat urutan diganti', async () => {
    renderLibrary()
    await screen.findByText('2 cerita')

    await userEvent.click(screen.getByRole('button', { name: 'Sedang Dibaca' }))
    await screen.findByText('1 cerita')
    await userEvent.selectOptions(screen.getByLabelText('Urutkan'), 'az')

    expect(await screen.findByText('1 cerita')).toBeInTheDocument()
  })

  it('tombol baca menuju bab terakhir yang dibaca, bukan bab pertama', async () => {
    renderLibrary()
    const chapters = (await db.chapters.where('storyId').equals('s1').toArray()).sort(
      (a, b) => a.number - b.number,
    )

    expect(await screen.findByRole('link', { name: 'Lanjut Baca' })).toHaveAttribute(
      'href',
      `/cerita/s1/bab/${chapters[44]?.id}`,
    )
    // Cerita yang belum dimulai mendapat label dan tujuan yang berbeda.
    expect(screen.getByRole('link', { name: 'Mulai Baca' })).toHaveAttribute(
      'href',
      `/cerita/s3/bab/s3-c1`,
    )
  })

  it('aria-label sakelar notifikasi ikut berubah saat ditekan', async () => {
    renderLibrary()
    const story = await db.stories.get('s1')
    const on = await screen.findByRole('switch', {
      name: `Notifikasi bab baru ${story?.title}: aktif`,
    })

    await userEvent.click(on)

    // Prototipe menahan labelnya tetap, jadi pembaca layar selalu mendengar
    // keadaan yang salah setelah ketukan pertama (PRD 06 §7 #3).
    expect(
      await screen.findByRole('switch', {
        name: `Notifikasi bab baru ${story?.title}: nonaktif`,
      }),
    ).toBeInTheDocument()
  })

  it('hapus menawarkan urungkan, dan urungkan mengembalikan ceritanya', async () => {
    renderLibrary()
    const story = await db.stories.get('s1')
    await screen.findByText(story?.title ?? '')

    await userEvent.click(
      screen.getByRole('button', { name: `Hapus ${story?.title} dari koleksi` }),
    )

    expect(await screen.findByText(`${story?.title} dihapus dari koleksi.`)).toBeInTheDocument()
    await vi.waitFor(async () =>
      expect(await db.libraryEntries.get(`lib-${CURRENT_USER_ID}-s1`)).toMatchObject({
        removed: true,
      }),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Urungkan' }))

    await vi.waitFor(async () =>
      expect(await db.libraryEntries.get(`lib-${CURRENT_USER_ID}-s1`)).toMatchObject({
        removed: false,
        savedAt: '2026-08-20',
      }),
    )
  })
})

describe('rak yang benar-benar kosong · FR-LIB-12', () => {
  beforeEach(async () => {
    await db.libraryEntries.where('userId').equals(CURRENT_USER_ID).delete()
  })

  it('mendapat ajakan, bukan pesan kegagalan pencarian', async () => {
    renderLibrary()

    expect(await screen.findByText('Rakmu masih kosong')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Jelajahi cerita' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Lihat yang paling populer' })).toHaveAttribute(
      'href',
      '/jelajah/populer',
    )
  })

  it('kontrol cari, saring, dan urut disembunyikan; ringkasan tetap tampil nol', async () => {
    renderLibrary()
    await screen.findByText('Rakmu masih kosong')

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sedang Dibaca' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Urutkan')).not.toBeInTheDocument()
    expect(screen.getAllByRole('definition').map((el) => el.textContent)).toEqual([
      '0',
      '0',
      '0',
      '0',
    ])
  })
})

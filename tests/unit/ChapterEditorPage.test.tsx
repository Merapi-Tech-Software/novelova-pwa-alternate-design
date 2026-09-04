import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/api/mock/db'
import { setMockDraftSaveFails } from '@/api/mock/handlers/chapters'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { ToastProvider } from '@/components/ui/Toast'
import ChapterEditorPage from '@/features/studio/pages/ChapterEditorPage'

function renderEditor(mode: 'baru' | 'ubah', chapterId = 'ms1-c51') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const path = mode === 'baru' ? '/karya/ms1/bab/baru' : `/karya/ms1/bab/${chapterId}/ubah`
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/karya/:storyId/bab/baru" element={<ChapterEditorPage mode="baru" />} />
            <Route
              path="/karya/:storyId/bab/:chapterId/ubah"
              element={<ChapterEditorPage mode="ubah" />}
            />
            <Route path="/karya/:storyId/bab" element={<p>daftar bab</p>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const KEY_NEW = 'novelova:chapter-draft-baru-ms1'
const KEY_C51 = 'novelova:chapter-draft-ms1-c51'

beforeEach(async () => {
  setMockDraftSaveFails(false)
  await db.authorProfiles.put({
    userId: CURRENT_USER_ID,
    tier: 'verified',
    payoutVerified: true,
    twoFactor: true,
    termsAcceptedAt: new Date().toISOString(),
  })
  localStorage.removeItem(KEY_NEW)
  localStorage.removeItem(KEY_C51)
})

afterEach(() => {
  setMockDraftSaveFails(false)
  localStorage.removeItem(KEY_NEW)
  localStorage.removeItem(KEY_C51)
})

describe('penghitung kata & mode fokus · FR-STUDIO-20', () => {
  it('naskah kosong menghasilkan nol, bukan satu', async () => {
    renderEditor('baru')
    expect(await screen.findByText('ID 0 kata')).toBeInTheDocument()
  })

  it('hitungan tampil di dua tempat sekaligus dan ikut bahasa aktif', async () => {
    renderEditor('baru')
    fireEvent.change(await screen.findByLabelText('Isi bab'), {
      target: { value: 'satu dua tiga' },
    })

    expect(screen.getByText('ID 3 kata')).toBeInTheDocument()
    // Bilah alat menampilkan bahasa aktif saja.
    expect(screen.getByText('3 kata')).toBeInTheDocument()
  })
})

describe('editor dwibahasa · FR-STUDIO-19', () => {
  it('panel English mulai dari kartu ajakan, bukan kolom kosong', async () => {
    renderEditor('baru')
    await userEvent.click(await screen.findByRole('tab', { name: 'English' }))

    expect(screen.getByText('Belum ada versi English')).toBeInTheDocument()
    expect(screen.queryByLabelText('English content')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Mulai Tulis English' }))
    expect(screen.getByLabelText('English content')).toBeInTheDocument()
  })

  it('"Lewati" mengembalikan penulis ke panel Indonesia', async () => {
    renderEditor('baru')
    await userEvent.click(await screen.findByRole('tab', { name: 'English' }))
    await userEvent.click(screen.getByRole('button', { name: /Lewati/ }))

    expect(screen.getByLabelText('Isi bab')).toBeInTheDocument()
  })

  it('adanya versi English mengubah label tombol terbit dan menandai tabnya', async () => {
    renderEditor('baru')
    expect(await screen.findByRole('button', { name: 'Terbitkan' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: 'English' }))
    await userEvent.click(screen.getByRole('button', { name: 'Mulai Tulis English' }))
    fireEvent.change(screen.getByLabelText('English content'), { target: { value: 'a story' } })

    expect(screen.getByRole('button', { name: 'Terbitkan ID + EN' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /English ●/ })).toBeInTheDocument()
  })
})

describe('validasi & alur terbit · FR-STUDIO-21', () => {
  const fillId = () => {
    fireEvent.change(screen.getByLabelText('Judul bab'), { target: { value: 'Bab Uji' } })
    fireEvent.change(screen.getByLabelText('Isi bab'), { target: { value: 'Isi naskahnya.' } })
  }

  it('empat aturan berjalan berurutan dan berhenti di yang pertama gagal', async () => {
    renderEditor('baru')
    await screen.findByLabelText('Judul bab')

    await userEvent.click(screen.getByRole('button', { name: 'Terbitkan' }))
    expect(screen.getByText('Judul bab Indonesia wajib diisi')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Judul bab'), { target: { value: 'Bab Uji' } })
    await userEvent.click(screen.getByRole('button', { name: 'Terbitkan' }))
    expect(screen.getByText('Konten Indonesia wajib diisi sebelum publish')).toBeInTheDocument()
  })

  it('versi English harus lengkap atau tidak ada — separuh ditolak dua arah', async () => {
    renderEditor('baru')
    await screen.findByLabelText('Judul bab')
    fillId()

    await userEvent.click(screen.getByRole('tab', { name: 'English' }))
    await userEvent.click(screen.getByRole('button', { name: 'Mulai Tulis English' }))
    fireEvent.change(screen.getByLabelText('English title'), { target: { value: 'Judul saja' } })
    await userEvent.click(screen.getByRole('button', { name: 'Terbitkan ID + EN' }))
    expect(screen.getByText(/Konten English belum diisi/)).toBeInTheDocument()

    // Arah sebaliknya: isi tanpa judul.
    fireEvent.change(screen.getByLabelText('English title'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('English content'), { target: { value: 'body only' } })
    await userEvent.click(screen.getByRole('button', { name: 'Terbitkan ID + EN' }))
    expect(screen.getByText(/Tambahkan judul English/)).toBeInTheDocument()
  })

  it('tanpa versi English, terbit menuntut konfirmasi dengan dua jalan keluar', async () => {
    renderEditor('baru')
    await screen.findByLabelText('Judul bab')
    fillId()

    await userEvent.click(screen.getByRole('button', { name: 'Terbitkan' }))
    const choose = within(await screen.findByRole('dialog'))
    await userEvent.click(choose.getByRole('button', { name: 'Terbitkan' }))

    const confirm = within(await screen.findByRole('dialog'))
    expect(confirm.getByText(/hanya dalam bahasa Indonesia/)).toBeInTheDocument()

    // "Tambah English dulu" menutup konfirmasi dan membuka editor English.
    await userEvent.click(confirm.getByRole('button', { name: 'Tambah English dulu' }))
    expect(await screen.findByLabelText('English content')).toBeInTheDocument()
  })
})

describe('autosave dua lapis · FR-STUDIO-34', () => {
  it('draf lokal ditulis per bab, dan isinya benar-benar naskahnya', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      renderEditor('baru')
      fireEvent.change(await screen.findByLabelText('Judul bab'), {
        target: { value: 'Naskah Autosave' },
      })
      fireEvent.change(screen.getByLabelText('Isi bab'), { target: { value: 'Satu paragraf.' } })

      await vi.advanceTimersByTimeAsync(3_100)

      const raw = localStorage.getItem(KEY_NEW)
      expect(raw).not.toBeNull()
      const draft = JSON.parse(raw as string)
      expect(draft.id.title).toBe('Naskah Autosave')
      expect(draft.id.body).toBe('Satu paragraf.')
    } finally {
      vi.useRealTimers()
    }
  })

  it('draf lokal yang lebih baru dari server ditawarkan, dan memulihkannya mengembalikan isinya', async () => {
    localStorage.setItem(
      KEY_C51,
      JSON.stringify({
        id: { title: 'Judul Dari Draf Lokal', body: 'Isi dari draf lokal.', authorNote: '' },
        en: { title: '', body: '', authorNote: '' },
        storyId: 'ms1',
        savedAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    )
    renderEditor('ubah')

    expect(await screen.findByText(/Ada draf lokal yang lebih baru/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Pulihkan draf' }))

    expect(screen.getByLabelText('Judul bab')).toHaveValue('Judul Dari Draf Lokal')
  })

  it('draf lokal yang lebih lama dari server tidak ditawarkan', async () => {
    localStorage.setItem(
      KEY_C51,
      JSON.stringify({
        id: { title: 'Kedaluwarsa', body: '', authorNote: '' },
        en: { title: '', body: '', authorNote: '' },
        storyId: 'ms1',
        savedAt: '2020-01-01T00:00:00.000Z',
      }),
    )
    renderEditor('ubah')
    await screen.findByLabelText('Judul bab')

    expect(screen.queryByText(/Ada draf lokal yang lebih baru/)).not.toBeInTheDocument()
  })

  it('menyimpan ke server membuang draf lokalnya', async () => {
    renderEditor('ubah')
    fireEvent.change(await screen.findByLabelText('Isi bab'), { target: { value: 'Naskah baru.' } })
    await userEvent.click(screen.getByRole('button', { name: 'Simpan ke draf' }))

    // Ditunggu pada **hasil yang sebenarnya**, bukan pada kunci lokalnya.
    // Kunci itu sudah `null` sejak awal test, jadi menunggunya menjadi `null`
    // selesai seketika — dan pemeriksaan berikutnya balapan dengan mutasinya.
    await vi.waitFor(
      async () => {
        const contents = await db.chapterContents.where('chapterId').equals('ms1-c51').toArray()
        expect(contents.find((c) => c.lang === 'id')?.body).toEqual(['Naskah baru.'])
      },
      { timeout: 5_000 },
    )
    expect(localStorage.getItem(KEY_C51)).toBeNull()
  })
})

describe('DRAFT-409 · arch §1.4', () => {
  it('empat kegagalan memunculkan sisipan, editornya tetap menerima ketikan, drafnya utuh', async () => {
    setMockDraftSaveFails(true)
    renderEditor('ubah')

    fireEvent.change(await screen.findByLabelText('Isi bab'), {
      target: { value: 'Naskah yang gagal terkirim.' },
    })

    const save = screen.getByRole('button', { name: 'Simpan ke draf' })
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await userEvent.click(save)
      await vi.waitFor(() => expect(screen.getByText(/Gagal menyimpan/)).toBeInTheDocument())
    }

    // Sisipan muncul beserta tiga jalan keluarnya.
    expect(await screen.findByText('Naskah belum tersimpan ke server')).toBeInTheDocument()
    for (const label of ['Simpan sekarang', 'Salin seluruh naskah', 'Unduh sebagai berkas']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }

    // **Editor tidak dibekukan** — menghalangi penulis mengetik saat penyimpanan
    // gagal justru memperbesar kemungkinan tulisannya hilang.
    const body = screen.getByLabelText('Isi bab')
    expect(body).toBeEnabled()
    fireEvent.change(body, { target: { value: 'Masih bisa terus menulis.' } })
    expect(body).toHaveValue('Masih bisa terus menulis.')

    // Dan naskahnya tetap ada di perangkat — lapis lokal tidak pernah berhenti
    // hanya karena lapis server bermasalah. Ditunggu tiga detik penuh: itulah
    // jeda autosave lokalnya.
    await vi.waitFor(() => expect(localStorage.getItem(KEY_C51)).not.toBeNull(), {
      timeout: 5_000,
    })
  })
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { ToastProvider } from '@/components/ui/Toast'
import ReviewQueuePage from '@/features/studio/pages/ReviewQueuePage'
import SchedulePage from '@/features/studio/pages/SchedulePage'

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/karya/jadwal" element={<SchedulePage />} />
            <Route path="/karya/tinjauan" element={<ReviewQueuePage />} />
            <Route path="/karya" element={<p>studio</p>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const at = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString()

async function entry(id: string, storyId: string, chapterId: string | null, when: string) {
  const story = await db.stories.get(storyId)
  await db.scheduleEntries.put({
    id,
    storyId,
    storyTitle: story?.title ?? '',
    chapterId,
    chapterLabel: chapterId ? 'Bab 48 · Dua Tanda Tangan' : null,
    publishAtUtc: when,
    authorTz: 'Asia/Jakarta',
    cadence: 'Terbit sekali',
    kind: 'ok',
    note: null,
  })
}

beforeEach(async () => {
  await db.authorProfiles.put({
    userId: CURRENT_USER_ID,
    tier: 'verified',
    payoutVerified: true,
    twoFactor: true,
    termsAcceptedAt: new Date().toISOString(),
  })
  await db.scheduleEntries.clear()
  await db.stories.update('ms1', { review: 'published', status: 'completed' })
  await db.stories.update('ms2', { review: 'draft', status: 'ongoing' })
  await db.stories.update('ms3', { review: 'in_review', status: 'ongoing' })
  await db.stories.update('ms4', { review: 'rejected', status: 'ongoing' })
  await db.chapters.update('ms1-c48', { state: 'scheduled' })
})

describe('jadwal terpadu · FR-STUDIO-37', () => {
  it('tiga metrik dihitung dari daftarnya', async () => {
    await entry('e1', 'ms1', 'ms1-c48', at(120))
    await entry('e2', 'ms1', 'ms1-c49', at(150))
    renderAt('/karya/jadwal')

    // Ditunggu sampai angkanya turun dari server — nilai awalnya nol, jadi
    // memotretnya seketika hanya memotret keadaan kosong.
    await vi.waitFor(async () => {
      const values = (await screen.findAllByRole('definition')).map((el) => el.textContent)
      // Dua terjadwal, nol celah (ms1 tamat), dua bentrok.
      expect(values.slice(0, 3)).toEqual(['2', '0', '2'])
    })
  })

  it('bentrok memunculkan sisipan yang menyatakan bab kedua ditahan', async () => {
    await entry('e1', 'ms1', 'ms1-c48', at(120))
    await entry('e2', 'ms1', 'ms1-c49', at(150))
    renderAt('/karya/jadwal')

    expect(await screen.findByText('Dua penerbitan pada slot yang sama')).toBeInTheDocument()
    expect(screen.getByText(/ditahan, bukan terbit dua kali/)).toBeInTheDocument()
    expect(screen.getByText('SCHED-409')).toBeInTheDocument()
  })

  it('celah tampil sebagai peringatan, bukan kegagalan', async () => {
    await db.stories.update('ms1', { status: 'ongoing' })
    renderAt('/karya/jadwal')

    expect(await screen.findByText('Jadwal berikutnya kosong')).toBeInTheDocument()
    expect(screen.getByText(/rehat yang disengaja tidak perlu diperbaiki/)).toBeInTheDocument()
    expect(screen.getByText('SCHED-000')).toBeInTheDocument()
  })

  it('tab "Perlu tindakan" menggabungkan celah dan bentrok', async () => {
    await db.stories.update('ms1', { status: 'ongoing' })
    await entry('e1', 'ms2', null, at(120))
    renderAt('/karya/jadwal')
    await screen.findByText(/Semua yang akan terbit/)

    await userEvent.click(screen.getByRole('tab', { name: 'Perlu tindakan' }))

    // Entri ms2 terjadwal normal tidak ikut; yang tersisa hanya celah ms1.
    expect(await screen.findByText('1 entri')).toBeInTheDocument()
  })

  it('membatalkan entri mengembalikan babnya jadi draf', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await entry('e1', 'ms1', 'ms1-c48', at(120))
    renderAt('/karya/jadwal')

    await userEvent.click(await screen.findByRole('button', { name: 'Batalkan' }))

    await vi.waitFor(
      async () => expect(await db.chapters.get('ms1-c48')).toMatchObject({ state: 'draft' }),
      { timeout: 5_000 },
    )
    vi.restoreAllMocks()
  })
})

describe('antrean tinjauan · FR-STUDIO-38', () => {
  it('mengumpulkan cerita dan bab, dan alasan penolakan tampil di barisnya', async () => {
    renderAt('/karya/tinjauan')

    expect(await screen.findByText('Perjamuan Terakhir Nyonya A')).toBeInTheDocument()
    expect(screen.getByText('Alasan penolakan')).toBeInTheDocument()
    expect(screen.getByText(/kutipan panjang tanpa sumber/)).toBeInTheDocument()
  })

  it('yang ditinjau bisa dibatalkan; yang ditolak menawarkan perbaikan', async () => {
    renderAt('/karya/tinjauan')
    await screen.findByText('Perjamuan Terakhir Nyonya A')

    expect(screen.getAllByRole('button', { name: 'Batalkan pengiriman' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Perbaiki & kirim ulang' }).length).toBeGreaterThan(
      0,
    )
  })

  it('membatalkan pengiriman menghapus barisnya — antrean diturunkan dari sumbernya', async () => {
    renderAt('/karya/tinjauan')
    await screen.findByText('Perjamuan Terakhir Nyonya A')

    // Ditekan **di dalam barisnya** — antrean berisi bab juga, dan barisnya
    // terurut waktu, jadi tombol pertama belum tentu milik cerita ini.
    const row = screen.getByText('Perjamuan Terakhir Nyonya A').closest('li')
    if (!row) throw new Error('baris antrean tidak ditemukan')
    await userEvent.click(within(row).getByRole('button', { name: 'Batalkan pengiriman' }))

    await vi.waitFor(async () => expect((await db.stories.get('ms3'))?.review).toBe('draft'), {
      timeout: 5_000,
    })
  })
})

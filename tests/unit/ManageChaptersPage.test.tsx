import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { ToastProvider } from '@/components/ui/Toast'
import ManageChaptersPage from '@/features/studio/pages/ManageChaptersPage'

/** Tanggal lokal tiga hari ke depan, `YYYY-MM-DD`. */
function threeDaysFromNow(): string {
  const at = new Date(Date.now() + 3 * 86_400_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`
}

function renderChapters(search = '') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/karya/ms1/bab${search}`]}>
          <Routes>
            <Route path="/karya/:storyId/bab" element={<ManageChaptersPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

beforeEach(async () => {
  await db.authorProfiles.put({
    userId: CURRENT_USER_ID,
    tier: 'verified',
    payoutVerified: true,
    twoFactor: true,
    termsAcceptedAt: new Date().toISOString(),
  })
  // Mengembalikan bab contoh ke keadaan awalnya — test lain memindahkannya.
  await db.chapters.update('ms1-c51', { state: 'draft', review: 'draft', publishAt: null })
  await db.chapters.update('ms1-c45', {
    state: 'private',
    access: 'private',
    review: 'published',
    publishAt: null,
  })
  await db.scheduleEntries.where('id').startsWith('sch-chapter-').delete()
})

describe('papan kepala halaman · FR-STUDIO-07', () => {
  it('tiga penghitung tampil dan menekannya menyaring daftarnya', async () => {
    renderChapters()
    expect(await screen.findByText('Sarapan Pukul Empat Pagi')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Publish/ }))

    // Tab yang sesuai ikut menyorot — dua kontrol, satu sumber kebenaran.
    expect(await screen.findByRole('tab', { name: 'Publish' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.queryByText('Sarapan Pukul Empat Pagi')).not.toBeInTheDocument()
    expect(screen.getByText('Tawaran di Lantai Tiga Puluh')).toBeInTheDocument()
  })

  it('pemberitahuan tindak lanjut tampil beserta tujuannya', async () => {
    renderChapters()

    expect(await screen.findByText(/belum disentuh/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lanjut tulis' })).toHaveAttribute(
      'href',
      '/karya/ms1/bab/ms1-c50/ubah',
    )
    expect(screen.getByText(/sedang privat/)).toBeInTheDocument()
  })
})

describe('baris bab per status · FR-STUDIO-08', () => {
  it('draf menampilkan progres dan tiga aksi cepatnya', async () => {
    renderChapters('?tab=draft')
    expect(await screen.findByText('Sarapan Pukul Empat Pagi')).toBeInTheDocument()

    expect(screen.getAllByText(/sekitar 650 kata/).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Lanjut Tulis' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Terbitkan' }).length).toBeGreaterThan(0)
  })

  it('bab terbit menampilkan lencana akses dan metrik, tanpa tombol terbitkan', async () => {
    renderChapters('?tab=published')
    expect(await screen.findByText('Tawaran di Lantai Tiga Puluh')).toBeInTheDocument()

    expect(screen.getAllByText(/Berbayar|Gratis/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/dibaca ·/).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Terbitkan' })).not.toBeInTheDocument()
  })

  it('bab privat menawarkan "Tampilkan", dan menekannya membuatnya terbit', async () => {
    renderChapters('?tab=private')
    await userEvent.click(await screen.findByRole('button', { name: 'Tampilkan' }))

    await vi.waitFor(async () =>
      expect(await db.chapters.get('ms1-c45')).toMatchObject({ state: 'published' }),
    )
  })
})

describe('cari, saring, urut · FR-STUDIO-09', () => {
  it('pesan kosong menyesuaikan saringan aktif', async () => {
    renderChapters('?tab=scheduled&q=zzz-tidak-ada')

    expect(
      await screen.findByText('Belum ada bab terjadwal. Jadwalkan bab dari tab Draf.'),
    ).toBeInTheDocument()
  })

  it('tujuh tab tersedia, termasuk dua status tinjauan', async () => {
    renderChapters()
    await screen.findByText('Sarapan Pukul Empat Pagi')

    for (const label of [
      'Semua',
      'Draf',
      'Dalam tinjauan',
      'Ditolak',
      'Terjadwal',
      'Publish',
      'Privat',
    ]) {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument()
    }
  })

  it('pencarian hanya judul bab', async () => {
    renderChapters()
    await screen.findByText('Sarapan Pukul Empat Pagi')

    await userEvent.type(screen.getByRole('searchbox'), 'parkiran')

    expect(await screen.findByText('Hujan di Parkiran Basement')).toBeInTheDocument()
    expect(screen.queryByText('Sarapan Pukul Empat Pagi')).not.toBeInTheDocument()
  })
})

describe('menu aksi dinamis · FR-STUDIO-10', () => {
  it('menu draf punya enam aksi dan "Hapus" bergaya danger', async () => {
    renderChapters('?tab=draft')
    await userEvent.click(
      (await screen.findAllByRole('button', { name: /Menu aksi/ }))[0] as HTMLElement,
    )

    // Dicari **di dalam lembarnya**: tombol cepat di baris bab memakai nama yang
    // sama dan tetap ada di DOM di balik lembar.
    const menu = within(await screen.findByRole('dialog'))
    expect(menu.getByText('Bab ini masih draf.')).toBeInTheDocument()
    for (const label of ['Lanjut Tulis', 'Atur Akses', 'Pratinjau']) {
      expect(menu.getByRole('link', { name: label })).toBeInTheDocument()
    }
    for (const label of ['Terbitkan', 'Jadwalkan', 'Hapus']) {
      expect(menu.getByRole('button', { name: label })).toBeInTheDocument()
    }
    expect(menu.getByRole('button', { name: 'Hapus' })).toHaveClass('text-nv-danger')
  })

  it('menu bab terbit menutup dengan hapus-berkonfirmasi-refund', async () => {
    renderChapters('?tab=published')
    await userEvent.click(
      (await screen.findAllByRole('button', { name: /Menu aksi/ }))[0] as HTMLElement,
    )

    expect(
      await screen.findByRole('button', { name: 'Hapus dengan konfirmasi refund' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Terbitkan' })).not.toBeInTheDocument()
  })

  it('membuka menu bab lain tidak menyisakan aksi bab sebelumnya', async () => {
    renderChapters()
    const menus = await screen.findAllByRole('button', { name: /Menu aksi/ })

    await userEvent.click(menus[0] as HTMLElement)
    expect(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Terbitkan' }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tutup' }))

    // Bab 49 terjadwal — menunya tidak boleh lagi menawarkan "Terbitkan".
    const scheduled = (await screen.findAllByRole('button', { name: /Menu aksi untuk Hujan/ }))[0]
    await userEvent.click(scheduled as HTMLElement)
    const menu = within(await screen.findByRole('dialog'))
    expect(menu.getByRole('button', { name: 'Batalkan Jadwal' })).toBeInTheDocument()
    expect(menu.queryByRole('button', { name: 'Terbitkan' })).not.toBeInTheDocument()
  })
})

describe('penjadwal bab · FR-STUDIO-11', () => {
  it('dibuka dari tombol cepat, menegaskan lingkupnya, lalu menyimpan jadwal babnya', async () => {
    renderChapters('?tab=draft')
    await userEvent.click(
      (await screen.findAllByRole('button', { name: 'Jadwalkan' }))[0] as HTMLElement,
    )

    expect(await screen.findByText(/Yang dijadwalkan hanya bab ini/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Tanggal terbit'), {
      target: { value: threeDaysFromNow() },
    })
    await userEvent.click(screen.getByRole('button', { name: '07:00' }))
    await userEvent.click(screen.getByRole('button', { name: 'Simpan jadwal' }))

    await vi.waitFor(async () => {
      const entry = await db.scheduleEntries.get('sch-chapter-ms1-c51')
      expect(entry?.chapterId).toBe('ms1-c51')
    })
  })

  it('juga dibuka dari menu aksi, dan menu itu tertutup lebih dulu', async () => {
    renderChapters('?tab=draft')
    await userEvent.click(
      (await screen.findAllByRole('button', { name: /Menu aksi/ }))[0] as HTMLElement,
    )
    const menu = within(await screen.findByRole('dialog'))
    await userEvent.click(menu.getByRole('button', { name: 'Jadwalkan' }))

    expect(await screen.findByText(/Yang dijadwalkan hanya bab ini/)).toBeInTheDocument()
    expect(screen.queryByText('Bab ini masih draf.')).not.toBeInTheDocument()
  })
})

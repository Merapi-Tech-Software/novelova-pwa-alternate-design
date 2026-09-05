import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { ToastProvider } from '@/components/ui/Toast'
import AuthorSignupPage from '@/features/studio/pages/AuthorSignupPage'
import StudioPage from '@/features/studio/pages/StudioPage'

/** Tanggal lokal tiga hari ke depan, `YYYY-MM-DD`. */
function threeDaysFromNow(): string {
  const at = new Date(Date.now() + 3 * 86_400_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`
}

function renderStudio(path = '/karya') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/karya" element={<StudioPage />} />
            <Route path="/karya/daftar-penulis" element={<AuthorSignupPage />} />
            <Route path="/penulis/analitik" element={<p>analitik penulis</p>} />
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
  await db.scheduleEntries.where('id').startsWith('sch-story-').delete()
  await db.stories.where('id').startsWith('ms-').delete()
})

describe('ringkasan & pintu masuk penghasilan · FR-STUDIO-01 · FR-EARN-10', () => {
  it('empat metrik tampil dan metrik Koin adalah tautan ke analitik penulis', async () => {
    renderStudio()

    const labels = (await screen.findAllByRole('term')).slice(0, 4).map((el) => el.textContent)
    expect(labels).toEqual(['Story', 'Dibaca', 'Pengikut', 'Koin'])

    expect(screen.getByRole('link', { name: /Koin/ })).toHaveAttribute('href', '/penulis/analitik')
    expect(screen.getByRole('link', { name: /Penghasilan/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Riwayat cetak/ })).toBeInTheDocument()
  })
})

describe('kartu & aksi kondisional · FR-STUDIO-02', () => {
  it('draf mendapat Jadwalkan; tamat mendapat Cetak PDF dan Analisa', async () => {
    renderStudio('/karya?tab=draft')
    expect(await screen.findByText('Musim yang Tidak Kembali')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jadwalkan' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cetak PDF' })).not.toBeInTheDocument()
    // Analisa dibalik dari prototipe: draf tidak punya angka untuk dianalisa.
    expect(screen.queryByRole('link', { name: 'Analisa' })).not.toBeInTheDocument()
  })

  it('cerita tamat mendapat Cetak PDF dan Analisa, tanpa Jadwalkan', async () => {
    renderStudio('/karya?tab=completed')
    expect(await screen.findByText('Velvet Alibi')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cetak PDF' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Analisa' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Jadwalkan' })).not.toBeInTheDocument()
  })

  it('empat aksi dasar selalu ada, apa pun statusnya', async () => {
    renderStudio('/karya?tab=rejected')
    expect(await screen.findByText('Surat yang Tidak Dikirim')).toBeInTheDocument()

    for (const name of ['Edit', 'Bab', 'Pratinjau']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Hapus' })).toBeInTheDocument()
  })

  it('cerita ditolak menampilkan alasannya di kartu', async () => {
    renderStudio('/karya?tab=rejected')
    expect(await screen.findByText('Alasan penolakan')).toBeInTheDocument()
    expect(screen.getByText(/kutipan panjang tanpa sumber/)).toBeInTheDocument()
  })
})

describe('cari, saring, urut · FR-STUDIO-03', () => {
  it('pencarian hanya judul, dan penghitung ikut menyesuaikan', async () => {
    renderStudio()
    await screen.findByText('Velvet Alibi')

    await userEvent.type(screen.getByRole('searchbox'), 'velvet')

    expect(await screen.findByText('1 story')).toBeInTheDocument()
    expect(screen.queryByText('Musim yang Tidak Kembali')).not.toBeInTheDocument()
  })

  it('mencari genre tidak menghasilkan apa pun — pencarian hanya judul', async () => {
    renderStudio()
    await screen.findByText('Velvet Alibi')

    await userEvent.type(screen.getByRole('searchbox'), 'drama')

    expect(await screen.findByText('Tidak ada story yang cocok')).toBeInTheDocument()
    // Dan jalan keluarnya ditawarkan, bukan jalan buntu.
    expect(screen.getByRole('button', { name: 'Hapus saringan' })).toBeInTheDocument()
  })

  it('delapan tab tersedia, termasuk dua status tinjauan', async () => {
    renderStudio()
    await screen.findByText('Velvet Alibi')

    for (const label of [
      'Semua',
      'Draf',
      'Dalam tinjauan',
      'Ditolak',
      'Terjadwal',
      'Terbit',
      'Tamat',
      'Arsip',
    ]) {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument()
    }
  })
})

describe('penjadwal cerita · FR-STUDIO-04', () => {
  it('sheet menegaskan yang diterbitkan adalah cerita utuh, lalu menyimpan jadwalnya', async () => {
    renderStudio('/karya?tab=draft')
    await userEvent.click(await screen.findByRole('button', { name: 'Jadwalkan' }))

    expect(await screen.findByText(/bukan bab tertentu/)).toBeInTheDocument()
    // Tanggal minimum hari ini menurut zona waktu lokal, bukan UTC.
    const today = new Date()
    const local = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    expect(screen.getByLabelText('2 · Tanggal terbit')).toHaveAttribute('min', local)

    // Tanggal tiga hari ke depan: hari ini membuat test ini bergantung jam
    // dinding — lewat 21.00 waktu setempat, server menolaknya sebagai waktu lewat.
    fireEvent.change(screen.getByLabelText('2 · Tanggal terbit'), {
      target: { value: threeDaysFromNow() },
    })
    await userEvent.click(screen.getByRole('button', { name: '21:00' }))
    await userEvent.click(screen.getByRole('button', { name: 'Simpan jadwal' }))

    await vi.waitFor(async () =>
      expect(await db.scheduleEntries.get('sch-story-ms2')).toMatchObject({ chapterId: null }),
    )
  })
})

describe('tiga keadaan kosong yang berbeda · FR-STUDIO-33 · FR-CORE-02', () => {
  it('yang belum mendaftar penulis mendapat ajakan, bukan daftar kosong', async () => {
    await db.authorProfiles.delete(CURRENT_USER_ID)
    renderStudio()

    expect(await screen.findByText('Mulai menulis di Novelova')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Daftar sebagai penulis' })).toHaveAttribute(
      'href',
      '/karya/daftar-penulis',
    )
    // Tidak ada kontrol daftar sama sekali — tidak ada yang bisa disaring.
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('pendaftaran menuntut ketentuan, tetapi tidak menuntut verifikasi', async () => {
    await db.authorProfiles.delete(CURRENT_USER_ID)
    renderStudio('/karya/daftar-penulis')

    const submit = await screen.findByRole('button', { name: 'Daftar dan mulai menulis' })
    await userEvent.click(screen.getByRole('switch', { name: 'Menyetujui ketentuan penulis' }))
    expect(submit).toBeEnabled()

    await userEvent.click(submit)

    await vi.waitFor(async () =>
      expect(await db.authorProfiles.get(CURRENT_USER_ID)).toMatchObject({ tier: 'registered' }),
    )
  })
})

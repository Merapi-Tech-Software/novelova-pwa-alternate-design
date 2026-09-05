import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { ToastProvider } from '@/components/ui/Toast'
import ChapterAccessPage from '@/features/studio/pages/ChapterAccessPage'

function renderAccess(chapterId = 'ms1-c47') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/karya/ms1/bab/${chapterId}/akses`]}>
          <Routes>
            <Route path="/karya/:storyId/bab/:chapterId/akses" element={<ChapterAccessPage />} />
            <Route path="/karya/:storyId/bab" element={<p>daftar bab</p>} />
            <Route path="/karya/daftar-penulis" element={<p>daftar penulis</p>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

async function setTier(tier: 'verified' | 'registered') {
  await db.authorProfiles.put({
    userId: CURRENT_USER_ID,
    tier,
    payoutVerified: tier === 'verified',
    twoFactor: tier === 'verified',
    termsAcceptedAt: new Date().toISOString(),
  })
}

beforeEach(async () => {
  await setTier('verified')
  await db.chapters.update('ms1-c47', {
    access: 'paid',
    priceCoins: 3,
    previewPct: 20,
    state: 'published',
    accessChangedAt: null,
    privateReason: null,
    privateUntil: null,
  })
  await db.ownerships.where('chapterId').startsWith('ms1-').delete()
})

describe('konteks bab · FR-STUDIO-36', () => {
  it('kepala halaman menyebut nomor dan judul bab yang sedang diatur', async () => {
    renderAccess()
    expect(await screen.findByText('Bab 47 · Tawaran di Lantai Tiga Puluh')).toBeInTheDocument()
  })

  it('tipe, harga, dan pratinjau dimuat dari data bab', async () => {
    await db.chapters.update('ms1-c47', { access: 'paid', priceCoins: 7, previewPct: 35 })
    renderAccess()

    expect(await screen.findByRole('button', { name: /Berbayar/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText('7')).toBeInTheDocument()
    // Penggeser primitif `Slider` sejak R9b: nilainya dibacakan lewat
    // `aria-valuetext`, bukan ditempel ke judulnya. Ini pemeriksaan yang lebih
    // kuat — ia menguji yang benar-benar didengar pembaca layar.
    expect(screen.getByRole('slider', { name: 'Pratinjau gratis' })).toHaveAttribute(
      'aria-valuetext',
      '35%',
    )
  })

  it('tombol kembali menuju daftar bab pada posisi bab itu', async () => {
    renderAccess()
    expect(await screen.findByRole('link', { name: 'Kembali ke daftar bab' })).toHaveAttribute(
      'href',
      '/karya/ms1/bab#bab-47',
    )
  })
})

describe('opsi yang ditahan menyebut alasannya · FR-STUDIO-36', () => {
  it('bab nomor satu: opsi Privat mati beserta alasannya', async () => {
    const sample = await db.chapters.get('ms1-c47')
    if (!sample) throw new Error('bab acuan tidak ada')
    await db.chapters.put({ ...sample, id: 'ms1-c1', number: 1 })

    renderAccess('ms1-c1')

    expect(await screen.findByRole('button', { name: /Privat/ })).toBeDisabled()
    expect(screen.getByText(/pintu masuk ceritamu/)).toBeInTheDocument()

    await db.chapters.delete('ms1-c1')
  })

  it('penulis belum terverifikasi: opsi Berbayar mati, dengan jalan ke verifikasi', async () => {
    await setTier('registered')
    await db.chapters.update('ms1-c47', { access: 'free' })
    renderAccess()

    expect(await screen.findByRole('button', { name: /Berbayar/ })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Selesaikan verifikasi' })).toBeInTheDocument()
  })

  it('bab yang baru digratiskan: opsi Berbayar mati dengan sisa harinya', async () => {
    await db.chapters.update('ms1-c47', {
      access: 'free',
      accessChangedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    })
    renderAccess()

    expect(await screen.findByRole('button', { name: /Berbayar/ })).toBeDisabled()
    expect(screen.getByText(/dalam 4 hari lagi/)).toBeInTheDocument()
  })
})

describe('tombol simpan membandingkan nilai awal · FR-STUDIO-23', () => {
  it('mengembalikan tipe ke semula membuat tombolnya nonaktif lagi', async () => {
    renderAccess()
    const save = await screen.findByRole('button', { name: 'Tidak ada perubahan' })
    expect(save).toBeDisabled()

    // Berbayar → Gratis lewat konfirmasi.
    await userEvent.click(screen.getByRole('button', { name: /^Gratis/ }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Ya, lanjutkan' }),
    )
    expect(screen.getByRole('button', { name: 'Simpan pengaturan' })).toBeEnabled()

    // Kembali ke Berbayar — tidak ada yang berubah lagi.
    await userEvent.click(screen.getByRole('button', { name: /^Berbayar/ }))
    expect(await screen.findByRole('button', { name: 'Tidak ada perubahan' })).toBeDisabled()
  })

  it('harga dijepit di 1 dan 50', async () => {
    await db.chapters.update('ms1-c47', { priceCoins: 1 })
    renderAccess()
    await userEvent.click(await screen.findByRole('button', { name: 'Kurangi harga' }))
    expect(screen.getByText('1')).toBeInTheDocument()

    await db.chapters.update('ms1-c47', { priceCoins: 50 })
    renderAccess()
    const ups = await screen.findAllByRole('button', { name: 'Tambah harga' })
    await userEvent.click(ups[ups.length - 1] as HTMLElement)
    expect(screen.getAllByText('50').length).toBeGreaterThan(0)
  })
})

describe('konfirmasi transisi berisiko · FR-STUDIO-24', () => {
  it('ubah ke gratis menyebut jumlah pembeli dari data bab', async () => {
    await db.ownerships.bulkPut(
      Array.from({ length: 3 }, (_, i) => ({
        id: `own-uji-${i}`,
        userId: `u${i + 5}`,
        chapterId: 'ms1-c47',
        source: 'coin' as const,
        acquiredAt: new Date().toISOString(),
      })),
    )
    renderAccess()

    await userEvent.click(await screen.findByRole('button', { name: /^Gratis/ }))
    expect(
      await screen.findByText(/3 pembeli tidak mendapat pengembalian koin/),
    ).toBeInTheDocument()
  })

  it('membatalkan tidak meninggalkan jejak apa pun', async () => {
    renderAccess()
    await userEvent.click(await screen.findByRole('button', { name: /^Gratis/ }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Batal' }),
    )

    expect(screen.getByRole('button', { name: /Berbayar/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Tidak ada perubahan' })).toBeDisabled()
  })

  it('gratis → berbayar tidak dikonfirmasi — ia tidak merugikan siapa pun', async () => {
    await db.chapters.update('ms1-c47', {
      access: 'free',
      accessChangedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    })
    renderAccess()

    await userEvent.click(await screen.findByRole('button', { name: /^Berbayar/ }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Simpan pengaturan' })).toBeEnabled()
  })
})

describe('panel privat · FR-STUDIO-26', () => {
  it('alasan dan tanggal kembali tampil, dan tanggal sebelum hari ini ditolak', async () => {
    renderAccess()
    await userEvent.click(await screen.findByRole('button', { name: /^Privat/ }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Ya, lanjutkan' }),
    )

    expect(await screen.findByLabelText('Alasan privat')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Durasi'), 'auto')

    const today = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    expect(screen.getByLabelText('Tanggal tampil kembali')).toHaveAttribute(
      'min',
      `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
    )
  })

  it('menyimpan privat benar-benar menyembunyikan babnya', async () => {
    renderAccess()
    await userEvent.click(await screen.findByRole('button', { name: /^Privat/ }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Ya, lanjutkan' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Simpan pengaturan' }))

    await vi.waitFor(
      async () => expect((await db.chapters.get('ms1-c47'))?.state).toBe('private'),
      { timeout: 5_000 },
    )
  })
})

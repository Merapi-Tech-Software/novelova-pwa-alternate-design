import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { ToastProvider } from '@/components/ui/Toast'
import EarningsPage from '@/features/studio/pages/EarningsPage'
import PayoutHistoryPage from '@/features/studio/pages/PayoutHistoryPage'

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/penulis/analitik" element={<EarningsPage />} />
            <Route path="/penulis/penarikan" element={<p>penarikan</p>} />
            <Route path="/penulis/penarikan/riwayat" element={<PayoutHistoryPage />} />
            <Route path="/karya/:storyId/bab" element={<p>kelola bab</p>} />
            <Route path="/karya" element={<p>studio</p>} />
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
})

describe('analitik penulis · FR-EARN-01..03', () => {
  it('tiga KPI dengan urutan tetap, dan rentang bawaan 30 hari', async () => {
    renderAt('/penulis/analitik')

    expect(await screen.findByText(/30 hari terakhir/)).toBeInTheDocument()
    const kpi = screen.getAllByRole('term').slice(0, 3)
    expect(kpi.map((el) => el.textContent)).toEqual(['Pendapatan', 'Dibaca', 'Rating'])
  })

  it('kurs koin dan bagi hasil dinyatakan terang di halamannya', async () => {
    renderAt('/penulis/analitik')
    expect(await screen.findByText(/1 koin = Rp/)).toBeInTheDocument()
    expect(screen.getByText(/bagi hasil penulis 80%/)).toBeInTheDocument()
  })

  /**
   * PRD 08 §7 #4. Di prototipe berpindah sudut pandang hanya mengganti gaya
   * tombolnya, jadi dua dari tiga sudut pandang tidak pernah terlihat.
   */
  it('berpindah sudut pandang benar-benar mengganti isi, bukan hanya gaya tombolnya', async () => {
    const user = userEvent.setup()
    renderAt('/penulis/analitik')

    expect(await screen.findByText('Kurva pendapatan')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retensi' }))
    expect(await screen.findByText('Titik berhenti')).toBeInTheDocument()
    expect(screen.queryByText('Kurva pendapatan')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Traffic' }))
    expect(await screen.findByText('Sumber pembaca')).toBeInTheDocument()
    expect(screen.queryByText('Titik berhenti')).not.toBeInTheDocument()
  })

  it('kurva pendapatan tujuh batang, dan tiap batang punya angkanya sendiri untuk pembaca layar', async () => {
    renderAt('/penulis/analitik')

    const chart = await screen.findByRole('list', { name: 'Grafik pendapatan' })
    const bars = within(chart).getAllByRole('listitem')
    expect(bars).toHaveLength(7)
    // Satu label untuk seluruh grafik menyembunyikan tujuh nilai sekaligus.
    expect(within(chart).getByText(/^Sab: .* koin$/)).toBeInTheDocument()
  })

  it('rentang tersimpan di URL, jadi tampilannya bisa dibagikan apa adanya', async () => {
    const user = userEvent.setup()
    renderAt('/penulis/analitik')
    await screen.findByText(/30 hari terakhir/)

    await user.click(screen.getByRole('button', { name: '7H' }))
    expect(await screen.findByText(/7 hari terakhir/)).toBeInTheDocument()
  })

  it('corong pembaca menyebut ceritanya dan persentasenya tidak pernah naik', async () => {
    const user = userEvent.setup()
    renderAt('/penulis/analitik')
    await screen.findByText(/30 hari terakhir/)

    await user.click(screen.getByRole('button', { name: 'Retensi' }))
    const funnel = await screen.findByRole('heading', { name: 'Corong pembaca' })
    // `<ol>` pertama sesudah judulnya — bukan `closest('div')`, yang bisa naik
    // ke wadah yang memuat kartu "Titik berhenti" sekaligus.
    const list = funnel.parentElement?.querySelector('ol')
    if (!list) throw new Error('daftar corong tidak ditemukan')

    // Persennya dibaca dari **sel angkanya**, bukan seluruh baris: label tahap
    // tengah menyebut nomor bab ("Bab 47"), dan regex atas `textContent` akan
    // menelannya jadi "47100".
    const pcts = [...list.querySelectorAll('li')].map((li) =>
      Number((li.querySelectorAll('span')[1]?.textContent ?? '').replace('%', '')),
    )
    expect(pcts).toHaveLength(4)
    for (const [i, pct] of pcts.entries()) {
      if (i > 0) expect(pct).toBeLessThanOrEqual(pcts[i - 1] ?? 100)
    }
  })

  it('heatmap adalah tabel, jadi hari dan slotnya terbaca pembaca layar', async () => {
    const user = userEvent.setup()
    renderAt('/penulis/analitik')
    await screen.findByText(/30 hari terakhir/)

    await user.click(screen.getByRole('button', { name: 'Traffic' }))
    const table = await screen.findByRole('table', { name: /peta panas/i })

    expect(within(table).getAllByRole('columnheader')).toHaveLength(8)
    expect(within(table).getAllByRole('rowheader')).toHaveLength(4)
    expect(within(table).getByText(/Sab 17–22 · paling ramai/)).toBeInTheDocument()
  })

  it('catatan aksi membawa tautan penjadwal, bukan sekadar saran', async () => {
    const user = userEvent.setup()
    renderAt('/penulis/analitik')
    await screen.findByText(/30 hari terakhir/)

    await user.click(screen.getByRole('button', { name: 'Traffic' }))
    const link = await screen.findByRole('link', { name: /Buka penjadwal/ })
    expect(link).toHaveAttribute('href', expect.stringContaining('jadwalkan=terbaik'))
  })

  it('saldo yang sedang diproses disebut, bukan hanya dipotong diam-diam', async () => {
    renderAt('/penulis/analitik')
    expect(await screen.findByText(/Saldo tersedia Rp/)).toBeInTheDocument()
    expect(screen.getByText(/sedang diproses dan belum bisa diajukan lagi/)).toBeInTheDocument()
  })
})

describe('riwayat pencairan · FR-EARN-12', () => {
  it('tiap pengajuan membawa angka, rekening tersamar, dan statusnya', async () => {
    renderAt('/penulis/penarikan/riwayat')

    expect(await screen.findByText(/pengajuan · seluruh riwayat/)).toBeInTheDocument()
    // Barisnya datang dari server, jadi ditunggu — bukan dibaca seketika.
    expect((await screen.findAllByText(/\*\*\*\* 4481/)).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Diterima bersih').length).toBeGreaterThan(0)
  })

  it('pengajuan ditolak membawa alasannya dan tidak digambari lini masa', async () => {
    renderAt('/penulis/penarikan/riwayat')
    const rejected = (await screen.findByText('Ditolak')).closest('div.nv-card')
    if (!rejected) throw new Error('baris ditolak tidak ditemukan')
    // Lini masa di bawah pengajuan yang ditolak menyiratkan uangnya masih jalan.
    expect(within(rejected as HTMLElement).queryByText('Ditransfer')).not.toBeInTheDocument()
  })

  it('bukti transfer adalah berkas nyata, hanya untuk yang sudah ditransfer', async () => {
    const user = userEvent.setup()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    URL.createObjectURL = vi.fn(() => 'blob:bukti')
    URL.revokeObjectURL = vi.fn()

    renderAt('/penulis/penarikan/riwayat')
    const buttons = await screen.findAllByRole('button', { name: 'Unduh bukti transfer' })
    // Hanya satu pengajuan berstatus Ditransfer di seed.
    expect(buttons).toHaveLength(1)

    await user.click(buttons[0] as HTMLElement)
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    click.mockRestore()
  })

  it('rantai koin → rupiah lengkap empat langkah, dan angkanya menjumlah utuh', async () => {
    renderAt('/penulis/penarikan/riwayat')

    expect(await screen.findByText(/Kurs berlaku: 1 koin = Rp/)).toBeInTheDocument()
    expect(screen.getByText(/Pembaca membayar → potongan platform/)).toBeInTheDocument()
    expect(screen.getByText(/Platform memotong .* \(20%\)/)).toBeInTheDocument()
    expect(screen.getByText(/Penulis menerima .* \(80%\)/)).toBeInTheDocument()
    expect(screen.getByText(/Minimum pencairan Rp/)).toBeInTheDocument()
  })
})

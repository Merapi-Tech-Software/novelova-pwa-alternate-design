import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { ToastProvider } from '@/components/ui/Toast'
import AnalyticsPage from '@/features/studio/pages/AnalyticsPage'
import PrintHistoryPage from '@/features/studio/pages/PrintHistoryPage'
import { todayLocalISO } from '@/lib/date'

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/karya/:storyId/analitik" element={<AnalyticsPage />} />
            <Route path="/karya/cetak" element={<PrintHistoryPage />} />
            <Route path="/karya" element={<p>studio</p>} />
            <Route path="/bantuan" element={<p>bantuan</p>} />
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
  await db.stories.update('ms1', { review: 'published', status: 'ongoing' })
  // Jenis pesanan dikembalikan dari nomornya — satu test menukarnya untuk
  // memeriksa keadaan kosong, dan pembersihan di akhir test tidak berjalan
  // kalau test itu gagal.
  for (const order of await db.printOrders.toArray()) {
    await db.printOrders.update(order.id, { kind: order.id.startsWith('#SFT-') ? 'soft' : 'hard' })
  }
  await db.printOrders.update('#HDC-20260822-001', { status: 'printing', stageIndex: 3 })
  await db.printOrders.update('#HDC-20260818-001', {
    status: 'cost_changed',
    stageIndex: 1,
    costQuoted: 196_000,
    costFinal: 214_000,
  })
})

describe('analitik cerita · FR-STUDIO-27..31', () => {
  it('rentang tersimpan di URL, jadi halamannya bisa dibagikan apa adanya', async () => {
    const user = userEvent.setup()
    renderAt('/karya/ms1/analitik')

    expect(await screen.findByText(/7 hari terakhir/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '30H' }))
    expect(await screen.findByText(/30 hari terakhir/)).toBeInTheDocument()
  })

  it('panel custom hanya muncul saat dipilih, dan menutup tanggal masa depan', async () => {
    const user = userEvent.setup()
    renderAt('/karya/ms1/analitik')
    await screen.findByText(/7 hari terakhir/)

    expect(screen.queryByLabelText('Mulai')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Custom' }))

    // `toISOString().slice(0,10)` adalah bug tanggal (CLAUDE.md §8): di WIB
    // pagi, UTC masih hari kemarin dan `max` halaman tidak akan cocok. Test ini
    // lulus selama lima hari lalu gagal sendiri saat tanggalnya berganti.
    const today = todayLocalISO()
    const start = await screen.findByLabelText('Mulai')
    expect(start).toHaveAttribute('max', today)
    expect(screen.getByLabelText('Selesai')).toHaveAttribute('max', today)
  })

  /**
   * PRD 07 §7 #10. Prototipe membiarkan kedua lapisan mati sekaligus dan
   * menampilkan kotak kosong; di sini yang terakhir ditahan **beserta
   * alasannya**.
   */
  it('lapisan terakhir tidak bisa dimatikan, dan penolakannya menjelaskan kenapa', async () => {
    const user = userEvent.setup()
    renderAt('/karya/ms1/analitik')
    await screen.findByText(/7 hari terakhir/)

    await user.click(screen.getByRole('button', { name: 'Views' }))
    await user.click(screen.getByRole('button', { name: 'Pembaca' }))

    expect(await screen.findByText(/minimal satu lapisan harus menyala/i)).toBeInTheDocument()
    // Lapisan kedua tetap menyala — grafiknya tidak pernah jadi kotak kosong.
    expect(
      screen.getByRole('img', { name: /grafik tren/i }).querySelectorAll('polyline'),
    ).toHaveLength(1)
  })

  it('menekan kartu metrik menggulir ke bagian tujuannya', async () => {
    const user = userEvent.setup()
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    renderAt('/karya/ms1/analitik')
    await screen.findByText(/7 hari terakhir/)

    await user.click(screen.getByRole('button', { name: /Lihat Komentar/ }))
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })

  it('menekan kartu bab membuka sheet dengan judul bab itu', async () => {
    const user = userEvent.setup()
    renderAt('/karya/ms1/analitik')
    await screen.findByText(/7 hari terakhir/)

    const first = (await screen.findAllByRole('button', { name: /^#1/ }))[0]
    if (!first) throw new Error('butuh satu kartu bab')
    const title = first.textContent ?? ''
    await user.click(first)

    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByText(/Retensi \d+%/)).toBeInTheDocument()
    expect(title).toContain(within(sheet).getByRole('heading').textContent ?? '')
  })
})

describe('riwayat cetak · FR-STUDIO-32', () => {
  it('lini masa hardcopy enam tahap PRD, bukan empat langkah kanvas', async () => {
    const user = userEvent.setup()
    renderAt('/karya/cetak')
    // Sisipan biaya menutup daftarnya lebih dulu — itu memang tugasnya.
    await user.click(await screen.findByRole('button', { name: 'Lihat riwayat dulu' }))
    const stages = await screen.findAllByText('Dikonfirmasi')

    expect(stages.length).toBeGreaterThan(0)
    for (const label of ['Diajukan', 'Dibayar', 'Dicetak', 'Dikirim', 'Diterima']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
  })

  it('membatalkan pesanan yang sudah dicetak ditolak dengan alasannya, bukan tombol mati', async () => {
    const user = userEvent.setup()
    renderAt('/karya/cetak?tab=hard')
    await user.click(await screen.findByRole('button', { name: 'Lihat riwayat dulu' }))
    await screen.findAllByText('Dicetak')

    // Baris pesanan bukan `.nv-card` lagi sejak R6 — kartu diganti baris
    // berpembatas (`7o`–`7r`, brief §4). Yang dicari elemen `<article>`-nya.
    const row = screen.getByText('#HDC-20260822-001').closest('article')
    if (!row) throw new Error('baris pesanan tidak ditemukan')
    // Tombolnya **ada** — yang menolak servernya, dan penolakannya bisa dibaca.
    await user.click(within(row as HTMLElement).getByRole('button', { name: 'Batalkan pesanan' }))

    expect(await screen.findByText(/tidak bisa dibatalkan/i)).toBeInTheDocument()
    expect(screen.getByText(/klaim/i)).toBeInTheDocument()
  })

  it('tiap tab punya keadaan kosongnya sendiri, bukan satu kalimat untuk semua', async () => {
    const user = userEvent.setup()
    await db.printOrders.where('userId').equals(CURRENT_USER_ID).modify({ kind: 'hard' })
    renderAt('/karya/cetak')
    await user.click(await screen.findByRole('button', { name: 'Lihat riwayat dulu' }))

    await user.click(screen.getByRole('tab', { name: 'PDF' }))
    expect(await screen.findByText(/Belum ada berkas PDF yang dibuat/)).toBeInTheDocument()

    await db.printOrders.where('userId').equals(CURRENT_USER_ID).modify({ kind: 'soft' })
    await user.click(screen.getByRole('tab', { name: 'Hardcopy' }))
    expect(await screen.findByText(/minimum 10 bab aktif/i)).toBeInTheDocument()
  })

  it('pesanan ditolak membawa alasan kebijakannya dan jalan keluarnya', async () => {
    const user = userEvent.setup()
    renderAt('/karya/cetak')
    await user.click(await screen.findByRole('button', { name: 'Lihat riwayat dulu' }))

    expect(await screen.findByText(/minimum 10 bab aktif/i)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Kembali ke Karya Saya' }).length).toBeGreaterThan(0)
  })

  it('invoice hardcopy adalah berkas nyata, bukan pesan "sedang disiapkan"', async () => {
    const user = userEvent.setup()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    URL.createObjectURL = vi.fn(() => 'blob:invoice')
    URL.revokeObjectURL = vi.fn()

    renderAt('/karya/cetak?tab=hard')
    await user.click(await screen.findByRole('button', { name: 'Lihat riwayat dulu' }))
    await user.click(
      (await screen.findAllByRole('button', { name: 'Download Invoice' }))[0] as HTMLElement,
    )

    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    click.mockRestore()
  })

  it('biaya berubah menghentikan halaman sampai penulis memutuskan · PRINT-402', async () => {
    renderAt('/karya/cetak')

    expect(await screen.findByText(/Biaya cetak berubah/)).toBeInTheDocument()
    // Kalimat keamanan uang lengkap · arch §1.4. Potongan "belum ada yang
    // ditagihkan" saja juga ada di catatan pesanan, jadi yang diperiksa bagian
    // yang hanya dimiliki sisipan ini.
    expect(screen.getByText(/Produksi berhenti sampai kamu menyetujui/i)).toBeInTheDocument()
    expect(screen.getByText(/PRINT-402 · #HDC-20260818-001/)).toBeInTheDocument()
    // Layar penuh **wajib menawarkan jalan keluar** (arch §1.4).
    expect(screen.getByRole('button', { name: 'Setujui biaya baru' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tolak & batalkan' })).toBeInTheDocument()
  })
})

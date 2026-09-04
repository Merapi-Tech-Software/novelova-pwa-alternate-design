import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { ToastProvider } from '@/components/ui/Toast'
import WithdrawPage from '@/features/studio/pages/WithdrawPage'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/penulis/penarikan']}>
          <Routes>
            <Route path="/penulis/penarikan" element={<WithdrawPage />} />
            <Route path="/penulis/penarikan/riwayat" element={<p>riwayat</p>} />
            <Route path="/pengaturan/keamanan" element={<p>keamanan</p>} />
            <Route path="/profil/ubah" element={<p>ubah profil</p>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

/** Jumlah panjang diketik `fireEvent`, bukan `userEvent` — lihat CLAUDE.md §8. */
const ketik = (value: string) =>
  fireEvent.change(screen.getByLabelText(/Jumlah penarikan/), {
    target: { value },
  })

beforeEach(async () => {
  await db.authorProfiles.put({
    userId: CURRENT_USER_ID,
    tier: 'verified',
    payoutVerified: true,
    twoFactor: true,
    termsAcceptedAt: new Date().toISOString(),
  })
  for (const row of await db.withdrawals.toArray()) {
    if (row.id.startsWith('wd-')) await db.withdrawals.delete(row.id)
  }
  await db.idempotency.clear()
})

describe('saldo & syarat · FR-EARN-06 · FR-EARN-07', () => {
  it('saldo, minimum, dan estimasi tampil bersamaan sebelum formulir', async () => {
    renderPage()

    expect(await screen.findByText('Saldo tersedia')).toBeInTheDocument()
    expect(screen.getByText('Minimum')).toBeInTheDocument()
    expect(screen.getByText('1–3 hari kerja')).toBeInTheDocument()
  })

  it('rekening tampil tersamar dan berstatus terverifikasi', async () => {
    renderPage()

    expect(await screen.findByText('**** 4481')).toBeInTheDocument()
    expect(screen.getByText('Terverifikasi')).toBeInTheDocument()
    // Nomor penuhnya tidak pernah ada di DOM.
    expect(screen.queryByText(/\d{10,}/)).not.toBeInTheDocument()
  })

  it('tiga tujuan penarikan tersedia', async () => {
    renderPage()
    await screen.findByText('Saldo tersedia')

    for (const label of [
      'Pembayaran pendapatan penulis',
      'Penyelesaian bulanan',
      'Koreksi manual',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('tiga tahap Ajukan–Tinjau–Transfer tampil', async () => {
    renderPage()
    await screen.findByText('Saldo tersedia')

    for (const label of ['Ajukan', 'Tinjau', 'Transfer']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })
})

describe('perhitungan & validasi · FR-EARN-08 · FR-EARN-11', () => {
  it('titik pada masukan diabaikan, dan bersih dihitung tiap ketikan', async () => {
    renderPage()
    await screen.findByText('Saldo tersedia')

    ketik('1.000.000')
    // Spasi **biasa**, bukan `\u00a0`: RTL menormalkan teks DOM (NBSP → spasi)
    // tetapi tidak menormalkan string pencariannya, jadi NBSP di query justru
    // yang membuatnya tidak pernah cocok. Kebalikan dari jebakan `Intl` §8.
    expect(await screen.findByText('Rp 1.000.000')).toBeInTheDocument()
    expect(screen.getByText('Rp 995.000')).toBeInTheDocument()
  })

  it('huruf dianggap nol, dan bersihnya tidak pernah negatif', async () => {
    renderPage()
    await screen.findByText('Saldo tersedia')

    ketik('abc')
    // Diminta dan bersih keduanya Rp 0 — dua baris, satu nilai.
    expect((await screen.findAllByText('Rp 0')).length).toBeGreaterThanOrEqual(2)
  })

  it('tombol nonaktif selama jumlah belum valid — bukan menolak setelah ditekan', async () => {
    renderPage()
    await screen.findByText('Saldo tersedia')

    const submit = screen.getByRole('button', { name: 'Ajukan penarikan' })
    expect(submit).toBeDisabled()

    ketik('50000')
    expect(await screen.findByRole('alert')).toHaveTextContent(/Penarikan minimum Rp 100\.000/)
    expect(submit).toBeDisabled()
  })

  it('kolom kosong tidak dimarahi — hanya tombolnya yang mati', async () => {
    renderPage()
    await screen.findByText('Saldo tersedia')

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajukan penarikan' })).toBeDisabled()
  })

  it('"Tarik semua" mengisi seluruh saldo dan menyalakan tombolnya', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Saldo tersedia')

    await user.click(screen.getByRole('button', { name: 'Tarik semua' }))
    expect(screen.getByRole('button', { name: 'Ajukan penarikan' })).toBeEnabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('2 langkah mati menahan pengajuan beserta tautan ke halaman keamanan', async () => {
    await db.authorProfiles.update(CURRENT_USER_ID, { twoFactor: false })
    renderPage()
    await screen.findByText('Saldo tersedia')

    ketik('200000')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/verifikasi 2 langkah/i)
    expect(screen.getByRole('link', { name: 'Perbaiki sekarang' })).toHaveAttribute(
      'href',
      '/pengaturan/keamanan',
    )
  })
})

describe('pengajuan menahan saldo · FR-EARN-11', () => {
  it('setelah berhasil, saldo tersedia langsung berkurang sebesar pengajuannya', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Saldo tersedia')

    const before = await api.getPayoutBalance()
    ketik('150000')
    await user.click(screen.getByRole('button', { name: 'Ajukan penarikan' }))

    expect(await screen.findByText(/masuk antrean verifikasi/)).toBeInTheDocument()
    const after = await api.getPayoutBalance()
    expect(after.available).toBe(before.available - 150_000)
  })
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { ToastProvider } from '@/components/ui/Toast'
import TransactionDetailPage from '@/features/wallet/pages/TransactionDetailPage'
import TransactionsPage from '@/features/wallet/pages/TransactionsPage'

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/koin/transaksi" element={<TransactionsPage />} />
            <Route path="/koin/transaksi/:txId" element={<TransactionDetailPage />} />
            <Route path="/hadiah" element={<p>pusat hadiah</p>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const at = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3_600_000).toISOString()

beforeEach(async () => {
  await db.wallets.put({
    userId: CURRENT_USER_ID,
    balance: 2_000,
    bonus: 0,
    updatedAt: new Date().toISOString(),
  })
  await db.transactions.where('userId').equals(CURRENT_USER_ID).delete()
  await db.transactions.bulkPut([
    {
      id: 'tx-uji-topup',
      userId: CURRENT_USER_ID,
      kind: 'topup',
      amount: 550,
      title: 'Isi 500 koin + 50 bonus',
      refType: 'topup',
      refId: 'ord-uji',
      method: 'QRIS',
      status: 'success',
      createdAt: at(1),
    },
    {
      id: 'tx-uji-spend',
      userId: CURRENT_USER_ID,
      kind: 'spend',
      amount: -2_000,
      title: 'Buka bab 8',
      refType: 'chapter',
      refId: 's1-c8',
      method: null,
      status: 'success',
      createdAt: at(3),
    },
    {
      id: 'tx-uji-reward',
      userId: CURRENT_USER_ID,
      kind: 'reward',
      amount: 55,
      title: 'Hadiah misi harian',
      refType: 'mission',
      refId: null,
      method: null,
      status: 'success',
      createdAt: at(5),
    },
  ])
})

describe('buku besar dompet · FR-WALLET-15', () => {
  it('menampilkan seluruh mutasi dan keterangan saringan aktif', async () => {
    renderAt('/koin/transaksi')

    expect(await screen.findByText('Isi 500 koin + 50 bonus')).toBeInTheDocument()
    expect(screen.getByText('Buka bab 8')).toBeInTheDocument()
    expect(
      screen.getByText('Menampilkan catatan semua dari buku besar dompet.'),
    ).toBeInTheDocument()
  })

  it('menyaring "Keluar" meminta ulang barisnya, bukan menyembunyikannya', async () => {
    renderAt('/koin/transaksi')
    await screen.findByText('Isi 500 koin + 50 bonus')

    // `role="tab"`, bukan `button`: saringan buku besar jadi **tab teks** di R8c
    // (brief §1 aturan 5). Yang diuji tetap sama — barisnya diminta ulang ke
    // server, bukan disembunyikan.
    await userEvent.click(screen.getByRole('tab', { name: 'Keluar' }))

    expect(await screen.findByText('Buka bab 8')).toBeInTheDocument()
    expect(screen.queryByText('Isi 500 koin + 50 bonus')).not.toBeInTheDocument()
    expect(
      screen.getByText('Menampilkan catatan keluar dari buku besar dompet.'),
    ).toBeInTheDocument()
  })

  it('baris hadiah menuju pusat hadiah, baris lain menuju detailnya', async () => {
    renderAt('/koin/transaksi')

    expect(await screen.findByRole('link', { name: /Hadiah misi harian/ })).toHaveAttribute(
      'href',
      '/hadiah',
    )
    expect(screen.getByRole('link', { name: /Buka bab 8/ })).toHaveAttribute(
      'href',
      '/koin/transaksi/tx-uji-spend',
    )
  })
})

describe('detail transaksi · FR-WALLET-14 · FR-WALLET-19', () => {
  it('baris pengeluaran menyebut cerita dan babnya beserta saldo sebelum–sesudah', async () => {
    renderAt('/koin/transaksi/tx-uji-spend')

    expect(await screen.findByText(/· Bab 8$/)).toBeInTheDocument()
    expect(screen.getByText('Saldo sebelum')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /· Bab 8$/ })).toHaveAttribute(
      'href',
      '/cerita/s1/bab/s1-c8',
    )
  })

  it('id yang tidak ada memberi keadaan kosong, bukan status sukses palsu', async () => {
    renderAt('/koin/transaksi/tx-entah-apa')

    expect(await screen.findByText('Transaksi tidak ditemukan')).toBeInTheDocument()
    expect(screen.queryByText('Koin sudah masuk')).not.toBeInTheDocument()
  })

  it('baris yang belum lunas tidak menggeser saldo', async () => {
    await db.transactions.update('tx-uji-topup', { status: 'pending' })
    renderAt('/koin/transaksi/tx-uji-topup')

    expect(await screen.findByText('Menunggu konfirmasi')).toBeInTheDocument()
    const saldo = screen.getAllByText('2.000')
    expect(saldo.length).toBeGreaterThanOrEqual(2)
  })

  /*
   * Lini masa · R8c.
   *
   * Yang diuji bukan bentuknya, melainkan **kapan ia tidak boleh ada**: deretan
   * tahap menyiratkan uangnya masih berjalan, dan pada transaksi gagal atau
   * dibalik itu kebalikan dari yang terjadi. Aturan yang sama sudah dipegang
   * riwayat pencairan; kalau salah satunya bergeser, yang ini ikut jatuh.
   */
  it('lini masa hanya untuk yang masih di jalurnya', async () => {
    renderAt('/koin/transaksi/tx-uji-topup')
    expect(await screen.findByText('Koin masuk')).toBeInTheDocument()
    expect(screen.getByText('Dibayar')).toBeInTheDocument()

    await db.transactions.update('tx-uji-topup', { status: 'failed' })
    cleanup()
    renderAt('/koin/transaksi/tx-uji-topup')

    expect(await screen.findByText('Pembayaran gagal')).toBeInTheDocument()
    expect(screen.queryByText('Koin masuk')).not.toBeInTheDocument()
  })

  it('tahap terakhir menyebut arah koinnya, bukan selalu "masuk"', async () => {
    renderAt('/koin/transaksi/tx-uji-spend')

    expect(await screen.findByText('Koin dipotong')).toBeInTheDocument()
    expect(screen.queryByText('Koin masuk')).not.toBeInTheDocument()
  })
})

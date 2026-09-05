import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { ToastProvider } from '@/components/ui/Toast'
import TopupPage from '@/features/wallet/pages/TopupPage'

function renderTopup(search = '') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/koin${search}`]}>
          <Routes>
            <Route path="/koin" element={<TopupPage />} />
            <Route path="/cerita/:storyId/bab/:chapterId" element={<p>ruang baca</p>} />
            <Route path="/" element={<p>beranda</p>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

beforeEach(async () => {
  await db.wallets.put({
    userId: CURRENT_USER_ID,
    balance: 15_300,
    bonus: 420,
    updatedAt: new Date().toISOString(),
  })
  await db.topupOrders.clear()
  await db.idempotency.clear()
})

const pay = () => screen.getByRole('button', { name: /Bayar|Pilih jumlah dan metode/ })

describe('tiga langkah isi koin · FR-WALLET-02 sampai FR-WALLET-05', () => {
  it('langkah metode dan ringkasan tertutup sampai jumlahnya dipilih', async () => {
    renderTopup()
    expect(await screen.findByText('Langkah 1 · Pilih jumlah')).toBeInTheDocument()

    expect(screen.queryByText('Langkah 2 · Pilih metode')).not.toBeInTheDocument()
    expect(pay()).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: /250/ }))
    expect(await screen.findByText('Langkah 2 · Pilih metode')).toBeInTheDocument()
    // Jumlah saja belum cukup — metodenya belum dipilih.
    expect(pay()).toBeDisabled()
  })

  it('memilih paket menonaktifkan kolom kustom, dan sebaliknya', async () => {
    renderTopup()
    const paket = await screen.findByRole('button', { name: /250/ })
    const kolom = screen.getByLabelText('Jumlah sendiri')

    await userEvent.click(paket)
    expect(paket).toHaveAttribute('aria-pressed', 'true')
    expect(kolom).toBeDisabled()

    // Jalan kembalinya: tekan lagi paket yang sama.
    await userEvent.click(screen.getByRole('button', { name: /Batalkan pilihan paket/ }))
    expect(kolom).toBeEnabled()

    await userEvent.type(kolom, '750')
    expect(await screen.findByText('Rp 97.500')).toBeInTheDocument()
    // Sekarang giliran kartu paket yang mati.
    expect(screen.getByRole('button', { name: /250/ })).toBeDisabled()
  })

  it('mundur ke jumlah tidak sah menutup kembali langkah yang sudah terbuka', async () => {
    renderTopup()
    const kolom = await screen.findByLabelText('Jumlah sendiri')

    await userEvent.type(kolom, '150')
    await userEvent.click(await screen.findByRole('button', { name: /OVO/ }))
    expect(await screen.findByText('Langkah 3 · Ringkasan')).toBeInTheDocument()

    await userEvent.clear(kolom)
    await userEvent.type(kolom, '77')
    expect(screen.getByText('Minimum pembelian 100 koin.')).toBeInTheDocument()
    expect(screen.queryByText('Langkah 2 · Pilih metode')).not.toBeInTheDocument()
    expect(pay()).toBeDisabled()
  })

  it('baris bonus hanya muncul pada 500 koin persis', async () => {
    renderTopup()
    await userEvent.click(await screen.findByRole('button', { name: /500/ }))
    await userEvent.click(await screen.findByRole('button', { name: /OVO/ }))

    expect(await screen.findByText('Bonus promo')).toBeInTheDocument()

    // Batalkan dulu paketnya supaya kolom kustom hidup lagi.
    await userEvent.click(screen.getByRole('button', { name: /Batalkan pilihan paket/ }))
    await userEvent.type(screen.getByLabelText('Jumlah sendiri'), '501')
    await userEvent.click(await screen.findByRole('button', { name: /OVO/ }))
    expect(screen.queryByText('Bonus promo')).not.toBeInTheDocument()
  })
})

describe('konteks dari gerbang bab · FR-WALLET-18', () => {
  it('menyorot paket terkecil yang mencukupi, tanpa mengunci yang lain', async () => {
    renderTopup('?return=%2Fcerita%2Fs1%2Fbab%2Fs1-c8&chapter_id=s1-c8&need=300')

    expect(await screen.findByText('Kamu kurang 300 koin')).toBeInTheDocument()
    expect(screen.getByText('Cukup untuk membuka bab ini')).toBeInTheDocument()

    // 500 sudah terpilih lebih dulu, tetapi 1.000 tetap bisa dipilih.
    const seribu = screen.getByRole('button', { name: /1\.000/ })
    await userEvent.click(seribu)
    expect(seribu).toHaveAttribute('aria-pressed', 'true')
  })

  it('setelah bayar, tombol utamanya kembali ke bab yang sama', async () => {
    renderTopup('?return=%2Fcerita%2Fs1%2Fbab%2Fs1-c8&chapter_id=s1-c8&need=300')

    await userEvent.click(await screen.findByRole('button', { name: /QRIS/ }))
    await userEvent.click(await screen.findByRole('button', { name: /^Bayar/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'Cek status' }))

    // Pelunasan menyentuh tiga tabel dalam satu transaksi lalu menyegarkan
    // saldo — di jsdom itu bisa lebih lambat daripada ambang bawaan 1 detik.
    expect(await screen.findByText('Koin sudah masuk', {}, { timeout: 5_000 })).toBeInTheDocument()
    // 15.300 + 500 + 50 bonus, di **dua** tempat dengan **dua bentuk angka**:
    // layar sukses menulisnya penuh (`15.850`) karena di situ jumlahnya yang
    // jadi pokok, sementara chip di bilah atas menulisnya ringkas (`15,8rb`)
    // seperti `7a` dan `7i`. Keduanya wajib berubah — yang diuji FR-WALLET-10
    // adalah saldo di bilah atas ikut bergerak, bukan bentuk hurufnya.
    //
    // Ditunggu, bukan dipotret: layar sukses tahu saldo barunya dari pesanan,
    // sedangkan bilah atas menunggu `['wallet']` diambil ulang. Keduanya benar,
    // tetapi tidak tiba pada render yang sama — dan assertion tanpa penantian
    // gagal sesekali karenanya.
    await vi.waitFor(() => expect(screen.getAllByText('15.850')).toHaveLength(1))
    await vi.waitFor(() => expect(screen.getAllByText('15,8rb')).toHaveLength(1))

    await userEvent.click(screen.getByRole('button', { name: 'Lanjutkan membaca' }))
    expect(await screen.findByText('ruang baca')).toBeInTheDocument()
  })
})

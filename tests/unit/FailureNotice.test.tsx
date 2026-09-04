import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FailureNotice } from '@/components/patterns/FailureNotice'

describe('FailureNotice', () => {
  it('merender copy dalam urutan tetap: apa terjadi → apa aman → aksi → kode', () => {
    render(
      <FailureNotice
        level="inset"
        title="Pembayaran belum bisa dipastikan"
        body="Penyedia tidak menjawab dalam 90 detik."
        safety="Jangan bayar dua kali. Koin masuk otomatis dalam 10 menit."
        onRetry={() => {}}
        code="PAY-504 · GoPay · 21.44 WIB"
      />,
    )

    expect(screen.getByText('Pembayaran belum bisa dipastikan')).toBeInTheDocument()
    expect(screen.getByText(/Jangan bayar dua kali/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument()
    // Kode teknis selalu ada, tetapi selalu sekunder.
    expect(screen.getByText('PAY-504 · GoPay · 21.44 WIB')).toBeInTheDocument()
  })

  it('menaikkan label coba-lagi setelah dua kegagalan berturut-turut', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<FailureNotice level="inset" title="Gagal memuat" onRetry={onRetry} />)

    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))

    // Percobaan ketiga memakai label berbeda — tombol yang sama tidak boleh
    // terasa berbohong setelah dua kali gagal.
    expect(screen.getByRole('button', { name: 'Coba sekali lagi' })).toBeInTheDocument()
    expect(onRetry).toHaveBeenCalledTimes(2)
  })

  it('tingkat inset hanya mengganti bagiannya — sisa halaman tetap terender', () => {
    render(
      <div>
        <h1>Beranda</h1>
        <section aria-label="Lanjut baca">Bagian ini tetap hidup</section>
        <FailureNotice level="inset" title="Bagian rekomendasi tidak bisa dimuat" />
        <footer>Bilah navigasi</footer>
      </div>,
    )

    expect(screen.getByText('Bagian rekomendasi tidak bisa dimuat')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Beranda' })).toBeInTheDocument()
    expect(screen.getByText('Bagian ini tetap hidup')).toBeInTheDocument()
    expect(screen.getByText('Bilah navigasi')).toBeInTheDocument()
  })

  it('tingkat inline hanya sebaris dan tidak membawa tombol', () => {
    render(<FailureNotice level="inline" title="Sinopsis minimal 50 karakter · sekarang 44" />)

    expect(screen.getByRole('alert')).toHaveTextContent('Sinopsis minimal 50 karakter')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

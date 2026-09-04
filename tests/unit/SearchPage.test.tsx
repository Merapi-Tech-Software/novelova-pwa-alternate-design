import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { api } from '@/api/client'
import SearchPage from '@/features/search/pages/SearchPage'
import { SEARCH_DEBOUNCE_MS } from '@/lib/limits'
import { useSearchHistory } from '@/stores/searchHistory'

function renderSearch() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/cari']}>
        <SearchPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Menunggu debounce lewat, lalu memberi kesempatan permintaannya berjalan. */
const settle = () => new Promise((r) => setTimeout(r, SEARCH_DEBOUNCE_MS + 120))

describe('halaman pencarian · FR-SRCH-01 · FR-SRCH-02', () => {
  it('kolom masukan sudah terfokus saat halaman dibuka', () => {
    renderSearch()

    expect(screen.getByRole('searchbox', { name: 'Cari cerita' })).toHaveFocus()
  })

  it('mengetik lima huruf cepat mengirim tepat satu permintaan', async () => {
    const spy = vi.spyOn(api, 'search')
    renderSearch()

    await userEvent.type(screen.getByRole('searchbox', { name: 'Cari cerita' }), 'romance')
    await settle()

    // Satu permintaan untuk seluruh ketikan, dan yang dikirim kueri terakhirnya.
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]?.[0]).toBe('romance')

    spy.mockRestore()
  })

  it('satu huruf tidak mengirim permintaan sama sekali', async () => {
    const spy = vi.spyOn(api, 'search')
    renderSearch()

    await userEvent.type(screen.getByRole('searchbox', { name: 'Cari cerita' }), 'r')
    await settle()

    expect(spy).not.toHaveBeenCalled()
    expect(screen.getByText('Ketik minimal 2 huruf')).toBeInTheDocument()

    spy.mockRestore()
  })

  it('hasil dikelompokkan, dan kelompok kosong tidak ditampilkan', async () => {
    renderSearch()

    await userEvent.type(screen.getByRole('searchbox', { name: 'Cari cerita' }), 'kantor')
    expect(await screen.findByRole('heading', { name: 'Cerita' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Tag' })).toBeInTheDocument()
    // Tidak ada penulis bernama "kantor" — judulnya pun tidak muncul.
    expect(screen.queryByRole('heading', { name: 'Penulis' })).not.toBeInTheDocument()
  })
})

describe('tujuan tiap hasil · FR-SRCH-02', () => {
  it('cerita menuju detailnya, penulis menuju profilnya', async () => {
    renderSearch()
    await userEvent.type(screen.getByRole('searchbox', { name: 'Cari cerita' }), 'amelia')

    await screen.findByRole('heading', { name: 'Penulis' })
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href') ?? '')

    expect(links.some((href) => href.startsWith('/pengguna/'))).toBe(true)
    expect(links.some((href) => href.startsWith('/cerita/'))).toBe(true)
  })

  it('menekan tag menjalankan pencarian tag itu, kolomnya ikut terisi', async () => {
    renderSearch()
    const box = screen.getByRole('searchbox', { name: 'Cari cerita' })
    await userEvent.type(box, 'kantor')

    await screen.findByRole('heading', { name: 'Tag' })
    // Pil tag membawa jumlah ceritanya, jadi namanya berbeda dari saran ketik
    // yang hanya berisi katanya.
    await userEvent.click(screen.getByRole('button', { name: /kantor · \d+ cerita/ }))

    expect(box).toHaveValue('kantor')
  })
})

describe('riwayat & kata kunci populer di layar · FR-SRCH-03', () => {
  it('riwayat tidak tampil sebelum pernah mencari, dan muncul setelah Enter', async () => {
    localStorage.removeItem('novelova:search-history-v1')
    useSearchHistory.setState({ entries: [] })
    renderSearch()

    expect(screen.queryByRole('heading', { name: 'Pencarian terakhir' })).not.toBeInTheDocument()

    const box = screen.getByRole('searchbox', { name: 'Cari cerita' })
    await userEvent.type(box, 'romance{Enter}')
    await userEvent.clear(box)

    expect(await screen.findByRole('heading', { name: 'Pencarian terakhir' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'romance' })).toBeInTheDocument()
  })

  it('mengetik saja tidak mencatat riwayat', async () => {
    localStorage.removeItem('novelova:search-history-v1')
    useSearchHistory.setState({ entries: [] })
    renderSearch()

    const box = screen.getByRole('searchbox', { name: 'Cari cerita' })
    await userEvent.type(box, 'romance')
    await settle()
    await userEvent.clear(box)

    // Riwayat berisi "r", "ro", "rom" bukan riwayat.
    expect(screen.queryByRole('heading', { name: 'Pencarian terakhir' })).not.toBeInTheDocument()
  })

  it('kata kunci populer menjalankan pencariannya langsung', async () => {
    localStorage.removeItem('novelova:search-history-v1')
    useSearchHistory.setState({ entries: [] })
    renderSearch()

    const trending = await screen.findByRole('heading', { name: 'Sedang banyak dicari' })
    expect(trending).toBeInTheDocument()

    const pill = screen.getAllByRole('button').find((b) => b.textContent === 'kantor')
    if (!pill) throw new Error('pil kata kunci tidak ada')
    await userEvent.click(pill)

    expect(screen.getByRole('searchbox', { name: 'Cari cerita' })).toHaveValue('kantor')
    expect(await screen.findByRole('heading', { name: 'Cerita' })).toBeInTheDocument()
  })
})

describe('saringan & URL · FR-SRCH-04', () => {
  it('kueri dan saringan ikut ke URL, dan URL yang dibuka langsung mencari', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/cari?q=romance&genre=Drama']}>
          <SearchPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByRole('searchbox', { name: 'Cari cerita' })).toHaveValue('romance')
    // Saringan aktif tampil sebagai pil yang bisa dilepas.
    expect(await screen.findByRole('button', { name: /Genre: Drama/ })).toBeInTheDocument()
  })

  it('mengganti urutan memuat ulang dari halaman pertama', async () => {
    const spy = vi.spyOn(api, 'search')
    renderSearch()

    await userEvent.type(screen.getByRole('searchbox', { name: 'Cari cerita' }), 'romance')
    await settle()
    spy.mockClear()

    await userEvent.selectOptions(screen.getByLabelText('Urutkan'), 'rating')
    await settle()

    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls.at(-1)?.[1]).toMatchObject({ page: 1, sort: 'rating' })

    spy.mockRestore()
  })
})

describe('keadaan kosong · FR-SRCH-05', () => {
  it('kosong karena saringan menawarkan menghapus saringan lebih dulu', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/cari?q=romance&genre=Horror&lang=English']}>
          <SearchPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(
      await screen.findByText('Tidak ada cerita yang cocok dengan saringan ini.'),
    ).toBeInTheDocument()
    // Dua tempat menawarkannya: bilah kontrol dan keadaan kosong itu sendiri.
    expect(screen.getAllByRole('button', { name: 'Hapus semua saringan' })).toHaveLength(2)
  })

  it('kueri salah eja menawarkan ejaan terdekat', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/cari?q=romanse']}>
          <SearchPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByText(/Maksud Anda/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Telusuri yang populer' })).toBeInTheDocument()
  })
})

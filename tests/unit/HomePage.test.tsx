import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { api } from '@/api/client'
import HomePage from '@/features/home/pages/HomePage'
import { defaultVisibility, useHomeSections } from '@/stores/homeSections'

function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('beranda', () => {
  it('merender section discovery beserta tautan lihat-semua', async () => {
    renderHome()

    expect(await screen.findByRole('heading', { name: 'Populer' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'See all' }).length).toBeGreaterThan(0)
  })

  it('memilih tab mengganti section tematiknya, dan tiga section pertama tetap', async () => {
    renderHome()
    await screen.findByRole('heading', { name: 'Sedang Ramai Dibicarakan' })

    await userEvent.click(screen.getByRole('button', { name: 'Fantasy' }))

    // Ekornya berganti mengikuti tab…
    expect(await screen.findByRole('heading', { name: 'Dunia Lain' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Sedang Ramai Dibicarakan' }),
    ).not.toBeInTheDocument()

    // …sementara tiga section pertama tetap ada, dan bacaan pribadi tidak
    // pernah ikut tersaring.
    expect(screen.getByRole('heading', { name: 'Populer' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Paling Banyak Dibuka' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lanjut Membaca' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Semua' }))
    expect(
      await screen.findByRole('heading', { name: 'Sedang Ramai Dibicarakan' }),
    ).toBeInTheDocument()
  })
})

describe('pengaturan section · FR-HOME-06 · FR-HOME-16', () => {
  it('mematikan sakelar menghilangkan section-nya dari feed', async () => {
    // Bukan `localStorage.clear()`: cookie refresh server tiruan juga tinggal di
    // sana, dan menghapusnya membuat seluruh permintaan menjawab AUTH-401.
    localStorage.removeItem('home_section_visibility_v1')
    useHomeSections.setState({ visible: defaultVisibility() })
    renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    await userEvent.click(screen.getByRole('button', { name: 'Pengaturan section' }))
    await userEvent.click(screen.getByRole('switch', { name: 'Populer' }))

    expect(screen.queryByRole('heading', { name: 'Populer' })).not.toBeInTheDocument()
    // Sakelarnya sendiri tetap ada — pengaturan pengguna dan keadaan kosong
    // adalah dua hal berbeda (FR-HOME-16).
    expect(screen.getByRole('switch', { name: 'Populer' })).toBeInTheDocument()
  })

  it('kesembilan sakelar selalu ada, termasuk blok yang sedang kosong', async () => {
    // Bukan `localStorage.clear()`: cookie refresh server tiruan juga tinggal di
    // sana, dan menghapusnya membuat seluruh permintaan menjawab AUTH-401.
    localStorage.removeItem('home_section_visibility_v1')
    useHomeSections.setState({ visible: defaultVisibility() })
    renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    await userEvent.click(screen.getByRole('button', { name: 'Pengaturan section' }))
    expect(screen.getAllByRole('switch')).toHaveLength(9)
  })
})

describe('mengganti tab', () => {
  it('memicu tepat satu pemuatan ulang', async () => {
    const spy = vi.spyOn(api, 'getHomeFeed')
    renderHome()
    await screen.findByRole('heading', { name: 'Populer' })

    const before = spy.mock.calls.length
    await userEvent.click(screen.getByRole('button', { name: 'My Kisah' }))
    await screen.findByRole('heading', { name: 'Kisah Pilu' })

    // Satu tab ditekan = satu permintaan. Dua berarti penyaringnya dikirim dua
    // kali, dan pembaca membayar dua kali menunggu untuk hasil yang sama.
    expect(spy.mock.calls.length - before).toBe(1)
    expect(spy).toHaveBeenLastCalledWith('My Kisah')

    spy.mockRestore()
  })
})

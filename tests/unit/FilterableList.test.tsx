import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { FilterableList, useListQuery } from '@/components/patterns/FilterableList'

const TABS = [
  { value: 'semua', label: 'Semua' },
  { value: 'berjalan', label: 'Berjalan' },
  { value: 'tamat', label: 'Tamat' },
] as const

/** Menampilkan kueri yang terbaca dari URL, supaya assertion-nya jujur. */
function Harness({ total = 6 }: { total?: number }) {
  const query = useListQuery({ tab: 'semua' })
  return (
    <FilterableList
      noun="cerita"
      total={total}
      tabs={TABS}
      sorts={[
        { value: 'terbaru', label: 'Terbaru' },
        { value: 'populer', label: 'Populer' },
      ]}
      pristine={total === 0}
    >
      <output data-testid="query">{`${query.q}|${query.tab}|${query.sort}|${query.page}`}</output>
    </FilterableList>
  )
}

/**
 * `MemoryRouter`, bukan `createMemoryRouter`. Data router membuat `Request`
 * pada tiap navigasi, dan di jsdom `AbortSignal` miliknya ditolak oleh `Request`
 * bawaan Node. Komponen ini hanya butuh `useSearchParams`, jadi router
 * sederhana justru menguji hal yang benar tanpa membawa masalah itu.
 */
function renderAt(path: string, total?: number) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Harness {...(total === undefined ? {} : { total })} />
    </MemoryRouter>,
  )
}

describe('FilterableList', () => {
  it('membaca saringan dari URL, bukan dari state komponen', () => {
    renderAt('/?q=kontrak&tab=tamat&sort=populer&page=2')

    // Inilah yang membuat tombol back mengembalikan hasil saring dan tautannya
    // bisa dibagikan (architecture.md §7.2).
    expect(screen.getByTestId('query')).toHaveTextContent('kontrak|tamat|populer|2')
  })

  it('menulis saringan ke URL dan mengembalikan ke halaman pertama', async () => {
    const user = userEvent.setup()
    renderAt('/?page=3')

    await user.click(screen.getByRole('tab', { name: 'Tamat' }))

    expect(screen.getByTestId('query')).toHaveTextContent('|tamat|')
    // Halaman 3 dari saringan lama tidak berlaku untuk saringan baru.
    expect(screen.getByTestId('query')).toHaveTextContent('|1')
  })

  it('menggabungkan cari dan saringan sebagai AND, bukan OR', async () => {
    const user = userEvent.setup()
    renderAt('/?tab=berjalan')

    await user.type(screen.getByRole('searchbox', { name: 'Cari' }), 'hujan')

    const shown = screen.getByTestId('query').textContent ?? ''
    expect(shown).toContain('hujan')
    expect(shown).toContain('berjalan')
  })

  it('memakai satu bentuk penghitung — Bahasa Indonesia tanpa jamak', () => {
    renderAt('/', 1)
    expect(screen.getByText('1 cerita')).toBeInTheDocument()
  })

  it('menyembunyikan kontrol cari & saring saat daftar benar-benar kosong', () => {
    renderAt('/', 0)

    // Tidak ada gunanya menyaring nol baris (FR-CORE-02, FR-LIB-12).
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })
})

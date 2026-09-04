import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import StoryDetailPage from '@/features/story/pages/StoryDetailPage'

function renderStory(id = 's1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/cerita/${id}`]}>
          <Routes>
            <Route path="/cerita/:storyId" element={<StoryDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('halaman detail cerita', () => {
  it('menampilkan hero, strip empat metrik, dan daftar bab', async () => {
    renderStory()

    expect(
      await screen.findByRole('heading', { name: 'Cinta di Balik Kontrak' }),
    ).toBeInTheDocument()

    // Putaran 7 mengganti tiga metrik pamer dengan empat sel `7b`, dan sel
    // ketiganya — durasi baca — datang dari server (`readMinutesTotal`), bukan
    // dijumlahkan dari 20 bab yang kebetulan sudah termuat.
    for (const label of ['Rating', 'Bab', 'Durasi baca', 'Status']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    // Dibaca dari **selnya**, bukan dari seluruh halaman: baris bab juga
    // berbunyi "8 menit", dan pencarian global akan menemukan keduanya.
    expect(screen.getByText('Durasi baca').parentElement).toHaveTextContent(/\d+ (jam|menit)/)

    expect(await screen.findByRole('heading', { name: 'Daftar bab' })).toBeInTheDocument()
  })

  it('sinopsis buka-tutup menjaga aria-expanded tetap sinkron', async () => {
    renderStory()
    const toggle = await screen.findByRole('button', { name: 'Selengkapnya' })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Ringkas' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('melepas simpanan minta konfirmasi lebih dulu', async () => {
    // s2 tidak ikut di-seed ke perpustakaan, jadi tombolnya mulai dari "Simpan".
    renderStory('s2')

    const save = await screen.findByRole('button', { name: 'Simpan' })
    await userEvent.click(save)

    // Setelah tersimpan, menekannya lagi membuka konfirmasi — bukan langsung
    // mengeluarkan cerita dari koleksi.
    const saved = await screen.findByRole('button', { name: 'Tersimpan' })
    await userEvent.click(saved)
    expect(await screen.findByText('Keluarkan dari koleksi?')).toBeInTheDocument()
  })

  it('urutan bab bisa dibalik', async () => {
    renderStory()

    const sort = await screen.findByRole('button', { name: 'Bab pertama dulu' })
    await userEvent.click(sort)

    expect(await screen.findByRole('button', { name: 'Bab terbaru dulu' })).toBeInTheDocument()
  })
})

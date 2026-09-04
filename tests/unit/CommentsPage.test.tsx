import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { ToastProvider } from '@/components/ui/Toast'
import CommentsPage from '@/features/story/pages/CommentsPage'

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/cerita/:storyId/bab/:chapterId/komentar" element={<CommentsPage />} />
            <Route path="/cerita/:storyId/bab/:chapterId" element={<p>bab</p>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const OPEN = '/cerita/s1/bab/s1-c5/komentar'

async function lockedPath() {
  const owned = new Set((await db.ownerships.toArray()).map((o) => o.chapterId))
  const rows = await db.chapters.where('storyId').equals('s1').toArray()
  const locked = rows.find((c) => c.access !== 'free' && !owned.has(c.id))
  if (!locked) throw new Error('butuh bab terkunci')
  return `/cerita/s1/bab/${locked.id}/komentar`
}

beforeEach(async () => {
  for (const row of await db.comments.toArray()) {
    if (row.id.startsWith('cm-')) await db.comments.delete(row.id)
  }
  for (const row of await db.reactions.toArray()) {
    if (row.userId === CURRENT_USER_ID) await db.reactions.delete(row.id)
  }
})

describe('bab terkunci · FR-SOCIAL-05', () => {
  it('menolak seluruh halaman dengan penjelasan dan jalan keluarnya', async () => {
    renderAt(await lockedPath())

    expect(await screen.findByText('Babnya belum terbuka')).toBeInTheDocument()
    expect(screen.getByText(/memuat isi bab/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Buka bab ini' })).toBeInTheDocument()
    // Kolom tulis tidak ikut dirender — bukan sekadar dimatikan.
    expect(screen.queryByPlaceholderText(/Bagikan pendapatmu/)).not.toBeInTheDocument()
  })
})

describe('utas komentar · FR-SOCIAL-05 · FR-SOCIAL-06', () => {
  it('lencana Penulis tampil pada komentar penulis cerita', async () => {
    renderAt(OPEN)
    expect((await screen.findAllByText('Penulis')).length).toBeGreaterThan(0)
  })

  /** Komentar spoiler datang dari seed — dua di antaranya, jadi `.first()`. */
  it('spoiler tertutup sampai diketuk, dan isinya tidak dibacakan pembaca layar', async () => {
    const user = userEvent.setup()
    renderAt(OPEN)
    await screen.findByText(/komentar di bab ini/)

    const veils = screen.getAllByRole('button', { name: /Spoiler —/ })
    const isi = screen.getByText(/sudah tahu isi kontrak keduanya/)
    // Isinya `aria-hidden` selama tertutup.
    expect(isi.closest('[aria-hidden="true"]')).not.toBeNull()

    await user.click(veils[0] as HTMLElement)
    expect(
      screen.getByText(/sudah tahu isi kontrak keduanya/).closest('[aria-hidden="true"]'),
    ).toBeNull()
    // Tirai yang dibuka hilang dari daftar tirai tertutup; sisanya tetap
    // tertutup. `queryAllByRole` — `getAllByRole` melempar saat hasilnya nol.
    expect(screen.queryAllByRole('button', { name: /Spoiler —/ })).toHaveLength(veils.length - 1)
  })

  it('komentar sedang ditinjau tetap punya barisnya, isinya diganti keterangan', async () => {
    renderAt(OPEN)

    expect(
      (await screen.findAllByText(/sedang ditinjau setelah dilaporkan/)).length,
    ).toBeGreaterThan(0)
    // Isinya tidak bocor lewat DOM …
    expect(screen.queryByText('Komentar ini sedang ditinjau moderator.')).not.toBeInTheDocument()
    // … tetapi namanya tetap ada: barisnya tidak hilang diam-diam.
    expect(screen.getByText('Yoga Saputra')).toBeInTheDocument()
  })
})

describe('menulis & membalas · FR-SOCIAL-05', () => {
  it('tombol kirim tertahan selama kolomnya kosong', async () => {
    renderAt(OPEN)
    await screen.findByText(/komentar di bab ini/)

    expect(screen.getByRole('button', { name: 'Kirim' })).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText(/Bagikan pendapatmu/), {
      target: { value: 'Bab ini bagus sekali.' },
    })
    expect(screen.getByRole('button', { name: 'Kirim' })).toBeEnabled()
  })

  it('membalas menampilkan sasarannya, dan bisa dibatalkan', async () => {
    const user = userEvent.setup()
    renderAt(OPEN)
    await screen.findByText(/komentar di bab ini/)

    await user.click((await screen.findAllByRole('button', { name: 'Balas' }))[0] as HTMLElement)
    expect(await screen.findByText(/^Membalas /)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Batal membalas' }))
    expect(screen.queryByText(/^Membalas /)).not.toBeInTheDocument()
  })

  it('komentar terkirim muncul di utas', async () => {
    const user = userEvent.setup()
    renderAt(OPEN)
    await screen.findByText(/komentar di bab ini/)

    fireEvent.change(screen.getByPlaceholderText(/Bagikan pendapatmu/), {
      target: { value: 'Paragraf terakhirnya membuat saya membaca ulang bab sepuluh.' },
    })
    await user.click(screen.getByRole('button', { name: 'Kirim' }))

    expect(await screen.findByText(/membuat saya membaca ulang/)).toBeInTheDocument()
  })

  it('suka komentar menaikkan penghitungnya', async () => {
    const user = userEvent.setup()
    renderAt(OPEN)
    await screen.findByText(/komentar di bab ini/)

    const button = (await screen.findAllByRole('button', { name: /^Suka \(\d+\)$/ }))[0]
    if (!button) throw new Error('butuh satu komentar')
    const before = Number(button.textContent?.match(/\((\d+)\)/)?.[1])

    await user.click(button)
    expect(
      await screen.findByRole('button', { name: `Suka (${(before ?? 0) + 1})` }),
    ).toBeInTheDocument()
  })
})

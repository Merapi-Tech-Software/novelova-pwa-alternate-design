import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { ToastProvider } from '@/components/ui/Toast'
import ReviewsPage from '@/features/story/pages/ReviewsPage'

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/cerita/:storyId/ulasan" element={<ReviewsPage />} />
            <Route path="/cerita/:storyId" element={<p>detail</p>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

async function markAsRead() {
  await db.progress.put({
    scrollByChapter: {},
    finishedAt: {},
    id: `${CURRENT_USER_ID}-s1`,
    userId: CURRENT_USER_ID,
    storyId: 's1',
    lastChapterId: 's1-c1',
    scrollPct: 40,
    finishedChapterIds: ['s1-c1'],
    updatedAt: new Date().toISOString(),
  })
}

beforeEach(async () => {
  for (const row of await db.reviews.toArray()) {
    if (row.userId === CURRENT_USER_ID) await db.reviews.delete(row.id)
  }
  await db.ratings.delete(`${CURRENT_USER_ID}-s1`)
  await db.progress.delete(`${CURRENT_USER_ID}-s1`)
  for (const row of await db.reactions.toArray()) {
    if (row.userId === CURRENT_USER_ID) await db.reactions.delete(row.id)
  }
  localStorage.removeItem('novelova:review-draft-s1')
})

describe('ringkasan & saringan · FR-SOCIAL-03', () => {
  it('rata-rata, jumlah penilai, dan sebaran lima baris tampil', async () => {
    renderAt('/cerita/s1/ulasan')

    expect(await screen.findByText(/dari \d+ penilai/)).toBeInTheDocument()
    const histogram = screen.getByRole('list', { name: 'Sebaran bintang' })
    expect(within(histogram).getAllByRole('listitem')).toHaveLength(5)
    // Tiap baris terbaca pembaca layar sebagai kalimat, bukan angka telanjang.
    expect(within(histogram).getByText(/5 bintang · \d+ penilai/)).toBeInTheDocument()
  })

  /**
   * Diuji dari **aturannya**, bukan dari selisih jumlah: berapa banyak rating
   * tanpa teks yang tersisa di seed bergantung pada test lain yang berbagi
   * basis data, dan test yang membandingkan angka akan lulus atau gagal karena
   * urutan berkas.
   */
  it('saring "ada teksnya" hanya menyisakan ulasan yang benar-benar ada teksnya', async () => {
    const user = userEvent.setup()
    renderAt('/cerita/s1/ulasan')
    await screen.findByText(/dari \d+ penilai/)

    await user.click(screen.getByRole('tab', { name: 'Ada teksnya' }))
    await screen.findByText(/^\d+ ulasan$/)

    const page = await api.listReviews('s1', {
      page: 1,
      pageSize: 20,
      stars: null,
      withText: true,
      tag: null,
      sort: 'helpful',
    })
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((r) => r.text.trim() !== '')).toBe(true)
  })

  it('saringan yang tidak menghasilkan apa pun menjelaskan dirinya, bukan diam', async () => {
    const user = userEvent.setup()
    renderAt('/cerita/s1/ulasan')
    await screen.findByText(/dari \d+ penilai/)

    await user.click(screen.getByRole('tab', { name: '1★' }))
    expect(await screen.findByText(/Tidak ada ulasan yang cocok/)).toBeInTheDocument()
  })
})

describe('kartu ulasan · FR-SOCIAL-03 · FR-SOCIAL-04', () => {
  it('tanggapan penulis berlencana', async () => {
    renderAt('/cerita/s1/ulasan')
    await screen.findByText(/dari \d+ penilai/)

    expect(screen.getAllByText('Penulis').length).toBeGreaterThan(0)
  })

  /**
   * Diuji dari **perilakunya**, bukan dari seed: ulasan bertanda "disunting" di
   * seed kebetulan milik pengguna contoh, dan `beforeEach` menghapusnya untuk
   * menguji alur "belum menilai". Test yang bersandar pada baris seed tertentu
   * akan patah setiap kali seed-nya disesuaikan.
   */
  it('menyunting ulasan memunculkan penanda "disunting"', async () => {
    await markAsRead()
    await api.submitReview({
      storyId: 's1',
      stars: 4,
      text: 'Paruh pertamanya lambat, tetapi bab dua puluh membuat semuanya masuk akal.',
      tags: [],
      spoiler: false,
    })
    await api.submitReview({
      storyId: 's1',
      stars: 5,
      text: 'Setelah membaca ulang saya naikkan penilaian saya — bagian tengahnya justru terkuat.',
      tags: [],
      spoiler: false,
    })

    renderAt('/cerita/s1/ulasan')
    expect(await screen.findByText(/disunting/)).toBeInTheDocument()
  })

  it('"Membantu" menaikkan penghitungnya', async () => {
    const user = userEvent.setup()
    renderAt('/cerita/s1/ulasan')
    await screen.findByText(/dari \d+ penilai/)

    const button = screen.getAllByRole('button', { name: /^Membantu \(\d+\)$/ })[0]
    if (!button) throw new Error('butuh satu ulasan orang lain')
    const before = Number(button.textContent?.match(/\((\d+)\)/)?.[1])

    await user.click(button)
    expect(
      await screen.findByRole('button', { name: `Membantu (${(before ?? 0) + 1})` }),
    ).toBeInTheDocument()
  })
})

describe('beri rating & tulis ulasan · FR-SOCIAL-01 · FR-SOCIAL-02', () => {
  it('belum membaca satu bab pun → ajakan membaca, bukan penolakan diam-diam', async () => {
    const user = userEvent.setup()
    renderAt('/cerita/s1/ulasan')
    await screen.findByText(/dari \d+ penilai/)

    await user.click(screen.getByRole('button', { name: 'Beri rating' }))
    const sheet = await screen.findByRole('dialog')
    // Bintang masukan adalah `<input type="radio">` sungguhan, bukan tombol —
    // navigasi panah dan pengelompokan `name` datang gratis dari peramban.
    await user.click(within(sheet).getByRole('radio', { name: '4 dari 5 bintang' }))

    expect(await screen.findByText(/Baca dulu minimal satu bab/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mulai baca' })).toBeInTheDocument()
  })

  it('memberi bintang saja sudah sah — ulasan ditawarkan, bukan diwajibkan', async () => {
    const user = userEvent.setup()
    await markAsRead()
    renderAt('/cerita/s1/ulasan')
    await screen.findByText(/dari \d+ penilai/)

    await user.click(screen.getByRole('button', { name: 'Beri rating' }))
    const sheet = await screen.findByRole('dialog')
    await user.click(within(sheet).getByRole('radio', { name: '5 dari 5 bintang' }))

    expect(await screen.findByText(/Bintangnya sudah tersimpan/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nanti saja' })).toBeInTheDocument()
    expect((await api.getMyRating('s1'))?.stars).toBe(5)
  })

  it('draf ulasan yang belum terkirim dipulihkan saat lembar dibuka lagi', async () => {
    const user = userEvent.setup()
    await markAsRead()
    localStorage.setItem(
      'novelova:review-draft-s1',
      'Kalimat yang belum sempat saya kirim kemarin.',
    )

    renderAt('/cerita/s1/ulasan')
    await screen.findByText(/dari \d+ penilai/)
    await user.click(screen.getByRole('button', { name: 'Beri rating' }))

    expect(await screen.findByDisplayValue(/belum sempat saya kirim/)).toBeInTheDocument()
  })

  it('ulasan terlalu pendek menahan tombol kirim, bukan menolak setelah ditekan', async () => {
    const user = userEvent.setup()
    await markAsRead()
    await api.rateStory('s1', 4)

    renderAt('/cerita/s1/ulasan')
    await screen.findByText(/dari \d+ penilai/)
    await user.click(
      screen.getAllByRole('button', { name: /Beri rating|Sunting/ })[0] as HTMLElement,
    )

    const sheet = await screen.findByRole('dialog')
    await user.click(within(sheet).getByRole('button', { name: 'Tulis ulasan' }))
    fireEvent.change(await screen.findByLabelText('Tulis ulasanmu'), {
      target: { value: 'pendek' },
    })

    expect(screen.getByRole('button', { name: 'Kirim ulasan' })).toBeDisabled()
  })
})

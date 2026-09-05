import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { Story } from '@/api/contracts'
import { Cover } from '@/components/patterns/Cover'
import { StoryCard } from '@/components/patterns/StoryCard'

const STORY = {
  id: 's1',
  title: 'Cinta di Balik Kontrak',
  synopsis: 'Satu kalimat.',
  coverUrl: 'https://contoh.invalid/sampul.webp',
  bannerUrl: null,
  authorId: 'a1',
  penName: 'Anna Maharani',
  genres: ['Romance'],
  kind: 'fiksi',
  tags: [],
  audience: 'Remaja',
  language: 'Indonesia',
  status: 'ongoing',
  review: 'published',
  rejectReason: null,
  visibility: 'public',
  monetizeType: 'partial',
  fullAccessCoins: 300,
  badge: null,
  updatedAt: '2026-08-24',
  commentsEnabled: true,
  moderateComments: false,
  allowTranslation: false,
  allowFanfiction: false,
  contentLabels: [],
  dedication: '',
  authorNote: '',
  publishAt: null,
  stats: { reads: 1000, saves: 10, rating: 4.8, ratingCount: 4, chapterCount: 3, weeklyReads: 0 },
} as unknown as Story

describe('sampul gagal dimuat · §1.22', () => {
  it('jatuh ke jaket satu huruf, bukan ikon gambar rusak', () => {
    const { container } = render(<Cover src="https://contoh.invalid/x.webp" title="Velvet Alibi" />)

    const img = container.querySelector('img')
    expect(img).not.toBeNull()

    // Sampulnya URL jarak jauh; CDN mati atau perangkat offline mendarat di sini.
    fireEvent.error(img as HTMLImageElement)

    expect(container.querySelector('img')).toBeNull()
    // Huruf pertama judulnya, mekanisme yang sudah dipakai cerita tanpa artwork.
    expect(container.textContent).toContain('V')
  })
})

describe('lingkup zoom sampul · §1.22', () => {
  it('tanpa onCoverClick sampulnya tetap bagian dari tautan — /jelajah, /pustaka, /cari', () => {
    render(
      <MemoryRouter>
        <StoryCard story={STORY} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('button', { name: /Perbesar sampul/ })).not.toBeInTheDocument()
    // Satu tautan untuk seluruh kartunya, seperti sebelum §1.22.
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('dengan onCoverClick sampulnya jadi tombol sendiri dan judulnya tetap tautan', () => {
    render(
      <MemoryRouter>
        <StoryCard story={STORY} onCoverClick={() => {}} />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('button', { name: `Perbesar sampul ${STORY.title}` }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link').getAttribute('href')).toBe('/cerita/s1')
  })
})

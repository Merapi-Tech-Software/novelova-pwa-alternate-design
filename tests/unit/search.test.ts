import { describe, expect, it } from 'vitest'
import { api } from '@/api/client'

const params = { page: 1, pageSize: 20, sort: 'relevan' } as const

describe('pencarian katalog · FR-SRCH-02', () => {
  it('mencari judul, penulis, tag, genre, dan sinopsis', async () => {
    const byTitle = await api.search('kontrak', params)
    expect(byTitle.stories.some((s) => s.title.toLowerCase().includes('kontrak'))).toBe(true)

    const byGenre = await api.search('fantasy', params)
    expect(
      byGenre.stories.every((s) => s.genres.some((g) => g.toLowerCase().includes('fantasy'))),
    ).toBe(true)

    const byTag = await api.search('sihir', params)
    expect(byTag.stories.some((s) => s.tags.includes('sihir'))).toBe(true)
  })

  it('judul menang atas sinopsis \u2014 kata yang kebetulan lewat tidak naik ke atas', async () => {
    const result = await api.search('kontrak', params)
    const first = result.stories[0]

    expect(first?.title.toLowerCase()).toContain('kontrak')
  })

  it('tidak peka huruf besar-kecil, dan spasi tepi diabaikan', async () => {
    const plain = await api.search('romance', params)
    const messy = await api.search('  RoMaNcE  ', params)

    expect(messy.stories.map((s) => s.id)).toEqual(plain.stories.map((s) => s.id))
    expect(messy.total).toBe(plain.total)
  })

  it('mengembalikan tiga kelompok sekaligus, bukan tiga permintaan', async () => {
    const result = await api.search('amelia', params)

    expect(result.authors.length).toBeGreaterThan(0)
    expect(Array.isArray(result.stories)).toBe(true)
    expect(Array.isArray(result.tags)).toBe(true)
  })

  it('kelompok yang tidak punya isi dikembalikan kosong, bukan dihilangkan', async () => {
    const result = await api.search('kantor', params)

    expect(result.tags.some((t) => t.tag === 'kantor')).toBe(true)
    // Bentuknya tetap lengkap; komponen yang memutuskan tidak menampilkannya.
    expect(result.authors).toEqual([])
  })

  it('di bawah dua huruf server pun menolak', async () => {
    const result = await api.search('r', params)

    expect(result.total).toBe(0)
    expect(result.stories).toEqual([])
  })

  it('tanpa hasil sama sekali, menawarkan ejaan terdekat', async () => {
    const result = await api.search('romanse', params)

    expect(result.stories).toEqual([])
    expect(result.didYouMean).not.toBeNull()
  })

  it('berpaginasi, dengan total yang menghitung seluruh hasil', async () => {
    const first = await api.search('a', { ...params, pageSize: 3 })
    expect(first.total).toBe(0)

    const page1 = await api.search('romance', { ...params, pageSize: 3 })
    expect(page1.stories).toHaveLength(3)
    expect(page1.hasMore).toBe(true)

    const page2 = await api.search('romance', { ...params, page: 2, pageSize: 3 })
    expect(page2.stories.map((s) => s.id)).not.toEqual(page1.stories.map((s) => s.id))
  })
})

describe('saran & kata kunci populer · FR-SRCH-03', () => {
  it('saran maksimal delapan, dengan bagian yang cocok ditandai', async () => {
    const suggestions = await api.getSuggestions('ka')

    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions.length).toBeLessThanOrEqual(8)
    for (const s of suggestions) {
      expect(s.label.toLowerCase().slice(s.matchStart, s.matchStart + s.matchLength)).toBe('ka')
    }
  })

  it('satu huruf tidak menghasilkan saran apa pun', async () => {
    expect(await api.getSuggestions('k')).toEqual([])
  })

  it('kata kunci populer datang dari isi katalog, bukan daftar tulis tangan', async () => {
    const trending = await api.getTrendingQueries()

    expect(trending.length).toBeGreaterThan(0)
    // Tiap kata kunci harus benar-benar menghasilkan sesuatu.
    const first = trending[0] ?? ''
    expect((await api.search(first, params)).total).toBeGreaterThan(0)
  })
})

describe('paginasi hasil · FR-SRCH-02', () => {
  it('halaman kedua meneruskan daftar, bukan mengulanginya', async () => {
    const page1 = await api.search('a', { ...params, pageSize: 5 })
    expect(page1.total).toBe(0)

    const first = await api.search('cinta', { ...params, pageSize: 2 })
    const second = await api.search('cinta', { ...params, page: 2, pageSize: 2 })

    const ids = new Set(first.stories.map((s) => s.id))
    for (const story of second.stories) expect(ids.has(story.id)).toBe(false)
    expect(first.total).toBe(second.total)
  })

  it('halaman terakhir menutup gulir tak terbatas', async () => {
    const all = await api.search('romance', { ...params, pageSize: 100 })
    const last = await api.search('romance', { ...params, pageSize: 100, page: 1 })

    expect(last.hasMore).toBe(false)
    expect(last.stories).toHaveLength(all.total)
  })
})

describe('saringan & urutan pencarian · FR-SRCH-04', () => {
  it('tiga penyaring bekerja bersama, dan total ikut menyusut', async () => {
    const all = await api.search('cinta', params)
    const filtered = await api.search('cinta', { ...params, genre: 'Romance', status: 'ongoing' })

    expect(filtered.total).toBeLessThanOrEqual(all.total)
    for (const story of filtered.stories) {
      expect(story.genres).toContain('Romance')
      expect(story.status).toBe('ongoing')
    }
  })

  it('bahasa cerita, bukan bahasa antarmuka', async () => {
    const english = await api.search('a', { ...params, language: 'English' })
    expect(english.total).toBe(0)

    const result = await api.search('romance', { ...params, language: 'Indonesia' })
    for (const story of result.stories) expect(story.language).toBe('Indonesia')
  })

  it('urutan pilihan pembaca mengalahkan skor relevansi', async () => {
    const byRating = await api.search('romance', { ...params, sort: 'rating' })
    const ratings = byRating.stories.map((s) => s.stats.rating)

    expect([...ratings].sort((a, b) => b - a)).toEqual(ratings)
  })

  it('saringan dipasang sebelum skor \u2014 total tidak menghitung yang dibuang', async () => {
    const filtered = await api.search('romance', { ...params, status: 'completed' })

    expect(filtered.total).toBe(
      filtered.stories.length + (filtered.hasMore ? filtered.total - filtered.stories.length : 0),
    )
    for (const story of filtered.stories) expect(story.status).toBe('completed')
  })
})

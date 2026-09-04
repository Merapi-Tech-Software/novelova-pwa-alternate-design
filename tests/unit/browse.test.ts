import { describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'

describe('lihat semua · FR-HOME-10', () => {
  it('berpaginasi, dengan total yang menghitung seluruh hasil', async () => {
    const first = await api.getSection('populer', { page: 1, pageSize: 5 })

    expect(first.items).toHaveLength(5)
    // Penghitung "40 cerita" harus jujur walau yang tampil baru lima.
    expect(first.total).toBeGreaterThan(first.items.length)
    expect(first.hasMore).toBe(true)

    const second = await api.getSection('populer', { page: 2, pageSize: 5 })
    expect(second.items.map((s) => s.id)).not.toEqual(first.items.map((s) => s.id))
  })

  it('memakai urutan yang sama dengan section beranda', async () => {
    const feed = await api.getHomeFeed()
    const onHome = feed.sections.find((s) => s.id === 'populer')?.stories ?? []
    const onPage = await api.getSection('populer', { page: 1, pageSize: 20 })

    // Halaman lihat-semua yang urutannya berbeda dari section yang baru saja
    // diketuk terbaca sebagai kesalahan, bukan sebagai halaman lain.
    expect(onPage.items.map((s) => s.id)).toEqual(onHome.map((s) => s.id))
  })

  it('section tematik punya halaman lihat-semuanya sendiri', async () => {
    const page = await api.getSection('romance-kantor', { page: 1, pageSize: 40, tab: 'Romance' })

    expect(page.items.length).toBeGreaterThan(0)
    for (const story of page.items) {
      expect(story.tags).toContain('kantor')
      expect(story.genres).toContain('Romance')
    }
  })

  it('Paling Banyak Dibuka hanya berisi cerita yang babnya pernah dibuka', async () => {
    const page = await api.getSection('terbuka', { page: 1, pageSize: 40 })

    expect(page.items.length).toBeGreaterThan(0)
    for (const story of page.items) expect(story.stats.unlockCount).toBeGreaterThan(0)
  })

  it('tab dari beranda ikut menyaring halaman lihat-semua', async () => {
    const all = await api.getSection('populer', { page: 1, pageSize: 40 })
    const drama = await api.getSection('populer', { page: 1, pageSize: 40, tab: 'Drama' })

    expect(drama.total).toBeLessThan(all.total)
    for (const story of drama.items) expect(story.genres).toContain('Drama')
  })

  it('urutan dapat diganti pembaca tanpa mengubah isinya', async () => {
    const byRating = await api.getSection('populer', { page: 1, pageSize: 40, sort: 'rating' })
    const byReads = await api.getSection('populer', { page: 1, pageSize: 40 })

    expect(byRating.total).toBe(byReads.total)
    const ratings = byRating.items.map((s) => s.stats.rating)
    expect([...ratings].sort((a, b) => b - a)).toEqual(ratings)
  })
})

describe('section beranda menampilkan 20 cerita', () => {
  it('cukup untuk mengisi baris di layar lebar', async () => {
    const feed = await api.getHomeFeed()
    const populer = feed.sections.find((s) => s.id === 'populer')

    expect(populer?.stories).toHaveLength(20)
  })
})

describe('kontrol lihat-semua · FR-HOME-11 · FR-HOME-14', () => {
  it('chip periode benar-benar menyaring menurut tanggal perbarui', async () => {
    const semua = await api.getSection('populer', { page: 1, pageSize: 40, chip: 'semua' })
    const minggu = await api.getSection('populer', { page: 1, pageSize: 40, chip: 'minggu' })

    expect(minggu.total).toBeLessThan(semua.total)
    for (const story of minggu.items) {
      expect(Date.now() - Date.parse(story.updatedAt)).toBeLessThanOrEqual(7 * 86_400_000)
    }
  })

  it('dua penyaring bekerja bersama, bukan saling menimpa', async () => {
    const page = await api.getSection('populer', {
      page: 1,
      pageSize: 40,
      tab: 'Romance',
      status: 'completed',
    })

    for (const story of page.items) {
      expect(story.genres).toContain('Romance')
      expect(story.status).toBe('completed')
    }
  })

  it('kombinasi yang tidak menghasilkan apa pun mengembalikan daftar kosong, bukan gagal', async () => {
    const page = await api.getSection('populer', {
      page: 1,
      pageSize: 40,
      tab: 'Horror',
      status: 'completed',
      chip: 'hari',
    })

    expect(page.items).toEqual([])
    expect(page.total).toBe(0)
  })

  it('"Pertumbuhan tercepat" memakai angka, bukan kalimat', async () => {
    const page = await api.getSection('terbaru', { page: 1, pageSize: 20, sort: 'growth' })
    const growth = page.items.map((s) => s.stats.weeklyReads)

    expect([...growth].sort((a, b) => b - a)).toEqual(growth)
  })
})

describe('sembunyikan cerita · FR-HOME-14', () => {
  it('yang disembunyikan hilang dari beranda dan dari lihat-semua', async () => {
    const before = await api.getSection('populer', { page: 1, pageSize: 40 })
    const victim = before.items[0]
    if (!victim) throw new Error('daftar contoh kosong')

    await api.hideStory(victim.id)

    const after = await api.getSection('populer', { page: 1, pageSize: 40 })
    expect(after.items.map((s) => s.id)).not.toContain(victim.id)

    const feed = await api.getHomeFeed()
    expect(feed.sections.flatMap((s) => s.stories.map((x) => x.id))).not.toContain(victim.id)

    // Bersihkan supaya test lain tidak ikut kehilangan cerita itu.
    const prefs = await api.getReaderPrefs()
    await db.readerPrefs.put({ ...prefs, hiddenStoryIds: [] })
  })
})

describe('simpan ke perpustakaan dari daftar · FR-DETAIL-13', () => {
  it('cerita yang baru disimpan muncul di daftar perpustakaan', async () => {
    const page = await api.getSection('terbuka', { page: 1, pageSize: 5 })
    const story = page.items[0]
    if (!story) throw new Error('daftar contoh kosong')

    const before = await api.listLibrary({ page: 1, pageSize: 200 })
    const wasSaved = before.items.some((s) => s.id === story.id)

    await api.toggleLibrary(story.id)
    const after = await api.listLibrary({ page: 1, pageSize: 200 })

    expect(after.items.some((s) => s.id === story.id)).toBe(!wasSaved)
  })
})

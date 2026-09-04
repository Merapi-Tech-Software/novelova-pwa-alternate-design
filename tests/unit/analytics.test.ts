import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import type { AnalyticsParams } from '@/api/contracts'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { todayLocalISO } from '@/lib/date'

const P = (over: Partial<AnalyticsParams> = {}): AnalyticsParams => ({
  range: '7h',
  from: null,
  to: null,
  chapterSort: 'views',
  ...over,
})

beforeEach(async () => {
  await db.authorProfiles.put({
    userId: CURRENT_USER_ID,
    tier: 'verified',
    payoutVerified: true,
    twoFactor: true,
    termsAcceptedAt: new Date().toISOString(),
  })
  await db.stories.update('ms1', { review: 'published', status: 'ongoing' })
})

describe('rentang waktu · FR-STUDIO-27', () => {
  it('rentang menyaring di server — 30 hari bukan label baru di atas angka yang sama', async () => {
    const week = await api.getStoryAnalytics('ms1', P())
    const month = await api.getStoryAnalytics('ms1', P({ range: '30h' }))

    expect(week.series).toHaveLength(7)
    expect(month.series).toHaveLength(30)
    expect(month.rangeLabel).toBe('30 hari terakhir')
    // Views sebulan harus lebih besar daripada seminggu; kalau sama, saringannya
    // tidak benar-benar berjalan.
    const viewsOf = (r: typeof week) => r.metrics.find((m) => m.key === 'views')?.value ?? 0
    expect(viewsOf(month)).toBeGreaterThan(viewsOf(week))
  })

  it('rentang custom dijepit maksimum hari ini', async () => {
    const future = new Date()
    future.setDate(future.getDate() + 30)

    const report = await api.getStoryAnalytics(
      'ms1',
      P({ range: 'custom', from: todayLocalISO(), to: todayLocalISO(future) }),
    )

    expect(report.to).toBe(todayLocalISO())
    expect(report.series).toHaveLength(1)
  })

  it('angkanya stabil antar pembacaan — dua permintaan sama memberi hasil sama', async () => {
    const a = await api.getStoryAnalytics('ms1', P())
    const b = await api.getStoryAnalytics('ms1', P())
    expect(b.series).toEqual(a.series)
  })

  it('empat kartu metrik, masing-masing menunjuk bagian tujuannya', async () => {
    const report = await api.getStoryAnalytics('ms1', P())
    expect(report.metrics.map((m) => m.key)).toEqual(['views', 'readers', 'comments', 'revenue'])
    expect(report.metrics.map((m) => m.target)).toEqual(['tren', 'tren', 'sentimen', 'pendapatan'])
  })

  it('analitik cerita orang lain ditolak', async () => {
    await expect(api.getStoryAnalytics('s1', P())).rejects.toThrow(/bukan milikmu/i)
  })
})

describe('performa per bab · FR-STUDIO-29', () => {
  it('kelima urutan benar-benar diurutkan servernya, bukan kontrol yang mati', async () => {
    // Diperiksa per kunci, bukan dengan membandingkan dua urutan: pada cerita
    // dengan sedikit bab, dua urutan yang berbeda aturannya bisa kebetulan
    // menghasilkan susunan yang sama — dan test itu akan lulus tanpa
    // membuktikan apa pun.
    const cases = [
      ['views', (c: { views: number }) => c.views],
      ['comments', (c: { comments: number }) => c.comments],
      ['purchases', (c: { purchases: number }) => c.purchases],
      ['rating', (c: { rating: number }) => c.rating],
      ['newest', (c: { number: number }) => c.number],
    ] as const

    for (const [sort, key] of cases) {
      const report = await api.getStoryAnalytics('ms1', P({ chapterSort: sort }))
      expect(report.chapters.length).toBeGreaterThan(1)
      const values = report.chapters.map(key)
      expect(values, sort).toEqual([...values].sort((a, b) => b - a))
    }
  })

  it('bab yang kehilangan pembaca dapat lencana Drop, dan lencananya menang atas harga', async () => {
    const published = (await db.chapters.where('storyId').equals('ms1').toArray())
      .filter((c) => c.state === 'published')
      .sort((a, b) => a.number - b.number)
    const [first, second] = published
    if (!first || !second) throw new Error('butuh dua bab terbit')

    await db.chapters.update(first.id, { views: 1000 })
    await db.chapters.update(second.id, { views: 100, access: 'paid', priceCoins: 5 })

    const report = await api.getStoryAnalytics('ms1', P())
    const row = report.chapters.find((c) => c.chapterId === second.id)
    expect(row?.badge).toBe('drop')
    expect(row?.note).toMatch(/retensi menurun/i)

    await db.chapters.update(first.id, { views: first.views })
    await db.chapters.update(second.id, {
      views: second.views,
      access: second.access,
      priceCoins: second.priceCoins,
    })
  })

  it('skor relatif: bab terbaik selalu 100, sisanya di bawahnya', async () => {
    const report = await api.getStoryAnalytics('ms1', P())
    const scores = report.chapters.map((c) => c.score)
    expect(Math.max(...scores)).toBe(100)
    expect(Math.min(...scores)).toBeGreaterThanOrEqual(0)
  })
})

describe('bagian pendukung · FR-STUDIO-30 · FR-STUDIO-37', () => {
  it('kalender publish diturunkan dari tanggal terbit bab, bukan daftar tulisan tangan', async () => {
    const report = await api.getStoryAnalytics('ms1', P())
    const month = todayLocalISO().slice(0, 7)
    for (const day of report.publishDays) expect(day.startsWith(month)).toBe(true)
  })

  it('sentimen diturunkan dari bintang ulasan nyata, dan ketiganya berjumlah 100', async () => {
    // `s1` punya ulasan seed dengan sebaran bintang; `ms1` belum tentu.
    const report = await api.getStoryAnalytics('ms1', P())
    const { positive, neutral, negative, total } = report.sentiment

    // Tanpa ulasan sama sekali, ketiganya nol — bukan angka karangan.
    if (positive + neutral + negative !== 0) {
      expect(positive + neutral + negative).toBe(100)
    }
    expect(total).toBe(report.metrics.find((m) => m.key === 'comments')?.value)
  })

  it('rekomendasi waktu terbit membawa slot yang belum lewat', async () => {
    const report = await api.getStoryAnalytics('ms1', P())
    expect(report.bestTime.label).toMatch(/^\w+ 20\.00$/)
    expect(report.bestTime.date > todayLocalISO()).toBe(true)
    expect(report.bestTime.time).toBe('20:00')
  })

  it('entri celah pada jadwal terpadu ikut menyebut waktu terbaiknya', async () => {
    await db.scheduleEntries.clear()
    await db.stories.update('ms1', { review: 'published', status: 'ongoing' })

    const gap = (await api.listSchedule()).find((e) => e.kind === 'gap' && e.storyId === 'ms1')
    expect(gap?.note).toMatch(/waktu terbaik menurut analitikmu/i)
  })
})

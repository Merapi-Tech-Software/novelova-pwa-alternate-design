import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { isApiError } from '@/api/errors'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'

const OPEN = 's1-c5'

const P = { page: 1, pageSize: 20, sort: 'newest' } as const

beforeEach(async () => {
  await db.reports.clear()
  await db.blocks.clear()
  for (const row of await db.comments.toArray()) {
    if (row.id.startsWith('cm-')) await db.comments.delete(row.id)
    else if (row.underReview && row.id !== 'c4') {
      await db.comments.update(row.id, { underReview: false })
    }
  }
  for (const row of await db.reviews.toArray()) {
    if (row.userId === CURRENT_USER_ID) await db.reviews.delete(row.id)
  }
  await db.ratings.delete(`${CURRENT_USER_ID}-s1`)
  await db.progress.put({
    id: `${CURRENT_USER_ID}-s1`,
    userId: CURRENT_USER_ID,
    storyId: 's1',
    lastChapterId: 's1-c1',
    scrollPct: 40,
    finishedChapterIds: ['s1-c1'],
    updatedAt: new Date().toISOString(),
  })
})

describe('laporkan · FR-SOCIAL-07', () => {
  it('satu laporan per pasangan; yang kedua ditolak dan mengatakan sudah masuk', async () => {
    const target = (await api.listComments(OPEN, P)).items[0]
    if (!target) throw new Error('butuh satu komentar')

    await api.report({ targetType: 'comment', targetId: target.id, reason: 'spam', note: '' })
    expect(await api.hasReported('comment', target.id)).toBe(true)

    const error = await api
      .report({ targetType: 'comment', targetId: target.id, reason: 'spam', note: '' })
      .catch((e: unknown) => e)
    // Bukan diterima diam-diam: pelapor tahu laporan pertamanya tidak hilang.
    expect(isApiError(error) && error.message).toMatch(/sudah masuk/)
  })

  it('konten dilaporkan **tetap tampil** sampai melewati ambang', async () => {
    const target = (await api.listComments(OPEN, P)).items[0]
    if (!target) throw new Error('butuh satu komentar')

    await api.report({ targetType: 'comment', targetId: target.id, reason: 'spam', note: '' })
    const after = (await api.listComments(OPEN, P)).items.find((c) => c.id === target.id)
    // Satu laporan tidak boleh membungkam siapa pun.
    expect(after?.underReview).toBe(false)
  })

  it('ambang tercapai → disembunyikan sambil menunggu tinjauan, bukan dihapus', async () => {
    const target = (await api.listComments(OPEN, P)).items[0]
    if (!target) throw new Error('butuh satu komentar')

    // Dua laporan dari orang lain, satu dari pengguna ini → tiga.
    for (const reporter of ['f1', 'f2']) {
      await db.reports.put({
        id: `rp-${reporter}-${target.id}`,
        reporterId: reporter,
        targetType: 'comment',
        targetId: target.id,
        reason: 'spam',
        note: '',
        status: 'open',
        createdAt: new Date().toISOString(),
      })
    }
    await api.report({ targetType: 'comment', targetId: target.id, reason: 'spam', note: '' })

    const after = (await api.listComments(OPEN, P)).items.find((c) => c.id === target.id)
    expect(after?.underReview).toBe(true)
    // Barisnya tetap ada — disembunyikan, bukan dihapus.
    expect(after).toBeDefined()
  })

  it('laporan atas cerita penulis masuk ke antrean tinjauan yang sama', async () => {
    await db.authorProfiles.put({
      userId: CURRENT_USER_ID,
      tier: 'verified',
      payoutVerified: true,
      twoFactor: true,
      termsAcceptedAt: new Date().toISOString(),
    })
    await api.report({
      targetType: 'story',
      targetId: 'ms1',
      reason: 'plagiat',
      note: 'Mirip cerita lain.',
    })

    const queue = await api.listReviewQueue()
    const row = queue.find((item) => item.kind === 'report')
    expect(row?.refId).toBe('ms1')
    expect(row?.context).toBe('Mirip cerita lain.')
  })

  it('"Lainnya" tanpa keterangan ditolak kontraknya', async () => {
    const { ReportInputSchema } = await import('@/api/contracts')
    const parsed = ReportInputSchema.safeParse({
      targetType: 'comment',
      targetId: 'c1',
      reason: 'lainnya',
      note: '   ',
    })
    expect(parsed.success).toBe(false)
  })
})

describe('blokir · FR-SOCIAL-07', () => {
  it('komentar pengguna terblokir hilang dari tampilan pemblokir saja', async () => {
    const before = await api.listComments(OPEN, P)
    const target = before.items.find((c) => c.userId !== CURRENT_USER_ID)
    if (!target) throw new Error('butuh komentar orang lain')

    await api.blockUser(target.userId, true)
    const after = await api.listComments(OPEN, P)
    expect(after.items.some((c) => c.userId === target.userId)).toBe(false)

    // Tidak dihapus: barisnya masih ada di basis data.
    expect(await db.comments.get(target.id)).toBeDefined()

    await api.blockUser(target.userId, false)
    const restored = await api.listComments(OPEN, P)
    expect(restored.items.some((c) => c.userId === target.userId)).toBe(true)
  })

  it('ulasan pengguna terblokir juga disembunyikan', async () => {
    const page = await api.listReviews('s1', {
      page: 1,
      pageSize: 20,
      stars: null,
      withText: false,
      tag: null,
      sort: 'helpful',
    })
    const target = page.items[0]
    if (!target) throw new Error('butuh satu ulasan')

    await api.blockUser(target.userId, true)
    const after = await api.listReviews('s1', {
      page: 1,
      pageSize: 20,
      stars: null,
      withText: false,
      tag: null,
      sort: 'helpful',
    })
    expect(after.items.some((r) => r.userId === target.userId)).toBe(false)
  })

  it('memblokir diri sendiri ditolak', async () => {
    await expect(api.blockUser(CURRENT_USER_ID, true)).rejects.toThrow(/diri sendiri/)
  })
})

describe('integrasi misi, feed & visibilitas · FR-SOCIAL-08', () => {
  const REVIEW = {
    storyId: 's1',
    stars: 5 as const,
    text: 'Percakapan di bab terakhir menutup pertanyaan yang dibangun sejak awal.',
    tags: [],
    spoiler: false,
  }

  it('misi ulasan jadi 100% setelah ulasan pertama hari ini', async () => {
    const before = await api.getRewards()
    const mission = before.missions.find((m) => m.id === 'm2')
    expect(mission?.progress).toBe(0)

    await api.submitReview(REVIEW)

    const after = await api.getRewards()
    const done = after.missions.find((m) => m.id === 'm2')
    expect(done?.progress).toBe(done?.target)
    // Klaim kemarin tidak menghalangi klaim hari ini.
    expect(done?.claimedAt).toBeNull()
  })

  it('misi tidak bisa diselesaikan dua kali sehari lewat cerita kedua', async () => {
    await api.submitReview(REVIEW)
    const first = (await api.getRewards()).missions.find((m) => m.id === 'm2')

    await db.progress.put({
      id: `${CURRENT_USER_ID}-ms1`,
      userId: CURRENT_USER_ID,
      storyId: 'ms1',
      lastChapterId: 'ms1-c1',
      scrollPct: 20,
      finishedChapterIds: ['ms1-c1'],
      updatedAt: new Date().toISOString(),
    })
    await api.submitReview({ ...REVIEW, storyId: 'ms1' })

    const second = (await api.getRewards()).missions.find((m) => m.id === 'm2')
    // Progresnya tetap satu target, bukan dua.
    expect(second?.progress).toBe(first?.progress)
    expect(second?.progress).toBe(second?.target)
  })

  it('progres misi diturunkan dari tanggal ulasan, bukan angka tersimpan', async () => {
    await api.submitReview(REVIEW)
    const mine = (await db.reviews.toArray()).find((r) => r.userId === CURRENT_USER_ID)
    if (!mine) throw new Error('butuh ulasan sendiri')

    // Digeser ke kemarin: misinya harus kembali nol tanpa ada yang menulis ulang.
    await db.reviews.update(mine.id, {
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
      editedAt: null,
    })

    const after = (await api.getRewards()).missions.find((m) => m.id === 'm2')
    expect(after?.progress).toBe(0)
  })

  it('feed aktivitas dibuat otomatis dari ulasan, bukan tabel event', async () => {
    await api.submitReview(REVIEW)

    const feed = await api.listActivity(CURRENT_USER_ID, false)
    expect(feed[0]?.kind).toBe('review')
    expect(feed[0]?.stars).toBe(5)
    expect(feed[0]?.storyTitle).toBeTruthy()
  })

  it('visibilitas mati menyembunyikan dari profil publik, **bukan** dari halaman ulasan', async () => {
    await api.submitReview(REVIEW)
    await db.privacySettings.put({
      userId: CURRENT_USER_ID,
      readingActivity: true,
      library: true,
      reviews: false,
      wallet: false,
    })

    // Dibaca orang lain → kosong.
    expect(await api.listActivity(CURRENT_USER_ID, true)).toHaveLength(0)
    // Dibaca pemiliknya sendiri → tetap ada.
    expect((await api.listActivity(CURRENT_USER_ID, false)).length).toBeGreaterThan(0)

    // Dan ulasannya tetap tampil di halaman ulasan cerita.
    const page = await api.listReviews('s1', {
      page: 1,
      pageSize: 20,
      stars: null,
      withText: false,
      tag: null,
      sort: 'helpful',
    })
    expect(page.myReview).not.toBeNull()

    await db.privacySettings.delete(CURRENT_USER_ID)
  })

  it('rata-rata cerita mencerminkan rating terbaru — angka kartu ikut bergerak', async () => {
    const before = (await db.stories.get('s1'))?.stats.rating ?? 0
    await api.rateStory('s1', 1)
    const after = (await db.stories.get('s1'))?.stats.rating ?? 0
    expect(after).toBeLessThan(before)
  })
})

describe('sentimen dari data nyata · FR-SOCIAL-08', () => {
  const RANGE = { range: '30h', from: null, to: null, chapterSort: 'views' } as const

  /** Analitik cerita hanya untuk pemiliknya, jadi cerita contoh penulis. */
  const MINE = 'ms1'

  it('bintang ulasan menentukan pecahan nada, dan ketiganya berjumlah 100', async () => {
    await db.progress.put({
      id: `${CURRENT_USER_ID}-${MINE}`,
      userId: CURRENT_USER_ID,
      storyId: MINE,
      lastChapterId: `${MINE}-c1`,
      scrollPct: 10,
      finishedChapterIds: [],
      updatedAt: new Date().toISOString(),
    })

    await api.submitReview({
      storyId: MINE,
      stars: 1,
      text: 'Tiga bab terakhir mengulang bab sepuluh tanpa menambah apa pun.',
      tags: [],
      spoiler: false,
    })

    const report = await api.getStoryAnalytics(MINE, RANGE)
    const { positive, neutral, negative } = report.sentiment
    expect(positive + neutral + negative).toBe(100)
    // Satu-satunya ulasan bintang satu → seluruhnya negatif.
    expect(negative).toBe(100)
  })

  it('tanpa ulasan sama sekali, ketiganya nol — bukan angka karangan', async () => {
    for (const row of await db.reviews.toArray()) {
      if (row.storyId === MINE) await db.reviews.delete(row.id)
    }

    const report = await api.getStoryAnalytics(MINE, RANGE)
    expect(report.sentiment.positive).toBe(0)
    expect(report.sentiment.neutral).toBe(0)
    expect(report.sentiment.negative).toBe(0)
  })
})

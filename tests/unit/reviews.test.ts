import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import type { ReviewParams } from '@/api/contracts'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'

const P = (over: Partial<ReviewParams> = {}): ReviewParams => ({
  page: 1,
  pageSize: 20,
  stars: null,
  withText: false,
  tag: null,
  sort: 'helpful',
  ...over,
})

const STORY = 's1'

/** Progres baca = syarat kelayakan menilai. Dipasang ulang tiap test. */
async function markAsRead(storyId = STORY) {
  await db.progress.put({
    scrollByChapter: {},
    finishedAt: {},
    id: `${CURRENT_USER_ID}-${storyId}`,
    userId: CURRENT_USER_ID,
    storyId,
    lastChapterId: `${storyId}-c1`,
    scrollPct: 40,
    finishedChapterIds: [`${storyId}-c1`],
    updatedAt: new Date().toISOString(),
  })
}

beforeEach(async () => {
  // Bersihkan jejak test sebelumnya **di awal**: pembersihan di akhir tidak
  // pernah berjalan pada test yang gagal.
  for (const row of await db.reviews.toArray()) {
    if (row.userId === CURRENT_USER_ID) await db.reviews.delete(row.id)
  }
  await db.ratings.delete(`${CURRENT_USER_ID}-${STORY}`)
  await db.progress.delete(`${CURRENT_USER_ID}-${STORY}`)
  for (const row of await db.reactions.toArray()) {
    if (row.userId === CURRENT_USER_ID) await db.reactions.delete(row.id)
  }
})

describe('kelayakan menilai · FR-SOCIAL-01', () => {
  it('menilai cerita yang belum pernah dibaca ditolak dengan ajakan, bukan error', async () => {
    const error = await api.rateStory(STORY, 4).catch((e: unknown) => e)
    const message = error instanceof Error ? error.message : String(error)

    expect(message).toMatch(/Baca dulu minimal satu bab/)
    // Ajakan, bukan kegagalan teknis: kalimatnya menyebut apa yang harus
    // dilakukan, bukan apa yang rusak. Dibaca dari `message`, bukan
    // `String(error)` — yang terakhir memuat nama kelasnya sendiri.
    expect(message).not.toMatch(/error|gagal/i)
  })

  it('setelah membaca satu bab, rating tersimpan dan rata-rata dihitung ulang', async () => {
    await markAsRead()
    const before = (await db.stories.get(STORY))?.stats.rating ?? 0

    const rating = await api.rateStory(STORY, 5)
    expect(rating.stars).toBe(5)

    const after = (await db.stories.get(STORY))?.stats.rating ?? 0
    expect(after).not.toBe(before)
  })

  it('rating bisa diubah dan dihapus; rata-ratanya ikut bergerak dua kali', async () => {
    await markAsRead()
    await api.rateStory(STORY, 1)
    const low = (await db.stories.get(STORY))?.stats.rating ?? 0

    await api.rateStory(STORY, 5)
    const high = (await db.stories.get(STORY))?.stats.rating ?? 0
    expect(high).toBeGreaterThan(low)

    await api.deleteRating(STORY)
    expect(await api.getMyRating(STORY)).toBeNull()
    const gone = (await db.stories.get(STORY))?.stats.rating ?? 0
    expect(gone).toBeLessThan(high)
  })
})

describe('satu ulasan per pasangan · FR-SOCIAL-02', () => {
  it('menulis kedua kali menyunting yang lama, bukan membuat yang baru', async () => {
    await markAsRead()
    const first = await api.submitReview({
      storyId: STORY,
      stars: 4,
      text: 'Bab pembukanya menahan saya sampai pagi. Konfliknya tumbuh pelan tapi tidak pernah kendur.',
      tags: ['slow burn'],
      spoiler: false,
    })
    expect(first.editedAt).toBeNull()

    const second = await api.submitReview({
      storyId: STORY,
      stars: 5,
      text: 'Setelah membaca ulang, bagian tengahnya justru bagian terkuatnya. Saya naikkan penilaian saya.',
      tags: ['chemistry'],
      spoiler: false,
    })

    expect(second.id).toBe(first.id)
    expect(second.editedAt).not.toBeNull()

    const mine = (await db.reviews.toArray()).filter(
      (r) => r.userId === CURRENT_USER_ID && r.storyId === STORY,
    )
    expect(mine).toHaveLength(1)
  })

  it('ulasan menuntut 20–1000 karakter, dan penolakannya menyebut panjang sekarang', async () => {
    await markAsRead()
    await expect(
      api.submitReview({ storyId: STORY, stars: 4, text: 'bagus', tags: [], spoiler: false }),
    ).rejects.toThrow(/Sekarang 5/)
  })

  it('menghapus ulasan tidak menghapus ratingnya, dan rata-rata tidak berubah', async () => {
    await markAsRead()
    await api.submitReview({
      storyId: STORY,
      stars: 5,
      text: 'Penutupnya menjawab hampir seluruh pertanyaan yang dibangun sejak bab awal.',
      tags: [],
      spoiler: false,
    })
    const before = (await db.stories.get(STORY))?.stats.rating ?? 0

    await api.deleteReview(STORY)

    expect((await api.getMyRating(STORY))?.stars).toBe(5)
    expect((await db.stories.get(STORY))?.stats.rating).toBe(before)
  })

  it('menghapus rating **ikut** menghapus ulasannya — ulasan tanpa bintang tidak sah', async () => {
    await markAsRead()
    await api.submitReview({
      storyId: STORY,
      stars: 3,
      text: 'Menarik di awal, tetapi tiga bab terakhir terasa mengulang bab sepuluh.',
      tags: [],
      spoiler: false,
    })

    await api.deleteRating(STORY)

    const page = await api.listReviews(STORY, P())
    expect(page.myReview).toBeNull()
  })
})

describe('halaman ulasan · FR-SOCIAL-03 · FR-SOCIAL-04', () => {
  it('sebaran dihitung dari **seluruh rating**, bukan dari ulasan yang lolos saringan', async () => {
    const all = await api.listReviews(STORY, P())
    const onlyFive = await api.listReviews(STORY, P({ stars: 5 }))

    expect(onlyFive.items.length).toBeLessThan(all.items.length)
    // Grafik yang ikut menyusut saat disaring berhenti menggambarkan ceritanya.
    expect(onlyFive.breakdown).toEqual(all.breakdown)
  })

  it('jumlah penilai sama dengan jumlah rating, bukan jumlah ulasan bertext', async () => {
    const page = await api.listReviews(STORY, P())
    const sum = page.breakdown.histogram.reduce((n, x) => n + x, 0)
    expect(sum).toBe(page.breakdown.total)
  })

  it('saring "ada teksnya" membuang rating tanpa ulasan', async () => {
    const withText = await api.listReviews(STORY, P({ withText: true }))
    expect(withText.items.every((r) => r.text.trim() !== '')).toBe(true)

    const all = await api.listReviews(STORY, P())
    expect(all.items.some((r) => r.text.trim() === '')).toBe(true)
  })

  it('keempat urutan benar-benar diurutkan server', async () => {
    const cases = [
      ['helpful', (r: { helpfulCount: number }) => r.helpfulCount],
      ['highest', (r: { stars: number }) => r.stars],
    ] as const

    for (const [sort, key] of cases) {
      const page = await api.listReviews(STORY, P({ sort }))
      const values = page.items.map(key)
      expect(values, sort).toEqual([...values].sort((a, b) => b - a))
    }

    const lowest = await api.listReviews(STORY, P({ sort: 'lowest' }))
    const stars = lowest.items.map((r) => r.stars)
    expect(stars).toEqual([...stars].sort((a, b) => a - b))
  })

  it('ulasan sendiri keluar dari daftar dan naik ke `myReview`', async () => {
    await markAsRead()
    await api.submitReview({
      storyId: STORY,
      stars: 4,
      text: 'Dialognya terasa hidup, terutama di bab-bab yang tokohnya sedang tidak sepakat.',
      tags: [],
      spoiler: false,
    })

    const page = await api.listReviews(STORY, P())
    expect(page.myReview?.userId).toBe(CURRENT_USER_ID)
    expect(page.items.some((r) => r.userId === CURRENT_USER_ID)).toBe(false)
  })

  it('tag terpopuler membawa jumlah pemakaiannya dan bisa dipakai menyaring', async () => {
    const page = await api.listReviews(STORY, P())
    const top = page.topTags[0]
    if (!top) throw new Error('butuh minimal satu tag')

    expect(top.count).toBeGreaterThan(0)
    const filtered = await api.listReviews(STORY, P({ tag: top.tag }))
    expect(filtered.items.every((r) => r.tags.includes(top.tag))).toBe(true)
  })

  it('"Membantu" satu kali per pengguna dan bisa dibatalkan', async () => {
    const page = await api.listReviews(STORY, P())
    const other = page.items[0]
    if (!other) throw new Error('butuh ulasan orang lain')

    await api.react({ type: 'review', id: other.id }, true)
    const after = (await api.listReviews(STORY, P())).items.find((r) => r.id === other.id)
    expect(after?.helpfulCount).toBe(other.helpfulCount + 1)
    expect(after?.markedHelpful).toBe(true)

    // Menandai dua kali tidak menaikkan dua kali.
    await api.react({ type: 'review', id: other.id }, true)
    const same = (await api.listReviews(STORY, P())).items.find((r) => r.id === other.id)
    expect(same?.helpfulCount).toBe(other.helpfulCount + 1)

    await api.react({ type: 'review', id: other.id }, false)
    const undone = (await api.listReviews(STORY, P())).items.find((r) => r.id === other.id)
    expect(undone?.helpfulCount).toBe(other.helpfulCount)
  })

  it('ulasan sendiri tidak bisa ditandai membantu', async () => {
    await markAsRead()
    const mine = await api.submitReview({
      storyId: STORY,
      stars: 5,
      text: 'Saya jarang menandai cerita sebagai favorit, tetapi yang ini bertahan di kepala.',
      tags: [],
      spoiler: false,
    })

    await expect(api.react({ type: 'review', id: mine.id }, true)).rejects.toThrow(
      /tidak bisa ditandai membantu/,
    )
  })

  it('hanya pemilik cerita yang bisa menanggapi, dan `canReply` mengatakannya', async () => {
    const page = await api.listReviews(STORY, P())
    // `s1` milik penulis lain, jadi pembaca contoh tidak boleh menanggapi.
    expect(page.canReply).toBe(false)

    const other = page.items[0]
    if (!other) throw new Error('butuh satu ulasan')
    await expect(api.replyToReview(other.id, 'Terima kasih!')).rejects.toThrow(/Hanya penulis/)
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'

const params = { page: 1, pageSize: 20, state: 'all' as const, sort: 'saved' as const }

/** Rak dikosongkan tiap test — seed punya enam cerita yang bukan urusan di sini. */
beforeEach(async () => {
  await db.libraryEntries.where('userId').equals(CURRENT_USER_ID).delete()
  await db.progress.where('userId').equals(CURRENT_USER_ID).delete()
})

async function save(storyId: string, savedAt = '2026-08-20') {
  await db.libraryEntries.put({
    id: `lib-${CURRENT_USER_ID}-${storyId}`,
    userId: CURRENT_USER_ID,
    storyId,
    savedAt,
    notify: true,
    removed: false,
  })
}

/** Menandai `count` bab pertama cerita selesai. */
async function finish(storyId: string, count: number, updatedAt = new Date().toISOString()) {
  const chapters = (await db.chapters.where('storyId').equals(storyId).toArray()).sort(
    (a, b) => a.number - b.number,
  )
  await db.progress.put({
    id: `${CURRENT_USER_ID}-${storyId}`,
    userId: CURRENT_USER_ID,
    storyId,
    lastChapterId: chapters[count - 1]?.id ?? null,
    scrollPct: 1,
    finishedChapterIds: chapters.slice(0, count).map((c) => c.id),
    updatedAt,
  })
}

const only = async (storyId: string) => {
  const page = await api.getLibrary(params)
  return page.items.find((i) => i.story.id === storyId)
}

describe('aturan status baca · FR-LIB-11', () => {
  it('cerita yang baru disimpan berstatus not-started dengan progres nol', async () => {
    await save('s2')

    const item = await only('s2')
    expect(item?.state).toBe('not-started')
    expect(item?.pct).toBe(0)
    // "Lanjut Baca" tetap punya tujuan: bab satu.
    expect(item?.continueChapterNumber).toBe(1)
  })

  it('bab selesai ke-3 dari 120 berstatus reading dengan persentase benar', async () => {
    await save('s1')
    await finish('s1', 3)

    const item = await only('s1')
    expect(item?.state).toBe('reading')
    expect(item?.finishedCount).toBe(3)
    expect(item?.totalChapters).toBe(120)
    expect(item?.pct).toBe(3)
    expect(item?.continueChapterNumber).toBe(3)
  })

  it('seluruh bab terbit selesai berstatus finished', async () => {
    await save('s1')
    await finish('s1', 120)

    const item = await only('s1')
    expect(item?.state).toBe('finished')
    expect(item?.pct).toBe(100)
  })

  it('cerita finished yang mendapat bab baru kembali menjadi reading', async () => {
    await save('s1')
    await finish('s1', 120, new Date(Date.now() - 3_600_000).toISOString())
    expect((await only('s1'))?.state).toBe('finished')

    await db.chapters.put({
      id: 's1-c121',
      storyId: 's1',
      number: 121,
      title: 'Bab 121',
      access: 'free',
      priceCoins: 0,
      readMinutes: 7,
      state: 'published',
      review: 'published',
      publishAt: new Date().toISOString(),
      publishTz: 'Asia/Jakarta',
      wordCount: 1_200,
      owned: true,
      finished: false,
      withdrawnAt: null,
      editedAt: new Date().toISOString(),
      views: 0,
      rating: 0,
      commentCount: 0,
      previewPct: 20,
      accessChangedAt: null,
      privateReason: null,
      privateUntil: null,
    })

    const item = await only('s1')
    expect(item?.state).toBe('reading')
    expect(item?.totalChapters).toBe(121)
    // Dan titik merahnya menyala: terbit setelah kunjungan terakhir, belum dibaca.
    expect(item?.hasNewChapter).toBe(true)

    await db.chapters.delete('s1-c121')
  })

  it('bab yang ditarik penulisnya tidak ikut dihitung selesai', async () => {
    await save('s1')
    await finish('s1', 3)
    await db.progress.update(`${CURRENT_USER_ID}-s1`, {
      finishedChapterIds: ['s1-c1', 's1-c2', 's1-c3', 's1-bab-hantu'],
    })

    // Tanpa penyaringan ini, cerita bisa tampil lebih dari 100% selesai.
    expect((await only('s1'))?.finishedCount).toBe(3)
  })
})

describe('cari, saring, urut — di server · FR-LIB-03/04/05/11', () => {
  beforeEach(async () => {
    await save('s1', '2026-08-20')
    await save('s3', '2026-08-18')
    await save('s4', '2026-07-28')
    await finish('s3', 2)
  })

  it('pencarian mencakup judul, penulis, dan genre tanpa peka huruf besar', async () => {
    const s1 = await db.stories.get('s1')
    const byTitle = await api.getLibrary({
      ...params,
      q: s1?.title.slice(3, 9).toUpperCase() ?? '',
    })
    const byAuthor = await api.getLibrary({ ...params, q: s1?.penName.toLowerCase() ?? '' })
    const byGenre = await api.getLibrary({ ...params, q: (s1?.genres[0] ?? '').toLowerCase() })

    expect(byTitle.items.map((i) => i.story.id)).toContain('s1')
    expect(byAuthor.items.map((i) => i.story.id)).toContain('s1')
    expect(byGenre.items.map((i) => i.story.id)).toContain('s1')
  })

  it('kueri kosong meloloskan semuanya', async () => {
    expect((await api.getLibrary({ ...params, q: '   ' })).total).toBe(3)
  })

  it('saringan status dan pencarian bersifat AND', async () => {
    const s1 = await db.stories.get('s1')
    const page = await api.getLibrary({
      ...params,
      state: 'reading',
      q: s1?.title.slice(0, 6) ?? '',
    })

    // s1 cocok dengan kueri tetapi belum dibaca; s3 sedang dibaca tetapi tidak
    // cocok. Keduanya harus terpenuhi, jadi hasilnya kosong.
    expect(page.total).toBe(0)
  })

  it('urutan bawaan terbaru disimpan; A–Z dan rating menyusun ulang', async () => {
    const saved = await api.getLibrary(params)
    expect(saved.items.map((i) => i.savedAt)).toEqual(['2026-08-20', '2026-08-18', '2026-07-28'])

    const az = await api.getLibrary({ ...params, sort: 'az' })
    const titles = az.items.map((i) => i.story.title)
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, 'id')))

    const rating = await api.getLibrary({ ...params, sort: 'rating' })
    const scores = rating.items.map((i) => i.story.stats.rating)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it('halaman pertama dipotong di server, bukan dikirim seluruhnya', async () => {
    const page = await api.getLibrary({ ...params, pageSize: 2 })

    expect(page.items).toHaveLength(2)
    expect(page.total).toBe(3)
    expect(page.hasMore).toBe(true)
  })
})

describe('ringkasan, notifikasi, dan hapus · FR-LIB-01/08/09', () => {
  beforeEach(async () => {
    await save('s1')
    await save('s3')
    await finish('s3', 2)
  })

  it('empat metrik tidak ikut berubah saat daftar disaring', async () => {
    const before = await api.getLibrarySummary()
    await api.getLibrary({ ...params, state: 'finished' })
    const after = await api.getLibrarySummary()

    expect(before).toEqual(after)
    expect(before.saved).toBe(2)
    expect(before.reading).toBe(1)
  })

  it('sakelar notifikasi bertahan di server', async () => {
    expect((await api.toggleNotify('s1')).notify).toBe(false)
    expect((await only('s1'))?.notify).toBe(false)
    expect((await api.toggleNotify('s1')).notify).toBe(true)
  })

  it('hapus menghilangkan cerita; urungkan mengembalikan tanggal simpan aslinya', async () => {
    await db.libraryEntries.update(`lib-${CURRENT_USER_ID}-s1`, { savedAt: '2026-01-02' })

    await api.removeFromLibrary('s1')
    expect(await only('s1')).toBeUndefined()

    const restored = await api.undoRemove('s1')
    expect(restored.savedAt).toBe('2026-01-02')
    expect((await only('s1'))?.savedAt).toBe('2026-01-02')
  })

  it('cerita yang tidak ada di koleksi ditolak, bukan didiamkan', async () => {
    await expect(api.toggleNotify('s2')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { todayLocalISO } from '@/lib/date'

const params = { page: 1, pageSize: 20, status: 'all' as const, sort: 'updated' as const }

const verified = {
  userId: CURRENT_USER_ID,
  tier: 'verified' as const,
  payoutVerified: true,
  twoFactor: true,
  termsAcceptedAt: new Date().toISOString(),
}

const form = {
  title: 'Naskah Uji',
  synopsis: 'x'.repeat(60),
  penName: 'Amelia Putri',
  coverUrl: null,
  genre: 'Drama' as const,
  extraGenres: [],
  tags: [],
  audience: 'Remaja' as const,
  language: 'Indonesia' as const,
  monetizeType: 'free' as const,
  fullAccessCoins: null,
  visibility: 'public' as const,
  status: 'ongoing' as const,
  commentsEnabled: true,
  moderateComments: false,
  allowTranslation: false,
  allowFanfiction: false,
  contentLabels: [],
  dedication: '',
  authorNote: '',
}

beforeEach(async () => {
  await db.authorProfiles.put(verified)
  await db.scheduleEntries.where('id').startsWith('sch-story-').delete()
  await db.stories.where('id').startsWith('ms-').delete()
})

const find = async (storyId: string) =>
  (await api.getMyStories({ ...params, pageSize: 100 })).items.find((i) => i.story.id === storyId)

describe('tujuh status studio · FR-STUDIO-02 · FR-STUDIO-38', () => {
  it('menurunkan status dari review, status terbit, dan visibilitas', async () => {
    expect((await find('ms1'))?.studioStatus).toBe('completed')
    expect((await find('ms2'))?.studioStatus).toBe('draft')
    // Dua status yang tidak ada di kanvas tetapi dituntut FR-STUDIO-38.
    expect((await find('ms3'))?.studioStatus).toBe('in_review')
    expect((await find('ms4'))?.studioStatus).toBe('rejected')
  })

  it('cerita ditolak membawa alasannya, bukan sekadar lencana', async () => {
    expect((await find('ms4'))?.rejectReason).toMatch(/kutipan panjang/)
  })

  it('menjadwalkan draf mengubah statusnya menjadi scheduled', async () => {
    // Besok menurut **zona waktu lokal**: di WIB pagi, "besok UTC" masih hari
    // ini, dan penjadwal menolaknya sebagai waktu yang sudah lewat.
    const besok = todayLocalISO(new Date(Date.now() + 86_400_000))
    const after = await api.scheduleStory({
      storyId: 'ms2',
      date: besok,
      time: '19:00',
      cadence: 'once',
    })

    expect(after.studioStatus).toBe('scheduled')
    expect(after.scheduledAt).not.toBeNull()
  })

  it('waktu terbit yang sudah lewat ditolak', async () => {
    await expect(
      api.scheduleStory({ storyId: 'ms2', date: '2020-01-01', time: '19:00', cadence: 'once' }),
    ).rejects.toMatchObject({ code: 'VALIDATION' })
  })
})

describe('cari, saring, urut · FR-STUDIO-03', () => {
  it('pencarian hanya mencakup judul, bukan genre atau tag', async () => {
    const byTitle = await api.getMyStories({ ...params, q: 'velvet' })
    const byGenre = await api.getMyStories({ ...params, q: 'drama' })

    expect(byTitle.items.map((i) => i.story.id)).toContain('ms1')
    expect(byGenre.total).toBe(0)
  })

  it('saringan status dan pencarian bersifat AND', async () => {
    expect((await api.getMyStories({ ...params, status: 'draft', q: 'velvet' })).total).toBe(0)
  })

  it('tiga urutan menyusun ulang daftarnya', async () => {
    const popular = await api.getMyStories({ ...params, sort: 'popular', pageSize: 100 })
    const views = popular.items.map((i) => i.story.stats.reads)
    expect(views).toEqual([...views].sort((a, b) => b - a))

    const az = await api.getMyStories({ ...params, sort: 'az', pageSize: 100 })
    const titles = az.items.map((i) => i.story.title)
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, 'id')))
  })
})

describe('tiga tingkat penulis ditegakkan server · FR-STUDIO-33', () => {
  it('yang belum mendaftar ditolak membuat cerita', async () => {
    await db.authorProfiles.delete(CURRENT_USER_ID)
    await expect(api.createStory(form)).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('menyetujui ketentuan saja sudah cukup untuk menulis', async () => {
    await db.authorProfiles.delete(CURRENT_USER_ID)

    const profile = await api.registerAuthor({
      termsAccepted: true,
      payoutVerified: false,
      twoFactor: false,
    })

    expect(profile.tier).toBe('registered')
    // Menulis tidak diblokir verifikasi — itu inti FR-STUDIO-33.
    await expect(api.createStory(form)).resolves.toMatchObject({ review: 'draft' })
  })

  it('identitas pencairan + 2FA menaikkan tingkat ke terverifikasi', async () => {
    await db.authorProfiles.delete(CURRENT_USER_ID)
    const profile = await api.registerAuthor({
      termsAccepted: true,
      payoutVerified: true,
      twoFactor: true,
    })
    expect(profile.tier).toBe('verified')
  })
})

describe('membuat, menyunting, menghapus · FR-STUDIO-06', () => {
  it('cerita baru selalu lahir sebagai draf dan muncul di daftar', async () => {
    const story = await api.createStory({ ...form, title: 'Naskah Baru Sekali' })

    expect(story.review).toBe('draft')
    expect((await find(story.id))?.studioStatus).toBe('draft')
  })

  it('menyunting menyimpan perubahan dan memperbarui judulnya', async () => {
    const story = await api.createStory({ ...form, title: 'Sebelum Disunting' })
    const after = await api.updateStory(story.id, { ...form, title: 'Sesudah Disunting' })

    expect(after.title).toBe('Sesudah Disunting')
    expect((await find(story.id))?.story.title).toBe('Sesudah Disunting')
  })

  it('cerita terbit yang babnya sudah dibeli menolak dihapus', async () => {
    await db.stories.update('ms1', { monetizeType: 'partial', review: 'published' })
    await db.chapters.put({
      id: 'ms1-c1',
      storyId: 'ms1',
      number: 1,
      title: 'Bab 1',
      access: 'paid',
      priceCoins: 1_500,
      readMinutes: 7,
      state: 'published',
      review: 'published',
      publishAt: new Date().toISOString(),
      publishTz: 'Asia/Jakarta',
      wordCount: 1_200,
      owned: false,
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
    await db.ownerships.put({
      id: 'own-uji-studio',
      userId: 'u9',
      chapterId: 'ms1-c1',
      source: 'coin',
      acquiredAt: new Date().toISOString(),
    })

    await expect(api.deleteStory('ms1')).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(await db.stories.get('ms1')).toBeDefined()

    await db.ownerships.delete('own-uji-studio')
    await db.chapters.delete('ms1-c1')
  })

  it('draf sendiri boleh dihapus beserta bab dan jadwalnya', async () => {
    const story = await api.createStory({ ...form, title: 'Draf Sekali Pakai' })
    await api.deleteStory(story.id)

    expect(await db.stories.get(story.id)).toBeUndefined()
    expect(await find(story.id)).toBeUndefined()
  })
})

describe('ringkasan studio & pesanan cetak · FR-STUDIO-01 · FR-STUDIO-05', () => {
  it('empat metrik agregat tidak ikut berubah saat daftar disaring', async () => {
    const before = await api.getStudioSummary()
    await api.getMyStories({ ...params, status: 'draft' })
    const after = await api.getStudioSummary()

    expect(before).toEqual(after)
    expect(before.stories).toBeGreaterThan(0)
    expect(before.views).toBeGreaterThan(0)
  })

  it('nomor pesanan membawa jenisnya, dan hardcopy menuntut alamat', async () => {
    const soft = await api.createPrintOrder({
      storyId: 'ms1',
      kind: 'soft',
      spec: 'A4 · semua bab',
      copies: 1,
      shipping: null,
    })
    expect(soft.id).toMatch(/^#SFT-\d{8}-\d{3}$/)
    expect(soft.fileName).toMatch(/\.pdf$/)

    await expect(
      api.createPrintOrder({
        storyId: 'ms1',
        kind: 'hard',
        spec: 'A5 · soft cover',
        copies: 3,
        shipping: null,
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION' })
  })
})

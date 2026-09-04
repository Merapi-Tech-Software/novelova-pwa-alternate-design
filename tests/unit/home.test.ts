import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'

beforeEach(async () => {
  await db.readerPrefs.put({
    userId: CURRENT_USER_ID,
    genres: ['Mystery', 'Fantasy'],
    hiddenStoryIds: [],
    onboardedAt: new Date().toISOString(),
  })
})

describe('beranda · FR-HOME-13', () => {
  it('genre menyaring empat section discovery', async () => {
    const feed = await api.getHomeFeed('Mystery')
    const filtered = feed.sections.filter((s) => ['populer', 'terbaru', 'terbuka'].includes(s.id))

    expect(filtered.length).toBeGreaterThan(0)
    for (const section of filtered) {
      for (const story of section.stories) {
        expect(story.genres).toContain('Mystery')
      }
    }
  })

  it('banner dan Continue Reading tidak ikut tersaring', async () => {
    const semua = await api.getHomeFeed()
    const mystery = await api.getHomeFeed('Mystery')

    const pick = (feed: Awaited<ReturnType<typeof api.getHomeFeed>>, id: string) =>
      feed.sections.find((s) => s.id === id)?.stories.map((x) => x.id)

    // Kurasi editorial dan bacaan pribadi tetap sama persis, apa pun tabnya.
    expect(pick(mystery, 'banner')).toEqual(pick(semua, 'banner'))
    expect(pick(mystery, 'lanjut-baca')).toEqual(pick(semua, 'lanjut-baca'))
  })

  it('section tanpa cerita pada tab itu tidak dikirim sama sekali', async () => {
    // Tidak ada cerita berbahasa Inggris bergenre Horor yang tamat, jadi
    // section generik "Tamat & Siap Dibaca" pada tab Horror bisa hilang —
    // yang penting: yang kosong tidak pernah dikirim sebagai judul kosong.
    const feed = await api.getHomeFeed('Horror')
    for (const section of feed.sections) {
      expect(section.stories.length).toBeGreaterThan(0)
    }
  })

  it('tiga section pertama selalu ada di tab mana pun', async () => {
    for (const tab of [undefined, 'Romance', 'Fantasy', 'My Kisah']) {
      const ids = (await api.getHomeFeed(tab)).sections.map((s) => s.id)
      expect(ids.slice(0, 4)).toEqual(['banner', 'populer', 'terbaru', 'terbuka'])
    }
  })

  it('urutan section tetap di kepala, dan ekornya berganti mengikuti tab', async () => {
    const semua = (await api.getHomeFeed()).sections.map((s) => s.id)
    const romance = (await api.getHomeFeed('Romance')).sections.map((s) => s.id)

    // Kepala sama, ekor berbeda — itu seluruh isi perubahan Fase 3b.
    expect(semua.slice(0, 4)).toEqual(romance.slice(0, 4))
    expect(semua).toContain('ramai')
    expect(romance).toContain('romance-kantor')
    expect(romance).not.toContain('ramai')

    expect(semua.at(-1)).toBe('lanjut-baca')
    expect((await api.getHomeFeed()).sections.find((s) => s.id === 'populer')?.seeAll).toBe(
      'populer',
    )
    expect(
      (await api.getHomeFeed()).sections.find((s) => s.id === 'lanjut-baca')?.seeAll,
    ).toBeNull()
  })

  it('tab My Kisah menyaring kisah nyata, bukan genre — dan genrenya macam-macam', async () => {
    const feed = await api.getHomeFeed('My Kisah')
    const stories = feed.sections
      .filter((s) => s.id !== 'banner' && s.id !== 'lanjut-baca')
      .flatMap((s) => s.stories)

    expect(stories.length).toBeGreaterThan(0)
    for (const story of stories) expect(story.kind).toBe('kisah')

    // Justru itu alasannya bukan genre: kisah nyata bisa drama, bisa horor.
    const genres = new Set(stories.flatMap((s) => s.genres))
    expect(genres.size).toBeGreaterThan(1)
  })

  it('genre tidak mengunci katalog — seluruh cerita tetap ada di keadaan "Semua"', async () => {
    const semua = await api.getHomeFeed()
    const mystery = await api.getHomeFeed('Mystery')

    const count = (feed: Awaited<ReturnType<typeof api.getHomeFeed>>) =>
      new Set(feed.sections.flatMap((s) => s.stories.map((x) => x.id))).size

    expect(count(semua)).toBeGreaterThan(count(mystery))
  })
})

/**
 * Setengah lagi dari FR-AUTH-11: apa yang dipilih saat onboarding harus terasa
 * di beranda. Dua tempat, dan **bukan** urutan section-nya (FR-HOME-04 menahan
 * susunan itu tetap): urutan tab, dan apa yang naik ke depan di tiap section.
 */
describe('favorit onboarding memengaruhi beranda · FR-AUTH-11', () => {
  it('tab favorit di depan, sisanya tetap ada', async () => {
    const { orderGenreTabs } = await import('@/features/home/hooks/useHomeFeed')
    const { GENRE_TABS } = await import('@/i18n/content')

    const tabs = orderGenreTabs(['Drama', 'CEO'])

    expect(tabs.slice(0, 2)).toEqual(['Drama', 'CEO'])
    // Tidak mengunci: seluruh tab tetap ada, hanya jaraknya yang berubah.
    expect(new Set(tabs)).toEqual(new Set(GENRE_TABS))
    expect(orderGenreTabs([])).toEqual([...GENRE_TABS])
  })

  it('genre favorit naik ke depan di dalam section, tanpa membuang yang lain', async () => {
    await db.readerPrefs.put({
      userId: CURRENT_USER_ID,
      genres: ['Fantasy'],
      hiddenStoryIds: [],
      onboardedAt: new Date().toISOString(),
    })

    const feed = await api.getHomeFeed()
    const popular = feed.sections.find((s) => s.id === 'populer')
    const stories = popular?.stories ?? []
    const fantasy = stories.filter((s) => s.genres.includes('Fantasy'))

    expect(fantasy.length).toBeGreaterThan(0)
    expect(stories[0]?.genres).toContain('Fantasy')
    // Yang bukan favorit tetap ikut tampil — beranda tidak menyempit jadi
    // satu genre hanya karena pengguna pernah menyukainya.
    expect(stories.length).toBeGreaterThan(fantasy.length)
  })

  it('tab yang dipilih mengalahkan favorit, bukan menumpuk di atasnya', async () => {
    await db.readerPrefs.put({
      userId: CURRENT_USER_ID,
      genres: ['Fantasy'],
      hiddenStoryIds: [],
      onboardedAt: new Date().toISOString(),
    })

    const feed = await api.getHomeFeed('Drama')
    for (const story of feed.sections.find((s) => s.id === 'populer')?.stories ?? []) {
      expect(story.genres).toContain('Drama')
    }
  })
})

describe('beranda pengguna baru · FR-HOME-16', () => {
  it('Continue Reading hilang sepenuhnya bila belum ada riwayat baca', async () => {
    const before = await db.progress.where('userId').equals(CURRENT_USER_ID).toArray()
    await db.progress.bulkDelete(before.map((p) => p.id))

    const ids = (await api.getHomeFeed()).sections.map((s) => s.id)
    expect(ids).not.toContain('lanjut-baca')
    // Sisanya tetap tampil: pengguna baru menemukan cerita, bukan layar kosong.
    expect(ids).toContain('populer')

    await db.progress.bulkAdd(before)
  })
})

describe('gambar contoh dari sample_data', () => {
  it('setiap cerita punya sampul dan banner dari berkas contoh', async () => {
    const { COVER_URLS, BANNER_URLS } = await import('@/api/mock/sampleImages')
    const feed = await api.getHomeFeed()
    const stories = feed.sections.flatMap((s) => s.stories)

    expect(COVER_URLS.length).toBeGreaterThan(0)
    expect(BANNER_URLS.length).toBeGreaterThan(0)
    for (const story of stories) {
      expect(COVER_URLS).toContain(story.coverUrl)
      expect(BANNER_URLS).toContain(story.bannerUrl)
    }
  })

  it('banner memakai gambar lanskap, bukan sampul potret', async () => {
    const { COVER_URLS } = await import('@/api/mock/sampleImages')
    const banner = (await api.getHomeFeed()).sections.find((s) => s.id === 'banner')

    // Dua kumpulan yang terpisah: memakai sampul sebagai banner berarti
    // memotongnya sampai judulnya sendiri hilang.
    for (const story of banner?.stories ?? []) {
      expect(COVER_URLS).not.toContain(story.bannerUrl)
    }
  })
})

describe('section kurasi per tab · Fase 3b', () => {
  it('tiap tab punya section kurasi yang benar-benar berbeda isinya', async () => {
    const curatedOf = async (tab: string) => {
      const feed = await api.getHomeFeed(tab)
      const fixed = new Set([
        'banner',
        'populer',
        'terbaru',
        'terbuka',
        'tamat',
        'gratis',
        'lanjut-baca',
      ])
      return feed.sections.filter((s) => !fixed.has(s.id))
    }

    const romance = await curatedOf('Romance')
    const fantasy = await curatedOf('Fantasy')

    expect(romance.map((s) => s.id)).toEqual(['romance-kantor', 'romance-musuh'])
    expect(fantasy.map((s) => s.id)).toEqual(['fantasy-dunia', 'fantasy-sihir'])

    // Bukan sekadar judul berbeda: isinya juga tidak boleh sama, kalau tidak
    // section kurasi hanya jadi label baru untuk daftar yang sama.
    const romanceIds = new Set(romance.flatMap((s) => s.stories.map((x) => x.id)))
    const fantasyIds = fantasy.flatMap((s) => s.stories.map((x) => x.id))
    expect(fantasyIds.some((id) => !romanceIds.has(id))).toBe(true)
  })

  it('setiap section kurasi punya halaman lihat-semuanya sendiri', async () => {
    const feed = await api.getHomeFeed('Mystery')

    for (const section of feed.sections) {
      const hasPage = section.id !== 'banner' && section.id !== 'lanjut-baca'
      expect(section.seeAll).toBe(hasPage ? section.id : null)
    }
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { isApiError } from '@/api/errors'
import { db } from '@/api/mock/db'
import { decideAgeVerificationAsDev, setAdultModeAsDev } from '@/api/mock/handlers/age'
import { resolveReviewAsAdmin } from '@/api/mock/handlers/schedule'
import { CURRENT_USER_ID as ME } from '@/api/mock/seed'
import { ADULT_MIN_AGE, ageOn, isAdultNow, isAdultStory } from '@/lib/age'

/**
 * Rating usia · todo-incoming-features.md A1, dan notifikasi pengikut · A2.
 *
 * Dua cerita contoh berlabel 18+ (`s16`, `s31`) — keduanya ditulis di
 * `catalog.ts`, bukan dipilih di sini, supaya test ini gagal keras bila seed-nya
 * berubah alih-alih diam-diam menguji cerita yang salah.
 */

const DEWASA = 's16'
const BAB_DEWASA = `${DEWASA}-c1`
const HARI_INI = '2026-09-15'

beforeEach(async () => {
  await db.ageVerifications.delete(ME)
  await db.kv.delete('policy:adultMode')
  await db.readerPrefs.delete(ME)
  await db.notifications.where('userId').equals(ME).delete()
})

const ajukan = () =>
  api.submitAgeVerification({
    birthDate: '1998-04-12',
    documentName: 'ktp.jpg',
    documentSize: 420_000,
  })

describe('lib/age · usia dihitung dari kalender, bukan dari milidetik', () => {
  it('ulang tahun ke-18 adalah hari pertama yang lolos — tidak sehari lebih awal', () => {
    expect(ageOn('2008-09-16', HARI_INI)).toBe(17)
    expect(ageOn('2008-09-15', HARI_INI)).toBe(18)
    expect(ageOn('2008-09-14', HARI_INI)).toBe(18)
  })

  it('hanya `verified` + usia cukup yang dewasa; status lain tidak, apa pun tanggal lahirnya', () => {
    expect(isAdultNow({ status: 'verified', birthDate: '1998-04-12' }, HARI_INI)).toBe(true)
    expect(isAdultNow({ status: 'verified', birthDate: '2010-01-01' }, HARI_INI)).toBe(false)
    expect(isAdultNow({ status: 'pending', birthDate: '1998-04-12' }, HARI_INI)).toBe(false)
    expect(isAdultNow({ status: 'rejected', birthDate: '1998-04-12' }, HARI_INI)).toBe(false)
    expect(isAdultNow(null, HARI_INI)).toBe(false)
    expect(ADULT_MIN_AGE).toBe(18)
  })

  it('cerita contoh 18+ memang berlabel begitu di seed', async () => {
    const story = await db.stories.get(DEWASA)
    expect(story && isAdultStory(story)).toBe(true)
  })
})

describe('gerbang usia · A1', () => {
  it('akun tanpa verifikasi: bab 18+ datang tanpa isi DAN tanpa pratinjau, progres tidak dicatat', async () => {
    const bab = await api.getChapter(DEWASA, BAB_DEWASA)
    expect(bab.ageRestricted).toBe(true)
    expect(bab.content).toEqual([])
    expect(bab.preview).toEqual([])
    // Berbeda dari gerbang koin: bab yang tidak pernah terlihat isinya bukan
    // bab yang "sudah dibuka".
    expect(await api.getProgress(DEWASA)).toBeNull()
  })

  it('cerita 18+ tidak muncul di beranda, pencarian, maupun pilihan awal bagi akun yang belum berhak', async () => {
    const feed = await api.getHomeFeed()
    const diBeranda = feed.sections.flatMap((s) => s.stories.map((x) => x.id))
    expect(diBeranda).not.toContain(DEWASA)

    const cari = await api.search('Malam Tanpa Rembulan', {
      page: 1,
      pageSize: 20,
      sort: 'relevan',
    })
    expect(cari.stories.map((s) => s.id)).not.toContain(DEWASA)

    const awal = await api.getStarterPicks(['Mystery', 'Thriller'])
    expect(awal.map((s) => s.id)).not.toContain(DEWASA)
  })

  it('membeli bab 18+ ditolak sebelum satu koin pun terpotong', async () => {
    const sebelum = (await api.getWallet()).balance
    await expect(
      api.unlockChapter({ chapterId: BAB_DEWASA, source: 'coin', idempotencyKey: 'age-test-1' }),
    ).rejects.toSatisfy((e: unknown) => isApiError(e) && e.code === 'FORBIDDEN')
    expect((await api.getWallet()).balance).toBe(sebelum)
  })

  it('mode `gated`: halaman detail tetap terbuka; mode `hidden`: NOT_FOUND', async () => {
    expect((await api.getStory(DEWASA)).id).toBe(DEWASA)

    await setAdultModeAsDev('hidden')
    await expect(api.getStory(DEWASA)).rejects.toSatisfy(
      (e: unknown) => isApiError(e) && e.code === 'NOT_FOUND',
    )
    await expect(api.getChapter(DEWASA, BAB_DEWASA)).rejects.toSatisfy(
      (e: unknown) => isApiError(e) && e.code === 'NOT_FOUND',
    )
  })

  it('alur verifikasi: none → pending → verified membuka bab; sakelar menampilkannya di beranda', async () => {
    expect((await api.getAgeVerification()).status).toBe('none')

    const diajukan = await ajukan()
    expect(diajukan.status).toBe('pending')
    expect(diajukan.isAdult).toBe(false)
    // Masih ditinjau: babnya tetap tertahan.
    expect((await api.getChapter(DEWASA, BAB_DEWASA)).ageRestricted).toBe(true)
    // Dua dokumen tidak boleh antre untuk satu akun.
    await expect(ajukan()).rejects.toSatisfy((e: unknown) => isApiError(e) && e.code === 'CONFLICT')

    await decideAgeVerificationAsDev(ME, 'approve')
    const disetujui = await api.getAgeVerification()
    expect(disetujui.status).toBe('verified')
    expect(disetujui.isAdult).toBe(true)

    const bab = await api.getChapter(DEWASA, BAB_DEWASA)
    expect(bab.ageRestricted).toBe(false)
    expect(bab.content.length).toBeGreaterThan(0)

    // Terverifikasi saja belum menaruhnya di beranda — sakelarnya masih mati.
    let feed = await api.getHomeFeed()
    expect(feed.sections.flatMap((s) => s.stories.map((x) => x.id))).not.toContain(DEWASA)

    await api.setShowAdultContent(true)
    feed = await api.getHomeFeed()
    expect(feed.sections.flatMap((s) => s.stories.map((x) => x.id))).toContain(DEWASA)
  })

  it('ditolak membawa alasannya, dan boleh mengajukan lagi', async () => {
    await ajukan()
    await decideAgeVerificationAsDev(ME, 'reject', 'Foto buram.')
    const ditolak = await api.getAgeVerification()
    expect(ditolak.status).toBe('rejected')
    expect(ditolak.rejectReason).toBe('Foto buram.')
    expect((await ajukan()).status).toBe('pending')
  })

  it('terverifikasi tetapi belum 18 tetap tertahan — usianya dihitung hari ini, bukan disimpan', async () => {
    await api.submitAgeVerification({
      birthDate: '2012-01-01',
      documentName: 'kia.jpg',
      documentSize: 100_000,
    })
    await decideAgeVerificationAsDev(ME, 'approve')
    const v = await api.getAgeVerification()
    expect(v.status).toBe('verified')
    expect(v.isAdult).toBe(false)
    expect((await api.getChapter(DEWASA, BAB_DEWASA)).ageRestricted).toBe(true)
  })
})

describe('mengikuti penulis · A2', () => {
  it('cerita penulis yang diikuti tayang → pengikutnya dapat notifikasi `cerita-baru` menuju ceritanya', async () => {
    // Akun contoh mengikuti `a2` (seed). Sisipkan satu cerita `a2` yang sedang
    // ditinjau, lalu setujui — satu-satunya jalur cerita jadi `published`.
    const contoh = await db.stories.get('s1')
    if (!contoh) throw new Error('seed s1 hilang')
    await db.stories.put({
      ...contoh,
      id: 'uji-cerita-baru',
      title: 'Cerita Uji Pengikut',
      authorId: 'a2',
      penName: 'Rani Kusuma',
      review: 'in_review',
    })

    await resolveReviewAsAdmin({ kind: 'story', refId: 'uji-cerita-baru' }, 'approve')

    const page = await api.listNotifications({ page: 1, pageSize: 50, unreadOnly: false })
    const baris = page.items.find((n) => n.kind === 'cerita-baru')
    expect(baris).toBeDefined()
    expect(baris?.title).toContain('Rani Kusuma')
    expect(baris?.deepLink).toBe('/cerita/uji-cerita-baru')

    await db.stories.delete('uji-cerita-baru')
  })

  it('section "Dari Penulis yang Kamu Ikuti" ada di beranda dan hanya berisi karya mereka', async () => {
    const feed = await api.getHomeFeed()
    const section = feed.sections.find((s) => s.id === 'mengikuti')
    expect(section).toBeDefined()
    expect(section?.seeAll).toBeNull()
    for (const story of section?.stories ?? []) expect(['a2', 'a3']).toContain(story.authorId)
  })

  it('tanpa satu pun penulis diikuti, section-nya tetap dikirim — kosong, supaya layar bisa mengajak', async () => {
    const punya = await db.follows.where('followerId').equals(ME).toArray()
    await db.follows.bulkDelete(punya.map((f) => f.id))
    try {
      const feed = await api.getHomeFeed()
      const section = feed.sections.find((s) => s.id === 'mengikuti')
      expect(section).toBeDefined()
      expect(section?.stories).toEqual([])
    } finally {
      await db.follows.bulkPut(punya)
    }
  })
})

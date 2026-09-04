import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { resolveReviewAsAdmin } from '@/api/mock/handlers/schedule'
import { CURRENT_USER_ID } from '@/api/mock/seed'

const at = (offsetMinutes: number) => new Date(Date.now() + offsetMinutes * 60_000).toISOString()

async function entry(id: string, storyId: string, chapterId: string | null, when: string) {
  const story = await db.stories.get(storyId)
  await db.scheduleEntries.put({
    id,
    storyId,
    storyTitle: story?.title ?? '',
    chapterId,
    chapterLabel: chapterId ? `Bab ${chapterId}` : null,
    publishAtUtc: when,
    authorTz: 'Asia/Jakarta',
    cadence: 'once',
    kind: 'ok',
    note: null,
  })
}

beforeEach(async () => {
  await db.authorProfiles.put({
    userId: CURRENT_USER_ID,
    tier: 'verified',
    payoutVerified: true,
    twoFactor: true,
    termsAcceptedAt: new Date().toISOString(),
  })
  await db.scheduleEntries.clear()
  // Cerita penulis kembali ke keadaan awal: satu tamat, satu draf, satu dalam
  // tinjauan, satu ditolak.
  await db.stories.update('ms1', { review: 'published', status: 'completed' })
  await db.stories.update('ms2', { review: 'draft', status: 'ongoing' })
  await db.stories.update('ms3', { review: 'in_review', status: 'ongoing' })
  await db.stories.update('ms4', { review: 'rejected', status: 'ongoing' })
  for (const id of ['ms1-c43', 'ms1-c44']) {
    await db.chapters.update(id, { review: id === 'ms1-c44' ? 'in_review' : 'rejected' })
  }
})

describe('jadwal terpadu · FR-STUDIO-37', () => {
  it('entri diurutkan menurut waktu, lintas cerita', async () => {
    await entry('e1', 'ms1', 'ms1-c48', at(240))
    await entry('e2', 'ms2', null, at(60))
    await entry('e3', 'ms1', 'ms1-c49', at(600))

    const list = (await api.listSchedule()).filter((e) => e.publishAtUtc !== null)
    expect(list.map((e) => e.id)).toEqual(['e2', 'e1', 'e3'])
  })

  it('dua penerbitan cerita yang sama berjarak 30 menit dianggap bentrok', async () => {
    await entry('e1', 'ms1', 'ms1-c48', at(120))
    await entry('e2', 'ms1', 'ms1-c49', at(150))

    const list = await api.listSchedule()
    expect(list.filter((e) => e.kind === 'clash')).toHaveLength(2)
  })

  it('cerita berbeda pada jam yang sama bukan bentrok', async () => {
    await entry('e1', 'ms1', 'ms1-c48', at(120))
    await entry('e2', 'ms2', null, at(125))

    const list = await api.listSchedule()
    expect(list.filter((e) => e.kind === 'clash')).toHaveLength(0)
  })

  it('bentrok dihitung ulang tiap pembacaan — menggeser satu entri memperbaikinya', async () => {
    await entry('e1', 'ms1', 'ms1-c48', at(120))
    await entry('e2', 'ms1', 'ms1-c49', at(150))
    expect((await api.listSchedule()).filter((e) => e.kind === 'clash')).toHaveLength(2)

    // Digeser dua jam; tidak ada yang perlu ingat memperbarui tetangganya.
    await entry('e2', 'ms1', 'ms1-c49', at(270))
    expect((await api.listSchedule()).filter((e) => e.kind === 'clash')).toHaveLength(0)
  })

  it('cerita terbit tanpa jadwal berikutnya memunculkan peringatan celah', async () => {
    await db.stories.update('ms1', { status: 'ongoing' })

    const gaps = (await api.listSchedule()).filter((e) => e.kind === 'gap')
    expect(gaps.map((e) => e.storyId)).toContain('ms1')
    // Cerita tamat tidak dianggap punya celah — ia memang selesai.
    await db.stories.update('ms1', { status: 'completed' })
    expect(
      (await api.listSchedule()).filter((e) => e.storyId === 'ms1' && e.kind === 'gap'),
    ).toHaveLength(0)
  })

  it('momen terbit tersimpan UTC, jadi tampilan zona lain tidak menggesernya', async () => {
    const when = at(180)
    await entry('e1', 'ms1', 'ms1-c48', when)

    const list = await api.listSchedule()
    // Yang tersimpan tetap instan yang sama, apa pun zona waktu pembacanya.
    expect(list.find((e) => e.id === 'e1')?.publishAtUtc).toBe(when)
    expect(new Date(when).toISOString().endsWith('Z')).toBe(true)
  })

  it('membatalkan entri mengembalikan babnya jadi draf, bukan menghapusnya', async () => {
    await db.chapters.update('ms1-c48', { state: 'scheduled', publishAt: at(120) })
    await entry('e1', 'ms1', 'ms1-c48', at(120))

    await api.cancelScheduleEntry('e1')

    expect(await db.scheduleEntries.get('e1')).toBeUndefined()
    expect(await db.chapters.get('ms1-c48')).toMatchObject({ state: 'draft', publishAt: null })
  })
})

describe('antrean tinjauan · FR-STUDIO-38', () => {
  it('satu antrean mengumpulkan cerita, bab, dan pesanan cetak', async () => {
    const queue = await api.listReviewQueue()
    const kinds = new Set(queue.map((item) => item.kind))

    expect(kinds).toContain('story')
    expect(kinds).toContain('chapter')
    // Baris bab menyebut cerita induknya, bukan hanya nomornya.
    expect(queue.find((item) => item.kind === 'chapter')?.context).toBeTruthy()
    // Dan setiap baris punya tujuan — antrean tanpa tautan hanya memindahkan
    // pekerjaan mencari ke penulisnya.
    for (const item of queue) expect(item.link.length).toBeGreaterThan(1)
  })

  it('cerita ditolak membawa alasannya yang spesifik', async () => {
    const rejected = (await api.listReviewQueue()).find(
      (item) => item.kind === 'story' && item.status === 'rejected',
    )
    expect(rejected?.reason).toMatch(/kutipan panjang/)
  })

  it('antrean diturunkan dari sumbernya — memperbaiki cerita menghapus barisnya', async () => {
    expect((await api.listReviewQueue()).some((i) => i.refId === 'ms3')).toBe(true)

    await api.withdrawFromReview({ kind: 'story', refId: 'ms3' })

    expect((await api.listReviewQueue()).some((i) => i.refId === 'ms3')).toBe(false)
    expect((await db.stories.get('ms3'))?.review).toBe('draft')
  })

  it('mengirim untuk ditinjau tidak menerbitkan apa pun', async () => {
    await db.chapters.update('ms1-c51', { review: 'draft', state: 'draft' })

    const item = await api.submitForReview({ kind: 'chapter', refId: 'ms1-c51' })
    expect(item.status).toBe('in_review')

    // Yang dikirim untuk ditinjau **tidak tampil ke pembaca**.
    const chapter = await db.chapters.get('ms1-c51')
    expect(chapter?.state).toBe('draft')
    expect(chapter?.review).toBe('in_review')
  })

  it('membatalkan pengiriman mengembalikan ke draf, bukan menghilangkan', async () => {
    await api.submitForReview({ kind: 'chapter', refId: 'ms1-c51' })
    await api.withdrawFromReview({ kind: 'chapter', refId: 'ms1-c51' })

    expect((await db.chapters.get('ms1-c51'))?.review).toBe('draft')
    expect(await db.chapters.get('ms1-c51')).toBeDefined()
  })

  it('keputusan admin menutup rantainya: disetujui → tayang, ditolak → beralasan', async () => {
    await db.chapters.update('ms1-c51', { review: 'draft', state: 'draft' })
    await api.submitForReview({ kind: 'chapter', refId: 'ms1-c51' })

    await resolveReviewAsAdmin({ kind: 'chapter', refId: 'ms1-c51' }, 'approve')
    expect(await db.chapters.get('ms1-c51')).toMatchObject({
      review: 'published',
      state: 'published',
    })
    expect((await api.listReviewQueue()).some((i) => i.refId === 'ms1-c51')).toBe(false)

    await resolveReviewAsAdmin(
      { kind: 'story', refId: 'ms2' },
      'reject',
      'Sinopsis terlalu pendek.',
    )
    const rejected = (await api.listReviewQueue()).find((i) => i.refId === 'ms2')
    expect(rejected?.status).toBe('rejected')
    expect(rejected?.reason).toBe('Sinopsis terlalu pendek.')
  })

  it('cerita dalam tinjauan tidak tampil ke pembaca', async () => {
    await db.stories.update('ms3', { review: 'in_review', visibility: 'public' })
    const found = await api.search('Perjamuan', { page: 1, pageSize: 20, sort: 'relevan' })

    expect(found.stories.some((story) => story.id === 'ms3')).toBe(false)
  })
})

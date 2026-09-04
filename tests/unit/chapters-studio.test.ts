import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { todayLocalISO } from '@/lib/date'

const params = { page: 1, pageSize: 50, status: 'all' as const, sort: 'number' as const }

beforeEach(async () => {
  await db.authorProfiles.put({
    userId: CURRENT_USER_ID,
    tier: 'verified',
    payoutVerified: true,
    twoFactor: true,
    termsAcceptedAt: new Date().toISOString(),
  })

  // Dipulihkan di sini, bukan di akhir tiap test: pembersihan di akhir tidak
  // pernah berjalan justru pada test yang gagal — dan di situlah kebocoran
  // keadaan paling merugikan.
  await db.chapters.update('ms1-c51', { state: 'draft', review: 'draft', publishAt: null })
  await db.chapters.update('ms1-c45', {
    state: 'private',
    access: 'private',
    review: 'published',
    publishAt: null,
  })
  await db.scheduleEntries.where('id').startsWith('sch-chapter-').delete()
})

const find = async (chapterId: string) =>
  (await api.getChaptersForAuthor('ms1', params)).items.find((c) => c.id === chapterId)

describe('enam status bab · FR-STUDIO-08 · FR-STUDIO-38', () => {
  it('menurunkan status dari state dan review sekaligus', async () => {
    const page = await api.getChaptersForAuthor('ms1', params)
    const byStatus = new Map(page.items.map((c) => [c.id, c.authorStatus]))

    expect(byStatus.get('ms1-c51')).toBe('draft')
    expect(byStatus.get('ms1-c49')).toBe('scheduled')
    expect(byStatus.get('ms1-c47')).toBe('published')
    expect(byStatus.get('ms1-c45')).toBe('private')
    // Dua status tinjauan mendahului keadaan terbitnya.
    expect(byStatus.get('ms1-c44')).toBe('in_review')
    expect(byStatus.get('ms1-c43')).toBe('rejected')
  })

  it('draf membawa perkiraan kelengkapan dari jumlah katanya', async () => {
    // 620 kata dari target 1.500 ≈ 41%.
    expect((await find('ms1-c51'))?.progressPct).toBe(41)
  })

  it('cerita orang lain ditolak, bukan dikembalikan kosong', async () => {
    await expect(api.getChaptersForAuthor('s1', params)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })
})

describe('cari, saring, urut · FR-STUDIO-09', () => {
  it('urutan bawaan nomor menurun — bab terbaru dulu', async () => {
    const page = await api.getChaptersForAuthor('ms1', params)
    const numbers = page.items.map((c) => c.number)
    expect(numbers).toEqual([...numbers].sort((a, b) => b - a))
  })

  it('tiga urutan lain menyusun ulang daftarnya', async () => {
    const views = (await api.getChaptersForAuthor('ms1', { ...params, sort: 'views' })).items.map(
      (c) => c.views,
    )
    expect(views).toEqual([...views].sort((a, b) => b - a))

    const edited = (await api.getChaptersForAuthor('ms1', { ...params, sort: 'edited' })).items.map(
      (c) => c.editedAt,
    )
    expect(edited).toEqual([...edited].sort((a, b) => b.localeCompare(a)))
  })

  it('pencarian judul dan saringan status bersifat AND', async () => {
    const hit = await api.getChaptersForAuthor('ms1', { ...params, q: 'sarapan' })
    expect(hit.items.map((c) => c.id)).toEqual(['ms1-c51'])

    const miss = await api.getChaptersForAuthor('ms1', {
      ...params,
      status: 'published',
      q: 'sarapan',
    })
    expect(miss.total).toBe(0)
  })
})

describe('papan kepala halaman · FR-STUDIO-07', () => {
  it('tiga penghitung dihitung dari seluruh bab, bukan halaman yang tampil', async () => {
    const board = await api.getChapterBoard('ms1')

    expect(board.draft).toBe(2)
    expect(board.scheduled).toBe(2)
    expect(board.published).toBe(2)
  })

  it('empat pemberitahuan lahir dari keadaan bab, dan semuanya punya tujuan', async () => {
    const board = await api.getChapterBoard('ms1')
    const kinds = board.notices.map((n) => n.kind)

    expect(kinds).toContain('stale-draft')
    expect(kinds).toContain('hidden')
    expect(kinds).toContain('milestone')
    for (const notice of board.notices) expect(notice.href.length).toBeGreaterThan(1)
  })
})

describe('aksi bab · FR-STUDIO-08 · FR-STUDIO-10 · FR-STUDIO-11', () => {
  it('naskah baru masuk tinjauan; bab yang sudah lolos tinjauan terbit langsung', async () => {
    // Draf baru → antrean tinjauan, dan **belum** tampil ke pembaca
    // (FR-STUDIO-38).
    const draft = await api.publishChapter('ms1-c51')
    expect(draft.authorStatus).toBe('in_review')
    expect((await db.chapters.get('ms1-c51'))?.state).toBe('draft')

    // Bab privat pernah terbit — menampilkannya kembali bukan konten baru.
    const hidden = await api.publishChapter('ms1-c45')
    expect(hidden.authorStatus).toBe('published')
    expect(hidden.access).not.toBe('private')
  })

  it('bab yang ditolak tinjauan tidak bisa langsung terbit', async () => {
    await expect(api.publishChapter('ms1-c43')).rejects.toMatchObject({ code: 'CONFLICT' })
    expect((await find('ms1-c43'))?.authorStatus).toBe('rejected')
  })

  it('menjadwalkan bab menulis baris jadwalnya sendiri, terpisah dari jadwal cerita', async () => {
    // Besok menurut **zona waktu lokal**: di WIB pagi, "besok UTC" masih hari
    // ini, dan penjadwal menolaknya sebagai waktu yang sudah lewat.
    const besok = todayLocalISO(new Date(Date.now() + 86_400_000))
    const after = await api.scheduleChapter({
      chapterId: 'ms1-c51',
      date: besok,
      time: '07:00',
      cadence: 'once',
    })

    expect(after.authorStatus).toBe('scheduled')
    const entry = await db.scheduleEntries.get('sch-chapter-ms1-c51')
    expect(entry?.chapterId).toBe('ms1-c51')
    expect(entry?.chapterLabel).toMatch(/^Bab 51/)

    // Membatalkannya mengembalikan babnya jadi draf, bukan menghilangkannya.
    const back = await api.unscheduleChapter('ms1-c51')
    expect(back.authorStatus).toBe('draft')
    expect(await db.scheduleEntries.get('sch-chapter-ms1-c51')).toBeUndefined()
  })

  it('waktu terbit yang sudah lewat ditolak', async () => {
    await expect(
      api.scheduleChapter({
        chapterId: 'ms1-c51',
        date: '2020-01-01',
        time: '07:00',
        cadence: 'once',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION' })
  })

  it('bab terbit yang sudah dibeli menolak dihapus', async () => {
    await db.ownerships.put({
      id: 'own-uji-bab',
      userId: 'u9',
      chapterId: 'ms1-c47',
      source: 'coin',
      acquiredAt: new Date().toISOString(),
    })

    await expect(api.deleteChapter('ms1-c47')).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(await db.chapters.get('ms1-c47')).toBeDefined()

    await db.ownerships.delete('own-uji-bab')
  })

  it('draf boleh dihapus beserta isinya', async () => {
    const base = await db.chapters.get('ms1-c51')
    if (!base) throw new Error('bab acuan tidak ada')
    await db.chapters.put({ ...base, id: 'ms1-c99', number: 99, title: 'Bab Sekali Pakai' })

    await api.deleteChapter('ms1-c99')
    expect(await db.chapters.get('ms1-c99')).toBeUndefined()
  })
})

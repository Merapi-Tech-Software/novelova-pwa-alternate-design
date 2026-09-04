import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import type { CommentParams } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { COMMENT_MAX_CHARS } from '@/lib/limits'

const P = (over: Partial<CommentParams> = {}): CommentParams => ({
  page: 1,
  pageSize: 20,
  sort: 'newest',
  ...over,
})

/** Bab yang **dimiliki** pembaca contoh — komentarnya ada di seed. */
const OPEN = 's1-c5'

/**
 * Bab berbayar yang tidak dimiliki siapa pun. Dicari, bukan dibuat: mencabut
 * kepemilikan bab yang dipakai test lain akan menjatuhkan hitungan pembelian di
 * analitik penulis.
 */
async function lockedChapterId(): Promise<string> {
  const owned = new Set((await db.ownerships.toArray()).map((o) => o.chapterId))
  const rows = await db.chapters.where('storyId').equals('s1').toArray()
  const locked = rows.find((c) => c.access !== 'free' && !owned.has(c.id))
  if (!locked) throw new Error('butuh satu bab berbayar yang belum dibeli')
  return locked.id
}

beforeEach(async () => {
  for (const row of await db.comments.toArray()) {
    if (row.id.startsWith('cm-')) await db.comments.delete(row.id)
  }
  for (const row of await db.reactions.toArray()) {
    if (row.userId === CURRENT_USER_ID) await db.reactions.delete(row.id)
  }
})

describe('bab terkunci · FR-SOCIAL-05', () => {
  it('menolak **membaca** komentarnya, bukan hanya menulis', async () => {
    const locked = await lockedChapterId()
    const error = await api.listComments(locked, P()).catch((e: unknown) => e)

    expect(isApiError(error) && error.code).toBe('FORBIDDEN')
    // Penjelasannya menyebut alasannya: komentar memuat isi bab.
    expect(String(error)).toMatch(/memuat isi bab/)
  })

  it('menolak menulis di bab yang belum dibuka', async () => {
    const locked = await lockedChapterId()
    await expect(
      api.postComment({ chapterId: locked, text: 'halo', parentId: null, spoiler: false }),
    ).rejects.toThrow(/Buka babnya dulu/)
  })
})

describe('utas & balasan · FR-SOCIAL-05', () => {
  it('komentar terikat pada satu bab, bukan pada cerita', async () => {
    const page = await api.listComments(OPEN, P())
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((c) => c.chapterId === OPEN)).toBe(true)
  })

  it('balasan atas balasan tetap satu tingkat — servernya yang menaikkan induknya', async () => {
    const root = await api.postComment({
      chapterId: OPEN,
      text: 'Bab ini mengubah cara saya membaca bab sepuluh.',
      parentId: null,
      spoiler: false,
    })
    const reply = await api.postComment({
      chapterId: OPEN,
      text: 'Setuju, terutama bagian percakapan di parkiran.',
      parentId: root.id,
      spoiler: false,
    })
    const replyToReply = await api.postComment({
      chapterId: OPEN,
      text: 'Bagian itu juga yang paling saya ingat.',
      parentId: reply.id,
      spoiler: false,
    })

    expect(reply.parentId).toBe(root.id)
    // Membalas balasan **tidak** membuat tingkat ketiga.
    expect(replyToReply.parentId).toBe(root.id)

    const page = await api.listComments(OPEN, P())
    const thread = page.items.find((c) => c.id === root.id)
    expect(thread?.replies).toHaveLength(2)
  })

  it('hanya utas induk yang dipaginasi; balasan ikut induknya', async () => {
    const page = await api.listComments(OPEN, P())
    expect(page.items.every((c) => c.parentId === null)).toBe(true)
    expect(page.total).toBe(page.items.length)
  })

  it('komentar melebihi 500 karakter ditolak beserta panjang sekarang', async () => {
    const tooLong = 'a'.repeat(COMMENT_MAX_CHARS + 1)
    await expect(
      api.postComment({ chapterId: OPEN, text: tooLong, parentId: null, spoiler: false }),
    ).rejects.toThrow(new RegExp(`Sekarang ${COMMENT_MAX_CHARS + 1}`))
  })

  it('ketiga urutan dijalankan server', async () => {
    const newest = await api.listComments(OPEN, P())
    const dates = newest.items.map((c) => c.createdAt)
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)))

    const oldest = await api.listComments(OPEN, P({ sort: 'oldest' }))
    const asc = oldest.items.map((c) => c.createdAt)
    expect(asc).toEqual([...asc].sort((a, b) => a.localeCompare(b)))

    const liked = await api.listComments(OPEN, P({ sort: 'liked' }))
    const likes = liked.items.map((c) => c.likeCount)
    expect(likes).toEqual([...likes].sort((a, b) => b - a))
  })

  it('balasan selalu terurut terlama → terbaru apa pun urutan induknya', async () => {
    const root = await api.postComment({
      chapterId: OPEN,
      text: 'Utas untuk menguji urutan balasan.',
      parentId: null,
      spoiler: false,
    })
    // Stempel waktunya dibedakan **eksplisit**: dua balasan yang dibuat dalam
    // milidetik yang sama punya `createdAt` identik, dan test yang bergantung
    // resolusi jam akan lolos atau gagal karena kecepatan mesin.
    const first = await api.postComment({
      chapterId: OPEN,
      text: 'Balasan pertama.',
      parentId: root.id,
      spoiler: false,
    })
    const second = await api.postComment({
      chapterId: OPEN,
      text: 'Balasan kedua.',
      parentId: root.id,
      spoiler: false,
    })
    await db.comments.update(first.id, { createdAt: new Date(Date.now() - 60_000).toISOString() })
    await db.comments.update(second.id, { createdAt: new Date().toISOString() })

    const page = await api.listComments(OPEN, P({ sort: 'oldest' }))
    const thread = page.items.find((c) => c.id === root.id)
    const order = thread?.replies?.map((r) => r.text) ?? []
    expect(order).toEqual(['Balasan pertama.', 'Balasan kedua.'])
  })
})

describe('lencana, suka & tinjauan · FR-SOCIAL-05 · FR-SOCIAL-07', () => {
  it('komentar penulis cerita diberi lencana Penulis', async () => {
    const page = await api.listComments(OPEN, P())
    const fromAuthor = page.items.flatMap((c) => [c, ...(c.replies ?? [])]).find((c) => c.isAuthor)
    expect(fromAuthor).toBeDefined()
  })

  it('suka komentar bisa dibatalkan, dan menyukai dua kali tidak menghitung dua kali', async () => {
    const page = await api.listComments(OPEN, P())
    const target = page.items[0]
    if (!target) throw new Error('butuh satu komentar')

    await api.react({ type: 'comment', id: target.id }, true)
    await api.react({ type: 'comment', id: target.id }, true)
    const after = (await api.listComments(OPEN, P())).items.find((c) => c.id === target.id)
    expect(after?.likeCount).toBe(target.likeCount + 1)
    expect(after?.liked).toBe(true)

    await api.react({ type: 'comment', id: target.id }, false)
    const undone = (await api.listComments(OPEN, P())).items.find((c) => c.id === target.id)
    expect(undone?.likeCount).toBe(target.likeCount)
  })

  it('komentar sedang ditinjau **tetap ada barisnya**, tidak hilang diam-diam', async () => {
    const page = await api.listComments(OPEN, P())
    const target = page.items[0]
    if (!target) throw new Error('butuh satu komentar')
    await db.comments.update(target.id, { underReview: true })

    const after = await api.listComments(OPEN, P())
    expect(after.items.some((c) => c.id === target.id)).toBe(true)
    expect(after.items.find((c) => c.id === target.id)?.underReview).toBe(true)

    await db.comments.update(target.id, { underReview: false })
  })
})

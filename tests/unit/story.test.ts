import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'

beforeEach(async () => {
  await db.libraryEntries.where('[userId+storyId]').equals([CURRENT_USER_ID, 's2']).delete()
})

describe('detail cerita · prd_04', () => {
  it('status kunci datang dari Ownership, bukan dari harga', async () => {
    const page = await api.getChapters('s1', { page: 1, pageSize: 20 })
    const bought = page.items.find((c) => c.id === 's1-c4')
    const stillLocked = page.items.find((c) => c.id === 's1-c8')

    // s1-c4 berbayar tetapi sudah dibeli di seed; s1-c8 berbayar dan belum.
    expect(bought?.access).toBe('paid')
    expect(bought?.owned).toBe(true)
    expect(stillLocked?.owned).toBe(false)
  })

  it('harga per bab datang dari server, bukan satu konstanta', async () => {
    const page = await api.getChapters('s1', { page: 1, pageSize: 20 })
    const prices = new Set(page.items.filter((c) => c.access === 'paid').map((c) => c.priceCoins))

    expect(prices.size).toBeGreaterThan(1)
  })

  it('daftar bab berpaginasi 20 dan bisa dibalik urutannya', async () => {
    const asc = await api.getChapters('s1', { page: 1, pageSize: 20 })
    const desc = await api.getChapters('s1', { page: 1, pageSize: 20, sort: 'desc' })

    expect(asc.items).toHaveLength(20)
    expect(asc.total).toBeGreaterThan(20)
    expect(asc.items[0]?.number).toBe(1)
    expect(desc.items[0]?.number).toBe(asc.total)
  })

  it('pencarian bab menerima judul maupun nomornya', async () => {
    const byNumber = await api.getChapters('s1', { page: 1, pageSize: 20, q: '5' })
    const byTitle = await api.getChapters('s1', { page: 1, pageSize: 20, q: 'kopi' })

    expect(byNumber.items.some((c) => c.number === 5)).toBe(true)
    expect(byTitle.items.every((c) => c.title.toLowerCase().includes('kopi'))).toBe(true)
  })

  it('"Lanjutkan — Bab N" datang dari progres, bukan dari tebakan', async () => {
    const detail = await api.getStory('s1')
    const progress = await db.progress
      .where('[userId+storyId]')
      .equals([CURRENT_USER_ID, 's1'])
      .first()

    expect(detail.continueChapterId).toBe(progress?.lastChapterId ?? null)
    expect(detail.continueChapterNumber).toBeGreaterThan(0)
  })
})

describe('Simpan ≠ Ikuti · FR-DETAIL-13', () => {
  it('menyimpan menyalakan follow', async () => {
    const before = await api.getStory('s2')
    expect(before.inLibrary).toBe(false)

    await api.toggleLibrary('s2')
    const after = await api.getStory('s2')

    expect(after.inLibrary).toBe(true)
    expect(after.following).toBe(true)
  })

  it('melepas follow tidak mengeluarkan cerita dari koleksi', async () => {
    await api.toggleLibrary('s2')
    await api.toggleFollow('s2')
    const after = await api.getStory('s2')

    expect(after.following).toBe(false)
    expect(after.inLibrary).toBe(true)
  })

  it('mengikuti tanpa menyimpan tidak memasukkan cerita ke koleksi', async () => {
    await api.toggleFollow('s2')
    const after = await api.getStory('s2')

    expect(after.following).toBe(true)
    expect(after.inLibrary).toBe(false)
  })
})

describe('voucher · FR-DETAIL-09 · FR-RWD-06', () => {
  it('kode tidak peka huruf besar-kecil', async () => {
    const voucher = await api.redeemVoucher('  mulai5  ')
    expect(voucher.code).toBe('MULAI5')
  })

  it('kode yang tidak dikenali ditolak dengan pesan, bukan diam', async () => {
    await expect(api.redeemVoucher('KODEPALSU')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('voucher kedaluwarsa ditolak', async () => {
    const template = await db.vouchers.get('v1')
    if (!template) throw new Error('seed voucher hilang')
    await db.vouchers.put({
      ...template,
      id: 'v-lewat',
      code: 'SUDAHLEWAT',
      expiresAt: new Date(Date.now() - 86_400_000).toISOString(),
    })

    await expect(api.redeemVoucher('SUDAHLEWAT')).rejects.toMatchObject({ code: 'PAY-410' })
  })

  it('cakupan dihormati: hanya bab yang berhak yang terbuka', async () => {
    // `MULAI5` hanya berlaku untuk `s6` — dan itu ditegakkan server.
    await expect(api.applyVoucher('v2', 's1')).rejects.toMatchObject({ code: 'FORBIDDEN' })

    const result = await api.applyVoucher('v2', 's6')
    const chapters = await api.getChapters('s6', { page: 1, pageSize: 20 })

    // `firstN` 5, dan tiga bab pertama memang sudah gratis — jadi yang terbuka
    // hanya bab berbayar di dalam cakupannya.
    expect(result.unlockedChapterIds.length).toBeGreaterThan(0)
    for (const id of result.unlockedChapterIds) {
      const chapter = chapters.items.find((c) => c.id === id)
      expect(chapter?.access).toBe('paid')
      expect(chapter?.number).toBeLessThanOrEqual(5)
    }
  })

  it('voucher yang dimiliki bisa dipakai tanpa mengetik kodenya lagi', async () => {
    const owned = await api.listVouchers()

    expect(owned.length).toBeGreaterThan(0)
    for (const voucher of owned) expect(voucher.usedCount).toBeLessThan(voucher.maxUses)
  })
})

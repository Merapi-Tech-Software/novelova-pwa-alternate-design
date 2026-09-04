import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { PRICE_BUNDLE_10, PRICE_FULL } from '@/lib/coin'
import { todayLocalISO } from '@/lib/date'

/** Mengembalikan dompet dan kepemilikan ke keadaan awal tiap test. */
beforeEach(async () => {
  await db.wallets.put({
    userId: CURRENT_USER_ID,
    balance: 15_300,
    bonus: 420,
    updatedAt: new Date().toISOString(),
  })
  await db.ownerships.where('userId').equals(CURRENT_USER_ID).delete()
  await db.idempotency.clear()
  await db.adQuotas.clear()
  await db.transactions.where('userId').equals(CURRENT_USER_ID).delete()
})

describe('membuka bab · FR-READ-07', () => {
  it('dua panggilan dengan kunci sama memotong saldo sekali', async () => {
    const input = { chapterId: 's1-c8', source: 'coin' as const, idempotencyKey: 'kunci-1' }

    const first = await api.unlockChapter(input)
    const second = await api.unlockChapter(input)

    expect(first.alreadyOwned).toBe(false)
    expect(second.alreadyOwned).toBe(true)
    expect(second.balance).toBe(first.balance)
    expect((await db.wallets.get(CURRENT_USER_ID))?.balance).toBe(15_300 - 2_000)
  })

  it('saldo 15.300 menolak "sampai tamat" 36.900, dan saldo tidak berubah', async () => {
    await expect(
      api.unlockChapter({ chapterId: 's1-c8', source: 'full', idempotencyKey: 'kunci-2' }),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_COINS' })

    expect((await db.wallets.get(CURRENT_USER_ID))?.balance).toBe(15_300)
    expect(await db.ownerships.where('userId').equals(CURRENT_USER_ID).count()).toBe(0)
  })

  it('bundel menulis sepuluh baris kepemilikan sekaligus', async () => {
    await db.wallets.put({
      userId: CURRENT_USER_ID,
      balance: PRICE_BUNDLE_10 + 500,
      bonus: 0,
      updatedAt: new Date().toISOString(),
    })

    const result = await api.unlockChapter({
      chapterId: 's1-c4',
      source: 'bundle',
      idempotencyKey: 'kunci-3',
    })

    expect(result.coinsSpent).toBe(PRICE_BUNDLE_10)
    expect(await db.ownerships.where('userId').equals(CURRENT_USER_ID).count()).toBe(10)
  })

  it('akses penuh membuka seluruh bab berbayar yang tersisa', async () => {
    await db.wallets.put({
      userId: CURRENT_USER_ID,
      balance: PRICE_FULL,
      bonus: 0,
      updatedAt: new Date().toISOString(),
    })

    await api.unlockChapter({ chapterId: 's1-c4', source: 'full', idempotencyKey: 'kunci-4' })
    const chapters = await api.getChapters('s1', { page: 1, pageSize: 20 })

    expect(chapters.items.every((c) => c.owned)).toBe(true)
  })

  it('bonus tidak ikut berkurang saat bab dibeli', async () => {
    await api.unlockChapter({ chapterId: 's1-c8', source: 'coin', idempotencyKey: 'kunci-5' })

    expect((await db.wallets.get(CURRENT_USER_ID))?.bonus).toBe(420)
  })

  it('setiap pembelian meninggalkan satu baris ledger', async () => {
    await api.unlockChapter({ chapterId: 's1-c8', source: 'coin', idempotencyKey: 'kunci-6' })
    const rows = await db.transactions.where('userId').equals(CURRENT_USER_ID).toArray()

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ kind: 'spend', amount: -2_000, refType: 'chapter' })
  })
})

describe('membuka bab dengan iklan · FR-READ-18', () => {
  it('kuota dipotong saat bab dibuka, dan tidak menyentuh saldo', async () => {
    const before = await api.getAdQuota()
    await api.unlockChapter({ chapterId: 's1-c8', source: 'ad', idempotencyKey: 'iklan-1' })
    const after = await api.getAdQuota()

    expect(after.used).toBe(before.used + 1)
    expect(after.date).toBe(todayLocalISO())
    expect((await db.wallets.get(CURRENT_USER_ID))?.balance).toBe(15_300)
  })

  it('kuota habis menolak permintaan berikutnya', async () => {
    await db.adQuotas.put({
      id: `${CURRENT_USER_ID}-${todayLocalISO()}`,
      userId: CURRENT_USER_ID,
      date: todayLocalISO(),
      used: 3,
      max: 3,
    })

    await expect(
      api.unlockChapter({ chapterId: 's1-c8', source: 'ad', idempotencyKey: 'iklan-2' }),
    ).rejects.toMatchObject({ code: 'QUOTA_EXCEEDED' })
  })
})

describe('kepemilikan bertahan · FR-CORE-01', () => {
  it('muat ulang setelah membeli: bab tetap terbuka dan saldo tetap berkurang', async () => {
    await api.unlockChapter({ chapterId: 's1-c8', source: 'coin', idempotencyKey: 'muat-1' })

    // "Muat ulang" di sisi klien berarti bertanya lagi ke server tanpa cache —
    // dan jawabannya harus sama, karena keduanya milik server (FR-CORE-01).
    const chapter = await api.getChapter('s1', 's1-c8')
    const wallet = await api.getWallet()

    expect(chapter.owned).toBe(true)
    expect(chapter.content.length).toBeGreaterThan(0)
    expect(wallet.balance).toBe(15_300 - 2_000)
  })
})

describe('bab ditarik penulisnya · CONTENT-410', () => {
  it('yang sudah dibeli dikembalikan persis sebesar harga belinya, satu baris ledger', async () => {
    await api.unlockChapter({ chapterId: 's1-c8', source: 'coin', idempotencyKey: 'tarik-1' })
    const afterBuy = (await api.getWallet()).balance

    const chapter = await db.chapters.get('s1-c8')
    if (!chapter) throw new Error('bab contoh hilang')
    await db.chapters.put({ ...chapter, withdrawnAt: new Date().toISOString() })

    await expect(api.getChapter('s1', 's1-c8')).rejects.toMatchObject({ code: 'CONTENT-410' })

    const wallet = await api.getWallet()
    const refunds = (
      await db.transactions.where('userId').equals(CURRENT_USER_ID).toArray()
    ).filter((tx) => tx.kind === 'refund')

    expect(wallet.balance).toBe(afterBuy + chapter.priceCoins)
    expect(refunds).toHaveLength(1)
    expect(refunds[0]?.amount).toBe(chapter.priceCoins)

    // Membuka berkali-kali tetap satu baris balik.
    await expect(api.getChapter('s1', 's1-c8')).rejects.toMatchObject({ code: 'CONTENT-410' })
    expect((await api.getWallet()).balance).toBe(afterBuy + chapter.priceCoins)

    await db.chapters.put({ ...chapter, withdrawnAt: null })
  })
})

describe('progres baca · FR-READ-16', () => {
  beforeEach(async () => {
    // Seed sudah menandai delapan bab pertama `s1` selesai; test ini menguji
    // aturannya, bukan sisa data contoh.
    await db.progress.delete(`${CURRENT_USER_ID}-s1`)
  })

  it('menyimpan posisi sebagai persentase dan menandai selesai di 90%', async () => {
    // Bab yang belum pernah ditandai selesai di seed, supaya batas 90% yang
    // diuji, bukan sisa data contoh.
    await api.saveProgress({ storyId: 's1', chapterId: 's1-c7', scrollPct: 0.42 })
    const half = await api.getProgress('s1')

    expect(half?.lastChapterId).toBe('s1-c7')
    expect(half?.scrollPct).toBeCloseTo(0.42)
    expect(half?.finishedChapterIds).not.toContain('s1-c7')

    await api.saveProgress({ storyId: 's1', chapterId: 's1-c7', scrollPct: 0.95 })
    expect((await api.getProgress('s1'))?.finishedChapterIds).toContain('s1-c7')
  })

  it('progres ikut ke daftar bab sebagai penanda "sudah dibaca"', async () => {
    await api.saveProgress({ storyId: 's1', chapterId: 's1-c3', scrollPct: 1 })
    const page = await api.getChapters('s1', { page: 1, pageSize: 20 })

    expect(page.items.find((c) => c.id === 's1-c3')?.finished).toBe(true)
  })
})

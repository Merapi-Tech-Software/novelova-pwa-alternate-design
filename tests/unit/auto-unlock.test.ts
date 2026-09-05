import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { SERVER_CONFIG } from '@/api/mock/config'
import { db } from '@/api/mock/db'
import { emptyReaderPrefs } from '@/api/mock/defaults'
import { CURRENT_USER_ID } from '@/api/mock/seed'

/**
 * Auto-unlock per cerita & tawaran bundling · FR-READ-09 · FR-READ-19 ·
 * `architecture.md` §1.19 dan §1.21.
 *
 * Ini **pemeriksaan sisi server**, dan itu disengaja: izin di sini memberi
 * wewenang memotong koin, dan aturan yang hanya ditegakkan layar akan dilanggar
 * oleh layar berikutnya yang memanggil seam yang sama.
 */

/** Bab berbayar `s1`, terurut nomor — yang dipakai seluruh berkas ini. */
async function babBerbayar(storyId: string) {
  return (await db.chapters.where('storyId').equals(storyId).toArray())
    .filter((c) => c.state === 'published' && c.access === 'paid')
    .sort((a, b) => a.number - b.number)
}

async function prefs() {
  return db.readerPrefs.get(CURRENT_USER_ID)
}

beforeEach(async () => {
  await db.readerPrefs.put(emptyReaderPrefs(CURRENT_USER_ID))
  await db.ownerships.where('userId').equals(CURRENT_USER_ID).delete()
  await db.idempotency.clear()
  // Baris ledger-nya ikut dibuang: `tx-<kunci idempotency>` adalah kunci primer,
  // dan test berikutnya yang memakai kunci sama akan gagal sebagai
  // ConstraintError — jauh dari sebabnya, dan tidak terbaca sebagai cacat test.
  const bekas = await db.transactions.where('userId').equals(CURRENT_USER_ID).toArray()
  await db.transactions.bulkDelete(bekas.filter((t) => t.id.startsWith('tx-k-')).map((t) => t.id))
  // Saldo dinaikkan **di test**, bukan di seed: angka 15,3rb tercetak di tiga
  // mockup, dan menaikkannya di seed membuat seluruhnya berhenti cocok (§1.21).
  await db.wallets.put({
    userId: CURRENT_USER_ID,
    balance: 500_000,
    bonus: 0,
    updatedAt: new Date().toISOString(),
  })
})

describe('izin buka-otomatis per cerita · FR-READ-09', () => {
  it('tersimpan per cerita, bukan sebagai sakelar global', async () => {
    await api.setAutoUnlock('s1', true)

    expect((await prefs())?.autoUnlockStoryIds).toEqual(['s1'])
    // Cerita lain tidak ikut menyala — itu seluruh isi perubahan §1.19.
    expect((await prefs())?.autoUnlockStoryIds).not.toContain('s3')

    await api.setAutoUnlock('s1', false)
    expect((await prefs())?.autoUnlockStoryIds).toEqual([])
  })

  it('dinyalakan bersama pembelian dalam satu panggilan', async () => {
    const bab = (await babBerbayar('s1'))[0]
    expect(bab).toBeDefined()

    await api.unlockChapter({
      idempotencyKey: 'k-gabung',
      chapterId: bab?.id ?? '',
      source: 'coin',
      enableAutoUnlock: true,
    })

    // Satu panggilan, dua akibat: babnya terbuka **dan** izinnya tersimpan.
    // Memecahnya membuka keadaan "koin terpotong, izin gagal tersimpan".
    expect((await prefs())?.autoUnlockStoryIds).toContain('s1')
    expect((await prefs())?.autoUnlockCounts.s1 ?? 0).toBe(0)
  })
})

describe('penghitung pembukaan otomatis · §1.21', () => {
  it('naik sekali per pembukaan otomatis, dan hanya untuk ceritanya sendiri', async () => {
    const bab = await babBerbayar('s1')

    for (const [i, c] of bab.slice(0, 3).entries()) {
      await api.unlockChapter({
        idempotencyKey: `k-auto-${i}`,
        chapterId: c.id,
        source: 'coin',
        auto: true,
      })
    }

    expect((await prefs())?.autoUnlockCounts.s1).toBe(3)
    expect((await prefs())?.autoUnlockCounts.s3).toBeUndefined()
  })

  it('TIDAK naik saat kunci idempotency dipakai ulang', async () => {
    const bab = (await babBerbayar('s1'))[0]

    const satu = await api.unlockChapter({
      idempotencyKey: 'k-ulang',
      chapterId: bab?.id ?? '',
      source: 'coin',
      auto: true,
    })
    const dua = await api.unlockChapter({
      idempotencyKey: 'k-ulang',
      chapterId: bab?.id ?? '',
      source: 'coin',
      auto: true,
    })

    expect(satu.alreadyOwned).toBe(false)
    expect(dua.alreadyOwned).toBe(true)
    /*
     * Pemakaian ulang kunci **tidak memotong koin**. Menaikkan penghitung di
     * sana mendekatkan pembaca ke tawaran belanja tanpa ia membayar apa pun —
     * dan penghitung yang bisa dinaikkan tanpa membayar bukan penghitung.
     */
    expect((await prefs())?.autoUnlockCounts.s1).toBe(1)
  })

  it('pembukaan manual tidak menaikkan penghitungnya sama sekali', async () => {
    const bab = (await babBerbayar('s1'))[0]

    await api.unlockChapter({
      idempotencyKey: 'k-manual',
      chapterId: bab?.id ?? '',
      source: 'coin',
    })

    expect((await prefs())?.autoUnlockCounts.s1).toBeUndefined()
  })
})

describe('tawaran bundling · FR-READ-19', () => {
  async function bukaOtomatis(storyId: string, berapa: number) {
    const bab = await babBerbayar(storyId)
    for (const [i, c] of bab.slice(0, berapa).entries()) {
      await api.unlockChapter({
        idempotencyKey: `k-${storyId}-${i}`,
        chapterId: c.id,
        source: 'coin',
        auto: true,
      })
    }
    return bab
  }

  it('null sebelum ambang, berisi sesudahnya', async () => {
    const ambang = SERVER_CONFIG.bundleOfferAfter
    const bab = await bukaOtomatis('s1', ambang - 1)
    const berikut = bab[ambang - 1]
    expect(berikut).toBeDefined()

    expect(await api.getBundleOffer('s1', berikut?.id ?? '')).toBeNull()

    await api.unlockChapter({
      idempotencyKey: 'k-ambang',
      chapterId: berikut?.id ?? '',
      source: 'coin',
      auto: true,
    })

    const setelah = bab[ambang]
    const tawaran = await api.getBundleOffer('s1', setelah?.id ?? '')
    expect(tawaran).not.toBeNull()
    expect(tawaran?.autoUnlockedCount).toBe(ambang)
    expect(tawaran?.chapterCount).toBeGreaterThan(0)
    /*
     * Hematnya dihitung dari harga bab **sungguhan**, bukan persentase tetap.
     * `prd_00` §6 dan `prd_05` §2 sama-sama menulis "hemat 5%" padahal sepuluh
     * bab seed berjumlah 17.200 melawan bundel 12.000 — 30% (§1.21).
     */
    expect(tawaran?.individualCoins).toBeGreaterThan(tawaran?.coins ?? 0)
  })

  it('cerita lain menghitung dari nol', async () => {
    await bukaOtomatis('s1', SERVER_CONFIG.bundleOfferAfter)
    const lain = await babBerbayar('s3')
    expect(lain.length).toBeGreaterThan(0)

    expect(await api.getBundleOffer('s3', lain[0]?.id ?? '')).toBeNull()
  })

  it('ditolak sekali berarti tidak muncul lagi di cerita itu', async () => {
    const bab = await bukaOtomatis('s1', SERVER_CONFIG.bundleOfferAfter)
    const berikut = bab[SERVER_CONFIG.bundleOfferAfter]

    expect(await api.getBundleOffer('s1', berikut?.id ?? '')).not.toBeNull()

    await api.dismissBundleOffer('s1')

    /*
     * Dan penolakannya bertahan **walau penghitungnya masih di atas ambang** —
     * itu sebabnya `bundleOfferSeenStoryIds` ada padahal penghitungnya sudah
     * cukup. Tanpa itu, kembali besok dengan penghitung masih 10 menampilkannya
     * lagi (§1.21).
     */
    expect(await api.getBundleOffer('s1', berikut?.id ?? '')).toBeNull()
    expect((await prefs())?.autoUnlockCounts.s1).toBe(SERVER_CONFIG.bundleOfferAfter)
  })
})

describe('membeli bundel dari pita · FR-READ-19', () => {
  it('membuka bab berikutnya sekaligus, dan saldo berkurang tepat sekali', async () => {
    const bab = await babBerbayar('s1')
    const mulai = bab[0]
    expect(mulai).toBeDefined()

    const sebelum = (await db.wallets.get(CURRENT_USER_ID))?.balance ?? 0
    const hasil = await api.unlockChapter({
      idempotencyKey: 'k-bundel',
      chapterId: mulai?.id ?? '',
      source: 'bundle',
    })

    const sesudah = (await db.wallets.get(CURRENT_USER_ID))?.balance ?? 0
    expect(sebelum - sesudah).toBe(hasil.coinsSpent)

    // Sepuluh bab berikutnya sudah dimiliki — jadi auto-unlock melewatinya
    // tanpa memotong koin lagi; tidak ada "saldo bundel" yang perlu disimpan.
    const dimiliki = new Set(
      (await db.ownerships.where('userId').equals(CURRENT_USER_ID).toArray()).map(
        (o) => o.chapterId,
      ),
    )
    for (const c of bab.slice(0, 10)) expect(dimiliki.has(c.id)).toBe(true)

    // Dan membuka salah satunya lagi tidak menagih apa pun.
    const lagi = await api.unlockChapter({
      idempotencyKey: 'k-bundel-lagi',
      chapterId: bab[3]?.id ?? '',
      source: 'coin',
      auto: true,
    })
    expect((await db.wallets.get(CURRENT_USER_ID))?.balance).toBe(sesudah - lagi.coinsSpent)
  })
})

describe('izin tersimpan di server, bukan di perangkat · aturan struktur #5', () => {
  it('bertahan lintas muat ulang, dan tidak pernah menyentuh localStorage', async () => {
    await api.setAutoUnlock('s1', true)

    /*
     * **Uji ulang paling murah untuk aturan struktur #5.** Kalau izinnya kembali
     * ke `stores/`, ia akan muncul di sini — dan izin yang memotong koin tetapi
     * tertinggal di ponsel lama adalah persis yang §1.19 larang.
     */
    const lokal = Object.keys(localStorage).map((k) => localStorage.getItem(k) ?? '')
    expect(lokal.some((v) => v.includes('autoUnlockStoryIds'))).toBe(false)

    // Yang menyimpannya server-mock; membaca ulang mengembalikan nilai yang sama.
    expect((await api.getReaderPrefs()).autoUnlockStoryIds).toContain('s1')
  })
})

describe('posisi baca per bab · FR-READ-16 · R7', () => {
  it('tiap bab menyimpan posisinya sendiri, bukan satu angka untuk seluruh cerita', async () => {
    const bab = await babBerbayar('s1')
    const [satu, dua] = [bab[0], bab[1]]
    expect(satu && dua).toBeTruthy()

    await api.saveProgress({ storyId: 's1', chapterId: satu?.id ?? '', scrollPct: 0.4 })
    await api.saveProgress({ storyId: 's1', chapterId: dua?.id ?? '', scrollPct: 0.7 })

    const progress = await api.getProgress('s1')

    /*
     * Sebelum R7 hanya `scrollPct` yang ada, dan ia menyimpan posisi bab
     * **terakhir** saja — kembali ke bab yang lebih awal selalu mulai dari atas,
     * dan bagi pembaca itu tidak bisa dibedakan dari kehilangan tempat.
     */
    expect(progress?.scrollByChapter[satu?.id ?? '']).toBeCloseTo(0.4)
    expect(progress?.scrollByChapter[dua?.id ?? '']).toBeCloseTo(0.7)
    // `scrollPct` tetap menunjuk bab terakhir — itulah yang dipakai Lanjut Baca.
    expect(progress?.scrollPct).toBeCloseTo(0.7)
    expect(progress?.lastChapterId).toBe(dua?.id)
  })
})

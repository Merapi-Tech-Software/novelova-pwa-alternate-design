import { AD_QUOTA_MAX, PRICE_BUNDLE_10, PRICE_FULL } from '@/lib/coin'
import { todayLocalISO } from '@/lib/date'
import { CHAPTER_DONE_PCT } from '@/lib/limits'
import type { NovelovaApi } from '../../client'
import type {
  AdQuota,
  BundleOffer,
  ChapterSummary,
  ProgressInput,
  ReactTarget,
  ReadingProgress,
  UnlockInput,
  UnlockOption,
  UnlockResult,
} from '../../contracts'
import { ApiError, INTERNAL_CODES } from '../../errors'
import { SERVER_CONFIG } from '../config'
import { db } from '../db'
import { readerPrefsOf } from '../defaults'
import { currentUserId } from './session'

/**
 * Membuka bab · FR-READ-07 · FR-READ-17 · FR-READ-18.
 *
 * Tiga hal yang membuat berkas ini bukan sekadar "kurangi saldo":
 *
 * 1. **Idempoten.** Kunci yang sama dijalankan dua kali memotong saldo sekali.
 *    Tombol yang diketuk dua kali karena jaringan lambat tidak boleh berarti
 *    membayar dua kali \u2014 dan pengguna tidak punya cara membuktikan sebaliknya.
 * 2. **Transaksional.** Saldo, kepemilikan, dan baris ledger ditulis dalam satu
 *    transaksi Dexie: tidak ada keadaan "saldo terpotong tetapi bab tetap
 *    terkunci".
 * 3. **Kuota iklan dipotong di sini**, setelah tayangan selesai \u2014 bukan saat
 *    tombol ditekan (FR-READ-18).
 */

/** Bab berbayar yang belum dimiliki, mulai dari bab ini ke belakang. */
async function lockedFrom(userId: string, chapter: ChapterSummary): Promise<ChapterSummary[]> {
  const owned = new Set(
    (await db.ownerships.where('userId').equals(userId).toArray()).map((o) => o.chapterId),
  )

  return (await db.chapters.where('storyId').equals(chapter.storyId).toArray())
    .filter((c) => c.state === 'published' && c.access === 'paid' && !owned.has(c.id))
    .filter((c) => c.number >= chapter.number)
    .sort((a, b) => a.number - b.number)
}

/** Bab mana saja yang ikut terbuka untuk sebuah pilihan pembayaran. */
export async function scopeOf(
  userId: string,
  chapter: ChapterSummary,
  source: UnlockInput['source'],
): Promise<{ chapters: ChapterSummary[]; coins: number; refType: 'chapter' | 'bundle' | 'story' }> {
  if (source === 'bundle') {
    const next = (await lockedFrom(userId, chapter)).slice(0, 10)
    return { chapters: next, coins: PRICE_BUNDLE_10, refType: 'bundle' }
  }
  if (source === 'full') {
    return { chapters: await lockedFrom(userId, chapter), coins: PRICE_FULL, refType: 'story' }
  }
  // `coin`, `ad`, dan `voucher` semuanya membuka satu bab; yang membedakan
  // hanyalah apa yang dibayarkan.
  return {
    chapters: [chapter],
    coins: source === 'coin' ? chapter.priceCoins : 0,
    refType: 'chapter',
  }
}

async function quotaOf(userId: string): Promise<AdQuota> {
  // Tanggalnya **zona waktu pengguna**, bukan UTC: kuota harian yang berganti
  // pukul tujuh pagi WIB bukan kuota harian (FR-READ-18, `lib/date.ts`).
  const date = todayLocalISO()
  const existing = await db.adQuotas.where('[userId+date]').equals([userId, date]).first()
  return existing ?? { userId, date, used: 0, max: AD_QUOTA_MAX }
}

export const unlockHandlers: Pick<
  NovelovaApi,
  | 'unlockChapter'
  | 'getAdQuota'
  | 'getUnlockOptions'
  | 'saveProgress'
  | 'getProgress'
  | 'react'
  | 'setAutoUnlock'
  | 'getBundleOffer'
  | 'dismissBundleOffer'
> = {
  /**
   * Izin buka-otomatis **per cerita** · FR-READ-09 · §1.19.
   *
   * Mutator sempit, mengikuti pola `hideStory(storyId)` yang sudah ada — bukan
   * `updatePrefs` serba bisa. Satu metode yang bisa menulis kolom apa pun di
   * preferensi berarti tiap layar boleh menyentuh jalur uang.
   */
  async setAutoUnlock(storyId: string, on: boolean): Promise<void> {
    const userId = currentUserId()
    const prefs = await readerPrefsOf(userId)
    const sudah = prefs.autoUnlockStoryIds.includes(storyId)
    if (sudah === on) return

    await db.readerPrefs.put({
      ...prefs,
      autoUnlockStoryIds: on
        ? [...prefs.autoUnlockStoryIds, storyId]
        : prefs.autoUnlockStoryIds.filter((id) => id !== storyId),
    })
  },

  /**
   * Tawaran bundling · FR-READ-19 · §1.21.
   *
   * **Servernya yang memutuskan kapan ia muncul.** Ambangnya kebijakan
   * (`SERVER_CONFIG.bundleOfferAfter`), dan angka hematnya harus dari harga bab
   * sungguhan — `individualCoins` yang sama dengan gerbang bab, bukan
   * persentase tetap yang akan berbohong pada tiap cerita berharga beda.
   *
   * `null` berarti "belum waktunya", dan ada empat jalan ke sana: sudah pernah
   * ditampilkan, penghitungnya belum sampai ambang, babnya tidak ada, atau
   * tidak ada lagi bab terkunci untuk dibundel. Layar tidak perlu tahu yang
   * mana — ia cuma perlu tahu tidak ada yang ditawarkan.
   */
  async getBundleOffer(storyId: string, chapterId: string): Promise<BundleOffer | null> {
    const userId = currentUserId()
    const prefs = await readerPrefsOf(userId)

    if (prefs.bundleOfferSeenStoryIds.includes(storyId)) return null

    const count = prefs.autoUnlockCounts[storyId] ?? 0
    if (count < SERVER_CONFIG.bundleOfferAfter) return null

    const chapter = await db.chapters.get(chapterId)
    if (!chapter) return null

    // `scopeOf` yang **sudah ada**, bukan aritmetika harga baru: bundel di
    // pita ini dan bundel di gerbang bab harus berupa satu penawaran yang sama.
    const { chapters, coins } = await scopeOf(userId, chapter, 'bundle')
    if (chapters.length === 0) return null

    return {
      storyId,
      coins,
      chapterCount: chapters.length,
      individualCoins: chapters.reduce((sum, c) => sum + c.priceCoins, 0),
      autoUnlockedCount: count,
    }
  },

  /** Ditolak berarti tidak muncul lagi di cerita ini · FR-READ-19. */
  async dismissBundleOffer(storyId: string): Promise<void> {
    const userId = currentUserId()
    const prefs = await readerPrefsOf(userId)
    if (prefs.bundleOfferSeenStoryIds.includes(storyId)) return

    await db.readerPrefs.put({
      ...prefs,
      bundleOfferSeenStoryIds: [...prefs.bundleOfferSeenStoryIds, storyId],
    })
  },

  /**
   * Progres baca · FR-READ-16.
   *
   * **Dua tingkat**: bab terakhir yang dibuka, dan posisi gulir sebagai
   * **persentase** — bukan piksel. Piksel berubah artinya begitu pembaca
   * menggeser ukuran huruf, dan progres yang meleset setelah mengubah
   * pengaturan terasa seperti kehilangan tempat.
   *
   * ≥ 90% dianggap bab selesai (`CHAPTER_DONE_PCT`); angka itu pula yang
   * mengisi "Bab 45 dari 120".
   */
  async saveProgress(input: ProgressInput): Promise<void> {
    const userId = currentUserId()
    const id = `${userId}-${input.storyId}`
    const existing = await db.progress.get(id)

    const finished = new Set(existing?.finishedChapterIds ?? [])
    const finishedAt = { ...(existing?.finishedAt ?? {}) }
    if (input.scrollPct >= CHAPTER_DONE_PCT) {
      finished.add(input.chapterId)
      // **Tanggal pertama kali selesai, bukan yang terakhir.** Membaca ulang bab
      // yang sama besok tidak boleh menghitungnya lagi sebagai misi hari itu —
      // kalau boleh, "Baca 3 bab hari ini" bisa diselesaikan dengan menggulir
      // satu bab yang sama tiga kali.
      finishedAt[input.chapterId] ??= todayLocalISO()
    }

    await db.progress.put({
      id,
      userId,
      storyId: input.storyId,
      lastChapterId: input.chapterId,
      scrollPct: input.scrollPct,
      // Ditulis **dua tempat**, dan keduanya perlu: `scrollPct` menjawab "di mana
      // saya berhenti terakhir kali" untuk tombol Lanjut Baca, kolom ini
      // menjawab "di mana saya berhenti di bab ini" saat pembaca kembali ke bab
      // yang lebih awal (R7).
      scrollByChapter: {
        ...(existing?.scrollByChapter ?? {}),
        [input.chapterId]: input.scrollPct,
      },
      finishedChapterIds: [...finished],
      finishedAt,
      updatedAt: new Date().toISOString(),
    })
  },

  async getProgress(storyId: string): Promise<ReadingProgress | null> {
    const userId = currentUserId()
    return (await db.progress.where('[userId+storyId]').equals([userId, storyId]).first()) ?? null
  },

  /** Reaksi bab atau komentar. Satu baris per (pengguna, target), bukan penghitung bebas. */
  async react(target: ReactTarget, on: boolean): Promise<void> {
    const userId = currentUserId()
    const id = `rx-${userId}-${target.type}-${target.id}`

    if (on) {
      await db.reactions.put({ id, userId, targetType: target.type, targetId: target.id })
    } else {
      await db.reactions.delete(id)
    }
  },

  /**
   * Tiga pilihan beserta angkanya · FR-READ-07.
   *
   * Termasuk **total harga satuannya**, supaya lencana hemat dihitung dari
   * angka sungguhan dan bukan dari asumsi bahwa semua bab berharga sama.
   * Pilihan yang tidak mencakup bab apa pun tidak dikirim — "beli 10 bab" pada
   * cerita yang tinggal dua bab terkunci adalah tawaran yang menipu.
   */
  async getUnlockOptions(chapterId: string): Promise<UnlockOption[]> {
    const userId = currentUserId()
    const chapter = await db.chapters.get(chapterId)
    if (!chapter) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Bab ini tidak ada.')

    const sources: Array<UnlockInput['source']> = ['coin', 'bundle', 'full']
    const options: UnlockOption[] = []

    for (const source of sources) {
      const { chapters, coins } = await scopeOf(userId, chapter, source)
      if (chapters.length === 0) continue

      options.push({
        source,
        coins,
        chapterCount: chapters.length,
        individualCoins: chapters.reduce((sum, c) => sum + c.priceCoins, 0),
      })
    }

    // Pilihan yang tidak lebih murah daripada membeli satuan tidak ditawarkan.
    return options.filter((o) => o.source === 'coin' || o.coins < o.individualCoins)
  },

  async getAdQuota(): Promise<AdQuota> {
    return quotaOf(currentUserId())
  },

  async unlockChapter(input: UnlockInput): Promise<UnlockResult> {
    const userId = currentUserId()

    // Kunci idempotency dicek lebih dulu, sebelum apa pun disentuh.
    const seen = await db.idempotency.get(input.idempotencyKey)
    if (seen) return { ...(JSON.parse(seen.resultJson) as UnlockResult), alreadyOwned: true }

    const chapter = await db.chapters.get(input.chapterId)
    if (!chapter) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Bab ini tidak ada.')

    const wallet = await db.wallets.get(userId)
    const balance = wallet?.balance ?? 0
    const { chapters, coins, refType } = await scopeOf(userId, chapter, input.source)

    if (input.source === 'coin' || input.source === 'bundle' || input.source === 'full') {
      if (balance < coins) {
        throw new ApiError(
          INTERNAL_CODES.INSUFFICIENT_COINS,
          `Saldomu kurang ${coins - balance} koin untuk pilihan ini.`,
          { detail: String(coins - balance) },
        )
      }
    }

    let quota = await quotaOf(userId)
    if (input.source === 'ad') {
      if (quota.used >= quota.max) {
        throw new ApiError(
          INTERNAL_CODES.QUOTA_EXCEEDED,
          'Kuota iklan hari ini sudah habis. Besok kuotanya kembali penuh.',
        )
      }
      quota = { ...quota, used: quota.used + 1 }
    }

    const now = new Date().toISOString()
    const nextBalance = balance - coins

    await db.transaction(
      'rw',
      db.wallets,
      db.ownerships,
      db.transactions,
      db.adQuotas,
      db.idempotency,
      async () => {
        await db.ownerships.bulkPut(
          chapters.map((c) => ({
            id: `own-${userId}-${c.id}`,
            userId,
            chapterId: c.id,
            source: input.source,
            acquiredAt: now,
          })),
        )

        if (coins > 0) {
          await db.wallets.put({
            userId,
            balance: nextBalance,
            // Bonus tidak ikut berkurang: ia punya masa berlaku sendiri, dan
            // memotongnya diam-diam membuat saldo bonus mustahil ditelusuri.
            bonus: wallet?.bonus ?? 0,
            updatedAt: now,
          })
          await db.transactions.add({
            id: `tx-${input.idempotencyKey}`,
            userId,
            kind: 'spend',
            amount: -coins,
            title:
              refType === 'chapter'
                ? `Buka bab ${chapter.number}`
                : refType === 'bundle'
                  ? `Buka ${chapters.length} bab sekaligus`
                  : 'Akses penuh cerita',
            refType,
            refId: chapter.id,
            method: 'koin',
            status: 'success',
            createdAt: now,
          })
        }

        if (input.source === 'ad') {
          await db.adQuotas.put({ ...quota, id: `${userId}-${quota.date}` })
        }
      },
    )

    const result: UnlockResult = {
      ownership: { userId, chapterId: chapter.id, source: input.source, acquiredAt: now },
      balance: coins > 0 ? nextBalance : balance,
      coinsSpent: coins,
      alreadyOwned: false,
    }

    await db.idempotency.put({
      key: input.idempotencyKey,
      operation: 'unlockChapter',
      resultJson: JSON.stringify(result),
      createdAt: now,
    })

    /*
     * Izin dan penghitung ditulis **setelah** pembukaannya berhasil, dan
     * keduanya hanya di jalur ini — jalur kunci idempotency yang terpakai ulang
     * sudah keluar di baris pertama fungsi ini.
     *
     * Itu penting untuk penghitungnya: pemakaian ulang kunci **tidak memotong
     * koin**, dan menaikkan penghitung di sana mendekatkan pembaca ke tawaran
     * belanja tanpa ia membayar apa pun.
     */
    if (input.enableAutoUnlock === true || input.auto === true) {
      const prefs = await readerPrefsOf(userId)
      const izin =
        input.enableAutoUnlock === true && !prefs.autoUnlockStoryIds.includes(chapter.storyId)
          ? [...prefs.autoUnlockStoryIds, chapter.storyId]
          : prefs.autoUnlockStoryIds

      const counts =
        input.auto === true
          ? {
              ...prefs.autoUnlockCounts,
              [chapter.storyId]: (prefs.autoUnlockCounts[chapter.storyId] ?? 0) + 1,
            }
          : prefs.autoUnlockCounts

      await db.readerPrefs.put({ ...prefs, autoUnlockStoryIds: izin, autoUnlockCounts: counts })
    }

    return result
  },
}

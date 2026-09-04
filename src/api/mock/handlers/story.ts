import { todayLocalISO } from '@/lib/date'
import type { NovelovaApi } from '../../client'
import type {
  Chapter,
  ChapterSummary,
  LibraryEntry,
  ListParams,
  Paged,
  RedeemResult,
  StoryDetail,
  Voucher,
} from '../../contracts'
import { ApiError, INTERNAL_CODES, VISIBLE_CODES } from '../../errors'
import { db } from '../db'
import { currentUserId } from './session'

/**
 * Detail cerita & daftar bab · prd_04.
 *
 * **Status kunci datang dari `Ownership`, bukan dari harga.** Bab berbayar yang
 * sudah dibeli tetap terbuka selamanya, termasuk setelah muat ulang di
 * perangkat lain (FR-CORE-01) — dan itu satu-satunya alasan tabel kepemilikan
 * ada.
 */

/** Naskah contoh untuk bab yang isinya tidak di-seed satu per satu. */
const FALLBACK_BODY = [
  'Ia berhenti di ambang pintu, menghitung sampai tiga, lalu masuk seolah tidak ada yang perlu dihitung.',
  'Di ruangan itu semua orang berbicara pelan, dan justru itu yang membuat setiap kalimat terdengar sampai ke sudut.',
  'Ada map di atas meja, tertutup rapi, dengan namanya sendiri tertulis di sudut kanan atas.',
  'Ketika ia akhirnya membukanya, yang paling mengejutkan bukan isinya — melainkan tanggal di halaman pertama.',
  'Malam itu ia pulang lebih lambat dari biasanya, dan tidak seorang pun bertanya kenapa.',
]

/**
 * Refund otomatis bab yang ditarik · `CONTENT-410`.
 *
 * Idempoten lewat id barisnya: membuka bab yang sama sepuluh kali tetap satu
 * baris balik. Kepemilikannya **dihapus** setelah dikembalikan — membiarkannya
 * berarti pembaca "memiliki" bab yang uangnya sudah kembali.
 */
async function refundWithdrawn(userId: string, chapter: ChapterSummary): Promise<void> {
  const ownership = await db.ownerships
    .where('[userId+chapterId]')
    .equals([userId, chapter.id])
    .first()
  if (ownership?.source !== 'coin') return

  const refundId = `tx-refund-${userId}-${chapter.id}`
  if (await db.transactions.get(refundId)) return

  const wallet = await db.wallets.get(userId)
  const now = new Date().toISOString()

  await db.transaction('rw', db.wallets, db.transactions, db.ownerships, async () => {
    await db.wallets.put({
      userId,
      balance: (wallet?.balance ?? 0) + chapter.priceCoins,
      bonus: wallet?.bonus ?? 0,
      updatedAt: now,
    })
    await db.transactions.add({
      id: refundId,
      userId,
      kind: 'refund',
      amount: chapter.priceCoins,
      title: `Refund bab ${chapter.number} yang ditarik`,
      refType: 'chapter',
      refId: chapter.id,
      method: 'koin',
      status: 'success',
      createdAt: now,
    })
    await db.ownerships.delete(`own-${userId}-${chapter.id}`)
  })
}

async function ownedChapterIds(userId: string): Promise<Set<string>> {
  const rows = await db.ownerships.where('userId').equals(userId).toArray()
  return new Set(rows.map((row) => row.chapterId))
}

/**
 * Simpan dan Ikuti adalah **dua hal berbeda** yang tinggal di satu baris
 * (FR-DETAIL-13): `removed` menandai koleksi, `notify` menandai follow.
 */
async function entryOf(userId: string, storyId: string): Promise<LibraryEntry | undefined> {
  return db.libraryEntries.where('[userId+storyId]').equals([userId, storyId]).first()
}

export const storyHandlers: Pick<
  NovelovaApi,
  | 'getStory'
  | 'getChapters'
  | 'getChapter'
  | 'toggleFollow'
  | 'redeemVoucher'
  | 'applyVoucher'
  | 'listVouchers'
> = {
  /**
   * Satu bab beserta isinya · FR-READ-06.
   *
   * **Pratinjau selalu dikirim**, terkunci atau tidak: gerbang unlock
   * memperlihatkan awal bab, bukan layar kosong. Isi lengkapnya hanya ikut bila
   * bab itu memang sudah dimiliki — mengirimnya lalu menyembunyikannya di CSS
   * berarti seluruh naskah berbayar ada di dalam jangkauan siapa pun yang
   * membuka panel jaringan.
   */
  async getChapter(storyId: string, chapterId: string): Promise<Chapter> {
    const userId = currentUserId()
    const chapter = await db.chapters.get(chapterId)
    if (!chapter || chapter.storyId !== storyId) {
      throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Bab ini tidak ada di cerita tersebut.')
    }
    if (chapter.withdrawnAt) {
      // Bab berbayar yang ditarik **dikembalikan uangnya di sini juga**, bukan
      // lewat penanganan manual: satu baris ledger balik, sekali saja
      // (arch §1.4, CONTENT-410).
      await refundWithdrawn(userId, chapter)
      throw new ApiError(
        VISIBLE_CODES.CONTENT_WITHDRAWN,
        'Bab ini ditarik penulisnya untuk disunting ulang.',
        { detail: chapter.withdrawnAt },
      )
    }

    const owned = (await ownedChapterIds(userId)).has(chapterId) || chapter.access === 'free'
    let progress = await db.progress.where('[userId+storyId]').equals([userId, storyId]).first()

    /**
     * **Membuka bab sudah tercatat**, bukan menunggu gulir pertama.
     *
     * `useReadingProgress` hanya mengirim setelah ada gulir, jadi bab pendek
     * yang muat satu layar tidak pernah meninggalkan jejak — dan pembacanya
     * ditolak saat hendak menilai cerita, dengan alasan yang terdengar salah.
     * Baris yang sudah ada **tidak disentuh**: menimpanya dengan nol akan
     * membuang posisi baca yang sebenarnya.
     */
    if (owned && !progress) {
      const opened = {
        id: `${userId}-${storyId}`,
        userId,
        storyId,
        lastChapterId: chapterId,
        scrollPct: 0,
        finishedChapterIds: [] as string[],
        updatedAt: new Date().toISOString(),
      }
      await db.progress.put(opened)
      progress = opened
    }

    const siblings = (await db.chapters.where('storyId').equals(storyId).toArray())
      .filter((c) => c.state === 'published')
      .sort((a, b) => a.number - b.number)
    const at = siblings.findIndex((c) => c.id === chapterId)

    // Bab tanpa baris isi memakai naskah contoh bawaan: hasilnya identik di
    // layar, dan seed tidak perlu menulis ribuan paragraf yang sama.
    const stored = await db.chapterContents.where('chapterId').equals(chapterId).toArray()
    const content =
      stored.length > 0
        ? stored
        : [
            {
              chapterId,
              lang: 'id' as const,
              title: chapter.title,
              body: FALLBACK_BODY,
              authorNote: null,
            },
          ]
    const body = content[0]?.body ?? []
    const commentCount = await db.comments.where('chapterId').equals(chapterId).count()

    return {
      ...chapter,
      owned,
      finished: progress?.finishedChapterIds.includes(chapterId) ?? false,
      content: owned ? content : [],
      preview: body.slice(0, 2),
      prevChapterId: siblings[at - 1]?.id ?? null,
      nextChapterId: siblings[at + 1]?.id ?? null,
      nextTitle: siblings[at + 1]?.title ?? null,
      commentCount,
    }
  },

  /** Voucher milik pengguna, yang belum kedaluwarsa dan masih punya sisa pakai. */
  async listVouchers(): Promise<Voucher[]> {
    const userId = currentUserId()
    const all = await db.vouchers.toArray()

    return all
      .filter((v) => v.ownerId === userId)
      .filter((v) => v.usedCount < v.maxUses)
      .sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt))
  },
  async getStory(storyId: string): Promise<StoryDetail> {
    const userId = currentUserId()
    const story = await db.stories.get(storyId)
    if (!story) {
      throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Cerita ini tidak ada atau sudah dihapus.')
    }

    const entry = await entryOf(userId, storyId)
    const progress = await db.progress.where('[userId+storyId]').equals([userId, storyId]).first()
    const rating = await db.ratings.where('[userId+storyId]').equals([userId, storyId]).first()

    const lastChapter = progress?.lastChapterId
      ? await db.chapters.get(progress.lastChapterId)
      : undefined

    return {
      ...story,
      editorNote: null,
      growthNote: null,
      inLibrary: entry !== undefined && !entry.removed,
      following: entry?.notify ?? false,
      continueChapterId: lastChapter?.id ?? null,
      continueChapterNumber: lastChapter?.number ?? null,
      myRating: rating?.stars ?? null,
    }
  },

  /**
   * Daftar bab · FR-DETAIL-14.
   *
   * Urutannya dapat dibalik dan bawaannya **bab pertama dulu**: pembaca baru
   * membuka halaman ini untuk memulai, bukan untuk melihat bab terakhir.
   */
  async getChapters(storyId: string, params: ListParams): Promise<Paged<ChapterSummary>> {
    const userId = currentUserId()
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20

    const owned = await ownedChapterIds(userId)
    const progress = await db.progress.where('[userId+storyId]').equals([userId, storyId]).first()
    const finished = new Set(progress?.finishedChapterIds ?? [])

    const all = (await db.chapters.where('storyId').equals(storyId).toArray())
      // Dua syarat, bukan satu: bab dalam tinjauan tersimpan sebagai `draft`
      // sehingga sudah tersaring, tetapi menuliskan `review` di sini membuat
      // aturannya terbaca — dan menutup bab terbit yang kemudian ditolak
      // (FR-STUDIO-38).
      .filter((c) => c.state === 'published' && c.review === 'published')
      .map((c) => ({ ...c, owned: c.owned || owned.has(c.id), finished: finished.has(c.id) }))

    const q = params.q?.trim().toLowerCase()
    const matched = q
      ? all.filter((c) => c.title.toLowerCase().includes(q) || String(c.number) === q)
      : all

    const sorted = matched.sort((a, b) =>
      params.sort === 'desc' ? b.number - a.number : a.number - b.number,
    )
    const start = (page - 1) * pageSize

    return {
      items: sorted.slice(start, start + pageSize),
      page,
      pageSize,
      total: sorted.length,
      hasMore: start + pageSize < sorted.length,
    }
  },

  /**
   * Ikuti / berhenti mengikuti. Barisnya dibuat kalau belum ada, tetapi
   * **tidak** ikut memasukkan cerita ke koleksi — mengikuti berarti ingin diberi
   * tahu, bukan ingin menyimpan.
   */
  async toggleFollow(storyId: string): Promise<LibraryEntry> {
    const userId = currentUserId()
    const existing = await entryOf(userId, storyId)

    const next: LibraryEntry = existing
      ? { ...existing, notify: !existing.notify }
      : { userId, storyId, savedAt: todayLocalISO(), notify: true, removed: true }

    await db.libraryEntries.put({ ...next, id: `lib-${userId}-${storyId}` })
    return next
  },

  /**
   * Menukar kode voucher · FR-DETAIL-09 · FR-RWD-06.
   *
   * Kode **tidak peka huruf besar-kecil**, dan yang berhasil ditukar masuk ke
   * daftar voucher pengguna — memakainya adalah langkah kedua yang terpisah.
   */
  async redeemVoucher(code: string): Promise<Voucher> {
    const userId = currentUserId()
    const wanted = code.trim().toLowerCase()

    const all = await db.vouchers.toArray()
    const voucher = all.find((v) => v.code.toLowerCase() === wanted)
    if (!voucher) {
      throw new ApiError(
        INTERNAL_CODES.NOT_FOUND,
        'Kode ini tidak dikenali. Periksa lagi ejaannya.',
      )
    }
    if (Date.parse(voucher.expiresAt) < Date.now()) {
      throw new ApiError(VISIBLE_CODES.PAY_EXPIRED, 'Voucher ini sudah kedaluwarsa.')
    }
    if (voucher.usedCount >= voucher.maxUses) {
      throw new ApiError(INTERNAL_CODES.CONFLICT, 'Voucher ini sudah habis dipakai.')
    }

    const owned = { ...voucher, ownerId: userId }
    await db.vouchers.put(owned)
    return owned
  },

  /**
   * Memakai voucher pada satu cerita.
   *
   * **Cakupannya dihormati server**: yang dikembalikan adalah daftar `chapterId`
   * yang benar-benar berhak terbuka, bukan seluruh bab cerita itu (memperbaiki
   * PRD 04 §7 #3).
   */
  async applyVoucher(voucherId: string, storyId: string): Promise<RedeemResult> {
    const userId = currentUserId()
    const voucher = await db.vouchers.get(voucherId)
    if (!voucher) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Voucher tidak ditemukan.')

    if (voucher.storyIds.length > 0 && !voucher.storyIds.includes(storyId)) {
      throw new ApiError(INTERNAL_CODES.FORBIDDEN, 'Voucher ini tidak berlaku untuk cerita ini.')
    }

    const chapters = (await db.chapters.where('storyId').equals(storyId).toArray()).sort(
      (a, b) => a.number - b.number,
    )
    // `firstN` menghitung **bab pertama cerita**, bukan bab berbayar pertama:
    // "5 bab pertama gratis" pada cerita yang tiga bab awalnya memang gratis
    // berarti dua bab yang terbuka, bukan lima.
    const eligible = chapters
      .filter((c) => (voucher.chapterIds.length > 0 ? voucher.chapterIds.includes(c.id) : true))
      .slice(0, voucher.firstN ?? chapters.length)
      .filter((c) => c.access === 'paid')

    const owned = await ownedChapterIds(userId)
    const fresh = eligible.filter((c) => !owned.has(c.id))

    await db.ownerships.bulkPut(
      fresh.map((c) => ({
        id: `own-${userId}-${c.id}`,
        userId,
        chapterId: c.id,
        source: 'voucher' as const,
        acquiredAt: new Date().toISOString(),
      })),
    )
    await db.vouchers.put({ ...voucher, usedCount: voucher.usedCount + 1 })

    return {
      voucher,
      unlockedChapterIds: fresh.map((c) => c.id),
      message:
        fresh.length === 0
          ? 'Semua bab yang dicakup voucher ini sudah terbuka.'
          : `${fresh.length} bab terbuka dengan voucher ini.`,
    }
  },
}

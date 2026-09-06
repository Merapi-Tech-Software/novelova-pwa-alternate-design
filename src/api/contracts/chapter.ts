import { z } from 'zod'
import {
  ContentLangSchema,
  IdempotentSchema,
  IdSchema,
  IsoDateTimeSchema,
  LocalDateSchema,
  ReviewStateSchema,
} from './common'

/** prd_04 · prd_05 · prd_07 */

export const ChapterAccessSchema = z.enum(['free', 'paid', 'private'])
export const ChapterStateSchema = z.enum(['draft', 'scheduled', 'published', 'private'])

export const ChapterSummarySchema = z.object({
  id: IdSchema,
  storyId: IdSchema,
  number: z.number().int().positive(),
  title: z.string(),
  access: ChapterAccessSchema,
  /** Harga **per bab**, bukan konstanta global (FR-DETAIL-14). */
  priceCoins: z.number().int().nonnegative(),
  readMinutes: z.number().int().nonnegative(),
  state: ChapterStateSchema,
  review: ReviewStateSchema,
  publishAt: IsoDateTimeSchema.nullable(),
  /** Zona waktu penulis saat menjadwalkan — disimpan bersama UTC (FR-STUDIO-37). */
  publishTz: z.string().nullable(),
  wordCount: z.number().int().nonnegative(),
  /** Sudah dimiliki pembaca ini: dibeli, bundel, akses penuh, iklan, atau voucher. */
  owned: z.boolean(),
  finished: z.boolean(),
  /** Ditarik penulis → CONTENT-410, refund otomatis (arch §1.4). */
  withdrawnAt: IsoDateTimeSchema.nullable(),
  /**
   * Empat angka berikut dipakai **daftar bab penulis** (FR-STUDIO-08/09):
   * "Diedit 5 hari lalu", urutan menurut views atau rating, dan pemberitahuan
   * "bab mencapai 10rb views". Semuanya fakta milik server — tidak satu pun bisa
   * diturunkan di klien, dan pembaca cukup mengabaikannya.
   */
  editedAt: IsoDateTimeSchema,
  views: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5),
  commentCount: z.number().int().nonnegative(),
  /**
   * Porsi bab yang bisa dicicipi gratis, 0–50% · FR-STUDIO-25.
   *
   * Milik pembaca juga, bukan hanya penulis: inilah yang menentukan seberapa
   * jauh gerbang bab memperlihatkan naskahnya.
   */
  previewPct: z.number().int().min(0).max(50),
  /**
   * Tiga kolom berikut hanya dipakai layar akses bab (FR-STUDIO-23..26,
   * FR-STUDIO-36). Pembaca mengabaikannya; menyimpannya di tabel terpisah
   * berarti join satu-ke-satu untuk data yang tidak pernah berdiri sendiri.
   */
  accessChangedAt: IsoDateTimeSchema.nullable(),
  privateReason: z.string().nullable(),
  privateUntil: LocalDateSchema.nullable(),
})
export type ChapterSummary = z.infer<typeof ChapterSummarySchema>

export const ChapterContentSchema = z.object({
  chapterId: IdSchema,
  lang: ContentLangSchema,
  title: z.string(),
  body: z.array(z.string()),
  authorNote: z.string().nullable(),
})
export type ChapterContent = z.infer<typeof ChapterContentSchema>

export const ChapterSchema = ChapterSummarySchema.extend({
  /** Versi Indonesia wajib; English opsional (FR-STUDIO-19). */
  content: z.array(ChapterContentSchema).min(1),
  /**
   * Paragraf pratinjau untuk bab terkunci. Selalu dikirim — gerbang unlock
   * memperlihatkan awal bab, bukan layar kosong (FR-READ-06).
   */
  preview: z.array(z.string()),
  /**
   * Judul ceritanya — bilah atas ruang baca menampilkan **cerita**, bukan bab
   * (`7v`). Judul babnya sudah jadi tajuk besar tepat di bawahnya, jadi
   * mengulangnya di bilah membuang satu-satunya baris yang bisa menjawab
   * "aku sedang di buku mana".
   */
  storyTitle: z.string(),
  prevChapterId: IdSchema.nullable(),
  nextChapterId: IdSchema.nullable(),
  /**
   * Judul bab tujuan, supaya tombol "Bab berikutnya" bisa menyebutkan ke mana
   * ia membawa (FR-READ-15). Dikirim server karena kliennya belum tentu punya
   * daftar babnya — pembaca bisa masuk lewat tautan langsung.
   */
  nextTitle: z.string().nullable(),
  /** Jumlah komentar bab ini (FR-READ-13). */
  commentCount: z.number().int().nonnegative(),
})
export type Chapter = z.infer<typeof ChapterSchema>

export const OwnershipSourceSchema = z.enum(['coin', 'bundle', 'full', 'ad', 'voucher'])

export const OwnershipSchema = z.object({
  userId: IdSchema,
  chapterId: IdSchema,
  source: OwnershipSourceSchema,
  acquiredAt: IsoDateTimeSchema,
})
export type Ownership = z.infer<typeof OwnershipSchema>

/** Membuka bab menyentuh uang → wajib idempoten (architecture.md §5 aturan 3). */
export const UnlockInputSchema = IdempotentSchema.extend({
  chapterId: IdSchema,
  source: OwnershipSourceSchema,
  /** Diisi hanya untuk `source: 'voucher'`. */
  voucherId: IdSchema.optional(),
  /**
   * Beli bab **dan** nyalakan izin buka-otomatis cerita ini dalam satu
   * panggilan (FR-READ-09).
   *
   * Satu panggilan, bukan dua: di gerbang itu memang satu tindakan pembaca, dan
   * memecahnya membuka keadaan "koin terpotong, izin gagal tersimpan" — yang
   * berarti pembaca membayar lalu dimintai persetujuan yang sama lagi di bab
   * berikutnya.
   */
  enableAutoUnlock: z.boolean().optional(),
  /**
   * Menandai pembukaan yang dilakukan **aplikasi sendiri**, bukan pembaca.
   * Satu-satunya gunanya menaikkan `autoUnlockCounts` — harga, potongan, dan
   * kepemilikannya persis sama.
   */
  auto: z.boolean().optional(),
})
export type UnlockInput = z.infer<typeof UnlockInputSchema>

/**
 * Satu pilihan pembayaran di gerbang bab · FR-READ-07.
 *
 * Angkanya **dihitung server**, bukan ditaksir klien: gerbang ini layar uang,
 * dan "hemat 20%" yang meleset karena harga bab berikutnya berbeda adalah
 * kebohongan kecil yang ditagih pengguna belakangan.
 */
export const UnlockOptionSchema = z.object({
  source: OwnershipSourceSchema,
  /** Yang dibayarkan untuk pilihan ini. */
  coins: z.number().int().nonnegative(),
  /** Berapa bab yang ikut terbuka. */
  chapterCount: z.number().int().nonnegative(),
  /** Total bila bab-bab itu dibeli satuan — dasar lencana hemat. */
  individualCoins: z.number().int().nonnegative(),
})
export type UnlockOption = z.infer<typeof UnlockOptionSchema>

export const UnlockResultSchema = z.object({
  ownership: OwnershipSchema,
  /** Saldo **setelah** potongan — satu-satunya sumber angka saldo (FR-WALLET-17). */
  balance: z.number().int().nonnegative(),
  coinsSpent: z.number().int().nonnegative(),
  /** Benar bila kunci idempotency ini sudah pernah dipakai — tidak ada potongan kedua. */
  alreadyOwned: z.boolean(),
})
export type UnlockResult = z.infer<typeof UnlockResultSchema>

/**
 * Tawaran bundling setelah sepuluh bab dibuka otomatis · FR-READ-19 · §1.21.
 *
 * **Server yang memutuskan kapan ia muncul**, bukan layar: ambangnya kebijakan
 * (`SERVER_CONFIG.bundleOfferAfter`) dan angka hematnya harus dari harga bab
 * sungguhan. `prd_00` §6 dan `prd_05` §2 sama-sama menulis "hemat 5%" padahal
 * sepuluh bab seed berjumlah 17.200 melawan bundel 12.000 — **30%**. Persentase
 * tetap di layar akan berbohong pada tiap cerita yang harganya berbeda.
 */
export const BundleOfferSchema = z.object({
  storyId: IdSchema,
  /** Harga bundelnya. */
  coins: z.number().int().positive(),
  /** Berapa bab yang ikut terbuka — bisa kurang dari sepuluh di ujung cerita. */
  chapterCount: z.number().int().positive(),
  /** Total bila bab-bab itu dibeli satuan — dasar angka hematnya. */
  individualCoins: z.number().int().nonnegative(),
  /** Berapa bab yang sudah dibuka otomatis di cerita ini saat tawaran ini lahir. */
  autoUnlockedCount: z.number().int().nonnegative(),
})
export type BundleOffer = z.infer<typeof BundleOfferSchema>

/** Dikirim maksimal sekali per 10 detik (`PROGRESS_THROTTLE_MS`). FR-READ-16. */
export const ProgressInputSchema = z.object({
  storyId: IdSchema,
  chapterId: IdSchema,
  scrollPct: z.number().min(0).max(1),
})
export type ProgressInput = z.infer<typeof ProgressInputSchema>

/**
 * Bab yang ditandai untuk dibaca offline · architecture.md §10.3 · FR-CORE-03.
 *
 * **Metadata di Dexie, isinya di Cache Storage** — pembagian yang sama dengan
 * yang dijelaskan §10.3. Yang disimpan di sini hanya penanda dan kapan terakhir
 * dibuka, karena itulah yang dibutuhkan aturan LRU.
 */
export const OfflineChapterSchema = z.object({
  userId: IdSchema,
  chapterId: IdSchema,
  storyId: IdSchema,
  storyTitle: z.string(),
  chapterLabel: z.string(),
  savedAt: IsoDateTimeSchema,
  /** Dipakai LRU: yang paling lama tidak dibuka yang dilepas lebih dulu. */
  lastOpenedAt: IsoDateTimeSchema,
})
export type OfflineChapter = z.infer<typeof OfflineChapterSchema>

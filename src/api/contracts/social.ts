import { z } from 'zod'
import { IdSchema, IsoDateTimeSchema, ListParamsSchema } from './common'

/** prd_12 · FR-SOCIAL-* */

/**
 * Rating dan ulasan adalah dua hal berbeda.
 * Memberi bintang tanpa menulis apa pun sah; menghapus ulasan **tidak**
 * menghapus ratingnya (FR-SOCIAL-02).
 */
export const RatingSchema = z.object({
  userId: IdSchema,
  storyId: IdSchema,
  stars: z.number().int().min(1).max(5),
  updatedAt: IsoDateTimeSchema,
})
export type Rating = z.infer<typeof RatingSchema>

export const AuthorReplySchema = z.object({
  reviewId: IdSchema,
  authorId: IdSchema,
  authorName: z.string(),
  text: z.string().min(1),
  updatedAt: IsoDateTimeSchema,
})
export type AuthorReply = z.infer<typeof AuthorReplySchema>

export const ReviewSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  userName: z.string(),
  storyId: IdSchema,
  stars: z.number().int().min(1).max(5),
  /** Kosong berarti rating tanpa teks — bukan ulasan yang gagal dimuat. */
  text: z.string(),
  tags: z.array(z.string()).max(3),
  spoiler: z.boolean(),
  helpfulCount: z.number().int().nonnegative(),
  markedHelpful: z.boolean(),
  editedAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  /** Satu tanggapan penulis per ulasan. */
  reply: AuthorReplySchema.nullable(),
})
export type Review = z.infer<typeof ReviewSchema>

export const ReviewInputSchema = z.object({
  storyId: IdSchema,
  stars: z.number().int().min(1).max(5),
  text: z.string(),
  tags: z.array(z.string()).max(3),
  spoiler: z.boolean().default(false),
})
export type ReviewInput = z.infer<typeof ReviewInputSchema>

export const RatingBreakdownSchema = z.object({
  average: z.number().min(0).max(5),
  total: z.number().int().nonnegative(),
  /** Jumlah per bintang, indeks 0 = 1 bintang. */
  histogram: z.tuple([z.number(), z.number(), z.number(), z.number(), z.number()]),
})

/**
 * Saringan & urutan halaman ulasan · FR-SOCIAL-03. `[LUAR]`
 *
 * Ketiganya **menyaring di server**, seperti seluruh daftar lain di proyek ini:
 * memotong daftar di layar membuat penghitung dan paginasi berbohong.
 */
export const ReviewParamsSchema = ListParamsSchema.extend({
  /** `null` berarti semua bintang. */
  stars: z.number().int().min(1).max(5).nullable().default(null),
  /** Benar berarti hanya ulasan yang benar-benar ada teksnya. */
  withText: z.boolean().default(false),
  tag: z.string().nullable().default(null),
  sort: z.enum(['helpful', 'newest', 'highest', 'lowest']).default('helpful'),
})
export type ReviewParams = z.infer<typeof ReviewParamsSchema>

export const ReviewPageSchema = z.object({
  items: z.array(ReviewSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  breakdown: RatingBreakdownSchema,
  myReview: ReviewSchema.nullable(),
  /** Tag terpopuler beserta jumlah pemakaiannya · FR-SOCIAL-03. */
  topTags: z.array(z.object({ tag: z.string(), count: z.number().int().positive() })),
  /**
   * Benar bila pembaca halaman ini **pemilik ceritanya** · FR-SOCIAL-04.
   *
   * Dikirim server, bukan dihitung layar: aturan siapa yang boleh menanggapi
   * sudah hidup di `replyToReview`, dan menghitungnya lagi di klien berarti dua
   * tempat yang bisa berselisih.
   */
  canReply: z.boolean(),
})
export type ReviewPage = z.infer<typeof ReviewPageSchema>

/**
 * Komentar. Balasan **satu tingkat saja** — tanpa utas bercabang
 * (`COMMENT_DEPTH_MAX`, FR-SOCIAL-05).
 *
 * Skemanya sengaja **tidak rekursif**: `CommentSchema` membungkus
 * `CommentBaseSchema`, sehingga balasan tidak bisa punya balasan. Aturan
 * kedalaman ditegakkan tipe, bukan oleh pemeriksaan runtime yang bisa lupa
 * dipanggil.
 */
const CommentBaseSchema = z.object({
  id: IdSchema,
  chapterId: IdSchema,
  userId: IdSchema,
  userName: z.string(),
  /** Benar bila penulis cerita sendiri yang berkomentar. */
  isAuthor: z.boolean(),
  parentId: IdSchema.nullable(),
  text: z.string(),
  spoiler: z.boolean(),
  likeCount: z.number().int().nonnegative(),
  liked: z.boolean(),
  /**
   * Komentar dilaporkan tetap menempati barisnya dengan isinya diganti
   * keterangan — pembaca lain melihat ada sesuatu di sana dan sedang diproses,
   * bukan konten yang hilang diam-diam (FR-SOCIAL-07, kanvas layar 18).
   */
  underReview: z.boolean(),
  createdAt: IsoDateTimeSchema,
})
export type CommentBase = z.infer<typeof CommentBaseSchema>

export const CommentSchema = CommentBaseSchema.extend({
  replies: z.array(CommentBaseSchema).optional(),
})
export type Comment = z.infer<typeof CommentSchema>

/**
 * Urutan & paginasi utas komentar · FR-SOCIAL-05. `[LUAR]`
 *
 * Diurutkan **server**, sama seperti seluruh daftar lain: memotong dan
 * mengurutkan di layar membuat paginasi 20-per-muat berbohong.
 */
export const CommentParamsSchema = ListParamsSchema.extend({
  sort: z.enum(['newest', 'liked', 'oldest']).default('newest'),
})
export type CommentParams = z.infer<typeof CommentParamsSchema>

/**
 * Menulis komentar · FR-SOCIAL-05 & FR-SOCIAL-06. `[LUAR]`
 *
 * `parentId` menunjuk **komentar induk mana pun** — termasuk sebuah balasan.
 * Server yang menaikkannya ke induk teratas, sehingga utas tidak pernah lebih
 * dalam dari satu tingkat tanpa layar perlu tahu aturannya.
 */
export const CommentInputSchema = z.object({
  chapterId: IdSchema,
  text: z.string().min(1).max(500),
  parentId: IdSchema.nullable().default(null),
  spoiler: z.boolean().default(false),
})
export type CommentInput = z.infer<typeof CommentInputSchema>

export const ReactTargetSchema = z.object({
  /** `chapter` ikut sejak FR-READ-13: baris reaksi ada di akhir tiap bab. */
  type: z.enum(['review', 'comment', 'chapter']),
  id: IdSchema,
})
export type ReactTarget = z.infer<typeof ReactTargetSchema>

/** Enam alasan tetap; "Lainnya" wajib disertai keterangan. FR-SOCIAL-07. */
export const ReportReasonSchema = z.enum([
  'spam',
  'spoiler',
  'kasar',
  'plagiat',
  'dewasa',
  'lainnya',
])
export type ReportReason = z.infer<typeof ReportReasonSchema>

export const ReportInputSchema = z
  .object({
    targetType: z.enum(['story', 'review', 'comment', 'user']),
    targetId: IdSchema,
    reason: ReportReasonSchema,
    note: z.string().default(''),
  })
  .refine((r) => r.reason !== 'lainnya' || r.note.trim().length > 0, {
    message: 'Jelaskan alasannya bila memilih "Lainnya"',
    path: ['note'],
  })
export type ReportInput = z.infer<typeof ReportInputSchema>

export const BlockSchema = z.object({
  userId: IdSchema,
  blockedUserId: IdSchema,
  createdAt: IsoDateTimeSchema,
})
export type Block = z.infer<typeof BlockSchema>

/**
 * Satu entri feed aktivitas · FR-SOCIAL-08. `[LUAR]`
 *
 * **Diturunkan dari ulasan**, bukan tabel event tersendiri: entri "Menulis
 * ulasan 5 bintang" adalah tampilan lain dari ulasan yang sama. Tabel event
 * akan jadi kebenaran kedua yang basi begitu ulasannya disunting atau dihapus.
 */
export const ActivityEntrySchema = z.object({
  id: IdSchema,
  kind: z.literal('review'),
  storyId: IdSchema,
  storyTitle: z.string(),
  stars: z.number().int().min(1).max(5),
  text: z.string(),
  createdAt: IsoDateTimeSchema,
})
export type ActivityEntry = z.infer<typeof ActivityEntrySchema>

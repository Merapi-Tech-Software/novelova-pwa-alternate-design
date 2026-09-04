import { z } from 'zod'
import { GenreSchema, IdSchema } from './common'
import { StorySchema } from './story'
import { UserSchema } from './user'

/** prd_11 · FR-SRCH-* */

export const SearchParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(20),
  genre: GenreSchema.optional(),
  status: z.enum(['ongoing', 'completed', 'hiatus']).optional(),
  /** Bahasa cerita, bukan bahasa antarmuka (FR-SRCH-04). */
  language: z.string().optional(),
  sort: z.enum(['relevan', 'populer', 'terbaru', 'rating']).default('relevan'),
})
export type SearchParams = z.infer<typeof SearchParamsSchema>

/**
 * Pencarian mengembalikan **tiga jenis hasil sekaligus** — cerita, penulis, tag.
 * Tabnya menyaring apa yang ditampilkan, bukan memicu tiga permintaan terpisah.
 */
export const SearchResultSchema = z.object({
  query: z.string(),
  stories: z.array(StorySchema),
  authors: z.array(UserSchema),
  tags: z.array(z.object({ tag: z.string(), storyCount: z.number().int().nonnegative() })),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  hasMore: z.boolean(),
  /**
   * *"Maksud Anda …?"* — hanya terisi bila ada kandidat cukup dekat.
   * Keadaan kosong menawarkan jalan keluar, bukan sekadar memberi tahu bahwa
   * hasilnya nihil (FR-SRCH-05).
   */
  didYouMean: z.string().nullable(),
})
export type SearchResult = z.infer<typeof SearchResultSchema>

export const SuggestionSchema = z.object({
  id: IdSchema,
  kind: z.enum(['cerita', 'penulis', 'tag', 'riwayat']),
  label: z.string(),
  /** Bagian yang cocok dengan kueri, untuk disorot tanpa menebak di komponen. */
  matchStart: z.number().int().nonnegative(),
  matchLength: z.number().int().nonnegative(),
})
export type Suggestion = z.infer<typeof SuggestionSchema>

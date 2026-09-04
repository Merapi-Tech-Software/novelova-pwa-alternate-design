import { z } from 'zod'

/**
 * Bentuk yang dipakai lintas modul. Kontrak tidak pernah menyebut Dexie, tabel,
 * atau `fetch` — ia hanya bicara domain (architecture.md §5 aturan 4).
 */

export const IdSchema = z.string().min(1)
/** Tanggal-waktu ISO 8601, selalu UTC. */
export const IsoDateTimeSchema = z.iso.datetime()
/** Tanggal lokal `YYYY-MM-DD` — dihasilkan `lib/date.ts`, bukan `toISOString()`. */
export const LocalDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Harus YYYY-MM-DD')

/**
 * Daftar besar selalu disaring di seam, tidak pernah di DOM
 * (architecture.md §5 aturan 6). `page` dimulai dari 1.
 */
export const ListParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  q: z.string().optional(),
  sort: z.string().optional(),
})
export type ListParams = z.infer<typeof ListParamsSchema>

/** Satu halaman hasil, lengkap dengan total supaya penghitung bisa jujur. */
export function pagedOf<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    hasMore: z.boolean(),
  })
}
export interface Paged<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

/**
 * Kunci idempotency wajib untuk setiap mutasi yang menyentuh uang
 * (architecture.md §5 aturan 3). Dijalankan dua kali dengan kunci sama = satu
 * efek — inilah yang mencegah menekan "Buka bab" dua kali memotong saldo dua
 * kali (FR-READ-07).
 */
export const IdempotentSchema = z.object({ idempotencyKey: IdSchema })

export const GenreSchema = z.enum([
  'Romance',
  'Mystery',
  'Fantasy',
  'Drama',
  'Thriller',
  'CEO',
  'Horror',
])
export type Genre = z.infer<typeof GenreSchema>

export const AudienceSchema = z.enum(['Remaja', 'Semua Umur', 'Dewasa 18+'])
export const ContentLangSchema = z.enum(['id', 'en'])

/** Status tinjauan, berlaku untuk cerita maupun bab. FR-STUDIO-38. */
export const ReviewStateSchema = z.enum(['draft', 'in_review', 'rejected', 'published'])
export type ReviewState = z.infer<typeof ReviewStateSchema>

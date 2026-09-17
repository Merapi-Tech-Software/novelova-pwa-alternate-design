import { z } from 'zod'
import type { NovelovaApi } from './client'
import type { Paged } from './contracts'
import { kodeDari, statusDari } from './errorMap'
import { ApiError, type ApiErrorOptions, INTERNAL_CODES, toApiError } from './errors'

/**
 * Amplop respons backend — **satu bentuk untuk semua jawaban** ·
 * `backend-contract.md` §2.2, `architecture.md` §1.55.
 *
 * ```jsonc
 * { "success": true, "code": 200, "message": "", "data": {}, "meta": {}, "request_id": "3f9a…" }
 * ```
 *
 * Berkas ini **satu-satunya** tempat `success` dipercaya, `meta` dibaca, dan
 * `request_id` diambil. Halaman dan hook tidak tahu amplop ini ada: tipe seam
 * (`Paged<T>`, nilai kembalian tiap metode, `ApiError`) tidak berubah sedikit
 * pun, jadi 12 folder `features/` dan 43 rute tidak perlu disentuh.
 *
 * Dipakai **dua sisi**: `api/mock/` membungkus lalu membuka lagi jawabannya
 * sendiri, dan `api/http/` membuka jawaban backend sungguhan. Itu bukan ritual
 * kosong di sisi mock — ia yang membuat 678 test unit dan 124 e2e yang sudah
 * ada ikut menguji amplopnya, sehingga kode yang tidak bisa pulang dari
 * `(metode, status)` gagal di test, bukan di tangan pengguna.
 */

const MetaSchema = z
  .object({
    total_count: z.number().int().nonnegative(),
    limit: z.number().int().nonnegative(),
    offset: z.number().int().nonnegative(),
  })
  .partial()

/**
 * `data` **objek atau array, tidak pernah `null`** — aturannya ditegakkan
 * skema, bukan diingat. `z.unknown()` akan menerima `null` dan `undefined`
 * diam-diam, dan justru itu yang dilarang kontraknya.
 */
const AmplopSchema = z.object({
  success: z.boolean(),
  code: z.number().int(),
  message: z.string(),
  data: z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]),
  meta: MetaSchema,
  request_id: z.string(),
})

export type Amplop = z.infer<typeof AmplopSchema>
export type AmplopMeta = z.infer<typeof MetaSchema>

/* ─────────────────────────── bentuk kembalian ─────────────────────────── */

type Metode = keyof NovelovaApi
type Hasil<K extends Metode> = Awaited<ReturnType<NovelovaApi[K]>>

/**
 * Empat bentuk yang **tidak** bisa dibaca dari amplopnya sendiri, jadi harus
 * didaftarkan. Sisanya (93 metode) `polos`: `data` dikembalikan apa adanya,
 * termasuk array biasa.
 *
 * Uniknya, ketiga daftar di bawah **tidak bisa ketinggalan zaman**. Tipenya
 * diturunkan dari `NovelovaApi` sendiri, dan `Record<Union, true>` menuntut
 * seluruh anggotanya hadir — menambah satu metode `Promise<void>` tanpa
 * mendaftarkannya di sini membuat `tsc --noEmit` gagal, bukan membuat satu
 * layar diam-diam menerima `{}`.
 */
// `undefined`, bukan `void`: keduanya sama saja di sini karena `Awaited` dari
// `Promise<void>` adalah `void`, dan `undefined` bisa ditugaskan ke sana.
type MetodeKosong = { [K in Metode]: undefined extends Hasil<K> ? K : never }[Metode]
type MetodeNullable = { [K in Metode]: null extends Hasil<K> ? K : never }[Metode]
type MetodeNilai = {
  [K in Metode]: Hasil<K> extends string | number | boolean ? K : never
}[Metode]

/**
 * Cocok **dua arah**, dan itu perlu: `ReviewPage` membawa `items`, `page`,
 * `pageSize`, `total`, dan `hasMore` **plus** `breakdown`, `myReview`,
 * `topTags`, dan `isOwner`. Pemeriksaan satu arah akan menyebutnya halaman,
 * lalu keempat bidang tambahannya hilang dalam perjalanan.
 */
type MetodeHalaman = {
  [K in Metode]: Hasil<K> extends Paged<infer U> ? (Paged<U> extends Hasil<K> ? K : never) : never
}[Metode]

const KOSONG: Record<MetodeKosong, true> = {
  logout: true,
  revokeDeviceSession: true,
  saveProgress: true,
  hideStory: true,
  setAutoUnlock: true,
  dismissBundleOffer: true,
  removeFromLibrary: true,
  deleteRating: true,
  deleteReview: true,
  react: true,
  report: true,
  blockUser: true,
  markRead: true,
  setNotificationPrefs: true,
  deleteStory: true,
  deleteChapter: true,
  cancelScheduleEntry: true,
  withdrawFromReview: true,
  clearReadingHistory: true,
  touchOfflineChapter: true,
}

const HALAMAN: Record<MetodeHalaman, true> = {
  getSection: true,
  getChapters: true,
  listLibrary: true,
  getLibrary: true,
  listTransactions: true,
  listComments: true,
  listNotifications: true,
  getMyStories: true,
  getChaptersForAuthor: true,
  listPrintOrders: true,
  listWithdrawals: true,
  listConnections: true,
}

const NULLABLE: Record<MetodeNullable, true> = {
  getProgress: true,
  getMyRating: true,
  getBundleOffer: true,
}

const NILAI: Record<MetodeNilai, true> = {
  hasReported: true,
  getUnreadCount: true,
}

export type Bentuk = 'polos' | 'kosong' | 'halaman' | 'nullable' | 'nilai'

export function bentukDari(metode: string): Bentuk {
  if (metode in KOSONG) return 'kosong'
  if (metode in HALAMAN) return 'halaman'
  if (metode in NULLABLE) return 'nullable'
  if (metode in NILAI) return 'nilai'
  return 'polos'
}

/* ───────────────────────────── membungkus ─────────────────────────────── */

const META_KOSONG: AmplopMeta = {}

function idPermintaan(): string {
  return crypto.randomUUID()
}

function objekAtauKosong(nilai: unknown): Record<string, unknown> | unknown[] {
  if (Array.isArray(nilai)) return nilai
  if (nilai !== null && typeof nilai === 'object') return nilai as Record<string, unknown>
  return {}
}

/** Membungkus jawaban **berhasil**. `data` selalu objek atau array (§2.2). */
export function bungkus(metode: string, hasil: unknown): Amplop {
  const dasar = { success: true, code: 200, message: '', request_id: idPermintaan() }

  switch (bentukDari(metode)) {
    case 'kosong':
      return { ...dasar, data: {}, meta: META_KOSONG }

    case 'nilai':
      return { ...dasar, data: { value: hasil }, meta: META_KOSONG }

    case 'nullable':
      // `{}` **adalah** `null`-nya. "Belum ada" bukan kegagalan, jadi ia tidak
      // boleh jadi 404 — pembaca yang belum membuka satu cerita pun normal.
      return { ...dasar, data: objekAtauKosong(hasil), meta: META_KOSONG }

    case 'halaman': {
      const halaman = hasil as Paged<unknown>
      return {
        ...dasar,
        data: halaman.items,
        meta: {
          total_count: halaman.total,
          limit: halaman.pageSize,
          offset: (halaman.page - 1) * halaman.pageSize,
        },
      }
    }

    default: {
      const data = objekAtauKosong(hasil)
      // Array yang **tidak** berhalaman tetap membawa `meta`, supaya aturannya
      // mekanis: klien tidak perlu tahu daftar mana yang punya halaman.
      const meta: AmplopMeta = Array.isArray(data)
        ? { total_count: data.length, limit: data.length, offset: 0 }
        : META_KOSONG
      return { ...dasar, data, meta }
    }
  }
}

/**
 * Membungkus **kegagalan**. Tiga fakta ikut di `data` karena layarnya bertindak
 * dari fakta itu, bukan dari kalimat pesannya; selain ketiganya `data` = `{}`.
 */
export function bungkusGagal(gagal: unknown): Amplop {
  const err = toApiError(gagal)
  const data: Record<string, unknown> = {}

  if (err.retryAt !== undefined) data.retry_at = err.retryAt
  if (err.withdrawnAt !== undefined) data.withdrawn_at = err.withdrawnAt
  if (err.shortBy !== undefined) data.short_by = err.shortBy

  return {
    success: false,
    code: statusDari(err.code) ?? 500,
    message: err.message,
    data,
    meta: META_KOSONG,
    request_id: idPermintaan(),
  }
}

/* ────────────────────────────── membuka ───────────────────────────────── */

function cacatKontrak(metode: string, sebab: string, requestId?: string): ApiError {
  const opsi: ApiErrorOptions = { retryable: false, detail: `${metode}: ${sebab}` }
  if (requestId !== undefined) opsi.requestId = requestId
  return new ApiError(
    INTERNAL_CODES.CONTRACT,
    'Jawaban server tidak sesuai kontrak. Coba lagi sebentar lagi.',
    opsi,
  )
}

function angka(nilai: unknown): number | undefined {
  return typeof nilai === 'number' && Number.isFinite(nilai) ? nilai : undefined
}

function teks(nilai: unknown): string | undefined {
  return typeof nilai === 'string' && nilai !== '' ? nilai : undefined
}

/**
 * Membuka amplop jadi nilai yang dijanjikan seam — atau **melempar**
 * `ApiError`. Inilah satu-satunya pintu keluar amplop.
 */
export function buka(mentah: unknown, metode: string): unknown {
  const terurai = AmplopSchema.safeParse(mentah)
  if (!terurai.success) throw cacatKontrak(metode, 'amplop tidak utuh')

  const { success, code, message, data, meta, request_id } = terurai.data

  // §9 no. 24 — `success` dan status wajib sepakat. Amplop yang membantah
  // dirinya sendiri lebih berbahaya daripada kegagalan biasa: separuh klien
  // akan membaca yang satu dan separuh lagi yang lain.
  if (success !== (code >= 200 && code < 300)) {
    throw cacatKontrak(metode, `success=${success} tetapi code=${code}`, request_id)
  }

  if (!success) {
    const rincian: Record<string, unknown> = Array.isArray(data) ? {} : data
    const opsi: ApiErrorOptions = { requestId: request_id }

    const tunggu = teks(rincian.retry_at)
    if (tunggu !== undefined) opsi.retryAt = tunggu
    const ditarik = teks(rincian.withdrawn_at)
    if (ditarik !== undefined) opsi.withdrawnAt = ditarik
    const kurang = angka(rincian.short_by)
    if (kurang !== undefined) opsi.shortBy = kurang

    throw new ApiError(kodeDari(metode, code), message, opsi)
  }

  switch (bentukDari(metode)) {
    case 'kosong':
      return undefined

    case 'nilai': {
      if (Array.isArray(data) || !('value' in data)) {
        throw cacatKontrak(metode, 'data.value tidak ada', request_id)
      }
      return data.value
    }

    case 'nullable':
      return !Array.isArray(data) && Object.keys(data).length === 0 ? null : data

    case 'halaman': {
      const { total_count, limit, offset } = meta
      if (!Array.isArray(data) || total_count === undefined || limit === undefined) {
        throw cacatKontrak(metode, 'meta halaman tidak lengkap', request_id)
      }
      const awal = offset ?? 0
      return {
        items: data,
        page: limit > 0 ? Math.floor(awal / limit) + 1 : 1,
        pageSize: limit,
        total: total_count,
        // Dihitung, bukan dikirim — halaman terakhir yang salah membuat
        // `IntersectionObserver` di `/cari` memuat tanpa henti (CLAUDE.md §8).
        hasMore: awal + data.length < total_count,
      } satisfies Paged<unknown>
    }

    default:
      return data
  }
}

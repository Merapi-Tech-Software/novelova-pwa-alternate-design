/**
 * Kegagalan yang dinormalkan. UI tidak pernah melihat objek error mentah
 * (architecture.md §5 aturan 2).
 *
 * Dua hal yang membuat berkas ini bukan sekadar `class Error`:
 *
 * 1. **`retryable` memisahkan "coba lagi" dari "kosong".** FR-CORE-03 melarang
 *    daftar yang gagal dimuat tampil seperti daftar kosong — "tidak ada hasil"
 *    saat sebenarnya jaringan putus adalah kebohongan yang membuat pengguna
 *    berhenti mencoba.
 * 2. **Kodenya persis sama dengan yang tampil di layar.** Pengguna membacakan
 *    `PAY-504` ke dukungan; kalau log memakai istilah lain, jejaknya putus
 *    (architecture.md §1.4).
 */

/** Kode yang **tampil ke pengguna** — persis seperti di kanvas seksi 7a & 8a. */
export const VISIBLE_CODES = {
  /** Bank menolak transaksi. Tidak ada dana terpotong. */
  PAY_DECLINED: 'PAY-402',
  /** Penyedia tidak menjawab dalam 90 detik → menunggu rekonsiliasi. */
  PAY_UNCONFIRMED: 'PAY-504',
  /** Kode bayar / VA lewat batas waktu. */
  PAY_EXPIRED: 'PAY-410',

  /** Sesi berakhir setelah 30 hari tidak dipakai. */
  AUTH_EXPIRED: 'AUTH-401',
  /** 5 percobaan masuk gagal → tahan 15 menit. */
  AUTH_RATE_LIMITED: 'AUTH-429',
  /** Versi aplikasi di bawah minimum yang didukung. */
  APP_OUTDATED: 'APP-426',

  /** Autosave naskah gagal berulang. Editor **tidak** dibekukan. */
  DRAFT_SAVE_FAILED: 'DRAFT-409',
  /** Bab ditarik penulis. Pembelian direfund otomatis. */
  CONTENT_WITHDRAWN: 'CONTENT-410',

  /** Pembuatan PDF melewati batas waktu pemrosesan. */
  PRINT_BUILD_TIMEOUT: 'PRINT-504',
  /** Berkas PDF lewat masa simpan 30 hari. */
  PRINT_FILE_EXPIRED: 'PRINT-410',
  /** Pesanan sudah masuk produksi — tidak bisa dibatalkan. */
  PRINT_IN_PRODUCTION: 'PRINT-409',
  /** Admin mengubah biaya; produksi berhenti sampai penulis menyetujui. */
  PRINT_COST_CHANGED: 'PRINT-402',

  /** Dua bab dijadwalkan pada slot yang sama. */
  SCHED_SLOT_CLASH: 'SCHED-409',
  /** Waktu terbit lebih awal dari sekarang. */
  SCHED_PAST_TIME: 'SCHED-422',
  /** Zona waktu berubah — momen terbit tetap, hanya tampilannya bergeser. */
  SCHED_TZ_SHIFTED: 'SCHED-200',
} as const

/** Kode internal — tidak pernah ditampilkan mentah ke pengguna. */
export const INTERNAL_CODES = {
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  OFFLINE: 'OFFLINE',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION',
  /** Respons tidak lolos skema Zod di batas seam. */
  CONTRACT: 'CONTRACT',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INSUFFICIENT_COINS: 'INSUFFICIENT_COINS',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  UNKNOWN: 'UNKNOWN',
} as const

type Values<T> = T[keyof T]
export type VisibleCode = Values<typeof VISIBLE_CODES>
export type InternalCode = Values<typeof INTERNAL_CODES>
export type ErrorCode = VisibleCode | InternalCode

/** Kegagalan yang mana pun boleh dicoba ulang tanpa risiko efek ganda. */
const RETRYABLE: ReadonlySet<string> = new Set<ErrorCode>([
  INTERNAL_CODES.NETWORK,
  INTERNAL_CODES.TIMEOUT,
  INTERNAL_CODES.OFFLINE,
  INTERNAL_CODES.UNKNOWN,
  VISIBLE_CODES.PAY_DECLINED,
  VISIBLE_CODES.DRAFT_SAVE_FAILED,
  VISIBLE_CODES.PRINT_BUILD_TIMEOUT,
])

export interface ApiErrorOptions {
  /** Detail teknis untuk log — tidak pernah dirender. */
  cause?: unknown
  /** Menimpa keputusan `retryable` bawaan kode ini. */
  retryable?: boolean
  /** Ditampilkan kecil di bawah pesan: `"PAY-402 · GoPay · 21.44 WIB"`. */
  detail?: string
  /**
   * Kapan permintaan yang sama boleh diulang, ISO. Dipakai kegagalan yang
   * menahan pengguna untuk waktu tertentu — `AUTH-429` menyebut jam buka
   * kembali di layar, dan itu hanya mungkin kalau waktunya ikut di error, bukan
   * terkubur di dalam kalimat pesannya.
   */
  retryAt?: string
}

export class ApiError extends Error {
  readonly code: ErrorCode
  readonly retryable: boolean
  readonly detail: string | undefined
  readonly retryAt: string | undefined

  constructor(code: ErrorCode, message: string, options: ApiErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause })
    this.name = 'ApiError'
    this.code = code
    this.retryable = options.retryable ?? RETRYABLE.has(code)
    this.detail = options.detail
    this.retryAt = options.retryAt
  }

  /** Benar bila kodenya memang untuk dibaca pengguna ke tim dukungan. */
  get isVisibleCode(): boolean {
    return this.code.includes('-')
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError
}

/**
 * Membungkus apa pun yang dilempar menjadi `ApiError`.
 * Dipakai di batas seam supaya tidak ada `TypeError` yang lolos ke komponen.
 */
export function toApiError(e: unknown): ApiError {
  if (isApiError(e)) return e
  if (e instanceof Error) {
    return new ApiError(INTERNAL_CODES.UNKNOWN, e.message, { cause: e })
  }
  return new ApiError(INTERNAL_CODES.UNKNOWN, 'Terjadi kegagalan yang tidak dikenali', { cause: e })
}

/**
 * Melengkapi implementasi seam yang belum ditulis.
 *
 * Kedua sisi seam wajib memenuhi `NovelovaApi` **sekarang**, padahal handler-nya
 * baru ditulis per fase. Tanpa ini, tiap fase harus menambah puluhan metode
 * kosong hanya supaya berkasnya lolos typecheck.
 */
export function withNotImplemented<T extends object>(partial: Partial<T>, side: string): T {
  return new Proxy(partial, {
    get(target, prop, receiver) {
      if (prop in target) return Reflect.get(target, prop, receiver)
      return () => {
        throw new ApiError(
          INTERNAL_CODES.NOT_IMPLEMENTED,
          `Fungsi "${String(prop)}" belum ada di implementasi ${side}.`,
          { retryable: false },
        )
      }
    },
  }) as T
}

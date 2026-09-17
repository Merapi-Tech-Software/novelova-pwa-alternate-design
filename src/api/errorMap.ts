import { type ErrorCode, INTERNAL_CODES, VISIBLE_CODES } from './errors'

/**
 * Peta dua arah antara **status HTTP** dan `ErrorCode` · `backend-contract.md` §7.
 *
 * Amplop backend (§2.2) hanya membawa `code` berupa **angka status HTTP** —
 * keputusan pengguna di Langkah 86. Ke-15 kode yang tampil ke pengguna dan 12
 * kode internal **tidak dikirim**, jadi klien memulihkannya sendiri dari
 * pasangan **`(metode, status)`**.
 *
 * Pasangannya cukup karena tiap metode hanya punya satu arti per status:
 * `402` dari `unlockChapter` adalah koin kurang, `402` dari `confirmTopupOrder`
 * adalah bank menolak. Yang **tidak** cukup adalah statusnya sendirian — dan
 * itulah sebabnya berkas ini ada alih-alih satu `switch` di `envelope.ts`.
 *
 * **Satu tabel, dua arah.** `statusDari()` tidak menulis ulang angkanya: kode
 * yang tampil ke pengguna berbentuk `XXX-nnn` dan `nnn` **adalah** status
 * HTTP-nya (aturan §9 no. 26), jadi angkanya dibaca dari namanya. Menuliskannya
 * dua kali berarti suatu hari keduanya berselisih tanpa ada yang tahu.
 */

/** Bawaan per status — berlaku untuk metode apa pun · §7.1. */
const BAWAAN: Readonly<Record<number, ErrorCode>> = {
  400: INTERNAL_CODES.VALIDATION,
  401: VISIBLE_CODES.AUTH_EXPIRED,
  402: INTERNAL_CODES.INSUFFICIENT_COINS,
  403: INTERNAL_CODES.FORBIDDEN,
  404: INTERNAL_CODES.NOT_FOUND,
  409: INTERNAL_CODES.CONFLICT,
  410: INTERNAL_CODES.NOT_FOUND,
  422: INTERNAL_CODES.VALIDATION,
  426: VISIBLE_CODES.APP_OUTDATED,
  429: INTERNAL_CODES.QUOTA_EXCEEDED,
  501: INTERNAL_CODES.NOT_IMPLEMENTED,
}

/**
 * Penimpaan per metode · §7.2 — diturunkan dari titik lempar yang **benar-benar
 * ada** di server-mock, bukan dari daftar keinginan.
 *
 * Metode yang tidak ada di sini memakai bawaan §7.1: `409` dari `claimCheckIn`
 * adalah `CONFLICT`, bukan `DRAFT-409`.
 */
export const PENIMPAAN: Readonly<Record<string, Readonly<Record<number, ErrorCode>>>> = {
  login: { 429: VISIBLE_CODES.AUTH_RATE_LIMITED },
  createTopupOrder: {
    402: VISIBLE_CODES.PAY_DECLINED,
    504: VISIBLE_CODES.PAY_UNCONFIRMED,
  },
  confirmTopupOrder: {
    402: VISIBLE_CODES.PAY_DECLINED,
    410: VISIBLE_CODES.PAY_EXPIRED,
    504: VISIBLE_CODES.PAY_UNCONFIRMED,
  },
  // Tiga arti berbeda dari satu metode: 404 tidak ada · 409 sudah habis ·
  // 410 kedaluwarsa. Hanya yang ketiga yang butuh kode tampil.
  redeemVoucher: { 410: VISIBLE_CODES.PAY_EXPIRED },
  getChapter: { 410: VISIBLE_CODES.CONTENT_WITHDRAWN },
  saveChapterDraft: { 409: VISIBLE_CODES.DRAFT_SAVE_FAILED },
  scheduleChapter: { 422: VISIBLE_CODES.SCHED_PAST_TIME },
  scheduleStory: { 422: VISIBLE_CODES.SCHED_PAST_TIME },
  cancelPrintOrder: { 409: VISIBLE_CODES.PRINT_IN_PRODUCTION },
}

/**
 * Lima kode yang **bukan kegagalan RPC** · §7.3.
 *
 * Mereka hidup sebagai keadaan di dalam data — `print_orders.failure_code`,
 * peringatan zona waktu, dan bentrok jadwal yang diturunkan — dan dijawab
 * `200`. Kalau salah satunya sampai dilempar sebagai error, layar yang
 * membacanya dari status pesanan berhenti bekerja; karena itu `statusDari()`
 * menolaknya alih-alih menebak.
 */
export const KODE_DI_DATA: ReadonlySet<ErrorCode> = new Set<ErrorCode>([
  VISIBLE_CODES.SCHED_TZ_SHIFTED,
  // Bentrok jadwal **diturunkan**, bukan dilempar: `SchedulePage` merendernya
  // dari daftar entri yang saling berdekatan, dan memperbaiki jadwalnya
  // menghapus barisnya sendiri (§1.11). Kalau `scheduleChapter` menolak dengan
  // 409, bentrok tidak akan pernah bisa dibuat — termasuk yang sengaja disemai
  // supaya peringatannya punya data.
  VISIBLE_CODES.SCHED_SLOT_CLASH,
  VISIBLE_CODES.PRINT_BUILD_TIMEOUT,
  VISIBLE_CODES.PRINT_FILE_EXPIRED,
  VISIBLE_CODES.PRINT_COST_CHANGED,
])

/**
 * Empat kode yang **lahir di klien**, bukan di server · §7.1 baris terakhir.
 * Tidak ada status HTTP yang memetakan ke sini, karena tidak ada jawaban server
 * yang membawanya: ia justru dipakai saat jawabannya tidak ada atau tidak utuh.
 */
export const KODE_KLIEN: ReadonlySet<ErrorCode> = new Set<ErrorCode>([
  INTERNAL_CODES.NETWORK,
  INTERNAL_CODES.TIMEOUT,
  INTERNAL_CODES.OFFLINE,
  INTERNAL_CODES.CONTRACT,
])

/** Kode internal yang memang menyeberang, dan statusnya. */
const STATUS_INTERNAL: Readonly<Record<string, number>> = {
  [INTERNAL_CODES.VALIDATION]: 400,
  [INTERNAL_CODES.FORBIDDEN]: 403,
  [INTERNAL_CODES.NOT_FOUND]: 404,
  [INTERNAL_CODES.CONFLICT]: 409,
  [INTERNAL_CODES.INSUFFICIENT_COINS]: 402,
  [INTERNAL_CODES.QUOTA_EXCEEDED]: 429,
  [INTERNAL_CODES.UNKNOWN]: 500,
  [INTERNAL_CODES.NOT_IMPLEMENTED]: 501,
}

/**
 * `(metode, status)` → kode yang dipakai aplikasi.
 *
 * `5xx` yang tidak dikenali jatuh ke `UNKNOWN` — satu-satunya kelas yang boleh
 * dicoba ulang otomatis. `4xx` yang tidak dikenali jatuh ke `VALIDATION`:
 * permintaannya yang salah, dan mengulanginya apa adanya tidak akan menolong.
 */
export function kodeDari(metode: string, status: number): ErrorCode {
  const khusus = PENIMPAAN[metode]?.[status]
  if (khusus) return khusus

  const bawaan = BAWAAN[status]
  if (bawaan) return bawaan

  return status >= 500 ? INTERNAL_CODES.UNKNOWN : INTERNAL_CODES.VALIDATION
}

/**
 * `ErrorCode` → status HTTP, atau `null` bila kode itu memang tidak pernah
 * menyeberang (§7.3 dan kode klien).
 *
 * Angka pada kode tampil dibaca dari **namanya sendiri** — `PAY-402` → `402` —
 * supaya tidak ada tabel kedua yang bisa berselisih dengan yang pertama.
 */
export function statusDari(kode: ErrorCode): number | null {
  if (KODE_KLIEN.has(kode) || KODE_DI_DATA.has(kode)) return null

  const dariNama = /-(\d{3})$/.exec(kode)
  if (dariNama?.[1]) return Number(dariNama[1])

  return STATUS_INTERNAL[kode] ?? 500
}

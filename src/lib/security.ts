/**
 * Skor perlindungan akun · FR-SET-02 · kanvas layar 29.
 *
 * **Satu berkas, dua pembaca** — pola `lib/payout.ts`, `lib/notif.ts`,
 * `lib/rewards.ts`: layar memakainya untuk menggambar skor dan saran, server
 * memakainya untuk menghitung angka yang dikirimnya. Dihitung terpisah, layar
 * bisa menjanjikan "+25 poin" sementara server memberi angka lain — dan tidak
 * ada test yang salah, karena keduanya benar sendiri-sendiri.
 *
 * Tanpa React dan tanpa `api`.
 */

/** Lima faktor berbobot; totalnya tepat 100. */
export const SECURITY_FACTORS = [
  { id: 'password', label: 'Kata sandi kuat', weight: 20 },
  { id: 'twoFactor', label: 'Verifikasi dua langkah', weight: 25 },
  { id: 'loginAlerts', label: 'Peringatan masuk', weight: 20 },
  { id: 'recovery', label: 'Kontak pemulihan terverifikasi', weight: 20 },
  { id: 'sessions', label: 'Sesi aktif terkendali', weight: 15 },
] as const

export type SecurityFactorId = (typeof SECURITY_FACTORS)[number]['id']

export type SecurityFacts = Record<SecurityFactorId, boolean>

/**
 * Bobotnya dijumlahkan sekali, bukan ditulis `100` sebagai konstanta kedua:
 * angka yang ditulis tangan akan berselisih pada perubahan bobot pertama, dan
 * skor 105 dari 100 tidak akan ketahuan sampai ada yang melihatnya di layar.
 */
export const SECURITY_MAX = SECURITY_FACTORS.reduce((sum, f) => sum + f.weight, 0)

export function securityScore(facts: SecurityFacts): number {
  return SECURITY_FACTORS.reduce((sum, f) => sum + (facts[f.id] ? f.weight : 0), 0)
}

/** Ambang label · kanvas layar 29: ≥85 kuat, ≥60 sedang, sisanya lemah. */
export type SecurityLevel = 'kuat' | 'sedang' | 'lemah'

export function securityLevel(score: number): SecurityLevel {
  if (score >= 85) return 'kuat'
  if (score >= 60) return 'sedang'
  return 'lemah'
}

/**
 * Berapa poin yang **akan didapat** kalau satu faktor dinyalakan.
 *
 * Dipakai saran keamanan supaya kalimatnya menyebut angka yang sungguhan —
 * saran yang berkata "tingkatkan keamanan" tanpa menyebut berapa tidak memberi
 * alasan untuk menekannya.
 */
export function pointsFor(id: SecurityFactorId): number {
  return SECURITY_FACTORS.find((f) => f.id === id)?.weight ?? 0
}

/** Sesi yang tidak aktif selama ini dianggap perlu ditinjau · kanvas layar 29. */
export const STALE_SESSION_DAYS = 12

/** Masa tenggang penghapusan akun · FR-SET-05. */
export const DELETION_GRACE_DAYS = 30

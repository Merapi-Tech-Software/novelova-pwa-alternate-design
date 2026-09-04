/**
 * Tanggal yang benar menurut **zona waktu pengguna**, bukan menurut UTC.
 *
 * `new Date().toISOString().slice(0, 10)` adalah bug yang sudah pernah terjadi:
 * di WIB (UTC+7) pukul 06.00, UTC masih di tanggal kemarin — sehingga klaim
 * check-in harian bisa ditolak, dan penjadwal menolak "hari ini" sebagai masa
 * lalu. FR-STUDIO-04 dan FR-RWD-07 keduanya bergantung pada ini.
 */

const MS_PER_MINUTE = 60_000
const MS_PER_DAY = 86_400_000

/**
 * Tanggal lokal dalam bentuk `YYYY-MM-DD`.
 *
 * @example
 * // 26 Agu 2026 23.30 UTC = 27 Agu 06.30 WIB
 * todayLocalISO(new Date('2026-08-26T23:30:00Z')) // "2026-08-27" di UTC+7
 */
export function todayLocalISO(at: Date = new Date()): string {
  const shifted = new Date(at.getTime() - at.getTimezoneOffset() * MS_PER_MINUTE)
  return shifted.toISOString().slice(0, 10)
}

/** Awal hari lokal — dasar perbandingan "hari ini" vs "kemarin". */
export function startOfLocalDay(at: Date = new Date()): Date {
  const d = new Date(at)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Benar bila kedua waktu jatuh pada tanggal lokal yang sama. */
export function isSameLocalDay(a: Date, b: Date): boolean {
  return startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime()
}

/**
 * Selisih **hari kalender** lokal, bukan selisih 24 jam.
 * Pukul 23.00 dan 01.00 keesokan harinya berjarak 1 hari, bukan 0.
 */
export function localDaysBetween(from: Date, to: Date): number {
  const ms = startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime()
  return Math.round(ms / MS_PER_DAY)
}

/** Zona waktu IANA perangkat ini — disimpan bersama jadwal terbit (FR-STUDIO-37). */
export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

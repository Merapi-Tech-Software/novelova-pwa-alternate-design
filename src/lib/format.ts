/**
 * Format angka, uang, dan waktu — seluruhnya lewat `Intl` locale `id-ID`.
 * Tidak ada dayjs / date-fns (architecture.md §2).
 *
 * Angka koin ringkas ada di `coin.ts` (`formatCompactCoin`), bukan di sini.
 */

import { isSameLocalDay, localDaysBetween } from './date'

const LOCALE = 'id-ID'

const rupiah = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})
const decimal = new Intl.NumberFormat(LOCALE)
const dateShort = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const dateLong = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const timeOnly = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' })
const timeZoned = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
})

/** `148000` → `"Rp 148.000"` */
export function formatRupiah(value: number): string {
  return rupiah.format(value)
}

/** `985234` → `"985.234"` — pemisah ribuan Indonesia (titik). */
export function formatNumber(value: number): string {
  return decimal.format(value)
}

/** `"26 Agu 2026"` */
export function formatDate(at: Date): string {
  return dateShort.format(at)
}

/** `"Rabu, 26 Agustus 2026"` */
export function formatDateLong(at: Date): string {
  return dateLong.format(at)
}

/** `"21.44"` — Indonesia memakai titik, bukan titik dua. */
export function formatTime(at: Date): string {
  return timeOnly.format(at)
}

/**
 * `"22.02 WIB"` — jam beserta zonanya.
 *
 * Dipakai saat pengguna harus **menunggu sampai jam tertentu** (`AUTH-429`,
 * kedaluwarsa kode bayar). Tanpa zona, "22.02" ambigu bagi pengguna yang sedang
 * bepergian, dan justru merekalah yang paling sering terkunci.
 */
export function formatTimeZoned(at: Date): string {
  return timeZoned.format(at)
}

/** `"26 Agu 2026 · 21.44"` */
export function formatDateTime(at: Date): string {
  return `${formatDate(at)} · ${formatTime(at)}`
}

/**
 * `"baru saja"` · `"12 menit lalu"` · `"5 jam lalu"` · `"Kemarin"` ·
 * `"3 hari lalu"` · `"2 minggu lalu"` · `"9 bulan lalu"` · `"2 tahun lalu"`
 *
 * Ditulis tangan, bukan dari `Intl.RelativeTimeFormat`, karena ICU menghasilkan
 * "12 menit **yang** lalu" sementara PRD menetapkan "12 menit lalu"
 * (FR-PROF-02, FR-NOTIF-01). Ini keputusan copy, bukan keputusan locale — dan
 * Bahasa Indonesia tidak punya bentuk jamak, jadi cabangnya memang sependek ini.
 *
 * Batas hari memakai **hari kalender lokal**, bukan selisih 24 jam — supaya
 * sesuatu yang terjadi pukul 23.50 tidak masih disebut "hari ini" pada pukul
 * 00.10 keesokan harinya.
 */
export function formatRelative(at: Date, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - at.getTime()) / 1000))
  if (seconds < 45) return 'baru saja'

  if (isSameLocalDay(at, now)) {
    if (seconds < 60) return `${seconds} detik lalu`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} menit lalu`
    return `${Math.floor(seconds / 3_600)} jam lalu`
  }

  const days = localDaysBetween(at, now)
  if (days === 1) return 'Kemarin'
  if (days < 7) return `${days} hari lalu`
  if (days < 30) return `${Math.floor(days / 7)} minggu lalu`
  if (days < 365) return `${Math.floor(days / 30)} bulan lalu`
  return `${Math.floor(days / 365)} tahun lalu`
}

/**
 * Kepala kelompok hari untuk daftar notifikasi & aktivitas:
 * `"Hari ini"` · `"Kemarin"` · `"26 Agu 2026"`. FR-NOTIF-01.
 */
export function formatDayGroup(at: Date, now: Date = new Date()): string {
  if (isSameLocalDay(at, now)) return 'Hari ini'
  if (localDaysBetween(at, now) === 1) return 'Kemarin'
  return formatDate(at)
}

/**
 * Sisa waktu untuk timer kedaluwarsa pembayaran: `"14:59"` atau `"23:59:12"`.
 * Nol berarti sudah lewat — pemanggil yang memutuskan apa artinya.
 */
export function formatCountdown(msLeft: number): string {
  const total = Math.max(0, Math.floor(msLeft / 1000))
  const h = Math.floor(total / 3_600)
  const m = Math.floor((total % 3_600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

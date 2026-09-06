/**
 * Aturan pusat hadiah · FR-RWD-02 · FR-RWD-04 · FR-RWD-07.
 *
 * **Satu berkas, dua pembaca** — pola `lib/payout.ts` dan `lib/notif.ts`: layar
 * memakainya untuk menggambar kalender tujuh hari, server memakainya untuk
 * memutuskan berapa koin yang benar-benar diberikan. Dihitung terpisah, kalender
 * bisa menjanjikan 20 koin sementara server memberi 15 — dan tidak ada test yang
 * salah, karena keduanya benar sendiri-sendiri.
 *
 * Tanpa React dan tanpa `api`.
 */

/** Hadiah hari ke-7 bukan koin, melainkan voucher · FR-RWD-02. */
export interface CheckInStep {
  /** 1–7. */
  day: number
  coins: number
  /** Terisi hanya di hari ketujuh. */
  voucherTitle: string | null
}

/**
 * Tangga tujuh hari, **menaik**, dan puncaknya voucher · FR-RWD-02.
 *
 * Angka-angkanya dari tabel PRD apa adanya. Puncaknya sengaja bukan koin: yang
 * membuat orang menyelesaikan siklus adalah hadiah yang berbeda jenisnya, bukan
 * hadiah yang sekadar lebih besar.
 */
export const CHECKIN_LADDER: CheckInStep[] = [
  { day: 1, coins: 10, voucherTitle: null },
  { day: 2, coins: 10, voucherTitle: null },
  { day: 3, coins: 15, voucherTitle: null },
  { day: 4, coins: 20, voucherTitle: null },
  { day: 5, coins: 20, voucherTitle: null },
  { day: 6, coins: 25, voucherTitle: null },
  { day: 7, coins: 0, voucherTitle: 'Bundle 5 bab gratis' },
]

export const CHECKIN_CYCLE = CHECKIN_LADDER.length

/** Hadiah referral, dan **syaratnya** · FR-RWD-04. */
export const REFERRAL_REWARD_COINS = 200

/**
 * Selisih hari kalender antara dua tanggal lokal `YYYY-MM-DD`.
 *
 * Membandingkan **string tanggal**, bukan `Date` bermenit-jam: dua stempel waktu
 * yang berjarak 20 jam bisa berada di hari kalender yang sama atau berbeda, dan
 * hanya tanggalnya yang menentukan hak klaim (FR-RWD-07).
 */
export function daysBetweenISO(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`)
  const b = Date.parse(`${to}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.NaN
  return Math.round((b - a) / 86_400_000)
}

export interface StreakState {
  /** Berapa hari berturut-turut yang **masih berlaku** hari ini. */
  streak: number
  /** Hari ke berapa yang akan diklaim berikutnya, 1–7. */
  nextDay: number
  /** Sudah klaim hari ini? */
  claimedToday: boolean
}

/**
 * Keadaan streak **dihitung ulang dari tanggal**, bukan dibaca apa adanya ·
 * FR-RWD-07.
 *
 * Ini yang membuat aturan *"melewatkan satu hari → kembali ke Hari 1"* benar
 * tanpa ada kerja terjadwal yang harus berjalan tengah malam: streak yang basi
 * tidak perlu dibersihkan, ia cukup **tidak dihitung** saat dibaca berikutnya.
 *
 * - klaim terakhir **hari ini** → streak berdiri, tidak bisa klaim lagi
 * - klaim terakhir **kemarin** → streak berlanjut
 * - lebih lama, atau belum pernah → streak nol, klaim berikutnya Hari 1
 *
 * Hari ke-7 menutup siklus: sesudahnya `streak` kembali nol, jadi `nextDay`
 * kembali 1.
 */
export function streakStateOf(
  lastCheckIn: string | null,
  storedStreak: number,
  today: string,
): StreakState {
  if (lastCheckIn === null) return { streak: 0, nextDay: 1, claimedToday: false }

  const gap = daysBetweenISO(lastCheckIn, today)
  if (Number.isNaN(gap) || gap < 0 || gap > 1) {
    return { streak: 0, nextDay: 1, claimedToday: false }
  }

  const streak = Math.max(0, Math.min(storedStreak, CHECKIN_CYCLE))
  if (gap === 0) {
    return { streak, nextDay: (streak % CHECKIN_CYCLE) + 1, claimedToday: true }
  }
  // Kemarin: siklus penuh dimulai ulang, selain itu lanjut.
  const carried = streak >= CHECKIN_CYCLE ? 0 : streak
  return { streak: carried, nextDay: carried + 1, claimedToday: false }
}

/** Langkah yang akan diklaim berikutnya. */
export function stepFor(day: number): CheckInStep {
  const step = CHECKIN_LADDER[Math.max(1, Math.min(CHECKIN_CYCLE, day)) - 1]
  // `CHECKIN_LADDER` panjangnya tetap tujuh dan indeksnya sudah dijepit, jadi
  // cabang ini tidak pernah terpakai — ia ada supaya tipenya tidak `undefined`.
  return step ?? { day: 1, coins: 10, voucherTitle: null }
}

/** Tiga jenis misi, dan **sumber progres nyatanya** · FR-RWD-07. */
export const MISSION_KINDS = ['read', 'review', 'ad'] as const
export type MissionKind = (typeof MISSION_KINDS)[number]

export const MISSION_SOURCE: Record<MissionKind, string> = {
  read: 'Bab yang kamu selesaikan hari ini',
  review: 'Ulasan yang kamu kirim hari ini',
  ad: 'Iklan yang selesai kamu tonton hari ini',
}

/** Ambang "hampir kedaluwarsa" untuk peringatan voucher · FR-RWD-01. */
export const VOUCHER_EXPIRING_DAYS = 3

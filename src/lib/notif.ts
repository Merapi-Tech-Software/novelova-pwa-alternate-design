import type { NotifKind, NotifPrefGroup, NotifType } from '@/api/contracts'

/**
 * Katalog sebelas jenis notifikasi · FR-NOTIF-02.
 *
 * **Satu tabel, dua pembaca** — pola yang sama dengan `lib/payout.ts`: layar
 * memakainya untuk ikon dan label, server-mock memakainya untuk memutuskan
 * saringan mana yang memuat sebuah notifikasi dan kelompok preferensi mana yang
 * boleh mematikannya.
 *
 * Kalau ketiganya dihitung terpisah, mereka akan menyimpang — dan gejalanya
 * paling halus: notifikasi yang muncul di saringan "Dompet" tetapi ikut mati
 * saat pengguna mematikan "Cerita".
 *
 * Tanpa React dan tanpa `api`, jadi test bisa memanggilnya langsung.
 */

export interface NotifKindDef {
  /** Saringan yang memuatnya · FR-NOTIF-01. */
  type: NotifType
  /** Kelompok preferensi yang boleh mematikannya · FR-NOTIF-04. */
  group: NotifPrefGroup
  /** Nama jenisnya untuk pembaca layar dan halaman preferensi. */
  label: string
}

/**
 * Urutannya mengikuti tabel FR-NOTIF-02 apa adanya, supaya kedua daftar bisa
 * dibandingkan baris per baris tanpa menerjemahkan.
 */
export const NOTIF_KINDS: Record<NotifKind, NotifKindDef> = {
  'bab-baru': { type: 'cerita', group: 'cerita', label: 'Bab baru' },
  'bab-terjadwal': { type: 'cerita', group: 'karya', label: 'Bab terjadwal terbit' },
  'cerita-terjadwal': { type: 'cerita', group: 'karya', label: 'Cerita terjadwal terbit' },
  'cetak-status': { type: 'sistem', group: 'karya', label: 'Status pesanan cetak' },
  topup: { type: 'dompet', group: 'dompetHadiah', label: 'Top-up koin' },
  checkin: { type: 'hadiah', group: 'dompetHadiah', label: 'Check-in harian' },
  'voucher-kedaluwarsa': {
    type: 'hadiah',
    group: 'dompetHadiah',
    label: 'Voucher akan kedaluwarsa',
  },
  'ulasan-komentar': { type: 'cerita', group: 'karya', label: 'Ulasan & komentar baru' },
  'pengikut-baru': { type: 'cerita', group: 'cerita', label: 'Pengikut baru' },
  penarikan: { type: 'dompet', group: 'karya', label: 'Penarikan' },
  keamanan: { type: 'sistem', group: 'sistem', label: 'Sistem & keamanan' },
}

/** Sebelas kunci, urut sesuai tabel PRD. */
export const NOTIF_KIND_LIST = Object.keys(NOTIF_KINDS) as NotifKind[]

export function typeOfKind(kind: NotifKind): NotifType {
  return NOTIF_KINDS[kind].type
}

export function groupOfKind(kind: NotifKind): NotifPrefGroup {
  return NOTIF_KINDS[kind].group
}

/**
 * Judul kelompok preferensi · FR-NOTIF-04.
 *
 * `sistem` sengaja tidak menyebut "Sistem" saja: yang membuatnya tidak bisa
 * dimatikan adalah bagian **keamanan**-nya, dan judul yang menyembunyikan itu
 * membuat sakelar terkuncinya terbaca sebagai cacat.
 */
export const NOTIF_GROUP_LABEL: Record<NotifPrefGroup, string> = {
  cerita: 'Cerita',
  dompetHadiah: 'Dompet & Hadiah',
  karya: 'Karya saya',
  sistem: 'Sistem & Keamanan',
}

export const NOTIF_GROUP_LIST = Object.keys(NOTIF_GROUP_LABEL) as NotifPrefGroup[]

/** Jenis apa saja yang ikut mati bila satu kelompok dimatikan. */
export function kindsInGroup(group: NotifPrefGroup): NotifKind[] {
  return NOTIF_KIND_LIST.filter((kind) => NOTIF_KINDS[kind].group === group)
}

/**
 * Lencana lonceng · FR-NOTIF-03. Lebih dari sembilan ditulis `9+`; **nol
 * mengembalikan `null`**, bukan `'0'` — lencana yang menampilkan nol adalah
 * lencana yang selalu ada, dan lencana yang selalu ada berhenti berarti.
 */
export function badgeCount(unread: number): string | null {
  if (unread <= 0) return null
  return unread > 9 ? '9+' : String(unread)
}

/** Notifikasi lebih lama dari ini tidak ditampilkan · FR-NOTIF-01. */
export const NOTIF_MAX_AGE_DAYS = 90

/** Jendela penggabungan notifikasi sejenis · FR-NOTIF-02. */
export const NOTIF_MERGE_WINDOW_MS = 24 * 60 * 60 * 1000

/**
 * Jam tenang · FR-NOTIF-05 · architecture.md §10.4.
 *
 * **Yang ditunda hanya push.** Notifikasi dalam aplikasi tetap tercatat saat itu
 * juga — menahan keduanya berarti kabar yang datang pukul 23.00 baru ada
 * jejaknya pukul 07.00, dan pembaca yang membuka aplikasi pukul 02.00 melihat
 * daftar yang berbohong.
 *
 * Jendelanya boleh **melintasi tengah malam** (22→7), dan itulah bentuk
 * bawaannya: `from > to` berarti rentangnya membungkus, bukan rentang kosong.
 */
export function dalamJamTenang(jam: number, from: number, to: number): boolean {
  if (from === to) return false
  return from < to ? jam >= from && jam < to : jam >= from || jam < to
}

/** Jam lokal pengguna menurut zona waktunya, bukan zona server. */
export function jamDiZona(timezone: string, at: Date = new Date()): number {
  try {
    return Number.parseInt(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        hour12: false,
      }).format(at),
      10,
    )
  } catch {
    // Zona yang tidak dikenal peramban jatuh ke jam lokal mesin. Salah zona
    // lebih baik daripada push yang berhenti sama sekali.
    return at.getHours()
  }
}

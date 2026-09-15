import type { AgeVerification, AgeVerificationStatus, Story } from '@/api/contracts'

/**
 * Aturan usia · todo-incoming-features.md A1.
 *
 * **Satu berkas, dua pembaca** — pola yang sama dengan `lib/payout.ts` dan
 * `lib/notif.ts`: server-mock memakainya untuk memutuskan apakah isi bab boleh
 * dikirim, layar memakainya untuk memilih kalimat gerbangnya. Kalau keduanya
 * menghitung usia sendiri-sendiri, batas 18 tahun bisa jatuh pada hari yang
 * berbeda di dua tempat — dan yang salah selalu yang dilihat pembaca.
 *
 * Tanpa React dan tanpa `api`, jadi test bisa memanggilnya langsung.
 */

export const ADULT_MIN_AGE = 18

/** Label cerita yang isinya digerbangi usia. Nilai `AudienceSchema`. */
export const ADULT_AUDIENCE: Story['audience'] = 'Dewasa 18+'

export function isAdultStory(story: Pick<Story, 'audience'>): boolean {
  return story.audience === ADULT_AUDIENCE
}

/**
 * Usia penuh pada tanggal tertentu, dari dua tanggal lokal `YYYY-MM-DD`.
 *
 * Dihitung dari komponen tanggal, **bukan** dari selisih milidetik ÷ 365,25:
 * pembulatan itu meleset satu hari di sekitar ulang tahun, dan satu hari di
 * sekitar ulang tahun ke-18 adalah persis hari yang diperkarakan.
 */
export function ageOn(birthDate: string, today: string): number {
  const [by, bm, bd] = birthDate.split('-').map(Number)
  const [ty, tm, td] = today.split('-').map(Number)
  if (!by || !bm || !bd || !ty || !tm || !td) return 0
  let age = ty - by
  if (tm < bm || (tm === bm && td < bd)) age -= 1
  return Math.max(0, age)
}

/**
 * Apakah akun ini boleh membaca cerita 18+ **hari ini**.
 *
 * Diturunkan, tidak disimpan: akun yang diverifikasi pada usia 17 tahun 11
 * bulan menjadi dewasa sebulan kemudian tanpa ada yang menulis apa pun — dan
 * bendera tersimpan akan tetap berkata "belum" selamanya.
 */
export function isAdultNow(
  v: Pick<AgeVerification, 'status' | 'birthDate'> | null | undefined,
  today: string,
): boolean {
  if (v?.status !== 'verified' || v.birthDate === null) return false
  return ageOn(v.birthDate, today) >= ADULT_MIN_AGE
}

/** Batas tanggal lahir termuda yang lolos pada `today` — untuk `max` kolom tanggal. */
export function latestAdultBirthDate(today: string): string {
  const [y, m, d] = today.split('-').map(Number)
  return `${String((y ?? 0) - ADULT_MIN_AGE).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/**
 * Kalimat gerbang per status — dipakai ruang baca, detail cerita, dan halaman
 * pengaturan, jadi ketiganya tidak pernah menjelaskan keadaan yang sama dengan
 * kata yang berbeda.
 */
export const AGE_STATUS_LABEL: Record<AgeVerificationStatus, string> = {
  none: 'Belum diverifikasi',
  pending: 'Menunggu tinjauan',
  verified: 'Terverifikasi',
  rejected: 'Ditolak',
}

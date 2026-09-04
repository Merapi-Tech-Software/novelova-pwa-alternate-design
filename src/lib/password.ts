import { PASSWORD_MIN } from './limits'

/**
 * Kekuatan kata sandi · FR-AUTH-06.
 *
 * Empat kriteria independen, masing-masing bernilai satu. Sengaja **tidak**
 * memakai library entropi: yang diminta requirement adalah empat aturan yang
 * bisa dijelaskan ke pengguna, bukan skor yang tidak bisa ditebak asal-usulnya.
 *
 * Meter ini **informasional** — yang memblokir submit hanya panjang minimum.
 */
export function passwordScore(password: string): 0 | 1 | 2 | 3 | 4 {
  let score = 0
  if (password.length >= PASSWORD_MIN) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  return score as 0 | 1 | 2 | 3 | 4
}

/** Label per skor. Kolom kosong selalu memakai label netral, apa pun skornya. */
export const STRENGTH_LABELS = ['Kekuatan kata sandi', 'Lemah', 'Cukup', 'Bagus', 'Kuat'] as const

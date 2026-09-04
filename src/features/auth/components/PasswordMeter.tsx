import { cx } from '@/lib/cx'
import { passwordScore, STRENGTH_LABELS } from '@/lib/password'

/** Satu kelas per skor — warnanya token, bukan hex di tempat pemakaian. */
const FILL = [
  'w-0 bg-nv-strength-0',
  'w-1/4 bg-nv-strength-1',
  'w-2/4 bg-nv-strength-2',
  'w-3/4 bg-nv-strength-3',
  'w-full bg-nv-strength-4',
] as const

/**
 * Meter kekuatan kata sandi · FR-AUTH-06.
 *
 * Skor 0–4 dari empat kriteria, lebar batang `skor × 25%`. **Informasional**:
 * ia tidak pernah memblokir submit — yang memblokir hanya panjang minimum.
 * Kolom kosong selalu memakai label netral, sehingga halaman yang baru dibuka
 * tidak menuduh pengguna punya kata sandi lemah sebelum ia mengetik apa pun.
 */
export function PasswordMeter({ password }: { password: string }) {
  const score = passwordScore(password)
  const shown = password ? score : 0
  const label = password ? STRENGTH_LABELS[score] : STRENGTH_LABELS[0]

  return (
    <div className="mt-2">
      <span className="block h-1.5 overflow-hidden rounded-nv-pill bg-nv-line-soft">
        <span className={cx('block h-1.5 transition-all duration-200', FILL[shown])} />
      </span>
      <p aria-live="polite" className="pt-1.5 text-caption text-nv-muted">
        {label}
      </p>
    </div>
  )
}

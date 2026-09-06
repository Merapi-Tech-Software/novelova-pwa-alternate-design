import { Coins } from 'lucide-react'
import { formatCompactCoin } from '@/lib/coin'
import { cx } from '@/lib/cx'

export interface CoinChipProps {
  amount: number
  /** `compact` memakai `formatCompactCoin`; `exact` menampilkan angka penuh. */
  format?: 'compact' | 'exact'
  size?: 'sm' | 'md'
  /**
   * Bentuk **pil bergaris rambut** dari `7a`/`7i` — chip saldo yang berdiri di
   * kepala halaman. Tanpa ini chip-nya telanjang, yang benar untuk angka di
   * dalam baris (harga bab, ringkasan pembayaran) tetapi salah untuk saldo yang
   * jadi kontrol tersendiri.
   */
  pill?: boolean
  /**
   * Koin bonus, ditulis terpisah sebagai `+23 bonus`.
   *
   * **Terpisah karena memang tidak pernah dibelanjakan** (FR-WALLET-17): kalau
   * ia dijumlahkan ke saldo, angka di kepala halaman akan menjanjikan daya beli
   * yang tidak ada. `0` berarti tidak dirender sama sekali.
   */
  bonus?: number
  className?: string
}

/**
 * Angka koin dengan ikonnya.
 *
 * Ikon memakai `--nv-gold-line` (nilai asli PRD), teksnya memakai `--nv-gold`
 * yang dinaikkan kontrasnya — emas yang enak jadi ikon tidak lolos AA sebagai
 * teks (architecture.md §9.1).
 */
export function CoinChip({
  amount,
  format = 'compact',
  size = 'md',
  pill = false,
  bonus = 0,
  className,
}: CoinChipProps) {
  const text =
    format === 'compact' ? formatCompactCoin(amount) : new Intl.NumberFormat('id-ID').format(amount)

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 font-semibold text-nv-gold tabular-nums',
        size === 'sm' ? 'text-caption' : 'text-body',
        pill && 'rounded-nv-pill border border-nv-line-soft px-2.5 py-1.5',
        className,
      )}
    >
      <Coins size={size === 'sm' ? 12 : 14} className="text-nv-gold-line" aria-hidden />
      {text}
      <span className="sr-only">koin</span>
      {bonus > 0 && (
        // Emas **teks** (`--nv-gold`), bukan emas garis: pada 12px di atas
        // kertas, `--nv-gold-line` cuma 3,01:1 — terukur axe, dan 1.4.3 menuntut
        // 4,5:1 untuk teks sekecil ini. Emas garis tetap benar untuk ikonnya.
        <span className="whitespace-nowrap pl-1 font-semibold text-caption text-nv-gold tabular-nums">
          +{formatCompactCoin(bonus)} bonus
        </span>
      )}
    </span>
  )
}

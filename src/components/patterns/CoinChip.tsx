import { Coins } from 'lucide-react'
import { formatCompactCoin } from '@/lib/coin'
import { cx } from '@/lib/cx'

export interface CoinChipProps {
  amount: number
  /** `compact` memakai `formatCompactCoin`; `exact` menampilkan angka penuh. */
  format?: 'compact' | 'exact'
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Angka koin dengan ikonnya.
 *
 * Ikon memakai `--nv-gold-line` (nilai asli PRD), teksnya memakai `--nv-gold`
 * yang dinaikkan kontrasnya — emas yang enak jadi ikon tidak lolos AA sebagai
 * teks (architecture.md §9.1).
 */
export function CoinChip({ amount, format = 'compact', size = 'md', className }: CoinChipProps) {
  const text =
    format === 'compact' ? formatCompactCoin(amount) : new Intl.NumberFormat('id-ID').format(amount)

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 font-semibold text-nv-gold tabular-nums',
        size === 'sm' ? 'text-caption' : 'text-body',
        className,
      )}
    >
      <Coins size={size === 'sm' ? 12 : 14} className="text-nv-gold-line" aria-hidden />
      {text}
      <span className="sr-only">koin</span>
    </span>
  )
}

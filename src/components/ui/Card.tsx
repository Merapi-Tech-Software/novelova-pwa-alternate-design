import type { HTMLAttributes } from 'react'
import { cx } from '@/lib/cx'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean
}

export function Card({ padded = true, className, children, ...rest }: CardProps) {
  return (
    <div className={cx('nv-card', padded && 'p-4', className)} {...rest}>
      {children}
    </div>
  )
}

export interface SkeletonProps {
  className?: string
  /** Jumlah baris; dipakai untuk kerangka daftar. */
  lines?: number
}

/**
 * Kerangka pemuatan. Denyutnya 1,4 detik — cukup pelan untuk tidak terasa
 * gelisah, cukup jelas untuk terbaca sebagai "sedang berjalan", bukan "rusak".
 */
export function Skeleton({ className, lines }: SkeletonProps) {
  if (lines) {
    // `className` menempel di **wadahnya**, bukan di tiap baris. Meneruskannya
    // ke baris berarti `m-6` bertumpuk dengan `w-full` pada elemen yang sama —
    // dan sebuah kerangka pemuatan pun bisa membuat halaman bergeser ke samping
    // selama sepersekian detik.
    return (
      <div className={cx('space-y-2', className)} aria-hidden>
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton
            // biome-ignore lint/suspicious/noArrayIndexKey: baris kerangka tidak punya identitas selain posisinya
            key={i}
            className={cx('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')}
          />
        ))}
      </div>
    )
  }
  return (
    <div
      aria-hidden
      className={cx(
        'animate-[pulse_1.4s_ease-in-out_infinite] rounded-nv-sm bg-nv-paper-2',
        className,
      )}
    />
  )
}

export interface ProgressBarProps {
  /** 0–1. */
  value: number
  label: string
  showValue?: boolean
  className?: string
}

export function ProgressBar({ value, label, showValue = false, className }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div className={className}>
      {showValue && (
        <div className="mb-1 flex items-baseline justify-between text-caption text-nv-muted">
          <span>{label}</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full overflow-hidden rounded-nv-pill bg-nv-paper-2"
      >
        <div
          className="h-full rounded-nv-pill bg-nv-accent transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

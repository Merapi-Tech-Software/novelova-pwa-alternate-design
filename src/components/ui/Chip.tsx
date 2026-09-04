import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

export interface ChipProps {
  children: ReactNode
  /** Chip yang bisa ditekan dirender sebagai `<button>`, bukan `<span>`. */
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  className?: string
}

/** Pilihan yang bisa ditekan: genre, tab saringan, jam terbit. */
export function Chip({ children, onClick, selected = false, disabled, className }: ChipProps) {
  const base = cx(
    'inline-flex items-center gap-1.5 rounded-nv-pill border px-3.5 py-1.5 text-caption font-semibold transition',
    selected
      ? 'border-nv-accent bg-nv-accent-soft text-nv-accent-strong'
      : 'border-nv-line bg-nv-card text-nv-muted hover:border-nv-accent',
    disabled && 'cursor-not-allowed opacity-50',
    className,
  )

  if (!onClick) return <span className={base}>{children}</span>

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={base}
    >
      {children}
    </button>
  )
}

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'danger' | 'warning' | 'info' | 'coin'

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-nv-paper-2 text-nv-muted',
  accent: 'bg-nv-accent-soft text-nv-accent-strong',
  success: 'bg-nv-success-bg text-nv-success',
  danger: 'bg-nv-danger-bg text-nv-danger',
  warning: 'bg-nv-warning-bg text-nv-warning',
  info: 'bg-nv-accent-soft text-nv-info',
  coin: 'bg-nv-accent-soft text-nv-coin',
}

export interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

/** Label status yang tidak bisa ditekan. Warnanya dari token §9.1, bukan hex. */
export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-nv-pill px-2.5 py-1 text-caption font-semibold',
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

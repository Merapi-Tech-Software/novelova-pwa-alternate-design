import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Button } from './Button'

/**
 * Keadaan kosong punya **dua varian** yang tidak boleh tertukar (FR-CORE-02):
 *
 * - `first-run` — belum ada isinya. Menjelaskan fungsi halaman dan mengajak
 *   mengisinya. Prototipe tidak punya varian ini, sehingga pengguna hari pertama
 *   disambut pesan kegagalan pencarian.
 * - `no-results` — saringan tidak menemukan apa pun. Menawarkan menghapus
 *   saringan lebih dulu, sebelum menyarankan hal lain.
 *
 * Keduanya berbeda dari **gagal** — itu urusan `FailureNotice`. "Tidak ada hasil"
 * saat sebenarnya jaringan putus adalah kebohongan yang membuat pengguna
 * berhenti mencoba.
 */

export interface EmptyStateProps {
  variant?: 'first-run' | 'no-results'
  icon?: ReactNode
  title: string
  /** Penjelasan singkat fungsi halaman ini. */
  description: string
  action?: { label: string; onClick: () => void }
  /** Tautan alternatif — selalu ada, supaya halaman tidak jadi jalan buntu. */
  secondary?: ReactNode
  className?: string
}

export function EmptyState({
  variant = 'first-run',
  icon,
  title,
  description,
  action,
  secondary,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cx(
        'flex flex-col items-center gap-3 px-6 py-12 text-center',
        variant === 'no-results' && 'py-8',
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden
          className="grid size-12 place-items-center rounded-nv-pill bg-nv-accent-soft text-nv-accent"
        >
          {icon}
        </span>
      )}
      <div className="max-w-sm space-y-1.5">
        <h2 className="font-display text-section font-bold">{title}</h2>
        <p className="text-body text-nv-muted">{description}</p>
      </div>
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
      {secondary && <div className="text-caption text-nv-muted">{secondary}</div>}
    </div>
  )
}

import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cx } from '@/lib/cx'

export interface SettingRowProps {
  title: string
  description?: string
  /** Kontrol di kanan: switch, select, atau nilai teks. */
  control?: ReactNode
  /** Bila diisi, seluruh baris jadi tautan dengan chevron. */
  to?: string
  onClick?: () => void
  tone?: 'default' | 'danger'
  className?: string
}

/**
 * Baris pengaturan: judul · keterangan · kontrol di kanan.
 * Memikul hampir seluruh layar bahasa & keamanan (kanvas 28–29).
 */
export function SettingRow({
  title,
  description,
  control,
  to,
  onClick,
  tone = 'default',
  className,
}: SettingRowProps) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span
          className={cx('block text-body font-semibold', tone === 'danger' && 'text-nv-danger')}
        >
          {title}
        </span>
        {description && <span className="block text-caption text-nv-muted">{description}</span>}
      </span>
      {control}
      {(to || onClick) && !control && (
        <ChevronRight size={16} className="shrink-0 text-nv-muted" aria-hidden />
      )}
    </>
  )

  const shell = cx(
    'flex w-full items-center gap-3 border-nv-line border-b px-1 py-3.5 text-left last:border-b-0',
    (to || onClick) && 'transition hover:bg-nv-accent-soft',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={shell}>
        {body}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shell}>
        {body}
      </button>
    )
  }

  return <div className={shell}>{body}</div>
}

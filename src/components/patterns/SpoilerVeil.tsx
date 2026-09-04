import { type ReactNode, useState } from 'react'
import { cx } from '@/lib/cx'

export interface SpoilerVeilProps {
  children: ReactNode
  className?: string
}

/**
 * Tirai spoiler (FR-SOCIAL-06).
 *
 * Memakai ulang gaya gerbang bab terkunci — buram, bukan komponen baru
 * (prd_12 §7 #6). Isinya `aria-hidden` selama tertutup, supaya screen reader
 * tidak membacakan spoiler yang secara visual disembunyikan.
 */
export function SpoilerVeil({ children, className }: SpoilerVeilProps) {
  const [revealed, setRevealed] = useState(false)

  if (revealed) return <div className={className}>{children}</div>

  return (
    <div className={cx('relative overflow-hidden rounded-nv-md', className)}>
      <div aria-hidden className="pointer-events-none select-none blur-[6px]">
        {children}
      </div>
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="absolute inset-0 grid place-items-center bg-nv-card/40 text-caption font-semibold text-nv-accent backdrop-blur-[2px]"
      >
        Spoiler — ketuk untuk melihat
      </button>
    </div>
  )
}

import { type ReactNode, useRef } from 'react'
import { useDismissable } from '@/lib/a11y'
import { cx } from '@/lib/cx'

export interface PopoverProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  label: string
  align?: 'left' | 'right'
  className?: string
}

/**
 * Panel mengambang yang menempel pada pemicunya.
 *
 * Menutup saat Escape, klik **di luar**, dan saat halaman digulir — tetapi
 * **tidak** saat diklik di dalam. Sakelar section beranda harus bisa dinyalakan
 * berkali-kali tanpa panelnya kabur setiap kali (FR-HOME-06).
 *
 * Pemicu wajib dibungkus elemen `relative` bersama komponen ini.
 */
export function Popover({
  open,
  onClose,
  children,
  label,
  align = 'right',
  className,
}: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  useDismissable(ref, open, onClose, { onScroll: true })

  if (!open) return null

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      className={cx(
        'absolute top-[calc(100%+0.5rem)] z-40 min-w-56 rounded-nv-lg border border-nv-line bg-nv-card p-3 shadow-nv',
        align === 'right' ? 'right-0' : 'left-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

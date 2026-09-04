import { X } from 'lucide-react'
import { type ReactNode, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useDismissable, useFocusTrap, useScrollLock } from '@/lib/a11y'
import { cx } from '@/lib/cx'
import { IconButton } from './Button'

interface OverlayProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Aksi di dasar overlay — tombol utama di kanan. */
  footer?: ReactNode
  /** Menyembunyikan judul secara visual, tetap terbaca screen reader. */
  hideTitle?: boolean
}

function Overlay({
  open,
  onClose,
  title,
  children,
  footer,
  hideTitle,
  variant,
}: OverlayProps & { variant: 'modal' | 'sheet' }) {
  const panelRef = useRef<HTMLDivElement>(null)

  useFocusTrap(panelRef, open)
  useScrollLock(open)
  // Gulir **tidak** menutup overlay — isinya sendiri sering perlu digulir.
  useDismissable(panelRef, open, onClose, { onScroll: false })

  if (!open) return null

  const isSheet = variant === 'sheet'

  return createPortal(
    <div
      className={cx(
        'fixed inset-0 z-50 flex bg-[rgb(30_30_30/0.4)] backdrop-blur-[2px]',
        isSheet ? 'items-end sm:items-center sm:justify-center' : 'items-center justify-center p-4',
      )}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'flex max-h-[90dvh] w-full flex-col bg-nv-card shadow-nv',
          isSheet
            ? // Bottom sheet di HP, dialog terpusat di ≥640 (architecture.md §9.4).
              'rounded-t-[28px] sm:max-w-lg sm:rounded-nv-xl'
            : 'max-w-lg rounded-nv-xl',
        )}
      >
        {isSheet && (
          <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
            <span aria-hidden className="h-1 w-10 rounded-nv-pill bg-nv-line" />
          </div>
        )}

        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <h2 className={cx('font-display text-section font-bold', hideTitle && 'sr-only')}>
            {title}
          </h2>
          <IconButton label="Tutup" size="sm" onClick={onClose} className="-mr-1 shrink-0">
            <X size={16} />
          </IconButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 border-nv-line border-t px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

/** Dialog terpusat di semua ukuran. Untuk konfirmasi dan formulir pendek. */
export function Modal(props: OverlayProps) {
  return <Overlay {...props} variant="modal" />
}

/**
 * Bottom sheet di `<640`, **dialog terpusat di `≥640`** — layar penuh di desktop
 * terasa salah (architecture.md §9.4).
 */
export function Sheet(props: OverlayProps) {
  return <Overlay {...props} variant="sheet" />
}

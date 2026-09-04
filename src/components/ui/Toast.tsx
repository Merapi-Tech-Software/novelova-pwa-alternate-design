import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { cx } from '@/lib/cx'

/**
 * Satu host toast global (FR-READ-10).
 *
 * Dua hal yang wajib benar dan mudah salah:
 * 1. **Timer lama selalu dibatalkan.** Prototipe menumpuk `setTimeout`, sehingga
 *    toast kedua menghilang mengikuti hitungan toast pertama.
 * 2. **`aria-live="polite"`, bukan `assertive`.** Toast tidak boleh memotong
 *    pembacaan kalimat yang sedang berjalan.
 */

const TOAST_MS = 2_600

export type ToastTone = 'neutral' | 'success' | 'danger'

interface ToastState {
  id: number
  message: string
  tone: ToastTone
  action?: { label: string; onClick: () => void }
}

interface ToastApi {
  show: (
    message: string,
    options?: {
      tone?: ToastTone
      action?: ToastState['action']
      /**
       * Lebih lama dari bawaan bila pesannya **menuntut tindakan** — "Urungkan"
       * yang lenyap dalam 2,6 detik adalah tombol yang tidak pernah sempat
       * ditekan (FR-LIB-09).
       */
      durationMs?: number
    },
  ) => void
  dismiss: () => void
}

const ToastContext = createContext<ToastApi | null>(null)

const TONE: Record<ToastTone, string> = {
  neutral: 'bg-nv-card text-nv-text',
  success: 'bg-nv-success-bg text-nv-success',
  danger: 'bg-nv-danger-bg text-nv-danger',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const seq = useRef(0)

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current)
    setToast(null)
  }, [])

  const show = useCallback<ToastApi['show']>((message, options) => {
    // Membatalkan timer yang sedang berjalan sebelum memasang yang baru.
    window.clearTimeout(timer.current)
    seq.current += 1
    setToast({
      id: seq.current,
      message,
      tone: options?.tone ?? 'neutral',
      ...(options?.action ? { action: options.action } : {}),
    })
    timer.current = window.setTimeout(() => setToast(null), options?.durationMs ?? TOAST_MS)
  }, [])

  const api = useMemo<ToastApi>(() => ({ show, dismiss }), [show, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-24 z-60 flex justify-center px-4 sm:bottom-8"
        >
          {toast && (
            <div
              key={toast.id}
              className={cx(
                'pointer-events-auto flex max-w-md items-center gap-3 rounded-nv-pill border border-nv-line px-4 py-2.5 text-body font-semibold shadow-nv',
                TONE[toast.tone],
              )}
            >
              <span className="min-w-0">{toast.message}</span>
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick()
                    dismiss()
                  }}
                  className="shrink-0 text-nv-accent-strong underline underline-offset-2"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
          )}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast dipakai di luar <ToastProvider>')
  return ctx
}

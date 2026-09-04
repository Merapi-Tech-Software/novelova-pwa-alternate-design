import { AlertTriangle, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { cx } from '@/lib/cx'
import { RETRY_ESCALATE_AT } from '@/lib/limits'
import { Button } from '../ui/Button'

/**
 * Satu tampilan kegagalan untuk seluruh aplikasi (`architecture.md` §1.4).
 *
 * **Tingkatnya dipilih pemanggil**, karena hanya pemanggil yang tahu seberapa
 * banyak halaman yang ikut mati:
 *
 * | Tingkat | Kapan | Perilaku |
 * |---|---|---|
 * | `inline` | Satu kolom salah | Menempel di kolomnya. Sisa formulir tidak bergerak. |
 * | `toast` | Aksi gagal, halaman utuh | Ringkas, membawa satu tombol coba lagi. |
 * | `inset` | Satu bagian gagal, sisanya jalan | Mengganti bagian itu saja, bukan seluruh layar. |
 * | `fullscreen` | Tidak ada yang bisa dikerjakan | Menghentikan segalanya — wajib menawarkan jalan keluar. |
 *
 * Tata letak copy **selalu sama**: apa yang terjadi → apakah uang/tulisan aman →
 * satu aksi → kode teknis kecil di bawah. Tidak ada pesan yang berhenti di
 * "terjadi kesalahan" atau menyalahkan pengguna.
 */

export type FailureLevel = 'inline' | 'toast' | 'inset' | 'fullscreen'

export interface FailureNoticeProps {
  level: FailureLevel
  /** Apa yang terjadi — kalimat lugas, tanpa jargon. */
  title: string
  body?: string
  /**
   * Apakah uang atau tulisan pengguna aman. **Selalu dinyatakan** kalau tugasnya
   * menyentuh salah satunya, walau jawabannya "ya".
   */
  safety?: string
  /** Satu tindakan berikutnya — tombol, bukan saran. */
  onRetry?: () => void
  retryLabel?: string
  /** Jalan keluar tambahan; wajib ada minimal satu pada tingkat `fullscreen`. */
  actions?: ReactNode
  /** `"PAY-402 · GoPay · 21.44 WIB"` — untuk dibacakan ke dukungan. */
  code?: string
  offline?: boolean
  className?: string
}

export function FailureNotice({
  level,
  title,
  body,
  safety,
  onRetry,
  retryLabel,
  actions,
  code,
  offline = false,
  className,
}: FailureNoticeProps) {
  // Hitungan percobaan adalah state komponen: label naik setelah dua kegagalan
  // berturut-turut, supaya tombol yang sama tidak terasa berbohong.
  const [attempts, setAttempts] = useState(0)
  const escalated = attempts >= RETRY_ESCALATE_AT
  const label = retryLabel ?? (escalated ? 'Coba sekali lagi' : 'Coba lagi')

  const retry = onRetry
    ? () => {
        setAttempts((n) => n + 1)
        onRetry()
      }
    : undefined

  const Icon = offline ? WifiOff : AlertTriangle

  if (level === 'inline') {
    return (
      <p role="alert" className={cx('mt-1.5 text-caption font-semibold text-nv-danger', className)}>
        {title}
        {safety && <span className="block font-medium text-nv-muted">{safety}</span>}
      </p>
    )
  }

  if (level === 'toast') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cx(
          'flex items-center gap-3 rounded-nv-pill border border-nv-line bg-nv-danger-bg px-4 py-2.5',
          className,
        )}
      >
        <span className="min-w-0 text-body font-semibold text-nv-danger">{title}</span>
        {retry && (
          <button
            type="button"
            onClick={retry}
            className="shrink-0 text-caption font-semibold text-nv-accent underline underline-offset-2"
          >
            {label}
          </button>
        )}
      </div>
    )
  }

  const fullscreen = level === 'fullscreen'

  return (
    <div
      // Sisipan mengumumkan diri dengan sopan; layar penuh memindahkan fokus ke
      // judulnya lewat `tabIndex={-1}` (lihat §13 aksesibilitas).
      role={fullscreen ? 'alert' : 'status'}
      aria-live="polite"
      className={cx(
        'flex flex-col items-center text-center',
        fullscreen
          ? 'min-h-[70dvh] justify-center gap-4 px-6'
          : 'gap-3 rounded-nv-lg border border-nv-line border-dashed bg-nv-paper-2 px-5 py-8',
        className,
      )}
    >
      <span
        aria-hidden
        className={cx(
          'grid place-items-center rounded-nv-pill bg-nv-danger-bg text-nv-danger',
          fullscreen ? 'size-14' : 'size-10',
        )}
      >
        <Icon size={fullscreen ? 26 : 18} />
      </span>

      <div className="max-w-sm space-y-1.5">
        <h2
          tabIndex={fullscreen ? -1 : undefined}
          className={cx('font-display font-semibold', fullscreen ? 'text-page' : 'text-section')}
        >
          {title}
        </h2>
        {body && <p className="text-body text-nv-muted">{body}</p>}
        {safety &&
          (fullscreen ? (
            // Layar penuh memberi jaminan itu kotaknya sendiri (kanvas layar 36).
            // Di situlah mata berhenti, dan itu satu-satunya kalimat yang
            // benar-benar menjawab "uangku bagaimana?".
            <div className="rounded-nv-md border border-nv-gold-line bg-nv-accent-soft px-4 py-3 text-left">
              <p className="text-caption font-semibold tracking-wide text-nv-accent uppercase">
                Yang tetap aman
              </p>
              <p className="mt-1 text-body text-nv-text">{safety}</p>
            </div>
          ) : (
            <p className="text-body font-semibold text-nv-success">{safety}</p>
          ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {retry && (
          <Button onClick={retry} size={fullscreen ? 'md' : 'sm'}>
            {label}
          </Button>
        )}
        {actions}
      </div>

      {code && <p className="font-mono text-caption text-nv-muted opacity-70">{code}</p>}
    </div>
  )
}

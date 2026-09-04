import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '@/lib/a11y'

export interface ConfettiProps {
  active: boolean
  count?: number
  durationMs?: number
  /** Warna diambil dari token, bukan hex — lihat pemanggilnya. */
  palette?: readonly string[]
}

const DEFAULT_PALETTE = [
  'var(--nv-accent)',
  'var(--nv-accent-2)',
  'var(--nv-coin-icon)',
  'var(--nv-accent-strong)',
] as const

/**
 * Perayaan kecil saat cerita ditandai selesai (FR-DETAIL-12).
 *
 * **Tidak dirender sama sekali** bila pengguna meminta gerak dikurangi — bukan
 * dirender lalu animasinya dimatikan CSS, karena elemen yang diam di tengah
 * layar justru lebih membingungkan daripada tidak ada.
 */
export function Confetti({
  active,
  count = 24,
  durationMs = 1_600,
  palette = DEFAULT_PALETTE,
}: ConfettiProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active || prefersReducedMotion()) return
    setVisible(true)
    const id = window.setTimeout(() => setVisible(false), durationMs)
    return () => window.clearTimeout(id)
  }, [active, durationMs])

  if (!visible) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-60 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: kepingan konfeti tidak punya identitas
          key={i}
          className="absolute top-[-5%] block size-2 rounded-[2px]"
          style={{
            left: `${(i / count) * 100}%`,
            background: palette[i % palette.length],
            animation: `nvFall ${durationMs}ms cubic-bezier(.3,.7,.4,1) ${i * 24}ms forwards`,
          }}
        />
      ))}
    </div>
  )
}

import { Check } from 'lucide-react'
import { cx } from '@/lib/cx'

export interface StageTrackProps {
  stages: readonly string[]
  /** Indeks tahap **saat ini**; tahap sebelumnya dianggap selesai. */
  current: number
  className?: string
}

/**
 * Lini masa berurutan: tahap selesai · tahap kini · tahap belum dijalani.
 *
 * Enam tahap untuk pesanan hardcopy — **PRD, bukan empat langkah yang digambar
 * kanvas** (FR-STUDIO-32, arch §1.5). Dipakai ulang untuk tangga verifikasi
 * penulis (FR-STUDIO-33), karena bentuk masalahnya sama: urutan yang harus
 * dilalui, dengan satu posisi sekarang.
 */
export function StageTrack({ stages, current, className }: StageTrackProps) {
  return (
    <ol className={cx('flex items-start gap-1', className)}>
      {stages.map((stage, i) => {
        const done = i < current
        const now = i === current

        return (
          <li key={stage} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center gap-1">
              <span
                aria-hidden
                className={cx(
                  'h-0.5 flex-1 rounded-nv-pill',
                  i === 0 ? 'opacity-0' : done || now ? 'bg-nv-accent' : 'bg-nv-line',
                )}
              />
              <span
                className={cx(
                  'grid size-5 shrink-0 place-items-center rounded-nv-pill border text-[10px]',
                  done && 'border-nv-accent bg-nv-accent text-nv-card',
                  now && 'border-nv-accent bg-nv-accent-soft text-nv-accent-strong',
                  !done && !now && 'border-nv-line bg-nv-card text-nv-muted',
                )}
              >
                {done ? <Check size={11} aria-hidden /> : i + 1}
              </span>
              <span
                aria-hidden
                className={cx(
                  'h-0.5 flex-1 rounded-nv-pill',
                  i === stages.length - 1 ? 'opacity-0' : done ? 'bg-nv-accent' : 'bg-nv-line',
                )}
              />
            </div>
            <span
              className={cx(
                'text-center text-[11px] leading-tight',
                now ? 'font-semibold text-nv-accent-strong' : 'text-nv-muted',
              )}
            >
              {stage}
            </span>
            {now && <span className="sr-only">tahap saat ini</span>}
          </li>
        )
      })}
    </ol>
  )
}

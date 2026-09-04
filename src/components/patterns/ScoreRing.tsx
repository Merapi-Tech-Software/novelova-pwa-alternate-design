import { cx } from '@/lib/cx'

export interface ScoreRingProps {
  /** 0–100. */
  score: number
  size?: number
  label: string
  className?: string
}

/** Ambang label skor keamanan — dari kanvas layar 29. */
export function scoreLevel(score: number): { text: string; tone: string } {
  if (score >= 85) return { text: 'kuat', tone: 'var(--nv-success)' }
  if (score >= 60) return { text: 'sedang', tone: 'var(--nv-warning)' }
  return { text: 'lemah', tone: 'var(--nv-danger)' }
}

/**
 * Cincin skor perlindungan akun (FR-SET-02).
 *
 * SVG tulis tangan — satu lingkaran dengan `stroke-dasharray`. Memasang library
 * grafik untuk ini akan menambah ~90KB demi satu bentuk (architecture.md §2).
 */
export function ScoreRing({ score, size = 96, label, className }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score))
  const level = scoreLevel(clamped)
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className={cx('inline-flex flex-col items-center gap-1.5', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          role="img"
          aria-label={`${label}: ${clamped} dari 100, ${level.text}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--nv-line)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={level.tone}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped / 100)}
            className="transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center font-display font-semibold text-stat tabular-nums"
        >
          {clamped}
        </span>
      </div>
      <span className="text-caption text-nv-muted">
        {label} · <span style={{ color: level.tone }}>{level.text}</span>
      </span>
    </div>
  )
}

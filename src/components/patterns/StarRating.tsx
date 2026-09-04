import { Star } from 'lucide-react'
import { useId, useState } from 'react'
import { cx } from '@/lib/cx'

export interface StarRatingProps {
  /** Masukan selalu bulat 1–5; tampilan rata-rata boleh berdesimal. */
  value: number
  onChange?: (stars: 1 | 2 | 3 | 4 | 5) => void
  size?: number
  /** Menampilkan angka di samping bintang. */
  showValue?: boolean
  className?: string
}

/** Satu bintang: lapisan kosong, lalu lapisan terisi yang dipotong sesuai `fill`. */
function StarGlyph({ fill, size }: { fill: number; size: number }) {
  return (
    <span className="relative block" style={{ width: size, height: size }} aria-hidden>
      <Star size={size} className="absolute inset-0 text-nv-line" />
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
        <Star size={size} className="text-nv-gold-line" fill="currentColor" />
      </span>
    </span>
  )
}

/**
 * Bintang rating (FR-SOCIAL-01).
 *
 * **Read-only** menerima desimal — 4,8 berarti empat bintang penuh dan satu
 * terisi 80%. **Masukan** memakai `<input type="radio">` sungguhan yang
 * disembunyikan secara visual, bukan `<button role="radio">`: navigasi panah,
 * pengelompokan `name`, dan pengiriman formulir jadi gratis dari peramban, dan
 * hanya bilangan bulat yang bisa terkirim.
 */
export function StarRating({
  value,
  onChange,
  size = 18,
  showValue = false,
  className,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null)
  const name = useId()
  const shown = hover ?? value

  if (!onChange) {
    return (
      <span
        className={cx('inline-flex items-center gap-1.5', className)}
        role="img"
        aria-label={`${value.toFixed(1)} dari 5 bintang`}
      >
        <span className="inline-flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <StarGlyph key={n} size={size} fill={Math.max(0, Math.min(1, value - (n - 1)))} />
          ))}
        </span>
        {showValue && (
          <span className="text-caption text-nv-muted tabular-nums">{value.toFixed(1)}</span>
        )}
      </span>
    )
  }

  return (
    <fieldset className={cx('inline-flex items-center gap-1.5 border-0 p-0', className)}>
      <legend className="sr-only">Beri rating</legend>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="cursor-pointer px-0.5"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n as 1 | 2 | 3 | 4 | 5)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(null)}
              className="sr-only"
            />
            <span className="sr-only">{n} dari 5 bintang</span>
            <StarGlyph size={size} fill={shown >= n ? 1 : 0} />
          </label>
        ))}
      </span>
      {showValue && (
        <span className="text-caption text-nv-muted tabular-nums">{value.toFixed(1)}</span>
      )}
    </fieldset>
  )
}

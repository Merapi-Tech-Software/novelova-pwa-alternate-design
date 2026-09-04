import { useId } from 'react'
import { cx } from '@/lib/cx'

export interface SwitchProps {
  checked: boolean
  onChange: (next: boolean) => void
  /** Label yang terbaca screen reader; boleh disembunyikan secara visual. */
  label: string
  hideLabel?: boolean
  description?: string
  disabled?: boolean
  /**
   * Beberapa sakelar tidak boleh dimatikan — mis. notifikasi keamanan
   * (FR-NOTIF-04). Dikunci menyala, bukan sekadar `disabled`.
   */
  lockedOn?: boolean
}

export function Switch({
  checked,
  onChange,
  label,
  hideLabel = false,
  description,
  disabled = false,
  lockedOn = false,
}: SwitchProps) {
  const on = lockedOn || checked
  const locked = disabled || lockedOn
  const descId = useId()

  return (
    <label className={cx('flex items-center gap-3', locked && 'opacity-70')}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        // Selalu dinamai, bukan hanya saat labelnya disembunyikan: teks di
        // sebelah kanan berada di dalam `<label>` yang sama, tetapi `<label>`
        // tidak menamai `<button>` — tanpa ini sakelarnya tidak punya nama sama
        // sekali bagi pembaca layar.
        aria-label={label}
        aria-describedby={description ? descId : undefined}
        disabled={locked}
        onClick={() => !locked && onChange(!checked)}
        className={cx(
          'relative h-6 w-11 shrink-0 rounded-nv-pill border transition',
          on ? 'border-nv-accent bg-nv-accent' : 'border-nv-line bg-nv-paper-2',
          locked ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        <span
          aria-hidden
          className={cx(
            'absolute top-0.5 size-4.5 rounded-nv-pill bg-nv-card shadow-nv-soft transition-all',
            on ? 'left-[calc(100%-1.25rem)]' : 'left-0.5',
          )}
        />
      </button>

      {!hideLabel && (
        <span className="min-w-0">
          <span className="block text-body font-semibold">{label}</span>
          {description && (
            <span id={descId} className="block text-caption text-nv-muted">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  )
}

export interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (next: number) => void
  label: string
  /** Teks yang dibacakan menggantikan angka mentah, mis. `"18 piksel"`. */
  valueText?: string
}

/** Dipakai ukuran font pembaca (FR-READ-03) — `<input type="range">` bawaan. */
export function Slider({ value, min, max, step = 1, onChange, label, valueText }: SliderProps) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-body font-semibold">{label}</span>
        <span className="text-caption text-nv-muted">{valueText ?? value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        // Namanya labelnya saja; nilainya sudah diumumkan lewat `aria-valuetext`,
        // dan menempelkannya ke nama membuat pembaca layar menyebut angkanya dua kali.
        aria-label={label}
        aria-valuetext={valueText}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-nv-pill bg-nv-paper-2 accent-[var(--nv-accent-strong)]"
      />
    </label>
  )
}

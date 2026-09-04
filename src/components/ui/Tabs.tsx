import { cx } from '@/lib/cx'

export interface TabItem<T extends string> {
  value: T
  label: string
  /** Penghitung di samping label, mis. jumlah hasil per saringan. */
  count?: number
}

export interface TabsProps<T extends string> {
  items: readonly TabItem<T>[]
  value: T
  onChange: (next: T) => void
  label: string
  className?: string
}

/**
 * Tab saringan. Memakai `role="tablist"` dengan navigasi panah — pengguna
 * keyboard berpindah tab dengan ← →, bukan menekan Tab lima kali.
 */
export function Tabs<T extends string>({ items, value, onChange, label, className }: TabsProps<T>) {
  const move = (delta: number) => {
    const i = items.findIndex((it) => it.value === value)
    const next = items[(i + delta + items.length) % items.length]
    if (next) onChange(next.value)
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx('flex gap-2 overflow-x-auto pb-1', className)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          move(1)
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          move(-1)
        }
      }}
    >
      {items.map((item) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cx(
              'shrink-0 rounded-nv-pill border px-3.5 py-1.5 text-caption font-semibold transition',
              selected
                ? 'border-nv-accent bg-nv-accent-soft text-nv-accent-strong'
                : 'border-nv-line bg-nv-card text-nv-muted hover:border-nv-accent',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="ml-1.5 opacity-70 tabular-nums">{item.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

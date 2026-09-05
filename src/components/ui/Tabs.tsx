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
 *
 * **Putaran 7: tab teks bergaris bawah 2px, bukan pil.** Brief §1 memisahkannya
 * tegas — saringan adalah tab teks; pil hanya dipakai di tempat mockup memang
 * menggambar pil (genre tambahan, tag, saran pencarian). Yang dipilih ditandai
 * garis, bukan latar, supaya deretan tab tidak berubah jadi deretan tombol.
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
      className={cx(
        'flex gap-5 overflow-x-auto border-nv-line border-b',
        // Bilah gulir disembunyikan: garis bawah tab adalah garisnya sendiri,
        // dan scrollbar di atasnya membuat dua garis sejajar yang tebalnya beda.
        '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
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
              // `-mb-px` menaruh garis bawah tab tepat di atas garis tablist,
              // bukan 1px di bawahnya — tanpa itu keduanya terlihat sebagai dua
              // garis kembar.
              // Kotak sentuh 44px lewat `::after`, sama seperti tombol `sm`
              // (R7): tingginya sendiri 38px, dan menaikkan padding akan
              // menebalkan garis tab yang justru jadi ciri putaran 7.
              "-mb-px relative shrink-0 border-b-2 px-0.5 pt-1 pb-2.5 text-body transition after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
              selected
                ? 'border-nv-accent font-bold text-nv-text'
                : 'border-transparent font-medium text-nv-muted hover:text-nv-text-2',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="ml-1.5 text-nv-muted tabular-nums">{item.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

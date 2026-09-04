import { cx } from '@/lib/cx'

export interface AdSlotProps {
  /** Deskripsi ringkas isi iklan, untuk `alt`. */
  alt?: string
  imageUrl?: string
  onClick?: () => void
  className?: string
  /**
   * `banner` — gambar lebar. `slim` — satu baris teks + ajakan, dipakai di sela
   * feed. `native` — menyerupai kartu cerita (FR-HOME-05 slot kedua).
   */
  variant?: 'banner' | 'slim' | 'native'
  /** Judul iklan untuk varian `slim` dan `native`. */
  title?: string
  /** Domain pengiklan; hanya varian `native`. Kejujuran asal iklan. */
  source?: string
  /** Label ajakan varian `slim`. */
  actionLabel?: string
}

/**
 * Slot iklan bersponsor.
 *
 * Tiga hal yang tidak boleh hilang: `<aside>` bernama supaya bisa dilewati
 * pengguna screen reader (perannya sudah `complementary` secara implisit), label
 * **"Bersponsor"** yang terlihat, dan `loading="lazy"` supaya iklan tidak
 * menunda konten yang dibayar pengguna.
 */
export function AdSlot({
  alt = 'Konten bersponsor',
  imageUrl,
  onClick,
  className,
  variant = 'banner',
  title,
  source,
  actionLabel,
}: AdSlotProps) {
  if (variant !== 'banner') {
    /*
     * Putaran 7 §2.5: iklan sela adalah **pita garis rambut**, bukan kartu
     * putus-putus. Garis di atas dan di bawah, tanpa latar dan tanpa radius —
     * ia menumpang di antara section, bukan bersaing dengan kartu cerita.
     *
     * Labelnya memakai tinta metadata, **bukan `#b8b0a8` mockup** yang cuma
     * 2,3:1: label iklan yang tidak terbaca bukan sekadar cacat kontras.
     */
    return (
      <aside
        aria-label="Konten bersponsor"
        className={cx('flex items-center gap-3 border-nv-line border-y py-3.5', className)}
      >
        {variant === 'native' && (
          <span
            aria-hidden
            className="h-14 w-10 shrink-0 rounded-nv-cover bg-nv-paper-2 ring-1 ring-nv-line-soft ring-inset"
          />
        )}
        <div className="min-w-0 flex-1">
          <span className="nv-section-label block">Bersponsor</span>
          <span className="mt-0.5 block truncate text-body font-bold">{title ?? alt}</span>
          {source && <span className="block truncate text-caption text-nv-muted">{source}</span>}
        </div>
        {variant === 'slim' && actionLabel && (
          <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className="shrink-0 rounded-nv-pill border border-nv-line-soft px-4 py-2 text-caption font-bold text-nv-text"
          >
            {actionLabel}
          </button>
        )}
      </aside>
    )
  }

  return (
    <aside
      aria-label="Konten bersponsor"
      className={cx('overflow-hidden rounded-nv-lg border border-nv-line bg-nv-paper-2', className)}
    >
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-nv-muted">
          Bersponsor
        </span>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className="block w-full text-left"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={alt}
            loading="lazy"
            className="aspect-[16/6] w-full object-cover"
          />
        ) : (
          <div className="grid aspect-[16/6] place-items-center text-caption text-nv-muted">
            {alt}
          </div>
        )}
      </button>
    </aside>
  )
}

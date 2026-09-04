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
    return (
      <aside
        aria-label="Konten bersponsor"
        className={cx(
          'flex items-center gap-3 rounded-nv-lg border border-nv-line border-dashed px-4 py-3',
          className,
        )}
      >
        {variant === 'native' && (
          <span aria-hidden className="size-12 shrink-0 rounded-nv-sm bg-nv-accent-soft" />
        )}
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold tracking-wider text-nv-muted uppercase">
            Bersponsor
          </span>
          <span className="block truncate text-body font-semibold">{title ?? alt}</span>
          {source && <span className="block truncate text-caption text-nv-muted">{source}</span>}
        </div>
        {variant === 'slim' && actionLabel && (
          <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className="shrink-0 rounded-nv-pill border border-nv-line px-3 py-1.5 text-caption font-semibold text-nv-muted"
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

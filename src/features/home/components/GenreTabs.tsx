import { useCallback, useEffect, useRef, useState } from 'react'
import { Chip } from '@/components/ui/Chip'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'

export interface GenreTabsProps {
  tabs: string[]
  /** `null` = "Semua" — posisi awal, dan jalan kembali tanpa penyaring. */
  value: string | null
  onChange: (genre: string | null) => void
}

/**
 * Tab genre · FR-HOME-03 · FR-HOME-13.
 *
 * Gradien tepi muncul **hanya bila deretnya benar-benar bisa digulir**: fade
 * yang selalu ada menjanjikan isi yang tidak pernah ada. Ambangnya 1px, karena
 * `scrollWidth` dan `clientWidth` kerap berbeda pecahan piksel walau tidak ada
 * yang tersembunyi.
 */
export function GenreTabs({ tabs, value, onChange }: GenreTabsProps) {
  const rail = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  const measure = useCallback(() => {
    const el = rail.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    if (max <= 1) {
      setEdges({ left: false, right: false })
      return
    }
    setEdges({ left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 })
  }, [])

  useEffect(() => {
    measure()
    // `resize` dibungkus rAF: mengukur di tengah layout pass memberi angka lama.
    const onResize = () => requestAnimationFrame(measure)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [measure])

  return (
    <div className="relative">
      <div
        ref={rail}
        onScroll={measure}
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Chip selected={value === null} onClick={() => onChange(null)}>
          {t('home.allGenres')}
        </Chip>
        {tabs.map((genre) => (
          <Chip key={genre} selected={value === genre} onClick={() => onChange(genre)}>
            {genre}
          </Chip>
        ))}
      </div>

      <span
        aria-hidden
        className={cx(
          'pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-nv-bg to-transparent transition-opacity',
          edges.left ? 'opacity-100' : 'opacity-0',
        )}
      />
      <span
        aria-hidden
        className={cx(
          'pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-nv-bg to-transparent transition-opacity',
          edges.right ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  )
}

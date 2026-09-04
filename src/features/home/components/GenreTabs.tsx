import { useCallback, useEffect, useRef, useState } from 'react'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'

export interface GenreTabsProps {
  tabs: string[]
  /** `null` = "Semua" — posisi awal, dan jalan kembali tanpa penyaring. */
  value: string | null
  onChange: (genre: string | null) => void
}

/**
 * Tab genre · FR-HOME-03 · FR-HOME-13 · mockup `7a`.
 *
 * **Tab teks bergaris bawah 2px, bukan pil.** Brief §1 memisahkan keduanya
 * tegas: saringan adalah tab teks, pil hanya dipakai di tempat mockup memang
 * menggambar pil. Deret pil di sini membuat baris genre terbaca sebagai deretan
 * tombol — padahal ia satu pilihan tunggal.
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
        className="flex gap-5 overflow-x-auto border-nv-line border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {[null, ...tabs].map((genre) => {
          const on = value === genre
          return (
            <button
              key={genre ?? '__semua'}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(genre)}
              className={cx(
                // `-mb-px` menaruh garis tab tepat di atas garis relnya, bukan
                // 1px di bawahnya — tanpa itu keduanya jadi dua garis kembar.
                '-mb-px shrink-0 border-b-2 px-0.5 pt-1 pb-2.5 text-body transition',
                on
                  ? 'border-nv-accent font-bold text-nv-text'
                  : 'border-transparent font-medium text-nv-muted hover:text-nv-text-2',
              )}
            >
              {genre ?? t('home.allGenres')}
            </button>
          )
        })}
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

import { Link } from 'react-router'
import type { Story } from '@/api/contracts'
import { Cover } from '@/components/patterns/Cover'
import { t } from '@/i18n/t'

/**
 * Banner cerita unggulan · FR-HOME-02 · mockup `7a`.
 *
 * **Kartu garis rambut, bukan gambar penuh berscrim.** Putaran 7 membalik
 * bentuknya: sampul kecil 66×88 di kiri, lalu judul serif, satu baris caption,
 * dan pil `Read now` terisi. Alasannya konsisten dengan seluruh bahasa visualnya
 * — bayangan dan gambar melebar diganti garis, dan sampul dibiarkan jadi
 * satu-satunya benda "fisik" di layar.
 *
 * **Seluruh kartu adalah satu `Link`**, dan `Read now` adalah label di dalamnya
 * — bukan tombol kedua. Prototipe memakai dua handler bertumpuk dan karena itu
 * butuh `stopPropagation()` supaya tidak berpindah halaman dua kali; dengan satu
 * tautan, masalahnya tidak pernah ada. Tombol di dalam tautan juga bukan HTML
 * yang sah.
 */
export function BannerCarousel({ stories }: { stories: Story[] }) {
  return (
    <section
      aria-label={t('home.featured')}
      className="-mx-4 mb-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {stories.slice(0, 3).map((story) => (
        <Link
          key={story.id}
          to={`/cerita/${story.id}`}
          className="flex w-[17rem] shrink-0 snap-start items-start gap-3.5 rounded-nv-lg border border-nv-line-soft bg-nv-card p-3.5"
        >
          <Cover src={story.coverUrl} title={story.title} className="w-[66px]" />

          <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <span className="line-clamp-2 font-display text-section leading-tight font-semibold">
              {story.title}
            </span>
            <span className="line-clamp-2 text-caption text-nv-muted">
              {story.badge ?? t('home.featuredKicker')} · {story.genres.join(' / ')}
            </span>
            <span className="mt-1.5 rounded-nv-pill bg-nv-accent px-4 py-2 text-caption font-bold text-nv-card">
              {t('home.readNow')}
            </span>
          </span>
        </Link>
      ))}
    </section>
  )
}

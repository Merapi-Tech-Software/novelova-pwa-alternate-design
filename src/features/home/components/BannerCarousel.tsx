import { Link } from 'react-router'
import type { Story } from '@/api/contracts'
import { t } from '@/i18n/t'

/**
 * Banner cerita unggulan · FR-HOME-02.
 *
 * **Seluruh kartu adalah satu `Link`**, dan "Baca sekarang" adalah label di
 * dalamnya — bukan tombol kedua. Prototipe memakai dua handler bertumpuk dan
 * karena itu butuh `stopPropagation()` supaya tidak berpindah halaman dua kali;
 * dengan satu tautan, masalahnya tidak pernah ada. Tombol di dalam tautan juga
 * bukan HTML yang sah.
 */
export function BannerCarousel({ stories }: { stories: Story[] }) {
  return (
    <section
      aria-label={t('home.featured')}
      className="-mx-4 mb-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {stories.slice(0, 3).map((story) => (
        <Link
          key={story.id}
          to={`/cerita/${story.id}`}
          className="w-72 shrink-0 snap-start overflow-hidden rounded-nv-lg border border-nv-line bg-nv-card"
        >
          <div className="relative flex h-36 flex-col justify-end bg-nv-accent-soft p-4">
            {(story.bannerUrl ?? story.coverUrl) && (
              <img
                src={story.bannerUrl ?? story.coverUrl ?? ''}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
            )}
            {/* Gradien supaya judul tetap terbaca di atas gambar apa pun. */}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-nv-scrim to-transparent"
            />
            <div className="relative">
              <p className="text-caption tracking-widest text-nv-on-scrim/85 uppercase">
                {story.badge ?? t('home.featuredKicker')}
              </p>
              <p className="pt-1 font-display text-page leading-tight font-bold text-nv-on-scrim">
                {story.title}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="min-w-0 truncate text-caption text-nv-muted">
              {story.genres.join(' / ')} · ★ {story.stats.rating.toFixed(1)}
            </span>
            <span className="shrink-0 rounded-nv-pill border border-nv-accent px-3 py-1 text-caption font-semibold text-nv-accent-strong">
              {t('home.readNow')}
            </span>
          </div>
        </Link>
      ))}
    </section>
  )
}

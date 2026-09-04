import { Link } from 'react-router'
import type { HomeSection } from '@/api/contracts'
import { StoryCard } from '@/components/patterns/StoryCard'
import { Skeleton } from '@/components/ui/Card'
import { t } from '@/i18n/t'

/** Daftar vertikal untuk section yang memang dibaca berurutan. */
const VERTICAL = new Set(['lanjut-baca'])

export function SectionSkeleton() {
  return (
    <section className="mb-7">
      <Skeleton className="mb-3 h-5 w-40" />
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 w-28 shrink-0" />
        ))}
      </div>
    </section>
  )
}

/**
 * Satu section beranda · FR-HOME-04.
 *
 * Section yang kosong tidak pernah sampai ke sini — server sudah membuangnya
 * (FR-HOME-13, FR-HOME-16). Yang tersisa untuk komponen ini hanyalah tata
 * letaknya: kartu horizontal untuk kurasi, daftar vertikal untuk yang dibaca
 * berurutan.
 *
 * Tab aktif ikut ke tautan "Lihat semua", sehingga halaman lihat-semua terbuka
 * dengan penyaring yang sama — bukan mengembalikan pengguna ke katalog penuh
 * yang baru saja ia persempit.
 */
export function StorySection({ section, tab }: { section: HomeSection; tab: string | null }) {
  const vertical = VERTICAL.has(section.id)
  const seeAll = section.seeAll
    ? `/jelajah/${section.seeAll}${tab ? `?tab=${encodeURIComponent(tab)}` : ''}`
    : null

  return (
    <section className="mb-7">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-section font-semibold">{section.title}</h2>
        {seeAll && (
          <Link
            to={seeAll}
            className="shrink-0 text-caption font-semibold text-nv-accent-strong underline underline-offset-2"
          >
            {t('home.seeAll')}
          </Link>
        )}
      </div>

      {vertical ? (
        <div className="space-y-2">
          {section.stories.map((story) => (
            <StoryCard key={story.id} story={story} variant="list" />
          ))}
        </div>
      ) : (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {section.stories.map((story) => (
            <StoryCard key={story.id} story={story} className="w-28 shrink-0 snap-start" />
          ))}
        </div>
      )}
    </section>
  )
}

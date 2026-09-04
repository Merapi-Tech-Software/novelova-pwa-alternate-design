import { Link } from 'react-router'
import type { HomeSection, Story } from '@/api/contracts'
import { StoryCard } from '@/components/patterns/StoryCard'
import { Skeleton } from '@/components/ui/Card'
import { SectionHeader, SeeAllAction } from '@/components/ui/SectionHeader'
import { t } from '@/i18n/t'
import { formatCompactCoin } from '@/lib/coin'

/**
 * Empat bentuk section · mockup `7a`.
 *
 * `rail` — deret mendatar kartu 112px: Populer, Baru & Naik Cepat.
 * `rail-wide` — deret mendatar kartu lebih lebar berkutipan: Paling Banyak Dibuka.
 * `ranked` — daftar tegak bernomor: section tematik yang mengikuti tab.
 * `continue` — daftar tegak berbatang progres dan tombol putar: Lanjut Membaca.
 *
 * Dipilih dari **id**, bukan dari judulnya: judul section berganti mengikuti tab
 * (Fase 3b), id-nya tidak.
 */
type Shape = 'rail' | 'rail-wide' | 'ranked' | 'continue'

function shapeOf(id: string): Shape {
  if (id === 'lanjut-baca') return 'continue'
  if (id === 'terbuka') return 'rail-wide'
  if (id === 'populer' || id === 'terbaru') return 'rail'
  return 'ranked'
}

export function SectionSkeleton() {
  return (
    <section className="mb-7">
      <Skeleton className="mb-3 h-3 w-28" />
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-52 w-28 shrink-0" />
        ))}
      </div>
    </section>
  )
}

/** Garis pertumbuhan emas · `7a` §6. Angkanya `weeklyReads`, bukan kalimat. */
function GrowthNote({ story }: { story: Story }) {
  if (story.stats.weeklyReads <= 0) return null
  return (
    <span className="mt-1 block text-caption font-semibold text-nv-gold">
      +{formatCompactCoin(story.stats.weeklyReads)} baca minggu ini
    </span>
  )
}

/**
 * Kutipan serif satu baris · `7a` §7.
 *
 * Diambil dari **kalimat pertama sinopsisnya**, bukan dari kolom kontrak baru.
 * Itu sekaligus alasan tiap sinopsis di seed ditulis supaya kalimat pertamanya
 * berdiri sendiri — sebelum Langkah 46 keempat puluh cerita berbagi satu
 * sinopsis, dan ketiga kartu di section ini menampilkan kalimat yang identik.
 */
function PullQuote({ story }: { story: Story }) {
  const first = story.synopsis.split(/(?<=[.!?])\s/)[0]?.trim()
  if (!first) return null
  return (
    <span className="mt-1.5 line-clamp-3 font-display text-caption text-nv-text-2 italic">
      “{first}”
    </span>
  )
}

/**
 * Satu section beranda · FR-HOME-04.
 *
 * Section yang kosong tidak pernah sampai ke sini — server sudah membuangnya
 * (FR-HOME-13, FR-HOME-16). Yang tersisa untuk komponen ini hanyalah bentuknya.
 *
 * Tab aktif ikut ke tautan "See all", sehingga halaman lihat-semua terbuka
 * dengan penyaring yang sama — bukan mengembalikan pengguna ke katalog penuh
 * yang baru saja ia persempit.
 */
export function StorySection({ section, tab }: { section: HomeSection; tab: string | null }) {
  const shape = shapeOf(section.id)
  const seeAll = section.seeAll
    ? `/jelajah/${section.seeAll}${tab ? `?tab=${encodeURIComponent(tab)}` : ''}`
    : null

  return (
    <section className="mb-7">
      <SectionHeader
        label={section.title}
        className="mb-3"
        action={
          seeAll && (
            <Link to={seeAll}>
              <SeeAllAction>{t('home.seeAll')}</SeeAllAction>
            </Link>
          )
        }
      />

      {shape === 'continue' && (
        <ul className="divide-y divide-nv-line">
          {section.stories.map((story) => (
            <li key={story.id}>
              <StoryCard
                story={story}
                variant="list"
                progress={section.progress?.[story.id] ?? 0}
              />
            </li>
          ))}
        </ul>
      )}

      {shape === 'ranked' && (
        <ul className="divide-y divide-nv-line">
          {section.stories.map((story, i) => (
            <li key={story.id}>
              <StoryCard story={story} variant="list" rank={i + 1} />
            </li>
          ))}
        </ul>
      )}

      {(shape === 'rail' || shape === 'rail-wide') && (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {section.stories.map((story, i) => (
            <StoryCard
              key={story.id}
              story={story}
              className={
                shape === 'rail-wide' ? 'w-40 shrink-0 snap-start' : 'w-28 shrink-0 snap-start'
              }
              // Populer memberi nomor peringkat; section lain memakai lencana
              // milik ceritanya sendiri (`Rising` · `New` · `Hot`).
              {...(section.id === 'populer' && i < 3 ? { badge: `#${i + 1} Populer` } : {})}
              note={
                section.id === 'terbaru' ? (
                  <GrowthNote story={story} />
                ) : shape === 'rail-wide' ? (
                  <PullQuote story={story} />
                ) : null
              }
            />
          ))}
        </div>
      )}
    </section>
  )
}

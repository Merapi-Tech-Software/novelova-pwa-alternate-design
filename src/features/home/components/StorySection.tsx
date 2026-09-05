import { Link } from 'react-router'
import type { HomeSection, Story } from '@/api/contracts'
import { StoryCard } from '@/components/patterns/StoryCard'
import { Skeleton } from '@/components/ui/Card'
import { SectionHeader, SeeAllAction } from '@/components/ui/SectionHeader'
import { t } from '@/i18n/t'

/**
 * **Dua bentuk section**, turun dari empat · `architecture.md` §1.22.
 *
 * `rail` — deret mendatar sampul 80px: **seluruh section genre**.
 * `continue` — daftar tegak berbatang progres: Lanjut Membaca saja.
 *
 * `ranked` (daftar tegak bernomor) dan `rail-wide` (160px + kutipan serif)
 * dihapus. Permintaan produk 5 September membalik aturan brief §4 untuk beranda:
 * daftar tegak menampilkan tiga sampai empat cerita per layar, rel 80px hampir
 * empat **per baris** tanpa memakan tinggi — dan beranda satu-satunya halaman
 * yang tugasnya penemuan. Aturannya tetap berlaku penuh di `/jelajah` dan
 * `/pustaka`.
 *
 * **Lanjut Membaca sengaja tidak ikut.** Ia membawa batang progres, "Bab 45 dari
 * 120", dan tombol lanjut; ketiganya butuh lebar satu baris penuh.
 *
 * Dipilih dari **id**, bukan dari judulnya: judul section berganti mengikuti tab
 * (Fase 3b), id-nya tidak.
 */
type Shape = 'rail' | 'continue'

function shapeOf(id: string): Shape {
  return id === 'lanjut-baca' ? 'continue' : 'rail'
}

export function SectionSkeleton() {
  return (
    <section className="mb-4">
      <Skeleton className="mb-3 h-3 w-28" />
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 w-20 shrink-0" />
        ))}
      </div>
    </section>
  )
}

/**
 * Section yang tiga teratasnya diberi nomor.
 *
 * Populer sejak `7a`; sisanya mewarisi nomor dari bentuk `ranked` yang dihapus
 * di §1.22 — tanpa itu peringkatnya hilang sama sekali, dan section bernama
 * "Paling Banyak Dibuka" yang tidak menunjukkan urutan tidak menjawab namanya.
 */
const RANKED = new Set(['populer', 'terbuka'])

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
export function StorySection({
  section,
  tab,
  onCoverClick,
}: {
  section: HomeSection
  tab: string | null
  /** Diteruskan ke tiap kartu di rel; lihat `StoryCard.onCoverClick`. */
  onCoverClick?: ((story: Story, origin: HTMLElement) => void) | undefined
}) {
  const shape = shapeOf(section.id)
  const seeAll = section.seeAll
    ? `/jelajah/${section.seeAll}${tab ? `?tab=${encodeURIComponent(tab)}` : ''}`
    : null

  return (
    <section className="mb-4">
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

      {shape === 'rail' && (
        <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {section.stories.map((story, i) => (
            <StoryCard
              key={story.id}
              story={story}
              className="w-20 shrink-0 snap-start"
              onCoverClick={onCoverClick}
              // Nomor peringkat dulu milik bentuk `ranked` yang dihapus; ia
              // pindah ke badge sampul, mekanisme yang sudah dipakai Populer.
              {...(RANKED.has(section.id) && i < 3 ? { badge: `#${i + 1}` } : {})}
            />
          ))}
        </div>
      )}
    </section>
  )
}

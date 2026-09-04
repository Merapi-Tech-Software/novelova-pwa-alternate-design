import { BookOpen } from 'lucide-react'
import type { StoryDetail } from '@/api/contracts'
import { Badge } from '@/components/ui/Chip'
import { t } from '@/i18n/t'
import { formatCompactCoin } from '@/lib/coin'

const STATUS_LABEL: Record<StoryDetail['status'], string> = {
  ongoing: 'Berjalan',
  completed: 'Tamat',
  hiatus: 'Hiatus',
}

/**
 * Hero sampul · FR-DETAIL-01 · FR-DETAIL-02.
 *
 * Gambar penuh dengan gradien di atasnya, bukan kartu kecil: ini satu-satunya
 * tempat sampul yang dipilih penulis ditampilkan sebesar yang ia gambar.
 *
 * Tiga metrik di bawahnya **bersumber dari data nyata** (FR-SOCIAL-08) — angka
 * yang dikarang di layar detail adalah janji yang akan ditagih penulis. Karena
 * itu metrik ketiga berbunyi **"Disimpan"**, bukan "Pengikut" seperti tertulis
 * di FR-DETAIL-02: yang benar-benar dihitung model ini adalah `stats.saves`.
 */
export function StoryHero({ story }: { story: StoryDetail }) {
  const stats = [
    { label: t('story.views'), value: formatCompactCoin(story.stats.reads) },
    { label: t('story.ratings'), value: `${story.stats.rating.toFixed(1)} / 5` },
    { label: t('story.followers'), value: formatCompactCoin(story.stats.saves) },
  ]

  return (
    <section className="-mx-4 mb-4">
      <div className="relative flex h-56 items-end overflow-hidden sm:h-64">
        {story.bannerUrl || story.coverUrl ? (
          <img
            src={story.bannerUrl ?? story.coverUrl ?? ''}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-nv-accent-soft">
            <BookOpen size={28} aria-hidden className="text-nv-accent-strong" />
          </div>
        )}
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-nv-scrim to-transparent"
        />

        <div className="relative w-full px-4 pb-4">
          {story.badge && (
            <span className="mb-2 inline-block rounded-nv-pill bg-nv-card px-2.5 py-0.5 text-caption font-semibold tracking-wide text-nv-accent-strong uppercase">
              {story.badge}
            </span>
          )}
          <h1 className="font-display text-page leading-tight font-bold text-nv-on-scrim">
            {story.title}
          </h1>
          <p className="flex flex-wrap items-center gap-2 pt-1 text-body text-nv-on-scrim/85">
            {story.penName}
            <Badge tone="neutral" aria-label={`Status: ${STATUS_LABEL[story.status]}`}>
              {STATUS_LABEL[story.status]}
            </Badge>
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-nv-line border-nv-line border-b">
        {stats.map((stat) => (
          <div key={stat.label} className="px-3 py-3 text-center">
            <dt className="text-caption text-nv-muted">{stat.label}</dt>
            <dd className="font-display text-card font-semibold tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

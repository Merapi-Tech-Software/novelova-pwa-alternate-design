import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import type { Review } from '@/api/contracts'
import { ReviewParamsSchema } from '@/api/contracts'
import { StarRating } from '@/components/patterns/StarRating'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Tabs } from '@/components/ui/Tabs'
import { t } from '@/i18n/t'
import { RateSheet } from '../components/RateSheet'
import { ReviewCard } from '../components/ReviewCard'
import { useReviews } from '../hooks/useReviews'

const SORTS = [
  { value: 'helpful', label: t('social.sHelpful') },
  { value: 'newest', label: t('social.sNewest') },
  { value: 'highest', label: t('social.sHighest') },
  { value: 'lowest', label: t('social.sLowest') },
] as const

/**
 * Halaman ulasan `/cerita/:storyId/ulasan` · FR-SOCIAL-03.
 *
 * Menggantikan tautan menggantung `detail_story_tabs.html#reviews-panel` — salah
 * satu dari tiga tautan prototipe yang menuju fitur yang tidak pernah ada
 * (FR-CORE-05).
 *
 * Seluruh saringan hidup di URL dan **menyaring di server**, jadi halaman ini
 * bisa dibagikan apa adanya dan penghitungnya tidak pernah berbohong.
 */
export default function ReviewsPage() {
  const { storyId = '' } = useParams()
  const [search, setSearch] = useSearchParams()
  const [rating, setRating] = useState(false)

  const params = ReviewParamsSchema.parse({
    page: 1,
    pageSize: 20,
    stars: search.get('bintang') ? Number(search.get('bintang')) : null,
    withText: search.get('teks') === '1',
    tag: search.get('tag'),
    sort: search.get('urut') ?? 'helpful',
  })

  const reviews = useReviews(storyId, params)

  function patch(next: Record<string, string | null>) {
    const query = new URLSearchParams(search)
    for (const [key, value] of Object.entries(next)) {
      if (value === null) query.delete(key)
      else query.set(key, value)
    }
    setSearch(query, { replace: true })
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-10">
      {/* Judul dan tombol kembali sudah dirender `TopBarLayout`. */}
      <AsyncState
        loading={reviews.isPending}
        error={reviews.error}
        data={reviews.data}
        onRetry={() => void reviews.refetch()}
        empty={{ title: t('social.emptyTitle'), description: t('social.emptyBody') }}
      >
        {(page) => (
          <>
            <section className="rounded-nv-lg bg-nv-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-display text-stat font-bold text-nv-gold tabular-nums">
                  {page.breakdown.average.toLocaleString('id-ID')}
                </p>
                <div>
                  <StarRating value={page.breakdown.average} />
                  <p className="pt-0.5 text-caption text-nv-muted tabular-nums">
                    {t('social.average')(
                      page.breakdown.average.toLocaleString('id-ID'),
                      page.breakdown.total,
                    )}
                  </p>
                </div>
              </div>

              {/* Sebaran dihitung dari **seluruh rating**, bukan dari ulasan yang
                  lolos saringan — grafik yang ikut menyusut saat disaring
                  berhenti menggambarkan ceritanya. */}
              <ol className="pt-3" aria-label={t('social.histogram')}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = page.breakdown.histogram[star - 1] ?? 0
                  const pct =
                    page.breakdown.total === 0
                      ? 0
                      : Math.round((count / page.breakdown.total) * 100)
                  return (
                    <li key={star} className="flex items-center gap-2 py-1">
                      <span className="w-6 text-caption text-nv-muted tabular-nums">{star}★</span>
                      {/* Batang garis rambut dengan **angka emas** (R9c): emas
                          dijatah untuk rating, dan sebaran bintang adalah
                          rating. Jalurnya kertas, bukan garis penuh. */}
                      <span className="h-1.5 flex-1 overflow-hidden rounded-nv-pill bg-nv-paper-2">
                        <span
                          className="block h-full rounded-nv-pill bg-nv-gold-line"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="sr-only">{t('social.starRow')(star, count)}</span>
                      <span
                        aria-hidden
                        className="w-8 text-right font-semibold text-caption text-nv-gold tabular-nums"
                      >
                        {count}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </section>

            {page.topTags.length > 0 && (
              <fieldset className="flex flex-wrap gap-2 pt-4">
                <legend className="sr-only">{t('social.tagsTop')}</legend>
                {page.topTags.map(({ tag, count }) => (
                  <Chip
                    key={tag}
                    selected={params.tag === tag}
                    onClick={() => patch({ tag: params.tag === tag ? null : tag })}
                  >
                    {t('social.tagCount')(tag, count)}
                  </Chip>
                ))}
              </fieldset>
            )}

            {/*
              Saringan dan urutan jadi **dua deret tab teks** (R9c). Keduanya
              tetap menyaring **di server** dan tetap hidup di URL — yang
              berganti bentuknya, bukan jalurnya.

              Saringannya jadi satu pilihan aktif: "Ada teksnya" dan sebuah
              bintang tidak lagi bisa menyala bersamaan. Itu memang yang sudah
              disiratkan tombol "Semua" sejak awal, dan gabungan "ada teksnya +
              bintang 4" tidak pernah punya jalan masuk yang jelas.
            */}
            <Tabs
              items={[
                { value: 'semua', label: t('social.fAll') },
                { value: 'teks', label: t('social.fText') },
                ...[5, 4, 3, 2, 1].map((star) => ({
                  value: String(star),
                  label: t('social.fStars')(star),
                })),
              ]}
              value={
                params.withText ? 'teks' : params.stars === null ? 'semua' : String(params.stars)
              }
              onChange={(next) =>
                patch({
                  teks: next === 'teks' ? '1' : null,
                  bintang: next === 'semua' || next === 'teks' ? null : next,
                })
              }
              label={t('social.filterLabel')}
              className="mt-4"
            />

            <Tabs
              items={SORTS.map((o) => ({ value: o.value, label: o.label }))}
              value={params.sort}
              onChange={(next) => patch({ urut: next })}
              label={t('social.sortLabel')}
              className="mt-3"
            />

            <p className="pt-3 text-caption text-nv-muted tabular-nums">
              {t('social.count')(page.total)}
            </p>

            {/* Ulasan sendiri **selalu paling atas dan tidak pernah tersaring**:
                penulisnya harus selalu bisa menemukan miliknya untuk disunting. */}
            {page.myReview && (
              <section className="pt-5">
                <SectionHeader label={t('social.mine')} />
                <ReviewCard review={page.myReview} isMine onEdit={() => setRating(true)} />
              </section>
            )}

            {page.items.length === 0 ? (
              <p className="pt-6 text-body text-nv-muted">
                {params.stars !== null || params.withText || params.tag !== null
                  ? t('social.emptyFiltered')
                  : t('social.emptyBody')}
              </p>
            ) : (
              <ol className="mt-5 border-nv-line border-t">
                {page.items.map((review: Review) => (
                  <li key={review.id}>
                    <ReviewCard review={review} canReply={page.canReply} />
                  </li>
                ))}
              </ol>
            )}

            <Button className="mt-6" variant="secondary" onClick={() => setRating(true)}>
              {page.myReview ? t('social.edit') : t('social.rate')}
            </Button>

            <RateSheet
              storyId={storyId}
              open={rating}
              onClose={() => setRating(false)}
              myReview={page.myReview}
            />
          </>
        )}
      </AsyncState>
    </div>
  )
}

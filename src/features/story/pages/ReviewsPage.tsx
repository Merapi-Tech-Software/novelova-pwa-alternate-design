import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import type { Review } from '@/api/contracts'
import { ReviewParamsSchema } from '@/api/contracts'
import { StarRating } from '@/components/patterns/StarRating'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
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
            <Card>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-display text-stat tabular-nums">
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
                    <li key={star} className="flex items-center gap-2 py-0.5">
                      <span className="w-6 text-caption text-nv-muted tabular-nums">{star}★</span>
                      <span className="h-1.5 flex-1 rounded-nv-pill bg-nv-line">
                        <span
                          className="block h-1.5 rounded-nv-pill bg-nv-accent"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="sr-only">{t('social.starRow')(star, count)}</span>
                      <span
                        aria-hidden
                        className="w-8 text-right text-caption text-nv-muted tabular-nums"
                      >
                        {count}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </Card>

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

            <fieldset className="flex flex-wrap gap-2 pt-3">
              <legend className="sr-only">{t('social.filterLabel')}</legend>
              <Chip
                selected={params.stars === null && !params.withText}
                onClick={() => patch({ bintang: null, teks: null })}
              >
                {t('social.fAll')}
              </Chip>
              <Chip
                selected={params.withText}
                onClick={() => patch({ teks: params.withText ? null : '1' })}
              >
                {t('social.fText')}
              </Chip>
              {[5, 4, 3, 2, 1].map((star) => (
                <Chip
                  key={star}
                  selected={params.stars === star}
                  onClick={() => patch({ bintang: params.stars === star ? null : String(star) })}
                >
                  {t('social.fStars')(star)}
                </Chip>
              ))}
            </fieldset>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
              <p className="text-body text-nv-muted tabular-nums">
                {t('social.count')(page.total)}
              </p>
              <label className="text-caption text-nv-muted">
                <span className="sr-only">{t('social.sortLabel')}</span>
                <select
                  className="h-11 rounded-nv-pill border border-nv-line bg-nv-card px-3 text-body text-nv-text"
                  value={params.sort}
                  onChange={(e) => patch({ urut: e.target.value })}
                >
                  {SORTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Ulasan sendiri **selalu paling atas dan tidak pernah tersaring**:
                penulisnya harus selalu bisa menemukan miliknya untuk disunting. */}
            {page.myReview && (
              <section className="pt-4">
                <h2 className="text-caption tracking-widest text-nv-muted uppercase">
                  {t('social.mine')}
                </h2>
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
              <ol className="pt-4">
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

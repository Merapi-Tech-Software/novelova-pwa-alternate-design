import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Card'
import { Badge, Chip } from '@/components/ui/Chip'
import { useChapters, useStory, useToggleFollow, useToggleSave } from '@/hooks/useStory'
import { t } from '@/i18n/t'
import { formatCompactCoin as formatCoin } from '@/lib/coin'
import { ChapterList } from '../components/ChapterList'
import { ModerationActions } from '../components/ModerationActions'
import { RateSheet } from '../components/RateSheet'
import { StoryActions } from '../components/StoryActions'
import { StoryHero } from '../components/StoryHero'
import { VoucherSheet } from '../components/VoucherSheet'
import { useMyRating, useReviews } from '../hooks/useReviews'

const MONETIZE_LABEL: Record<string, string> = {
  free: 'Gratis',
  partial: 'Sebagian berbayar',
  premium: 'Premium',
}

/**
 * Detail cerita · prd_04.
 *
 * Urutannya mengikuti apa yang dicari pembaca: sampul dan angka dulu, lalu dua
 * aksi utama, sinopsis, tag, dan terakhir daftar bab — yang paling panjang, dan
 * satu-satunya yang perlu digulir.
 */
export default function StoryDetailPage() {
  const { storyId } = useParams()
  const story = useStory(storyId)
  const [sort, setSort] = useState<'asc' | 'desc'>('asc')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [voucherOpen, setVoucherOpen] = useState(false)
  const [rating, setRating] = useState(false)

  const chapters = useChapters(storyId, { sort, q: query })
  // Dua kueri ringan hanya untuk keadaan tombol Rate dan ulasan milik sendiri.
  const myRating = useMyRating(storyId ?? '')
  const reviews = useReviews(storyId ?? '', {
    page: 1,
    pageSize: 1,
    stars: null,
    withText: false,
    tag: null,
    sort: 'helpful',
  })
  const toggleSave = useToggleSave(storyId)
  const toggleFollow = useToggleFollow(storyId)

  if (story.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-56" />
        <Skeleton lines={4} />
      </div>
    )
  }

  if (story.isError || !story.data) {
    return (
      <FailureNotice
        level="inset"
        title={t('failure.genericTitle')}
        body={t('failure.genericBody')}
        safety={t('failure.genericSafe')}
        onRetry={() => void story.refetch()}
      />
    )
  }

  const detail = story.data
  const rows = chapters.data?.pages.flatMap((page) => page.items) ?? []
  const total = chapters.data?.pages[0]?.total ?? 0
  const resume = detail.continueChapterNumber

  return (
    <div>
      <StoryHero story={detail} />

      <StoryActions
        story={detail}
        onToggleSave={() => toggleSave.mutate()}
        onToggleFollow={() => toggleFollow.mutate()}
      />

      {/* Tombol utama: melanjutkan bila pernah membaca, memulai bila belum. */}
      {rows.length > 0 && (
        <Link
          to={`/cerita/${detail.id}/bab/${detail.continueChapterId ?? rows[0]?.id}`}
          className="mb-5 flex h-13 w-full items-center justify-center rounded-nv-pill bg-nv-accent px-6 text-card font-semibold text-nv-card transition hover:bg-nv-accent-strong"
        >
          {resume ? t('story.continueAt')(resume) : t('story.startReading')}
        </Link>
      )}

      <section className="mb-5">
        <p className={expanded ? 'text-body' : 'line-clamp-3 text-body'}>{detail.synopsis}</p>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((on) => !on)}
          className="pt-1 text-caption font-semibold text-nv-accent-strong underline underline-offset-4"
        >
          {expanded ? t('story.readLess') : t('story.readMore')}
        </button>
      </section>

      {/* Status dan harga sebagai lencana, genre sebagai pil — dua kosakata
          berbeda yang tidak boleh terbaca sebagai satu deret (FR-DETAIL-06). */}
      {/* Rating **diproduksi** di sini · FR-SOCIAL-01. Sampai sekarang angkanya
          dikonsumsi enam tempat tetapi tidak pernah bisa ditulis siapa pun.
          Tombolnya membawa keadaannya: "Beri rating" bila belum, bintangnya
          bila sudah. */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => setRating(true)}>
          {myRating.data ? t('social.rated')(myRating.data.stars) : t('social.rate')}
        </Button>
        <Link
          to={`/cerita/${detail.id}/ulasan`}
          className="text-body text-nv-accent-strong underline"
        >
          {t('social.allReviews')}
        </Link>
        {/* Tombol Report prototipe tidak pernah punya handler (FR-SOCIAL-07);
            di sini ia memakai alur yang sama dengan ulasan dan komentar. */}
        <ModerationActions
          targetType="story"
          targetId={detail.id}
          targetLabel={t('moderation.targetStory')(detail.title)}
          ownerId={null}
        />
      </div>

      <Button variant="secondary" block className="mb-6" onClick={() => setVoucherOpen(true)}>
        {t('story.voucher')}
      </Button>

      <RateSheet
        storyId={detail.id}
        open={rating}
        onClose={() => setRating(false)}
        myReview={reviews.data?.myReview ?? null}
      />

      <section className="mb-6 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge tone="accent">{MONETIZE_LABEL[detail.monetizeType] ?? detail.monetizeType}</Badge>
          <Badge tone="neutral">{detail.audience}</Badge>
          <Badge tone="neutral">{detail.language}</Badge>
          {detail.fullAccessCoins !== null && (
            <Badge tone="coin">{formatCoin(detail.fullAccessCoins)} koin · akses penuh</Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {detail.genres.map((genre) => (
            <Chip key={genre}>{genre}</Chip>
          ))}
          {detail.tags.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
      </section>

      <VoucherSheet
        open={voucherOpen}
        onClose={() => setVoucherOpen(false)}
        storyId={detail.id}
        chapters={rows}
      />

      <ChapterList
        story={detail}
        chapters={rows}
        total={total}
        sort={sort}
        query={query}
        loading={chapters.isPending}
        hasMore={chapters.hasNextPage}
        onSort={() => setSort((current) => (current === 'asc' ? 'desc' : 'asc'))}
        onQuery={setQuery}
        onMore={() => void chapters.fetchNextPage()}
      />
    </div>
  )
}

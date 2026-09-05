import { Play } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { ModerationActions } from '@/components/patterns/ModerationActions'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Card'
import { Badge, Chip } from '@/components/ui/Chip'
import { useChapters, useStory, useToggleFollow, useToggleSave } from '@/hooks/useStory'
import { t } from '@/i18n/t'
import { ChapterList } from '../components/ChapterList'
import { MonetizationCard } from '../components/MonetizationCard'
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
  /*
   * `7b` menuliskan **nomor dan judul** bab terakhir, bukan kalimat tombolnya.
   * Judulnya hanya ada di daftar bab yang sudah termuat; kalau babnya belum
   * termuat, bilahnya turun ke nomor saja — bukan memuat halaman tambahan
   * demi satu baris teks.
   */
  const lastRead =
    rows.find((c) => c.id === detail.continueChapterId) ??
    (resume === null ? undefined : { number: resume, title: '' })

  return (
    // Ruang bawah tambahan: `AppShell` sudah menyisakan ruang untuk bilah nav
    // dan FAB, tetapi bilah lengket di halaman ini menumpuk di atas keduanya.
    <div className="pb-20">
      <StoryHero story={detail} />

      <StoryActions
        story={detail}
        onToggleSave={() => toggleSave.mutate()}
        onToggleFollow={() => toggleFollow.mutate()}
      />

      <section className="mb-5">
        {/* Sinopsis **serif**: ia bagian dari ceritanya, bukan keterangan aplikasi
            tentang dirinya (brief §2). */}
        <p className={expanded ? 'font-display text-card' : 'line-clamp-3 font-display text-card'}>
          {detail.synopsis}
        </p>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((on) => !on)}
          className="nv-tap text-caption font-semibold text-nv-accent underline underline-offset-4"
        >
          {expanded ? t('story.readLess') : t('story.readMore')}
        </button>
      </section>

      <MonetizationCard story={detail} />

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
          className="nv-tap text-body text-nv-accent underline"
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
          {/*
            Harga akses penuh **tidak diulang di sini** — kartu monetisasi di atas
            sudah menyebutnya, dan satu angka uang yang tampil dua kali di satu
            layar adalah dua tempat yang bisa berselisih.
          */}
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

      {/*
        Bilah bawah lengket `7b`. **`bottom-[var(--nv-bottom-nav)]`, bukan
        `bottom-0`** — di `<1024` bilah navigasi juga menempel di dasar layar,
        dan dua bilah `fixed bottom-0` saling menutupi persis di lebar yang
        paling banyak dipakai (`CLAUDE.md` §8). Menaikkan `z-index` hanya
        menukar siapa yang tertutup.

        Isinya digandakan di ruang statis setinggi bilahnya supaya baris terakhir
        daftar bab tidak pernah tertutup.
      */}
      {rows.length > 0 && (
        <div className="fixed inset-x-0 bottom-[var(--nv-bottom-nav)] z-30 border-nv-line border-t bg-nv-card/95 backdrop-blur lg:bottom-0">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="nv-section-label">{t('story.lastRead')}</p>
              <p className="truncate pt-0.5 font-display text-card font-semibold">
                {lastRead
                  ? `Bab ${lastRead.number}${lastRead.title ? ` · ${lastRead.title}` : ''}`
                  : t('story.startReading')}
              </p>
            </div>
            <Link
              to={`/cerita/${detail.id}/bab/${detail.continueChapterId ?? rows[0]?.id}`}
              className="flex shrink-0 items-center gap-1.5 rounded-nv-pill bg-nv-accent px-5 py-3 text-body font-bold text-nv-card"
            >
              <Play size={13} className="fill-current" aria-hidden />
              {t('story.resume')}
            </Link>
          </div>
        </div>
      )}

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

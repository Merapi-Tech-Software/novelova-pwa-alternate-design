import { Link } from 'react-router'
import type { StudioStory } from '@/api/contracts'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Chip'
import { t } from '@/i18n/t'
import { formatCompactCoin } from '@/lib/coin'
import { formatDateTime } from '@/lib/format'

const STATUS: Record<StudioStory['studioStatus'], { label: string; tone: BadgeTone }> = {
  draft: { label: t('studio.stDraft'), tone: 'neutral' },
  in_review: { label: t('studio.stInReview'), tone: 'info' },
  rejected: { label: t('studio.stRejected'), tone: 'danger' },
  scheduled: { label: t('studio.stScheduled'), tone: 'warning' },
  published: { label: t('studio.stPublished'), tone: 'success' },
  completed: { label: t('studio.stCompleted'), tone: 'accent' },
  archived: { label: t('studio.stArchived'), tone: 'neutral' },
}

export interface StudioCardProps {
  item: StudioStory
  onSchedule: (item: StudioStory) => void
  onPrint: (item: StudioStory) => void
  onDelete: (item: StudioStory) => void
}

/**
 * Kartu karya · FR-STUDIO-02 · FR-STUDIO-38.
 *
 * Empat aksi selalu ada (Edit · Bab · Pratinjau · Hapus); tiga sisanya muncul
 * **hanya bila berlaku**, bukan muncul-lalu-dinonaktifkan. Tombol mati yang
 * tetap terlihat mengajari penulis mencoba hal yang tidak akan pernah bekerja.
 *
 * Aturan Analisa **dibalik dari prototipe** (PRD 07 §7 #1): di sana justru
 * cerita terbit yang kehilangan tautan analitiknya — padahal hanya cerita terbit
 * yang punya angka untuk dianalisa.
 */
export function StudioCard({ item, onSchedule, onPrint, onDelete }: StudioCardProps) {
  const { story, studioStatus } = item
  const status = STATUS[studioStatus]

  const metrics = [
    { label: t('studio.mViews'), value: formatCompactCoin(story.stats.reads) },
    { label: t('studio.mReaders'), value: formatCompactCoin(story.stats.readers) },
    {
      label: t('studio.mRating'),
      value: story.stats.rating > 0 ? story.stats.rating.toFixed(1) : '—',
    },
    { label: t('studio.mComments'), value: formatCompactCoin(story.stats.commentCount) },
    { label: t('studio.mCoins'), value: formatCompactCoin(story.stats.coinsEarned) },
    { label: t('studio.mChapters'), value: String(story.stats.chapterCount) },
  ]

  return (
    <article className="rounded-nv-lg border border-nv-line bg-nv-card p-3.5">
      <div className="flex items-start gap-3">
        {story.coverUrl ? (
          <img
            src={story.coverUrl}
            alt=""
            loading="lazy"
            className="h-20 w-14 shrink-0 rounded-nv-md object-cover"
          />
        ) : (
          <span className="block h-20 w-14 shrink-0 rounded-nv-md bg-nv-surface" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 truncate font-semibold text-body text-nv-text">{story.title}</h3>
            <Badge tone={status.tone} className="shrink-0">
              {status.label}
            </Badge>
          </div>
          <p className="truncate pt-0.5 text-caption text-nv-muted">{story.genres.join(' · ')}</p>
          <p className="pt-0.5 text-caption text-nv-muted tabular-nums">{story.updatedAt}</p>
          {item.scheduledAt && (
            <p className="pt-0.5 text-caption text-nv-accent-strong">
              {t('studio.scheduledFor')(formatDateTime(new Date(item.scheduledAt)))}
            </p>
          )}
        </div>
      </div>

      {/* Alasan penolakan tampil di kartunya sendiri — penulis tidak boleh harus
          mencarinya (FR-STUDIO-38). */}
      {studioStatus === 'rejected' && item.rejectReason && (
        <div className="mt-3 rounded-nv-md bg-nv-danger-bg p-3">
          <p className="font-semibold text-caption text-nv-danger">{t('studio.rejectedLabel')}</p>
          <p className="pt-0.5 text-caption text-nv-text">{item.rejectReason}</p>
        </div>
      )}

      {/* Satu bab terbit adalah momen paling tepat mengingatkan ritme rilis —
          dan satu-satunya yang bisa dikenali dari angka (FR-STUDIO-35). */}
      {item.publishedChapters === 1 && (
        <div className="mt-3 rounded-nv-md bg-nv-accent-soft p-3">
          <p className="text-caption text-nv-text">{t('studio.nudgeFirstChapter')}</p>
          <div className="flex flex-wrap gap-3 pt-1.5">
            <Link
              to={`/karya/${story.id}/bab/baru`}
              className="text-caption font-semibold text-nv-accent-strong underline"
            >
              {t('studio.nudgeSchedule')}
            </Link>
            <Link
              to={`/karya/${story.id}/bab`}
              className="text-caption font-semibold text-nv-accent-strong underline"
            >
              {t('studio.nudgeAccess')}
            </Link>
          </div>
        </div>
      )}

      <dl className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-nv-md bg-nv-surface px-2 py-1.5 text-center">
            <dt className="text-caption text-nv-muted">{m.label}</dt>
            <dd className="pt-0.5 font-semibold text-caption text-nv-text tabular-nums">
              {m.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex flex-wrap gap-2">
        <ActionLink to={`/karya/${story.id}/ubah`}>{t('studio.actEdit')}</ActionLink>
        <ActionLink to={`/karya/${story.id}/bab`}>{t('studio.actChapters')}</ActionLink>
        <ActionLink to={`/cerita/${story.id}`}>{t('studio.actPreview')}</ActionLink>

        {studioStatus === 'draft' && (
          <Button variant="secondary" size="sm" onClick={() => onSchedule(item)}>
            {t('studio.actSchedule')}
          </Button>
        )}

        {(studioStatus === 'published' || studioStatus === 'completed') && (
          <ActionLink to={`/karya/${story.id}/analitik`}>{t('studio.actAnalytics')}</ActionLink>
        )}

        {studioStatus === 'completed' && (
          <Button variant="secondary" size="sm" onClick={() => onPrint(item)}>
            {t('studio.actPrint')}
          </Button>
        )}

        <Button variant="danger" size="sm" className="ml-auto" onClick={() => onDelete(item)}>
          {t('studio.actDelete')}
        </Button>
      </div>
    </article>
  )
}

/** Tautan yang tampil seperti tombol kecil sekunder — tujuan, bukan aksi. */
function ActionLink({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="inline-flex h-9 items-center rounded-nv-pill border border-nv-line px-3 font-semibold text-caption text-nv-text transition hover:bg-nv-surface"
    >
      {children}
    </Link>
  )
}

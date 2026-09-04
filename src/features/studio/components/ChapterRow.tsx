import { MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router'
import type { AuthorChapter } from '@/api/contracts'
import { Button, IconButton } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Chip'
import { t } from '@/i18n/t'
import { formatDateTime, formatRelative } from '@/lib/format'

const STATUS: Record<AuthorChapter['authorStatus'], { label: string; tone: BadgeTone }> = {
  draft: { label: t('chapters.stDraft'), tone: 'neutral' },
  in_review: { label: t('chapters.stInReview'), tone: 'warning' },
  rejected: { label: t('chapters.stRejected'), tone: 'danger' },
  scheduled: { label: t('chapters.stScheduled'), tone: 'info' },
  published: { label: t('chapters.stPublished'), tone: 'success' },
  private: { label: t('chapters.stPrivate'), tone: 'neutral' },
}

export interface ChapterRowProps {
  chapter: AuthorChapter
  storyId: string
  onPublish: (chapter: AuthorChapter) => void
  onSchedule: (chapter: AuthorChapter) => void
  onMenu: (chapter: AuthorChapter) => void
}

/**
 * Satu bab di daftar penulis · FR-STUDIO-08.
 *
 * **Informasi dan aksi cepatnya berbeda per status**, bukan satu baris seragam
 * dengan tombol yang kadang mati: draf menunjukkan sejauh mana ia ditulis,
 * terjadwal menunjukkan kapan, terbit menunjukkan bagaimana ia diterima, dan
 * privat menunjukkan bahwa ia memang tidak terlihat.
 *
 * `id` jangkarnya dipakai pemberitahuan "terbit dalam 24 jam" untuk menggulir
 * langsung ke babnya (FR-STUDIO-07).
 */
export function ChapterRow({ chapter, storyId, onPublish, onSchedule, onMenu }: ChapterRowProps) {
  const status = STATUS[chapter.authorStatus]

  return (
    <article
      id={`bab-${chapter.number}`}
      className="rounded-nv-lg border border-nv-line bg-nv-card p-3.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-caption text-nv-muted tabular-nums">Bab {chapter.number}</p>
          <h3 className="truncate font-semibold text-body text-nv-text">{chapter.title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {chapter.authorStatus === 'published' && (
            <Badge tone={chapter.access === 'paid' ? 'coin' : 'neutral'}>
              {chapter.access === 'paid' ? t('chapters.accessPaid') : t('chapters.accessFree')}
            </Badge>
          )}
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
      </div>

      <Meta chapter={chapter} />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {chapter.authorStatus === 'draft' && (
          <>
            <Link
              to={`/karya/${storyId}/bab/${chapter.id}/ubah`}
              className="inline-flex h-9 items-center rounded-nv-pill bg-nv-accent px-3.5 font-semibold text-caption text-nv-card"
            >
              {t('chapters.actWrite')}
            </Link>
            <Button variant="secondary" size="sm" onClick={() => onPublish(chapter)}>
              {t('chapters.actPublish')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onSchedule(chapter)}>
              {t('chapters.actSchedule')}
            </Button>
          </>
        )}

        {chapter.authorStatus === 'scheduled' && (
          <Button variant="secondary" size="sm" onClick={() => onSchedule(chapter)}>
            {t('chapters.actReschedule')}
          </Button>
        )}

        {chapter.authorStatus === 'published' && (
          <Link
            to={`/cerita/${storyId}/bab/${chapter.id}`}
            className="inline-flex h-9 items-center rounded-nv-pill border border-nv-line px-3.5 font-semibold text-caption text-nv-text"
          >
            {t('chapters.actView')}
          </Link>
        )}

        {chapter.authorStatus === 'private' && (
          <Button variant="secondary" size="sm" onClick={() => onPublish(chapter)}>
            {t('chapters.actShow')}
          </Button>
        )}

        <IconButton
          label={t('chapters.actMenu')(chapter.title)}
          size="sm"
          className="ml-auto"
          onClick={() => onMenu(chapter)}
        >
          <MoreHorizontal size={18} />
        </IconButton>
      </div>
    </article>
  )
}

/** Baris keterangan — isinya ditentukan status, bukan diseragamkan. */
function Meta({ chapter }: { chapter: AuthorChapter }) {
  if (chapter.authorStatus === 'draft' || chapter.authorStatus === 'in_review') {
    return (
      <>
        <p className="pt-1.5 text-caption text-nv-muted">
          {t('chapters.draftMeta')(
            formatRelative(new Date(chapter.editedAt)),
            chapter.progressPct,
            chapter.wordCount,
          )}
        </p>
        <span
          aria-hidden
          className="mt-1.5 block h-1.5 overflow-hidden rounded-nv-pill bg-nv-surface"
        >
          <span
            className="block h-full rounded-nv-pill bg-nv-accent"
            style={{ width: `${chapter.progressPct}%` }}
          />
        </span>
      </>
    )
  }

  if (chapter.authorStatus === 'scheduled' && chapter.publishAt) {
    return (
      <p className="pt-1.5 text-caption text-nv-accent">
        {t('chapters.scheduledMeta')(formatDateTime(new Date(chapter.publishAt)))}
      </p>
    )
  }

  if (chapter.authorStatus === 'private') {
    return <p className="pt-1.5 text-caption text-nv-muted">{t('chapters.privateMeta')}</p>
  }

  if (chapter.authorStatus === 'published' && chapter.publishAt) {
    return (
      <p className="pt-1.5 text-caption text-nv-muted tabular-nums">
        {t('chapters.publishedMeta')(
          chapter.views,
          chapter.commentCount,
          formatDateTime(new Date(chapter.publishAt)),
        )}
      </p>
    )
  }

  return <p className="pt-1.5 text-caption text-nv-muted">{t('chapters.emptyTitle')}</p>
}

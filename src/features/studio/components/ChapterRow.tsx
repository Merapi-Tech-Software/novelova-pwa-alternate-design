import { MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router'
import type { AuthorChapter } from '@/api/contracts'
import { Button, IconButton } from '@/components/ui/Button'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
import { formatDateTime, formatRelative } from '@/lib/format'

/**
 * Enam status sebagai **kata berwarna status**, bukan lencana terisi (R9b).
 *
 * Enam lencana bertumpuk di satu daftar membuat tiap baris terbaca sebagai
 * peringatan; yang dibutuhkan penulis cuma tahu di mana babnya berdiri. Warnanya
 * tetap membedakan — yang hilang hanya bidangnya.
 */
const STATUS: Record<AuthorChapter['authorStatus'], { label: string; tone: string }> = {
  draft: { label: t('chapters.stDraft'), tone: 'text-nv-muted' },
  in_review: { label: t('chapters.stInReview'), tone: 'text-nv-warning' },
  rejected: { label: t('chapters.stRejected'), tone: 'text-nv-danger' },
  scheduled: { label: t('chapters.stScheduled'), tone: 'text-nv-info' },
  published: { label: t('chapters.stPublished'), tone: 'text-nv-success' },
  private: { label: t('chapters.stPrivate'), tone: 'text-nv-muted' },
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
    <article id={`bab-${chapter.number}`} className="border-nv-line border-b py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="nv-section-label tabular-nums">Bab {chapter.number}</p>
          <h3 className="truncate pt-0.5 font-display text-card font-bold text-nv-text">
            {chapter.title}
          </h3>
        </div>
        <div className="flex shrink-0 items-baseline gap-2 text-caption font-semibold">
          {chapter.authorStatus === 'published' && (
            <span className={chapter.access === 'paid' ? 'text-nv-gold' : 'text-nv-muted'}>
              {chapter.access === 'paid' ? t('chapters.accessPaid') : t('chapters.accessFree')}
            </span>
          )}
          <span className={cx(status.tone, 'whitespace-nowrap')}>{status.label}</span>
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
          className="mt-1.5 block h-1.5 overflow-hidden rounded-nv-pill bg-nv-paper-2"
        >
          <span
            className="block h-full rounded-nv-pill bg-nv-gold-line"
            style={{ width: `${chapter.progressPct}%` }}
          />
        </span>
      </>
    )
  }

  if (chapter.authorStatus === 'scheduled' && chapter.publishAt) {
    return (
      <p className="pt-1.5 text-caption text-nv-text-2">
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

  /*
   * **Bab yang ditolak menyebut apa yang terjadi**, bukan "Belum ada bab di
   * sini" — kalimat keadaan-kosong yang sampai R9b muncul di bawah bab yang
   * jelas-jelas ada. `AuthorChapter` belum membawa alasan penolakannya, jadi
   * yang ditulis di sini adalah langkah berikutnya, bukan alasan yang dikarang.
   */
  if (chapter.authorStatus === 'rejected') {
    return <p className="pt-1.5 text-caption text-nv-danger">{t('chapters.rejectedMeta')}</p>
  }

  // Sisa keadaan apa pun tetap punya `editedAt`, jadi selalu ada yang benar
  // untuk ditulis.
  return (
    <p className="pt-1.5 text-caption text-nv-muted">
      {t('chapters.editedMeta')(formatRelative(new Date(chapter.editedAt)))}
    </p>
  )
}

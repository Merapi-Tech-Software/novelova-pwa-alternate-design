import { ArrowDownUp, Check, Circle, Dot } from 'lucide-react'
import type { ChapterSummary, StoryDetail } from '@/api/contracts'
import { ChapterRow } from '@/components/patterns/ChapterRow'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchInput } from '@/components/ui/Field'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'

/** Di bawah ini kolom pencarian bab tidak muncul (FR-DETAIL-14). */
const SEARCH_THRESHOLD = 20

export interface ChapterListProps {
  story: StoryDetail
  chapters: ChapterSummary[]
  total: number
  sort: 'asc' | 'desc'
  query: string
  loading: boolean
  hasMore: boolean
  onSort: () => void
  onQuery: (next: string) => void
  onMore: () => void
}

/**
 * Tiga penanda di luar status kunci · FR-DETAIL-14.
 *
 * Sudah dibaca, sedang dibaca, belum dibaca — pembaca yang kembali setelah
 * seminggu tidak ingat bab mana yang ia tinggalkan, dan daftar tanpa penanda
 * memaksanya menebak.
 */
function Mark({ chapter, current }: { chapter: ChapterSummary; current: boolean }) {
  const [Icon, label, tone] = chapter.finished
    ? [Check, t('story.markFinished'), 'text-nv-success']
    : current
      ? [Dot, t('story.markReading'), 'text-nv-accent-strong']
      : [Circle, t('story.markUnread'), 'text-nv-line']

  return (
    <span className={cx('inline-flex items-center gap-1 text-caption', tone)}>
      <Icon size={14} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function ChapterList({
  story,
  chapters,
  total,
  sort,
  query,
  loading,
  hasMore,
  onSort,
  onQuery,
  onMore,
}: ChapterListProps) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-section font-semibold">{t('story.chapters')}</h2>
        <span className="text-caption text-nv-muted tabular-nums">
          {t('story.chapterCount')(total)}
        </span>
      </div>

      <div className="mb-3 flex items-end gap-2">
        {/* Kolom pencarian hanya muncul saat daftarnya memang panjang. */}
        {story.stats.chapterCount > SEARCH_THRESHOLD && (
          <div className="flex-1">
            <SearchInput
              label={t('story.searchChapter')}
              placeholder={t('story.searchChapter')}
              value={query}
              onChange={onQuery}
            />
          </div>
        )}
        <Button size="sm" variant="secondary" onClick={onSort} iconLeft={<ArrowDownUp size={14} />}>
          {sort === 'asc' ? t('story.sortAsc') : t('story.sortDesc')}
        </Button>
      </div>

      {loading && chapters.length === 0 && (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      )}

      {!loading && chapters.length === 0 && (
        <EmptyState
          variant={query ? 'no-results' : 'first-run'}
          title={query ? t('story.noChapterMatch')(query) : t('story.noChapters')}
          description={query ? t('search.emptyBody') : t('story.noChaptersBody')}
          {...(query
            ? { action: { label: t('action.clearFilters'), onClick: () => onQuery('') } }
            : {})}
        />
      )}

      <ul className="divide-y divide-nv-line-soft">
        {chapters.map((chapter) => (
          <li key={chapter.id} className="flex items-center gap-2">
            <Mark chapter={chapter} current={chapter.id === story.continueChapterId} />
            <div className="min-w-0 flex-1">
              <ChapterRow chapter={chapter} />
            </div>
          </li>
        ))}
      </ul>

      {hasMore && (
        <Button variant="secondary" block className="mt-3" onClick={onMore}>
          {t('search.loadMore')}
        </Button>
      )}
    </section>
  )
}

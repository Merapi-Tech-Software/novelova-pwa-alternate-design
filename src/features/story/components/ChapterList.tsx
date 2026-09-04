import { ArrowDownUp } from 'lucide-react'
import type { ChapterSummary, StoryDetail } from '@/api/contracts'
import { ChapterRow } from '@/components/patterns/ChapterRow'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchInput } from '@/components/ui/Field'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { t } from '@/i18n/t'

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
      {/* `7b`: label kecil + garis + pengurut rata kanan. Jumlah babnya sudah
          tampil di strip statistik atas, jadi di sini ia cuma pengulangan. */}
      <SectionHeader
        label={t('story.chapters')}
        className="mb-1"
        action={
          <button
            type="button"
            onClick={onSort}
            className="flex shrink-0 items-center gap-1 font-bold text-caption text-nv-text"
          >
            {sort === 'asc' ? t('story.sortAsc') : t('story.sortDesc')}
            <ArrowDownUp size={12} aria-hidden />
          </button>
        }
      />
      <span className="sr-only">{t('story.chapterCount')(total)}</span>

      <div className="mb-2 flex items-end gap-2">
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

      <ul className="divide-y divide-nv-line">
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <ChapterRow chapter={chapter} current={chapter.id === story.continueChapterId} />
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

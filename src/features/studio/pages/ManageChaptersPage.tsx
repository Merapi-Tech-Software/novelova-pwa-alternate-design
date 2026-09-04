import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import type { AuthorChapter, AuthorChapterParams, ScheduleChapterInput } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { FilterableList } from '@/components/patterns/FilterableList'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { formatDateTime } from '@/lib/format'
import { ChapterActionSheet } from '../components/ChapterActionSheet'
import { ChapterRow } from '../components/ChapterRow'
import { ChapterScheduleSheet } from '../components/ChapterScheduleSheet'
import { useStoryAnalytics } from '../hooks/useAnalytics'
import {
  useAuthorChapters,
  useChapterBoard,
  useDeleteChapter,
  usePublishChapter,
  useScheduleChapter,
  useUnscheduleChapter,
} from '../hooks/useAuthorChapters'

const PAGE_SIZE = 20

const TABS = [
  { value: 'all', label: t('chapters.tabAll') },
  { value: 'draft', label: t('chapters.stDraft') },
  { value: 'in_review', label: t('chapters.stInReview') },
  { value: 'rejected', label: t('chapters.stRejected') },
  { value: 'scheduled', label: t('chapters.stScheduled') },
  { value: 'published', label: t('chapters.stPublished') },
  { value: 'private', label: t('chapters.stPrivate') },
] as const

const SORTS = [
  { value: 'number', label: t('chapters.sortNumber') },
  { value: 'edited', label: t('chapters.sortEdited') },
  { value: 'views', label: t('chapters.sortViews') },
  { value: 'rating', label: t('chapters.sortRating') },
]

/** Pesan kosong menyesuaikan saringan aktif · FR-STUDIO-09. */
const EMPTY: Record<string, string> = {
  all: t('chapters.emptyAll'),
  draft: t('chapters.emptyDraft'),
  scheduled: t('chapters.emptyScheduled'),
  published: t('chapters.emptyPublished'),
  in_review: t('chapters.emptyInReview'),
  rejected: t('chapters.emptyRejected'),
  private: t('chapters.emptyPrivate'),
}

/**
 * Kelola bab · FR-STUDIO-07..11 · FR-STUDIO-38.
 *
 * Tiga penghitung di kepala halaman **adalah pintasan saringan** — menekannya
 * menerapkan saringan yang sama dengan tabnya, dan tab itu ikut menyorot. Dua
 * kontrol yang menyaring hal yang sama tetapi tidak saling tahu adalah cara
 * tercepat membuat penulis ragu mana yang sedang berlaku.
 */
export default function ManageChaptersPage() {
  const { storyId } = useParams()
  const [params, setParams] = useSearchParams()
  const toast = useToast()

  const q = params.get('q') ?? ''
  const status = (TABS.find((tab) => tab.value === params.get('tab')) ?? TABS[0]).value
  const sort = (SORTS.find((s) => s.value === params.get('sort')) ?? SORTS[0])
    ?.value as AuthorChapterParams['sort']
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1)

  const board = useChapterBoard(storyId)
  // Hanya untuk rekomendasi waktu terbit di penjadwal · FR-STUDIO-37. Dibaca
  // dari analitik cerita ini, bukan chip yang ditulis tangan.
  const analytics = useStoryAnalytics(storyId ?? '', {
    range: '30h',
    from: null,
    to: null,
    chapterSort: 'views',
  })
  const chapters = useAuthorChapters(storyId, {
    page: 1,
    pageSize: page * PAGE_SIZE,
    status,
    sort,
    q,
  } as AuthorChapterParams)

  const publish = usePublishChapter()
  const schedule = useScheduleChapter()
  const unschedule = useUnscheduleChapter()
  const remove = useDeleteChapter()

  const [menuFor, setMenuFor] = useState<AuthorChapter | null>(null)
  const [pickedForSchedule, setPickedForSchedule] = useState<AuthorChapter | null>(null)

  /**
   * `?jadwalkan=terbaik` · FR-EARN-05.
   *
   * Datang dari catatan aksi heatmap di `/penulis/analitik`: penjadwal terbuka
   * untuk draf pertama dengan waktu terbaik **sudah terisi**. Rekomendasi yang
   * masih menuntut penulis mencari sendiri babnya lalu mengetik tanggalnya bukan
   * rekomendasi yang bisa dijalankan.
   *
   * Diturunkan, bukan disalin ke `useState` lewat efek: keadaan yang sudah ada
   * di URL tidak perlu disimpan dua kali, dan efek yang menyalinnya akan
   * berjalan lagi setiap kali daftar bab diambil ulang.
   */
  const wantsBestSlot = params.get('jadwalkan') === 'terbaik'
  const firstDraft = chapters.data?.items.find((c) => c.state === 'draft') ?? null
  const schedulingFor = pickedForSchedule ?? (wantsBestSlot ? firstDraft : null)

  function closeScheduler() {
    setPickedForSchedule(null)
    if (wantsBestSlot) patch({ jadwalkan: null })
  }

  function patch(next: Record<string, string | null>) {
    const search = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === '') search.delete(key)
      else search.set(key, value)
    }
    setParams(search, { replace: true })
  }

  /** Satu jalur untuk seluruh aksi: pesan gagalnya selalu berasal dari server. */
  async function run(action: () => Promise<unknown>, done: string) {
    try {
      await action()
      toast.show(done)
    } catch (error) {
      toast.show(isApiError(error) ? error.message : t('failure.genericTitle'), { tone: 'danger' })
    }
  }

  const onPublish = (chapter: AuthorChapter) => {
    setMenuFor(null)
    void run(
      () => publish.mutateAsync(chapter.id),
      chapter.authorStatus === 'private'
        ? t('chapters.shown')(chapter.title)
        : t('chapters.published')(chapter.title),
    )
  }

  const onSchedule = (chapter: AuthorChapter) => {
    setMenuFor(null)
    setPickedForSchedule(chapter)
  }

  const onUnschedule = (chapter: AuthorChapter) => {
    setMenuFor(null)
    void run(() => unschedule.mutateAsync(chapter.id), t('chapters.unscheduled')(chapter.title))
  }

  const onDelete = (chapter: AuthorChapter) => {
    setMenuFor(null)
    if (!window.confirm(t('chapters.deleteConfirm')(chapter.title))) return
    void run(() => remove.mutateAsync(chapter.id), t('chapters.deleted')(chapter.title))
  }

  async function saveSchedule(input: ScheduleChapterInput) {
    const saved = await schedule.mutateAsync(input)
    closeScheduler()
    toast.show(
      t('chapters.scheduleSaved')(
        saved.publishAt ? formatDateTime(new Date(saved.publishAt)) : `${input.date} ${input.time}`,
      ),
      { tone: 'success' },
    )
  }

  const counters = [
    { id: 'draft', label: t('chapters.cDraft'), value: board.data?.draft ?? 0 },
    { id: 'scheduled', label: t('chapters.cScheduled'), value: board.data?.scheduled ?? 0 },
    { id: 'published', label: t('chapters.cPublished'), value: board.data?.published ?? 0 },
  ]

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-10">
      <header className="flex items-center gap-3">
        <Link
          to="/karya"
          aria-label={t('chapters.backToStudio')}
          className="grid size-9 shrink-0 place-items-center rounded-nv-pill border border-nv-line text-nv-text"
        >
          <ChevronLeft size={18} aria-hidden />
        </Link>
        <h1 className="min-w-0 flex-1 font-display text-section font-bold text-nv-text">
          {t('chapters.title')}
        </h1>
        <Link
          to={`/karya/${storyId}/bab/baru`}
          className="inline-flex h-10 shrink-0 items-center rounded-nv-pill bg-nv-accent px-3.5 font-semibold text-caption text-nv-card"
        >
          + {t('chapters.newChapter')}
        </Link>
      </header>

      {/* Penghitung **adalah** pintasan saringan (FR-STUDIO-07): menekannya
          menerapkan saringan yang sama dengan tab, dan tabnya ikut menyorot
          karena keduanya membaca `?tab=` yang sama. */}
      <fieldset className="grid grid-cols-3 gap-2 border-0 pt-4">
        <legend className="sr-only">{t('chapters.countersLabel')}</legend>
        {counters.map((counter) => (
          <button
            key={counter.id}
            type="button"
            aria-pressed={status === counter.id}
            onClick={() => patch({ tab: counter.id, page: null })}
            className={
              status === counter.id
                ? 'rounded-nv-lg border border-nv-accent bg-nv-accent-soft px-3 py-2.5 text-center'
                : 'rounded-nv-lg border border-nv-line bg-nv-surface px-3 py-2.5 text-center'
            }
          >
            <span className="block text-caption text-nv-muted">{counter.label}</span>
            <span className="block pt-0.5 font-display font-bold text-section text-nv-text tabular-nums">
              {counter.value}
            </span>
          </button>
        ))}
      </fieldset>

      {board.data && board.data.notices.length > 0 && (
        <ul className="grid grid-cols-1 gap-2 pt-3">
          {board.data.notices.map((notice) => (
            <li
              key={notice.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-nv-lg bg-nv-surface px-3.5 py-2.5"
            >
              <span className="min-w-0 text-caption text-nv-text">{notice.text}</span>
              <Link
                to={notice.href}
                className="shrink-0 text-caption font-semibold text-nv-accent underline"
              >
                {notice.actionLabel}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-4">
        <FilterableList
          noun="bab"
          total={chapters.data?.total ?? 0}
          shown={chapters.data?.items.length ?? 0}
          tabs={TABS}
          tabsLabel={t('chapters.tabsLabel')}
          sorts={SORTS}
          searchLabel={t('chapters.search')}
          searchPlaceholder={t('chapters.search')}
        >
          <AsyncState
            loading={chapters.isPending}
            error={chapters.error}
            data={chapters.data}
            isEmpty={(data) => data.items.length === 0}
            onRetry={() => void chapters.refetch()}
            empty={{
              variant: 'no-results',
              title: t('chapters.emptyTitle'),
              // Pesannya menyesuaikan saringan aktif — "belum ada bab" saat tab
              // Terjadwal aktif tidak memberi tahu apa pun yang berguna.
              description: EMPTY[status] ?? t('chapters.emptyAll'),
              action: { label: t('chapters.newChapter'), onClick: () => patch({ tab: null }) },
            }}
          >
            {(data) => (
              <>
                <div className="grid grid-cols-1 gap-2.5">
                  {data.items.map((chapter) => (
                    <ChapterRow
                      key={chapter.id}
                      chapter={chapter}
                      storyId={storyId ?? ''}
                      onPublish={onPublish}
                      onSchedule={onSchedule}
                      onMenu={setMenuFor}
                    />
                  ))}
                </div>

                {data.hasMore && (
                  <Button
                    variant="secondary"
                    block
                    className="mt-3"
                    onClick={() => patch({ page: String(page + 1) })}
                  >
                    {t('library.more')}
                  </Button>
                )}
              </>
            )}
          </AsyncState>
        </FilterableList>
      </div>

      <ChapterActionSheet
        chapter={menuFor}
        storyId={storyId ?? ''}
        onClose={() => setMenuFor(null)}
        onPublish={onPublish}
        onSchedule={onSchedule}
        onUnschedule={onUnschedule}
        onDelete={onDelete}
      />
      <ChapterScheduleSheet
        chapter={schedulingFor}
        onClose={closeScheduler}
        onSave={(input) => void saveSchedule(input)}
        saving={schedule.isPending}
        bestTime={analytics.data?.bestTime}
        applyBestTime={wantsBestSlot}
      />
    </div>
  )
}

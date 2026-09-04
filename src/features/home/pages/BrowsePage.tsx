import { Search } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useLibraryIds, useProgressMap } from '@/hooks/useLibrary'
import { t } from '@/i18n/t'
import { BROWSE, BROWSE_DEFAULT } from '../browseConfig'
import type { BrowseFilters } from '../components/BrowseControls'
import { BrowseControls } from '../components/BrowseControls'
import { BrowseRow } from '../components/BrowseRow'
import { SECTION_TITLE, useInfiniteSection } from '../hooks/useSection'

const PAGE_SIZE = 20

/**
 * Lihat semua · FR-HOME-10 · FR-HOME-14 · FR-HOME-15.
 *
 * **Seluruh keadaan saringan hidup di URL.** Itu yang membuat tombol kembali
 * peramban memulihkan saringan sebelumnya dan tautan hasil saringan bisa
 * dibagikan (FR-HOME-14) — dua hal yang tidak mungkin kalau kontrolnya menyimpan
 * pilihannya sendiri di dalam komponen.
 *
 * Aksennya rose-gold untuk keempat kategori: FR-HOME-15 memakai kedatangan
 * halaman keempat sebagai kesempatan menyeragamkan tiga aksen yang berbeda-beda.
 */
export default function BrowsePage() {
  const { kategori } = useParams()
  const [params, setParams] = useSearchParams()
  // Kata rutenya **adalah** id section-nya sejak Fase 3b — tidak ada lagi tabel
  // pemetaan yang harus dijaga tetap sinkron dengan registry di server.
  const sectionId = kategori && SECTION_TITLE[kategori] ? kategori : undefined
  const config = sectionId ? (BROWSE[sectionId] ?? BROWSE_DEFAULT) : null

  const filters: BrowseFilters = {
    sort: params.get('sort') ?? config?.sorts[0]?.value ?? '',
    chip: params.get('chip') ?? config?.chips[0]?.value ?? '',
    tab: params.get('tab') ?? '',
    extra: params.get(config?.extra?.param ?? 'status') ?? '',
  }

  const query = useInfiniteSection(sectionId, {
    page: 1,
    pageSize: PAGE_SIZE,
    ...(filters.sort ? { sort: filters.sort } : {}),
    ...(filters.chip ? { chip: filters.chip } : {}),
    ...(filters.tab ? { tab: filters.tab } : {}),
    ...(filters.extra && config?.extra ? { [config.extra.param]: filters.extra } : {}),
  })

  const savedIds = useLibraryIds()
  const progress = useProgressMap()
  const sentinel = useRef<HTMLDivElement>(null)

  const fetchNext = query.fetchNextPage
  const canFetch = query.hasNextPage && !query.isFetchingNextPage
  useEffect(() => {
    const node = sentinel.current
    if (!node || !canFetch) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void fetchNext()
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [canFetch, fetchNext])

  if (!sectionId || !config) {
    return (
      <FailureNotice
        level="inset"
        title={t('home.unknownCategory')}
        body={t('home.unknownCategoryBody')}
        safety={t('failure.genericSafe')}
      />
    )
  }

  function patch(next: Partial<BrowseFilters>) {
    setParams((current) => {
      const draft = new URLSearchParams(current)
      for (const [key, value] of Object.entries(next)) {
        const param = key === 'extra' ? (config?.extra?.param ?? 'status') : key
        if (value) draft.set(param, value)
        else draft.delete(param)
      }
      return draft
    })
  }

  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  const total = query.data?.pages[0]?.total ?? 0

  return (
    <div>
      <header className="mb-3">
        <h1 className="font-display text-page font-bold">{SECTION_TITLE[sectionId]}</h1>
        {filters.tab && <p className="text-caption text-nv-muted">{filters.tab}</p>}
        <p className="text-body text-nv-muted tabular-nums">
          {query.isSuccess ? t('home.storyCount')(total) : '\u00a0'}
        </p>
      </header>

      {/* Pintasan, bukan kolom pencarian kedua: pencariannya sendiri punya
          halaman sendiri (FR-SRCH-01), dan dua kotak cari yang berbeda perilaku
          hanya membuat pembaca menebak mana yang mencari apa. */}
      <Link
        to="/cari"
        className="mb-4 flex items-center gap-3 rounded-nv-pill border border-nv-line-soft bg-nv-card px-4 py-3 text-body text-nv-muted"
      >
        <Search size={16} aria-hidden />
        {t('home.searchPlaceholder')}
      </Link>

      <BrowseControls config={config} value={filters} onChange={patch} />

      {query.isError && (
        <FailureNotice
          level="inset"
          title={t('failure.genericTitle')}
          body={t('failure.genericBody')}
          safety={t('failure.genericSafe')}
          onRetry={() => void query.refetch()}
        />
      )}

      {/* Kerangka **setinggi barisnya** (brief §14), bukan kotak sembarang. */}
      {query.isPending && (
        <div className="divide-y divide-nv-line">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="my-3.5 h-20" />
          ))}
        </div>
      )}

      {query.isSuccess && items.length === 0 && (
        <EmptyState
          variant="no-results"
          title={t('home.noGenreResultsTitle')}
          description={t('home.noGenreResultsBody')}
          action={{
            label: t('action.clearFilters'),
            onClick: () => setParams(new URLSearchParams()),
          }}
        />
      )}

      <ul className="divide-y divide-nv-line">
        {items.map((story, i) => {
          const read = progress.get(story.id)
          return (
            <li key={story.id}>
              <BrowseRow
                story={story}
                saved={savedIds.has(story.id)}
                rank={i + 1}
                {...(read ? { progress: read.scrollPct } : {})}
              />
            </li>
          )
        })}
      </ul>

      {/* Skeleton di ujung daftar sekaligus pemicu muat berikutnya. */}
      {query.hasNextPage && (
        <div ref={sentinel} className="space-y-2 pt-2">
          <Skeleton className="h-28" />
          <Button variant="secondary" block onClick={() => void query.fetchNextPage()}>
            {t('home.loadMore')}
          </Button>
        </div>
      )}
    </div>
  )
}

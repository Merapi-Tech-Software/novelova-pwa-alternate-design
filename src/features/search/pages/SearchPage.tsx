import { ChevronLeft } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import type { SearchParams } from '@/api/contracts'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { Button, IconButton } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchInput } from '@/components/ui/Field'
import { t } from '@/i18n/t'
import { onVisible } from '@/lib/a11y'
import { SEARCH_MIN_CHARS } from '@/lib/limits'
import { useBackNavigation } from '@/lib/nav'
import { useSearchHistory } from '@/stores/searchHistory'
import { SearchControls } from '../components/SearchControls'
import { SearchIdle } from '../components/SearchIdle'
import { SearchResults } from '../components/SearchResults'
import { SuggestionList } from '../components/SuggestionList'
import { useDebounced, useSearch, useSuggestions, useTrendingQueries } from '../hooks/useSearch'
import { FILTER_PARAMS, type FilterParam } from '../searchConfig'

/**
 * Pencarian katalog · FR-SRCH-01 sampai FR-SRCH-05.
 *
 * **Seluruh keadaan ada di URL** — kueri, urutan, dan tiga saringan. Itu yang
 * membuat hasil bisa dibagikan dan tombol kembali peramban memulihkan pencarian
 * sebelumnya (FR-SRCH-04). Kolomnya tetap terasa seketika karena yang tertunda
 * hanya permintaannya, bukan ketikannya; penulisan URL memakai `replace` supaya
 * tiap huruf tidak menumpuk jadi satu entri riwayat peramban.
 *
 * Riwayat pencarian dicatat saat pengguna **benar-benar mencari** — Enter,
 * saran, riwayat, pil, atau tag — bukan pada tiap ketikan yang berhenti 300 ms.
 */
export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const sort = params.get('sort') ?? 'relevan'
  const filters = Object.fromEntries(
    FILTER_PARAMS.map((param) => [param, params.get(param) ?? '']),
  ) as Record<FilterParam, string>

  const debounced = useDebounced(query)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const search = useSearch(debounced, {
    sort: sort as SearchParams['sort'],
    ...(filters.genre ? { genre: filters.genre as NonNullable<SearchParams['genre']> } : {}),
    ...(filters.status ? { status: filters.status as NonNullable<SearchParams['status']> } : {}),
    ...(filters.lang ? { language: filters.lang } : {}),
  })
  const suggestions = useSuggestions(debounced, showSuggestions)
  const trending = useTrendingQueries()
  const remember = useSearchHistory((s) => s.remember)
  const goBack = useBackNavigation('/')
  const sentinel = useRef<HTMLDivElement>(null)

  const typed = query.trim()
  const settled = debounced.trim()
  const idle = typed.length < SEARCH_MIN_CHARS
  const hasFilters = FILTER_PARAMS.some((param) => filters[param])

  const pages = search.data?.pages ?? []
  const first = pages[0]
  const stories = pages.flatMap((page) => page.stories)
  const nothing =
    first !== undefined &&
    stories.length === 0 &&
    first.authors.length === 0 &&
    first.tags.length === 0

  const fetchNext = search.fetchNextPage
  const canFetch = search.hasNextPage && !search.isFetchingNextPage
  useEffect(() => {
    const node = sentinel.current
    if (!node || !canFetch) return

    return onVisible(node, () => void fetchNext())
  }, [canFetch, fetchNext])

  /** Menulis ke URL; nilai kosong dihapus supaya alamatnya tetap terbaca. */
  function patch(next: Record<string, string>, replace = true) {
    setParams(
      (current) => {
        const draft = new URLSearchParams(current)
        for (const [key, value] of Object.entries(next)) {
          if (value) draft.set(key, value)
          else draft.delete(key)
        }
        return draft
      },
      { replace },
    )
  }

  /** Satu pintu untuk semua cara "benar-benar mencari". */
  function run(next: string) {
    patch({ q: next }, false)
    remember(next)
    setShowSuggestions(false)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    setShowSuggestions(false)
    if (typed.length >= SEARCH_MIN_CHARS) remember(typed)
  }

  return (
    <div>
      <form onSubmit={submit} className="mb-4 flex items-center gap-2">
        <IconButton label={t('action.back')} size="sm" onClick={goBack}>
          <ChevronLeft size={18} />
        </IconButton>
        <div className="flex-1">
          <SearchInput
            label={t('search.title')}
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(next) => {
              patch({ q: next })
              setShowSuggestions(true)
            }}
            autoFocus
          />
        </div>
      </form>

      {!idle && showSuggestions && (
        <SuggestionList suggestions={suggestions.data ?? []} onPick={run} />
      )}

      {!idle && <SearchControls sort={sort} filters={filters} onChange={patch} />}

      {idle && <SearchIdle typed={typed} trending={trending.data ?? []} onPick={run} />}

      {!idle && search.isFetching && !first && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {/* Gagal memuat ditangani terpisah dari "tidak ada hasil" (FR-CORE-03):
          keduanya terlihat mirip di layar dan artinya berlawanan. */}
      {!idle && search.isError && (
        <FailureNotice
          level="inset"
          title={t('failure.genericTitle')}
          body={t('failure.genericBody')}
          safety={t('failure.genericSafe')}
          onRetry={() => void search.refetch()}
        />
      )}

      {/* Kosong karena saringan ditawari jalan keluarnya lebih dulu: kuerinya
          sendiri mungkin sudah benar (FR-SRCH-05). */}
      {!idle && nothing && !search.isError && hasFilters && (
        <EmptyState
          variant="no-results"
          title={t('search.emptyByFilter')}
          description={t('search.emptyByFilterBody')}
          action={{
            label: t('action.clearFilters'),
            onClick: () => patch(Object.fromEntries(FILTER_PARAMS.map((p) => [p, '']))),
          }}
        />
      )}

      {!idle && nothing && !search.isError && !hasFilters && (
        <EmptyState
          variant="no-results"
          title={t('search.emptyTitle')(settled)}
          description={t('search.emptyBody')}
          {...(first?.didYouMean
            ? {
                action: {
                  label: t('search.didYouMean')(first.didYouMean),
                  onClick: () => run(first.didYouMean ?? ''),
                },
              }
            : {})}
          secondary={
            <Link to="/jelajah/populer" className="font-semibold text-nv-accent underline">
              {t('search.browsePopular')}
            </Link>
          }
        />
      )}

      {!idle && first && !nothing && (
        <SearchResults result={first} stories={stories} onPickTag={run} />
      )}

      {!idle && search.hasNextPage && (
        <div ref={sentinel} className="space-y-2 pt-2">
          <Skeleton className="h-24" />
          <Button variant="secondary" block onClick={() => void search.fetchNextPage()}>
            {t('search.loadMore')}
          </Button>
        </div>
      )}
    </div>
  )
}

import { ChevronDown, Compass } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import type { LibraryItem, LibraryParams } from '@/api/contracts'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchInput } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
import { LibraryCard } from '../components/LibraryCard'
import {
  useRemoveFromLibrary,
  useShelf,
  useShelfSummary,
  useToggleNotify,
  useUndoRemove,
} from '../hooks/useShelf'

const PAGE_SIZE = 20

/** "Urungkan" perlu waktu untuk dibaca **dan** ditekan — 2,6 detik tidak cukup. */
const UNDO_MS = 6_000

const TABS = [
  { id: 'all', label: t('library.tabAll') },
  { id: 'reading', label: t('library.tabReading') },
  { id: 'finished', label: t('library.tabFinished') },
  { id: 'not-started', label: t('library.tabNotStarted') },
] as const

const SORTS = [
  { value: 'saved', label: t('library.sortSaved') },
  { value: 'updated', label: t('library.sortUpdated') },
  { value: 'az', label: t('library.sortAz') },
  { value: 'rating', label: t('library.sortRating') },
]

/**
 * Perpustakaan · FR-LIB-01..09 · FR-LIB-11 · FR-LIB-12.
 *
 * Tab, kueri, dan urutan seluruhnya hidup di URL dan **setiap perubahan meminta
 * ulang ke server**. Prototipe menyaring kartu yang kebetulan ada di DOM, jadi
 * cerita ke-43 tidak pernah ikut tersaring apa pun saringannya.
 *
 * **Dua keadaan kosong yang berbeda** (FR-CORE-02): rak yang benar-benar kosong
 * mendapat ajakan, saringan yang tidak menemukan apa pun mendapat jalan keluar.
 * Menyamakan keduanya berarti menyambut pengguna hari pertama dengan pesan
 * kegagalan pencarian.
 */
export default function LibraryPage() {
  const [params, setParams] = useSearchParams()
  const toast = useToast()

  const q = params.get('q') ?? ''
  const state = (TABS.find((tab) => tab.id === params.get('state')) ?? TABS[0]).id
  const sort = (SORTS.find((option) => option.value === params.get('sort')) ?? SORTS[0])
    ?.value as LibraryParams['sort']
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1)

  const summary = useShelfSummary()
  const shelf = useShelf({ page: 1, pageSize: page * PAGE_SIZE, state, sort, q } as LibraryParams)

  const toggleNotify = useToggleNotify()
  const remove = useRemoveFromLibrary()
  const undo = useUndoRemove()

  function patch(next: Record<string, string | null>) {
    const search = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === '') search.delete(key)
      else search.set(key, value)
    }
    setParams(search, { replace: true })
  }

  function onToggleNotify(item: LibraryItem) {
    toggleNotify.mutate(item.story.id)
    toast.show(item.notify ? t('library.notifyToastOff') : t('library.notifyToastOn'))
  }

  function onRemove(item: LibraryItem) {
    remove.mutate(item.story.id)
    toast.show(t('library.removed')(item.story.title), {
      durationMs: UNDO_MS,
      action: {
        label: t('library.undo'),
        onClick: () => {
          undo.mutate(item.story.id)
          toast.show(t('library.restored'), { tone: 'success' })
        },
      },
    })
  }

  const stats = [
    { label: t('library.statSaved'), value: summary.data?.saved ?? 0 },
    { label: t('library.statReading'), value: summary.data?.reading ?? 0 },
    { label: t('library.statDone'), value: summary.data?.done ?? 0 },
    { label: t('library.statNew'), value: summary.data?.fresh ?? 0 },
  ]

  // Rak benar-benar kosong dibaca dari **ringkasan**, bukan dari daftar yang
  // sedang tampil: daftar kosong karena saringan bukan rak kosong.
  const shelfIsEmpty = summary.isSuccess && summary.data.saved === 0
  const filtered = q !== '' || state !== 'all'

  return (
    <div className="mx-auto w-full max-w-3xl pb-10">
      {/*
        `7c` menghapus empat kartu metrik dan blok hero: yang tersisa judul,
        satu baris hitungan, lalu daftarnya. Angkanya **tidak hilang** — ia
        pindah ke baris hitungan, dan tetap dibaca dari ringkasan supaya nol
        tetap tampil saat rak kosong (FR-LIB-12).
      */}
      <header className="px-4 pt-4">
        <h1 className="font-display text-page font-semibold text-nv-text">{t('library.title')}</h1>
        {/*
          Satu baris, tetapi **tetap `<dl>` dengan empat pasang `<dt>`/`<dd>`**.
          Menggabungnya jadi satu string memang terlihat sama, dan itu justru
          masalahnya: pembaca layar kehilangan pasangan label–angkanya, dan
          empat assertion yang menjaga urutan FR-LIB-02 ikut kehilangan
          pegangannya.
        */}
        <dl className="flex flex-wrap items-baseline gap-x-3 pt-0.5 text-body text-nv-muted">
          {stats.map((stat) => (
            <div key={stat.label} className="inline-flex items-baseline gap-1.5">
              <dd className="font-semibold text-nv-text tabular-nums">{stat.value}</dd>
              <dt>{stat.label}</dt>
            </div>
          ))}
        </dl>
      </header>

      {shelfIsEmpty ? (
        <div className="px-4 pt-6">
          <EmptyState
            icon={<Compass size={28} />}
            title={t('library.emptyTitle')}
            description={t('library.emptyBody')}
            secondary={
              <Link to="/jelajah/populer" className="text-body text-nv-accent underline">
                {t('library.emptyPopular')}
              </Link>
            }
          />
          <Link
            to="/"
            className="mx-auto mt-3 flex h-11 w-fit items-center rounded-nv-pill bg-nv-accent px-5 font-semibold text-body text-nv-card"
          >
            {t('library.emptyAction')}
          </Link>
        </div>
      ) : (
        <>
          <div className="px-4 pt-4">
            <SearchInput
              label={t('library.search')}
              value={q}
              onChange={(value) => patch({ q: value, page: null })}
              placeholder={t('library.search')}
              variant="box"
            />
          </div>

          {/* `fieldset` + `legend`, bukan `div role="group"`: empat tombol
              saringan memang satu kelompok kontrol, dan elemen aslinya sudah
              membawa peran itu tanpa ARIA. */}
          <fieldset className="mx-4 flex gap-5 overflow-x-auto border-nv-line border-b border-0 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <legend className="sr-only">{t('library.filtersLabel')}</legend>
            {TABS.map((tab) => {
              const on = tab.id === state
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => patch({ state: tab.id === 'all' ? null : tab.id, page: null })}
                  className={cx(
                    '-mb-px shrink-0 border-b-2 px-0.5 pt-1 pb-2.5 text-body transition',
                    on
                      ? 'border-nv-accent font-bold text-nv-text'
                      : 'border-transparent font-medium text-nv-muted hover:text-nv-text-2',
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </fieldset>

          <div className="flex items-center justify-between gap-3 px-4 pt-3">
            {/* Penghitung menampilkan hasil yang **terlihat**, bukan total
                koleksi — itu tugas ringkasan di atas (FR-LIB-06). */}
            <p className="text-caption text-nv-muted tabular-nums">
              {t('library.count')(shelf.data?.total ?? 0)}
            </p>
            {/* Satu baris: label pengurut ada di `aria-label`, bukan dicetak di
                atasnya — `7c` menaruhnya sebagai aksi, bukan sebagai kolom. */}
            <span className="relative inline-flex shrink-0 items-center gap-1 font-bold text-caption text-nv-text">
              {SORTS.find((s) => s.value === sort)?.label ?? SORTS[0]?.label}
              <ChevronDown size={12} aria-hidden />
              <select
                aria-label={t('library.sortLabel')}
                value={sort}
                onChange={(event) => patch({ sort: event.target.value, page: null })}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </span>
          </div>

          <div className="px-4 pt-2">
            <AsyncState
              loading={shelf.isPending}
              error={shelf.error}
              data={shelf.data}
              isEmpty={(data) => data.items.length === 0}
              onRetry={() => void shelf.refetch()}
              empty={{
                variant: 'no-results',
                title: t('library.noResultsTitle'),
                description: t('library.noResultsBody'),
                ...(filtered
                  ? {
                      action: {
                        label: t('library.clearFilters'),
                        onClick: () => patch({ q: null, state: null, page: null }),
                      },
                    }
                  : {}),
              }}
            >
              {(data) => (
                <>
                  <ul className="divide-y divide-nv-line">
                    {data.items.map((item) => (
                      <LibraryCard
                        key={item.story.id}
                        item={item}
                        onToggleNotify={onToggleNotify}
                        onRemove={onRemove}
                      />
                    ))}
                  </ul>

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
          </div>
        </>
      )}
    </div>
  )
}

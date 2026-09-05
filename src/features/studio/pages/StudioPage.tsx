import { Compass, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import type {
  PrintOrderInput,
  ScheduleStoryInput,
  StudioParams,
  StudioStory,
} from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { FilterableList } from '@/components/patterns/FilterableList'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { formatCompactCoin } from '@/lib/coin'
import { cx } from '@/lib/cx'
import { formatDateTime } from '@/lib/format'
import { PrintSheet } from '../components/PrintSheet'
import { ScheduleSheet } from '../components/ScheduleSheet'
import { StudioCard } from '../components/StudioCard'
import {
  useAuthorProfile,
  useCreatePrintOrder,
  useDeleteStory,
  useMyStories,
  useScheduleStory,
  useStudioSummary,
} from '../hooks/useAuthorProfile'

const PAGE_SIZE = 20

/**
 * Delapan tab, bukan enam · FR-STUDIO-03 + FR-STUDIO-38.
 *
 * PRD menyebut enam; FR-STUDIO-38 menambahkan dua status tinjauan yang
 * *"melengkapi lima status cerita yang sudah ada"*. Tanpa keduanya, cerita yang
 * ditolak tidak punya satu pun saringan yang menampilkannya.
 */
const TABS = [
  { value: 'all', label: t('studio.tabAll') },
  { value: 'draft', label: t('studio.stDraft') },
  { value: 'in_review', label: t('studio.stInReview') },
  { value: 'rejected', label: t('studio.stRejected') },
  { value: 'scheduled', label: t('studio.stScheduled') },
  { value: 'published', label: t('studio.stPublished') },
  { value: 'completed', label: t('studio.stCompleted') },
  { value: 'archived', label: t('studio.stArchived') },
] as const

const SORTS = [
  { value: 'updated', label: t('studio.sortUpdated') },
  { value: 'popular', label: t('studio.sortPopular') },
  { value: 'az', label: t('studio.sortAz') },
]

/**
 * Author Studio · FR-STUDIO-01..06 · FR-STUDIO-33 · FR-EARN-10.
 *
 * Tiga keadaan yang berbeda, dan menyamakannya adalah cacat prototipe yang
 * ditutup di sini:
 *
 * 1. **Belum mendaftar penulis** → ajakan menjadi penulis, bukan daftar kosong.
 * 2. **Sudah mendaftar, belum menulis apa pun** → ajakan membuat cerita pertama.
 * 3. **Saringan tidak menemukan apa pun** → jalan keluar dari saringannya.
 */
export default function StudioPage() {
  const [params, setParams] = useSearchParams()
  const toast = useToast()

  const q = params.get('q') ?? ''
  const status = (TABS.find((tab) => tab.value === params.get('tab')) ?? TABS[0]).value
  const sort = (SORTS.find((s) => s.value === params.get('sort')) ?? SORTS[0])
    ?.value as StudioParams['sort']
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1)

  const profile = useAuthorProfile()
  const summary = useStudioSummary()
  const stories = useMyStories({
    page: 1,
    pageSize: page * PAGE_SIZE,
    status,
    sort,
    q,
  } as StudioParams)

  const schedule = useScheduleStory()
  const print = useCreatePrintOrder()
  const remove = useDeleteStory()

  const [scheduling, setScheduling] = useState<StudioStory | null>(null)
  const [printing, setPrinting] = useState<StudioStory | null>(null)

  function patch(next: Record<string, string | null>) {
    const search = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === '') search.delete(key)
      else search.set(key, value)
    }
    setParams(search, { replace: true })
  }

  async function onDelete(item: StudioStory) {
    if (!window.confirm(t('studio.deleteConfirm')(item.story.title))) return
    try {
      await remove.mutateAsync(item.story.id)
      toast.show(t('studio.deleted')(item.story.title))
    } catch (error) {
      // Cerita terbit yang babnya sudah dibeli ditolak server, dan alasannya
      // konkret — jumlah bab yang sudah dibayar pembaca.
      toast.show(isApiError(error) ? error.message : t('failure.genericTitle'), {
        tone: 'danger',
      })
    }
  }

  async function onSchedule(input: ScheduleStoryInput) {
    const saved = await schedule.mutateAsync(input)
    setScheduling(null)
    toast.show(
      t('studio.schedSaved')(
        saved.scheduledAt
          ? formatDateTime(new Date(saved.scheduledAt))
          : `${input.date} ${input.time}`,
      ),
      { tone: 'success' },
    )
  }

  async function onPrint(input: PrintOrderInput) {
    const order = await print.mutateAsync(input)
    if (input.kind === 'hard') toast.show(t('studio.orderPlaced')(order.id), { tone: 'success' })
    return order
  }

  const notRegistered = profile.isSuccess && profile.data.tier === 'none'
  const noStories = summary.isSuccess && summary.data.stories === 0
  const filtered = q !== '' || status !== 'all'

  if (notRegistered) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-10">
        <EmptyState
          icon={<Compass size={28} />}
          title={t('studio.joinTitle')}
          description={t('studio.joinBody')}
          secondary={
            <Link to="/bantuan" className="text-body text-nv-accent underline">
              {t('studio.printHistory')}
            </Link>
          }
        />
        <Link
          to="/karya/daftar-penulis"
          className="mx-auto mt-3 flex h-11 w-fit items-center rounded-nv-pill bg-nv-accent px-5 font-semibold text-body text-nv-card"
        >
          {t('studio.joinAction')}
        </Link>
      </div>
    )
  }

  const stats: Array<{ label: string; value: number; to: string | null; gold?: boolean }> = [
    { label: t('studio.statStories'), value: summary.data?.stories ?? 0, to: null },
    { label: t('studio.statViews'), value: summary.data?.views ?? 0, to: null },
    { label: t('studio.statSubs'), value: summary.data?.subs ?? 0, to: null },
    // Metrik Coins **adalah tautan** ke analitik penulis (FR-EARN-10): ujung
    // rantai kerja penulis tidak boleh cuma dijangkau lewat halaman bantuan.
    {
      label: t('studio.statCoins'),
      value: summary.data?.coins ?? 0,
      to: '/penulis/analitik',
      gold: true,
    },
  ]

  return (
    <div className="mx-auto w-full max-w-3xl pb-10">
      <header className="px-4 pt-4">
        <h1 className="font-display text-title font-bold text-nv-text">{t('studio.title')}</h1>
        <p className="pt-1 text-body text-nv-muted">{t('studio.subtitle')}</p>
      </header>

      {/*
        Strip empat sel di atas **satu panel putih**, bukan empat kotak abu
        terpisah (`7j`). Angkanya serif, labelnya 9,5px huruf besar — pola yang
        sama dengan strip detail cerita dan profil, jadi pembaca mengenalinya
        sebagai "angka tentang sesuatu", bukan sebagai empat kartu.
      */}
      <dl className="mx-4 mt-4 grid grid-cols-4 gap-x-2 rounded-nv-lg bg-nv-card p-4">
        {stats.map((stat) => {
          const body = (
            <>
              <dd
                className={cx(
                  'font-display font-bold text-section tabular-nums',
                  // **Koin emas**, sisanya tinta. Emas dijatah untuk uang
                  // (brief §6); memakainya untuk keempatnya menghapus artinya.
                  stat.gold ? 'text-nv-gold' : 'text-nv-text',
                )}
              >
                {formatCompactCoin(stat.value)}
              </dd>
              <dt className="nv-section-label pt-1">{stat.label}</dt>
            </>
          )
          return stat.to ? (
            <Link key={stat.label} to={stat.to} className="block">
              {body}
            </Link>
          ) : (
            <div key={stat.label}>{body}</div>
          )
        })}
      </dl>

      {/* Aksi utama **selebar halaman**, di bawah angkanya (`7j`): studio dibuka
          untuk menulis, dan tombolnya tidak boleh jadi pil kecil di pojok. */}
      <div className="px-4 pt-4">
        <Link
          to="/karya/baru"
          className="flex h-13 w-full items-center justify-center gap-2 rounded-nv-pill bg-nv-accent font-bold text-card text-nv-card"
        >
          <Plus size={18} aria-hidden />
          {t('studio.newStory')}
        </Link>
      </div>

      {/* Tautan cepat jadi **pil garis rambut**, bukan teks bergaris bawah:
          empat tautan bergaris bawah berjajar terbaca sebagai satu kalimat
          yang rusak. */}
      <nav className="flex flex-wrap gap-2 px-4 pt-3">
        {[
          // Label **pendek** (`7j`): "Riwayat Cetak PDF & Hardcopy" memakan
          // satu baris penuh sendirian di 390px, dan empat pil yang
          // masing-masing sebaris berhenti terbaca sebagai satu deret.
          ['/penulis/analitik', t('studio.navEarnings')],
          ['/karya/jadwal', t('studio.navSchedule')],
          ['/karya/tinjauan', t('studio.navReview')],
          ['/karya/cetak', t('studio.navPrint')],
        ].map(([to, label]) => (
          <Link
            key={to}
            to={to as string}
            className="flex h-11 items-center rounded-nv-pill border border-nv-line-soft px-4 text-body font-semibold"
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-4 pt-4">
        {noStories ? (
          <div className="pt-2">
            <EmptyState
              title={t('studio.emptyTitle')}
              description={t('studio.emptyBody')}
              secondary={
                <Link to="/karya/baru" className="text-body text-nv-accent underline">
                  {t('studio.newStory')}
                </Link>
              }
            />
          </div>
        ) : (
          <>
            {/* Pola bersama, bukan kontrol tangan-sendiri: cari + tab + urut +
              penghitung + sembunyi-saat-kosong sudah dibangun di Fase 1, dan
              saringannya hidup di URL sehingga tombol back mengembalikan hasil. */}
            <FilterableList
              noun="story"
              total={stories.data?.total ?? 0}
              shown={stories.data?.items.length ?? 0}
              tabs={TABS}
              tabsLabel={t('studio.tabsLabel')}
              sorts={SORTS}
              searchLabel={t('studio.search')}
              searchPlaceholder={t('studio.search')}
            >
              <AsyncState
                loading={stories.isPending}
                error={stories.error}
                data={stories.data}
                isEmpty={(data) => data.items.length === 0}
                onRetry={() => void stories.refetch()}
                empty={{
                  variant: 'no-results',
                  title: t('studio.noResultsTitle'),
                  description: t('studio.noResultsBody'),
                  ...(filtered
                    ? {
                        action: {
                          label: t('studio.clearFilters'),
                          onClick: () => patch({ q: null, status: null, page: null }),
                        },
                      }
                    : {}),
                }}
              >
                {(data) => (
                  <>
                    {/* **Daftar berpembatas, bukan tumpukan kartu** (`7j`, brief §4).
                        Kartu putih per cerita membuat delapan karya terlihat
                        sebagai delapan objek terpisah; yang dicari penulis
                        adalah satu daftar yang bisa dipindai. */}
                    <ul className="divide-y divide-nv-line">
                      {data.items.map((item) => (
                        <li key={item.story.id}>
                          <StudioCard
                            item={item}
                            onSchedule={setScheduling}
                            onPrint={setPrinting}
                            onDelete={(story) => void onDelete(story)}
                          />
                        </li>
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
            </FilterableList>

            <p className="pt-3 text-caption text-nv-muted">{t('studio.schedulerNote')}</p>
          </>
        )}
      </div>

      <ScheduleSheet
        item={scheduling}
        onClose={() => setScheduling(null)}
        onSave={(input) => void onSchedule(input)}
        saving={schedule.isPending}
      />
      <PrintSheet
        item={printing}
        onClose={() => setPrinting(null)}
        onSubmit={onPrint}
        submitting={print.isPending}
      />
    </div>
  )
}

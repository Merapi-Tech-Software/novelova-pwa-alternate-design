import { useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import type { AnalyticsPoint, ChapterPerf, PerfSort, StoryAnalytics } from '@/api/contracts'
import { AnalyticsRangeSchema, PerfSortSchema } from '@/api/contracts'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Sheet } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { todayLocalISO } from '@/lib/date'
import { formatNumber } from '@/lib/format'
import { useStoryAnalytics } from '../hooks/useAnalytics'

const RANGES = [
  { value: '7h', label: t('analytics.r7h') },
  { value: '30h', label: t('analytics.r30h') },
  { value: '3b', label: t('analytics.r3b') },
  { value: '1t', label: t('analytics.r1t') },
  { value: 'custom', label: t('analytics.rCustom') },
] as const

const SORTS = [
  { value: 'views', label: t('analytics.sViews') },
  { value: 'comments', label: t('analytics.sComments') },
  { value: 'purchases', label: t('analytics.sPurchases') },
  { value: 'rating', label: t('analytics.sRating') },
  { value: 'newest', label: t('analytics.sNewest') },
] as const

const METRIC_LABEL = {
  views: t('analytics.mViews'),
  readers: t('analytics.mReaders'),
  comments: t('analytics.mComments'),
  revenue: t('analytics.mRevenue'),
} as const

/** Satu garis grafik dari deret harian — dua lapisan berbagi sumbu yang sama. */
function polyline(points: AnalyticsPoint[], key: 'views' | 'newReaders', max: number): string {
  if (points.length === 0) return ''
  const step = points.length === 1 ? 0 : 300 / (points.length - 1)
  return points
    .map((p, i) => `${(i * step).toFixed(1)},${(110 - (p[key] / max) * 100).toFixed(1)}`)
    .join(' ')
}

/**
 * Kartu pencapaian · FR-STUDIO-31. Digambar di `<canvas>` lalu diunduh sebagai
 * PNG — berkas **nyata** dari klien, bukan toast yang berpura-pura (PRD 07 §7
 * #11). Tidak perlu server sama sekali: seluruh angkanya sudah ada di layar.
 */
function downloadCard(data: StoryAnalytics): void {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1080
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Warna diambil dari **nilai terhitung badan halaman**, bukan ditulis di sini:
  // satu hex di berkas ini melanggar aturan token (§4.1), dan kartunya ikut tema
  // gelap tanpa kode tambahan.
  const page = getComputedStyle(document.body)
  const ink = page.color
  ctx.fillStyle = page.backgroundColor
  ctx.fillRect(0, 0, 1080, 1080)
  ctx.fillStyle = ink
  ctx.font = '48px Georgia, serif'
  ctx.fillText(data.storyTitle.slice(0, 28), 80, 200)
  ctx.font = '28px system-ui, sans-serif'
  ctx.fillText(data.rangeLabel, 80, 260)

  data.metrics.forEach((metric, i) => {
    const y = 420 + i * 140
    ctx.font = '26px system-ui, sans-serif'
    ctx.fillText(METRIC_LABEL[metric.key], 80, y)
    ctx.font = '64px Georgia, serif'
    ctx.fillText(formatNumber(metric.value), 80, y + 70)
  })

  const link = document.createElement('a')
  link.download = `novelova-${data.storyId}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export default function AnalyticsPage() {
  const { storyId = '' } = useParams()
  const [search, setSearch] = useSearchParams()
  const toast = useToast()

  const today = todayLocalISO()
  const range = AnalyticsRangeSchema.catch('7h').parse(search.get('rentang'))
  const chapterSort = PerfSortSchema.catch('views').parse(search.get('urut'))
  // Nilai awal panel custom adalah **hari ini**, dan `max` menutup masa depan —
  // rentang yang belum terjadi tidak punya angka untuk ditampilkan.
  const from = search.get('dari') ?? today
  const to = search.get('sampai') ?? today

  const analytics = useStoryAnalytics(storyId, {
    range,
    from: range === 'custom' ? from : null,
    to: range === 'custom' ? to : null,
    chapterSort,
  })

  const [layers, setLayers] = useState({ views: true, readers: true })
  const [openChapter, setOpenChapter] = useState<ChapterPerf | null>(null)
  const sections = useRef<Record<string, HTMLElement | null>>({})

  function patch(next: Record<string, string>) {
    const params = new URLSearchParams(search)
    for (const [key, value] of Object.entries(next)) params.set(key, value)
    setSearch(params, { replace: true })
  }

  /**
   * Menekan kartu metrik **menggulir mulus** ke bagiannya · FR-STUDIO-27 —
   * bukan lompatan jangkar yang membuat penulis kehilangan posisinya.
   */
  function jumpTo(target: string) {
    sections.current[target]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /**
   * Mematikan lapisan terakhir ditolak — dan **alasannya dikatakan**.
   * Prototipe membiarkan keduanya mati sekaligus (PRD 07 §7 #10), yang
   * menghasilkan kotak kosong tanpa satu pun penjelasan.
   */
  function toggleLayer(key: 'views' | 'readers') {
    const next = { ...layers, [key]: !layers[key] }
    if (!next.views && !next.readers) {
      toast.show(t('analytics.lastLayer'))
      return
    }
    setLayers(next)
  }

  const data = analytics.data
  const maxViews = useMemo(
    () => Math.max(1, ...(data?.series ?? []).map((p) => Math.max(p.views, p.newReaders))),
    [data],
  )

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-10">
      {/* Judul dan tombol kembali sudah dirender `TopBarLayout`. */}
      <p className="text-body text-nv-muted">
        {data ? t('analytics.subtitle')(data.storyTitle, data.rangeLabel) : ''}
      </p>

      <fieldset className="flex gap-2 overflow-x-auto pt-3">
        <legend className="sr-only">{t('analytics.rangeLabel')}</legend>
        {RANGES.map((option) => (
          <Chip
            key={option.value}
            selected={range === option.value}
            onClick={() => patch({ rentang: option.value })}
          >
            {option.label}
          </Chip>
        ))}
      </fieldset>

      {range === 'custom' && (
        <div className="pt-3">
          <div className="flex flex-wrap gap-2">
            <label className="flex-1 text-caption text-nv-muted">
              {t('analytics.from')}
              <input
                type="date"
                className="mt-1 h-11 w-full rounded-nv-md border border-nv-line bg-nv-card px-3 text-body text-nv-text"
                value={from}
                max={today}
                onChange={(e) => patch({ dari: e.target.value })}
              />
            </label>
            <label className="flex-1 text-caption text-nv-muted">
              {t('analytics.to')}
              <input
                type="date"
                className="mt-1 h-11 w-full rounded-nv-md border border-nv-line bg-nv-card px-3 text-body text-nv-text"
                value={to}
                max={today}
                onChange={(e) => patch({ sampai: e.target.value })}
              />
            </label>
          </div>
          <p className="pt-1 text-caption text-nv-muted">{t('analytics.customNote')}</p>
        </div>
      )}

      <AsyncState
        loading={analytics.isPending}
        error={analytics.error}
        data={data}
        onRetry={() => void analytics.refetch()}
        empty={{ title: t('analytics.emptyTitle'), description: t('analytics.emptyBody') }}
      >
        {(report) => (
          <>
            <dl className="grid grid-cols-2 gap-2 pt-4">
              {report.metrics.map((metric) => (
                <Card key={metric.key} padded={false}>
                  <button
                    type="button"
                    className="w-full rounded-nv-md p-3 text-left"
                    onClick={() => jumpTo(metric.target)}
                  >
                    <dt className="text-caption tracking-widest text-nv-muted uppercase">
                      {METRIC_LABEL[metric.key]}
                    </dt>
                    <dd className="pt-0.5 font-display text-page tabular-nums">
                      {formatNumber(metric.value)}
                    </dd>
                    <dd
                      className={
                        metric.changePct < 0
                          ? 'text-caption text-nv-danger'
                          : 'text-caption text-nv-accent-strong'
                      }
                    >
                      {t('analytics.change')(metric.changePct)}
                    </dd>
                    <span className="sr-only">{t('analytics.jump')(METRIC_LABEL[metric.key])}</span>
                  </button>
                </Card>
              ))}
            </dl>

            <section
              ref={(el) => {
                sections.current.tren = el
              }}
              className="scroll-mt-20 pt-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-section">{t('analytics.trend')}</h2>
                <fieldset className="flex gap-2">
                  <legend className="sr-only">{t('analytics.layersLabel')}</legend>
                  <Chip selected={layers.views} onClick={() => toggleLayer('views')}>
                    {t('analytics.layerViews')}
                  </Chip>
                  <Chip selected={layers.readers} onClick={() => toggleLayer('readers')}>
                    {t('analytics.layerReaders')}
                  </Chip>
                </fieldset>
              </div>

              <Card className="mt-2 p-3">
                <svg
                  viewBox="0 0 300 120"
                  className="h-32 w-full overflow-visible"
                  role="img"
                  aria-label={t('analytics.chartLabel')(report.from, report.to)}
                >
                  <line x1="0" y1="110" x2="300" y2="110" className="stroke-nv-line" />
                  <line
                    x1="0"
                    y1="60"
                    x2="300"
                    y2="60"
                    className="stroke-nv-line"
                    strokeDasharray="3 4"
                  />
                  {layers.views && (
                    <polyline
                      points={polyline(report.series, 'views', maxViews)}
                      fill="none"
                      className="stroke-nv-accent"
                      strokeWidth="1.6"
                    />
                  )}
                  {layers.readers && (
                    <polyline
                      points={polyline(report.series, 'newReaders', maxViews)}
                      fill="none"
                      className="stroke-nv-muted"
                      strokeWidth="1.6"
                      strokeDasharray="4 3"
                    />
                  )}
                </svg>
                <div className="flex justify-between pt-1 text-caption text-nv-muted tabular-nums">
                  <span>{report.from}</span>
                  <span>{report.to}</span>
                </div>
              </Card>
            </section>

            <section className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-section">{t('analytics.perf')}</h2>
                <label className="text-caption text-nv-muted">
                  <span className="sr-only">{t('analytics.sortLabel')}</span>
                  <select
                    className="h-11 rounded-nv-pill border border-nv-line bg-nv-card px-3 text-body text-nv-text"
                    value={chapterSort}
                    onChange={(e) => patch({ urut: e.target.value as PerfSort })}
                  >
                    {SORTS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {report.chapters.length === 0 ? (
                <EmptyState
                  title={t('analytics.emptyTitle')}
                  description={t('analytics.emptyBody')}
                  className="mt-3"
                />
              ) : (
                <ol className="pt-1">
                  {report.chapters.map((chapter, i) => (
                    <li key={chapter.chapterId}>
                      <button
                        type="button"
                        className="w-full border-nv-line border-b py-3 text-left"
                        onClick={() => setOpenChapter(chapter)}
                      >
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-display text-nv-muted text-sm tabular-nums">
                            {t('analytics.rank')(i + 1)}
                          </span>
                          <span
                            className={
                              chapter.badge === 'drop'
                                ? 'rounded-nv-pill border border-nv-danger px-2 py-0.5 text-caption text-nv-danger'
                                : 'rounded-nv-pill border border-nv-line px-2 py-0.5 text-caption text-nv-muted tabular-nums'
                            }
                          >
                            {chapter.badge === 'drop'
                              ? t('analytics.badgeDrop')
                              : chapter.badge === 'free'
                                ? t('analytics.badgeFree')
                                : t('analytics.badgePrice')(chapter.priceCoins)}
                          </span>
                        </span>
                        <span className="block pt-1 font-medium text-body">
                          {chapter.number}. {chapter.title}
                        </span>
                        <span className="block pt-0.5 text-caption text-nv-muted tabular-nums">
                          {t('analytics.chapterMeta')(
                            chapter.views,
                            chapter.comments,
                            chapter.purchases,
                          )}
                        </span>
                        <span className="block pt-0.5 text-caption text-nv-accent-strong">
                          {chapter.note}
                        </span>
                        {/* Batang skor relatif · FR-STUDIO-29. */}
                        <span className="mt-2 block h-1 rounded-nv-pill bg-nv-line">
                          <span
                            className="block h-1 rounded-nv-pill bg-nv-accent"
                            style={{ width: `${chapter.score}%` }}
                          />
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <div className="grid gap-3 pt-6 sm:grid-cols-2">
              <section
                ref={(el) => {
                  sections.current.sentimen = el
                }}
                className="scroll-mt-20"
              >
                <Card className="h-full p-3">
                  <h2 className="text-caption tracking-widest text-nv-muted uppercase">
                    {t('analytics.sentiment')}
                  </h2>
                  {(
                    [
                      [t('analytics.positive'), report.sentiment.positive],
                      [t('analytics.neutral'), report.sentiment.neutral],
                      [t('analytics.negative'), report.sentiment.negative],
                    ] as const
                  ).map(([label, value]) => (
                    <p key={label} className="flex justify-between pt-1 text-body tabular-nums">
                      <span>{label}</span>
                      <span>{value}%</span>
                    </p>
                  ))}
                  <p className="pt-2 text-caption text-nv-muted">
                    {t('analytics.fromComments')(report.sentiment.total)}
                  </p>
                </Card>
              </section>

              <Card className="h-full p-3">
                <h2 className="text-caption tracking-widest text-nv-muted uppercase">
                  {t('analytics.origin')}
                </h2>
                {report.origin.sources.map((source) => (
                  <p
                    key={source.label}
                    className="flex justify-between pt-1 text-body tabular-nums"
                  >
                    <span>{source.label}</span>
                    <span>{source.pct}%</span>
                  </p>
                ))}
                <p className="pt-2 text-caption text-nv-muted">
                  {t('analytics.peak')(report.origin.peakHours)}
                </p>
              </Card>
            </div>

            <section
              ref={(el) => {
                sections.current.pendapatan = el
              }}
              className="scroll-mt-20 pt-6"
            >
              <h2 className="font-display text-section">{t('analytics.calendar')}</h2>
              <Card className="mt-2 p-3">
                <PublishCalendar days={report.publishDays} />
                <p className="pt-2 text-caption text-nv-muted">
                  {t('analytics.calendarNote')(report.publishDays.length)}
                </p>
              </Card>
              <p className="pt-3 text-body text-nv-muted">
                {t('analytics.bestTime')(report.bestTime.label)}
              </p>
            </section>

            <div className="flex flex-wrap gap-2 pt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  toast.show(t('analytics.exportDone'))
                  window.print()
                }}
              >
                {t('analytics.exportPdf')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  downloadCard(report)
                  toast.show(t('analytics.cardDone'))
                }}
              >
                {t('analytics.exportCard')}
              </Button>
            </div>

            <Sheet
              open={openChapter !== null}
              onClose={() => setOpenChapter(null)}
              title={openChapter ? `${openChapter.number}. ${openChapter.title}` : ''}
            >
              {openChapter && (
                <div className="space-y-2">
                  <p className="text-body text-nv-muted">
                    {t('analytics.sheetRange')(report.rangeLabel)}
                  </p>
                  <p className="text-body tabular-nums">
                    {t('analytics.chapterMeta')(
                      openChapter.views,
                      openChapter.comments,
                      openChapter.purchases,
                    )}
                  </p>
                  <p className="text-body tabular-nums">
                    {t('analytics.sheetRetention')(openChapter.retentionPct)}
                  </p>
                  <p className="text-body text-nv-accent-strong">{openChapter.note}</p>
                  <Link
                    to={`/karya/${storyId}/bab/${openChapter.chapterId}/ubah`}
                    className="inline-block text-body text-nv-accent-strong underline"
                  >
                    {t('analytics.sheetOpen')}
                  </Link>
                </div>
              )}
            </Sheet>
          </>
        )}
      </AsyncState>
    </div>
  )
}

/**
 * Kalender aktivitas publish · FR-STUDIO-30. Bulan berjalan, dan hari yang
 * pernah menerbitkan bab ditandai — diturunkan dari `publishAt`, bukan dari
 * daftar tanggal yang ditulis tangan.
 */
function PublishCalendar({ days }: { days: string[] }) {
  const now = new Date()
  const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const marked = new Set(days.map((d) => Number(d.slice(8, 10))))

  return (
    <ol className="grid grid-cols-7 gap-1">
      {Array.from({ length: total }, (_, i) => i + 1).map((day) => (
        <li
          key={day}
          className={
            marked.has(day)
              ? 'grid h-7 place-items-center rounded-nv-sm bg-nv-accent text-caption text-nv-card tabular-nums'
              : 'grid h-7 place-items-center rounded-nv-sm bg-nv-paper text-caption text-nv-muted tabular-nums'
          }
        >
          {day}
        </li>
      ))}
    </ol>
  )
}

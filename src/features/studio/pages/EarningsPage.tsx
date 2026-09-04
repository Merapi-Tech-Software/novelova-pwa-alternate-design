import { Link, useSearchParams } from 'react-router'
import { AnalyticsRangeSchema, AuthorViewpointSchema } from '@/api/contracts'
import { AsyncState } from '@/components/ui/AsyncState'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { t } from '@/i18n/t'
import { formatNumber, formatRupiah } from '@/lib/format'
import { useAuthorAnalytics, usePayoutBalance } from '../hooks/useEarnings'

const RANGES = [
  { value: '7h', label: '7H' },
  { value: '30h', label: '30H' },
  { value: '3b', label: '3B' },
  { value: '1t', label: '1T' },
] as const

const VIEWPOINTS = [
  { value: 'revenue', label: t('earnings.vRevenue'), note: t('earnings.nRevenue') },
  { value: 'retention', label: t('earnings.vRetention'), note: t('earnings.nRetention') },
  { value: 'traffic', label: t('earnings.vTraffic'), note: t('earnings.nTraffic') },
] as const

/**
 * Analitik penulis `/penulis/analitik` · FR-EARN-01..03.
 *
 * Dua cacat prototipe diperbaiki di sini sekaligus: rentang waktunya **sama
 * dengan analitik cerita** (PRD 08 §7 #5 — dua halaman analitik dengan pemilih
 * berbeda memaksa penulis belajar dua kali), dan pemilih sudut pandang
 * **benar-benar mengganti isi** (§7 #4 — di prototipe dua dari tiga sudut
 * pandang tidak pernah terlihat).
 */
export default function EarningsPage() {
  const [search, setSearch] = useSearchParams()

  // Bawaan 30 hari · FR-EARN-01. `catch` menjaga URL yang disunting tangan
  // tidak menjatuhkan halaman.
  const range = AnalyticsRangeSchema.catch('30h').parse(search.get('rentang'))
  const viewpoint = AuthorViewpointSchema.catch('revenue').parse(search.get('sudut'))

  const analytics = useAuthorAnalytics({ range, viewpoint })
  const balance = usePayoutBalance()

  function patch(key: string, value: string) {
    const params = new URLSearchParams(search)
    params.set(key, value)
    setSearch(params, { replace: true })
  }

  const note = VIEWPOINTS.find((v) => v.value === viewpoint)?.note ?? ''

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-10">
      {/* Judul dan tombol kembali ke `/karya` sudah dirender `TopBarLayout`. */}
      <p className="text-body text-nv-muted">
        {t('earnings.subtitle')(analytics.data?.rangeLabel ?? '')}
      </p>

      <fieldset className="flex gap-2 overflow-x-auto pt-3">
        <legend className="sr-only">{t('earnings.rangeLabel')}</legend>
        {RANGES.map((option) => (
          <Chip
            key={option.value}
            selected={range === option.value}
            onClick={() => patch('rentang', option.value)}
          >
            {option.label}
          </Chip>
        ))}
      </fieldset>

      <AsyncState
        loading={analytics.isPending}
        error={analytics.error}
        data={analytics.data}
        onRetry={() => void analytics.refetch()}
        empty={{ title: t('earnings.emptyTitle'), description: t('earnings.emptyBody') }}
      >
        {(report) => (
          <>
            <dl className="grid grid-cols-3 gap-2 pt-4">
              {(
                [
                  [t('earnings.kRevenue'), formatRupiah(report.kpi.revenueRupiah)],
                  [t('earnings.kReads'), formatNumber(report.kpi.reads)],
                  [t('earnings.kRating'), report.kpi.rating.toLocaleString('id-ID')],
                ] as const
              ).map(([label, value]) => (
                <Card key={label} className="p-3">
                  <dt className="text-caption tracking-widest text-nv-muted uppercase">{label}</dt>
                  <dd className="pt-0.5 font-display text-section tabular-nums">{value}</dd>
                </Card>
              ))}
            </dl>

            {/* Kurs koin → rupiah **dinyatakan terang** · PRD 08 §7 #9. Tanpa ini
                analitik memakai koin dan pencairan memakai rupiah, dan penulis
                tidak pernah tahu penghubungnya. */}
            <p className="pt-2 text-caption text-nv-muted tabular-nums">
              {t('earnings.rate')(formatRupiah(report.coinRateRupiah), report.authorSharePct)}
            </p>

            <fieldset className="flex gap-2 pt-4">
              <legend className="sr-only">{t('earnings.viewLabel')}</legend>
              {VIEWPOINTS.map((option) => (
                <Chip
                  key={option.value}
                  selected={viewpoint === option.value}
                  onClick={() => patch('sudut', option.value)}
                >
                  {option.label}
                </Chip>
              ))}
            </fieldset>
            <p className="pt-2 text-caption text-nv-muted">{note}</p>

            {viewpoint === 'revenue' && <RevenueView report={report} />}
            {viewpoint === 'retention' && <RetentionView report={report} />}
            {viewpoint === 'traffic' && <TrafficView report={report} />}

            <div className="grid gap-2 pt-6 sm:grid-cols-2">
              <Link
                to="/penulis/penarikan"
                className="inline-flex h-11 items-center justify-center rounded-nv-md border border-nv-accent px-4 text-body text-nv-accent-strong"
              >
                {t('earnings.withdraw')}
              </Link>
              <Link
                to="/karya"
                className="inline-flex h-11 items-center justify-center rounded-nv-md border border-nv-line px-4 text-body text-nv-muted"
              >
                {t('earnings.manage')}
              </Link>
              <Link
                to="/penulis/penarikan/riwayat"
                className="text-body text-nv-accent-strong underline sm:col-span-2"
              >
                {t('earnings.history')}
              </Link>
            </div>

            {balance.data && (
              <p className="pt-2 text-caption text-nv-muted tabular-nums">
                {t('earnings.available')(formatRupiah(balance.data.available))}
                {balance.data.pending > 0
                  ? ` · ${t('earnings.heldNote')(formatRupiah(balance.data.pending))}`
                  : ''}
              </p>
            )}
          </>
        )}
      </AsyncState>
    </div>
  )
}

type Report = NonNullable<ReturnType<typeof useAuthorAnalytics>['data']>

/** Sudut pandang **Pendapatan** · FR-EARN-03. */
function RevenueView({ report }: { report: Report }) {
  const { openRatePct, openRateChangePct, newFans, newFansChangePct, bars, note } = report.revenue

  return (
    <>
      <dl className="grid grid-cols-2 gap-2 pt-3">
        <Card className="p-3">
          <dt className="text-caption tracking-widest text-nv-muted uppercase">
            {t('earnings.openRate')}
          </dt>
          <dd className="pt-0.5 font-display text-page tabular-nums">{openRatePct}%</dd>
          <dd className="text-caption text-nv-accent-strong">
            {t('earnings.change')(openRateChangePct)}
          </dd>
          <dd className="pt-0.5 text-caption text-nv-muted">{t('earnings.openRateHint')}</dd>
        </Card>
        <Card className="p-3">
          <dt className="text-caption tracking-widest text-nv-muted uppercase">
            {t('earnings.newFans')}
          </dt>
          <dd className="pt-0.5 font-display text-page tabular-nums">{formatNumber(newFans)}</dd>
          <dd className="text-caption text-nv-accent-strong">
            {t('earnings.change')(newFansChangePct)}
          </dd>
        </Card>
      </dl>

      <Card className="mt-3 p-3">
        <h2 className="font-display text-section">{t('earnings.curve')}</h2>
        <p className="text-caption text-nv-muted">{t('earnings.curveHint')}</p>
        {/* Batang dibuat dari `<div>` ber-`aria-label`, bukan SVG: tiap hari
            punya angkanya sendiri, dan pembaca layar harus bisa membacanya
            satu per satu. */}
        <ol className="flex h-32 items-end gap-2 pt-3" aria-label={t('earnings.curveAria')}>
          {bars.map((bar) => (
            <li key={bar.day} className="flex h-full flex-1 flex-col justify-end gap-1.5">
              <span
                aria-hidden
                className="block rounded-nv-sm bg-nv-accent"
                style={{ height: `${bar.pct}%` }}
              />
              <span aria-hidden className="block text-center text-caption text-nv-muted">
                {bar.day}
              </span>
              {/* Angkanya dibacakan per batang: grafik yang hanya punya satu
                  label keseluruhan menyembunyikan tujuh nilai dari pembaca layar. */}
              <span className="sr-only">{t('earnings.barAria')(bar.day, bar.coins)}</span>
            </li>
          ))}
        </ol>
        <p className="mt-2 border-nv-line border-t pt-2 text-body text-nv-muted">{note}</p>
      </Card>
    </>
  )
}

/**
 * Sudut pandang **Retensi** · FR-EARN-04 — corong pembaca dan bab tempat mereka
 * berhenti. Corongnya milik **satu cerita**, dan nama ceritanya disebut: corong
 * agregat lintas judul tidak bisa ditindaklanjuti, karena perbaikannya selalu
 * ada di satu cerita tertentu.
 */
function RetentionView({ report }: { report: Report }) {
  const { funnel, drops } = report.retention

  return (
    <>
      <Card className="mt-3 p-3">
        <h2 className="font-display text-section">{t('earnings.funnel')}</h2>
        {report.focusStory ? (
          <>
            <p className="text-caption text-nv-muted">{report.focusStory.title}</p>
            <ol className="pt-2">
              {funnel.map((stage) => (
                <li key={stage.label} className="pt-2">
                  <p className="flex justify-between text-body tabular-nums">
                    <span>{stage.label}</span>
                    <span>{stage.pct}%</span>
                  </p>
                  <span className="mt-1 block h-1.5 rounded-nv-pill bg-nv-line">
                    <span
                      className="block h-1.5 rounded-nv-pill bg-nv-accent"
                      style={{ width: `${stage.pct}%` }}
                    />
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 border-nv-line border-t pt-2 text-caption text-nv-muted">
              {t('earnings.funnelNote')}
            </p>
          </>
        ) : (
          <p className="pt-2 text-body text-nv-muted">{t('earnings.funnelEmpty')}</p>
        )}
      </Card>

      <Card className="mt-3 p-3">
        <h2 className="font-display text-section">{t('earnings.drops')}</h2>
        {drops.length === 0 ? (
          <p className="pt-2 text-body text-nv-muted">{t('earnings.dropsEmpty')}</p>
        ) : (
          <ol>
            {drops.map((drop) => (
              <li key={drop.label} className="border-nv-line border-t pt-2 first:border-t-0">
                <p className="flex justify-between gap-2 text-body tabular-nums">
                  <span>{drop.label}</span>
                  <span className="text-nv-danger">
                    {t('earnings.retention')(drop.retentionPct)}
                  </span>
                </p>
                <p className="pb-2 text-caption text-nv-muted">
                  {drop.storyTitle} · {drop.note}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </>
  )
}

/**
 * Sudut pandang **Traffic** · FR-EARN-05 — dari mana pembaca datang, kapan, dan
 * satu rekomendasi yang **bisa langsung dijalankan**.
 */
function TrafficView({ report }: { report: Report }) {
  return (
    <>
      <Card className="mt-3 p-3">
        <h2 className="font-display text-section">{t('earnings.sources')}</h2>
        <ol className="pt-2">
          {report.traffic.sources.map((source) => (
            <li key={source.label} className="pt-2">
              <p className="flex justify-between text-body tabular-nums">
                <span>{source.label}</span>
                <span>{source.pct}%</span>
              </p>
              <span className="mt-1 block h-1.5 rounded-nv-pill bg-nv-line">
                <span
                  className="block h-1.5 rounded-nv-pill bg-nv-accent"
                  style={{ width: `${source.pct}%` }}
                />
              </span>
            </li>
          ))}
        </ol>
        <p className="pt-3 text-caption text-nv-muted">
          {t('earnings.peak')(report.traffic.peakHours)}
        </p>
      </Card>

      <Card className="mt-3 p-3">
        <h2 className="font-display text-section">{t('earnings.heat')}</h2>

        {/* Heatmap sebagai **tabel**, bukan grid `<div>`: tiap sel punya hari,
            slot, dan intensitasnya, dan hanya tabel yang membuat ketiganya
            terbaca pembaca layar tanpa menulis ulang labelnya di setiap sel. */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full border-separate border-spacing-1 text-caption">
            <caption className="sr-only">{t('earnings.heatAria')}</caption>
            <thead>
              <tr>
                <th className="w-14" />
                {report.traffic.heatDays.map((day) => (
                  <th key={day} scope="col" className="font-normal text-nv-muted">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.traffic.heatSlots.map((slot) => (
                <tr key={slot}>
                  <th scope="row" className="text-left font-normal text-nv-muted tabular-nums">
                    {slot}
                  </th>
                  {report.traffic.heatDays.map((day) => {
                    const cell = report.traffic.heat.find((c) => c.day === day && c.slot === slot)
                    const level = cell?.level ?? 'low'
                    return (
                      <td key={day} className="p-0">
                        <span
                          className={
                            level === 'hot'
                              ? 'block h-7 rounded-nv-sm bg-nv-accent'
                              : level === 'mid'
                                ? 'block h-7 rounded-nv-sm bg-nv-accent-soft'
                                : 'block h-7 rounded-nv-sm bg-nv-paper'
                          }
                        >
                          <span className="sr-only">
                            {t('earnings.heatCell')(
                              day,
                              slot,
                              t(
                                `earnings.heat${level === 'hot' ? 'Hot' : level === 'mid' ? 'Mid' : 'Low'}`,
                              ),
                            )}
                          </span>
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Catatan aksi **wajib bisa dijalankan** (FR-EARN-05) — karena itu ia
            membawa tautannya, bukan hanya kalimatnya. */}
        <p className="mt-3 border-nv-line border-t pt-2 text-body text-nv-muted">
          {report.traffic.actionNote}
        </p>
        {report.traffic.scheduleLink && (
          <Link
            to={report.traffic.scheduleLink}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-nv-md border border-nv-accent px-4 text-body text-nv-accent-strong"
          >
            {t('earnings.scheduleNow')}
          </Link>
        )}
      </Card>
    </>
  )
}

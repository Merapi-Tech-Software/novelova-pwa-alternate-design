import { Link, useSearchParams } from 'react-router'
import { AnalyticsRangeSchema, AuthorViewpointSchema } from '@/api/contracts'
import { AsyncState } from '@/components/ui/AsyncState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Tabs } from '@/components/ui/Tabs'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
import { formatNumber, formatRupiah } from '@/lib/format'
import { useAuthorAnalytics, usePayoutBalance } from '../hooks/useEarnings'

const RANGES = [
  { value: '7h', label: '7H' },
  { value: '30h', label: '30H' },
  { value: '3b', label: '3B' },
  { value: '1t', label: '1T' },
] as const

/**
 * Tautan yang berperan sebagai tombol. `Button` bukan polimorfik — dan
 * membuatnya polimorfik demi tiga tautan berarti menyentuh primitif yang dipakai
 * ~190 tempat. Kelasnya ditulis sekali di sini, seperti yang sudah dilakukan
 * `ProfilePage` dan detail transaksi. `h-11` = 44px, jadi target ketuknya sudah
 * benar tanpa `::after`.
 */
const LINK_PRIMARY =
  'inline-flex h-11 items-center rounded-nv-pill bg-nv-accent px-5 font-bold text-body text-nv-card'
const LINK_SECONDARY =
  'inline-flex h-11 items-center rounded-nv-pill border border-nv-line-soft px-5 font-semibold text-body text-nv-text'

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
 *
 * **Putaran 7 (R9a).** Rentang dan sudut pandang jadi **tab teks**, bukan pil —
 * brief §1 memisahkannya tegas: saringan adalah tab teks. Angka jadi strip sel
 * `7j` di atas satu panel putih, bukan tiga kartu berdiri sendiri. Dan tiap
 * batang, alur, serta sel panas memakai **emas garis**, karena batang progres
 * memang salah satu dari enam peran emas.
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

      <Tabs
        items={RANGES.map((r) => ({ value: r.value, label: r.label }))}
        value={range}
        onChange={(next) => patch('rentang', next)}
        label={t('earnings.rangeLabel')}
        className="mt-3"
      />

      <AsyncState
        loading={analytics.isPending}
        error={analytics.error}
        data={analytics.data}
        onRetry={() => void analytics.refetch()}
        empty={{ title: t('earnings.emptyTitle'), description: t('earnings.emptyBody') }}
      >
        {(report) => (
          <>
            {/*
              Strip tiga sel di atas **satu panel putih** (`7j`) — pola yang sama
              dengan studio, detail cerita, dan profil. `text-card` bukan
              `text-section`: `Rp 293.480` terpanjang di antara ketiganya, dan di
              320px ia terpotong pada ukuran yang lebih besar.
            */}
            <dl className="mt-4 grid grid-cols-3 gap-x-3 rounded-nv-lg bg-nv-card p-4">
              {(
                [
                  [t('earnings.kRevenue'), formatRupiah(report.kpi.revenueRupiah), true],
                  [t('earnings.kReads'), formatNumber(report.kpi.reads), false],
                  [t('earnings.kRating'), report.kpi.rating.toLocaleString('id-ID'), false],
                ] as const
              ).map(([label, value, gold]) => (
                <div key={label} className="min-w-0">
                  <dd
                    className={cx(
                      'font-display text-card leading-tight font-bold tabular-nums',
                      gold ? 'text-nv-gold' : 'text-nv-text',
                    )}
                  >
                    {value}
                  </dd>
                  <dt className="nv-section-label pt-1">{label}</dt>
                </div>
              ))}
            </dl>

            {/* Kurs koin → rupiah **dinyatakan terang** · PRD 08 §7 #9. Tanpa ini
                analitik memakai koin dan pencairan memakai rupiah, dan penulis
                tidak pernah tahu penghubungnya. */}
            <p className="pt-2 text-caption text-nv-muted tabular-nums">
              {t('earnings.rate')(formatRupiah(report.coinRateRupiah), report.authorSharePct)}
            </p>

            <Tabs
              items={VIEWPOINTS.map((v) => ({ value: v.value, label: v.label }))}
              value={viewpoint}
              onChange={(next) => patch('sudut', next)}
              label={t('earnings.viewLabel')}
              className="mt-4"
            />
            <p className="pt-2 text-caption text-nv-muted">{note}</p>

            {viewpoint === 'revenue' && <RevenueView report={report} />}
            {viewpoint === 'retention' && <RetentionView report={report} />}
            {viewpoint === 'traffic' && <TrafficView report={report} />}

            {/* Aksi uang jadi tombol utama; dua sisanya turun tingkat. Sebelum
                R9a ketiganya bergaris rambut, jadi tidak ada yang menunjukkan
                mana yang dituju halaman ini. */}
            <div className="flex flex-wrap items-center gap-3 pt-6">
              <Link to="/penulis/penarikan" className={LINK_PRIMARY}>
                {t('earnings.withdraw')}
              </Link>
              <Link to="/karya" className={LINK_SECONDARY}>
                {t('earnings.manage')}
              </Link>
              <Link
                to="/penulis/penarikan/riwayat"
                className="nv-tap font-semibold text-body text-nv-muted underline underline-offset-4"
              >
                {t('earnings.history')}
              </Link>
            </div>

            {balance.data && (
              <p className="pt-3 text-caption text-nv-muted tabular-nums">
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

/** Dua sel angka di atas kertas, dipisah garis — bukan dua kartu. */
function Pair({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-4 border-nv-line border-y py-4">{children}</dl>
}

function Cell({
  label,
  value,
  change,
  hint,
}: {
  label: string
  value: string
  change?: number
  hint?: string
}) {
  return (
    <div className="min-w-0">
      <dd className="font-display text-page leading-tight font-bold tabular-nums">{value}</dd>
      <dt className="nv-section-label pt-1">{label}</dt>
      {change !== undefined && (
        <dd className="pt-1 text-caption font-semibold text-nv-text-2 tabular-nums">
          {t('earnings.change')(change)}
        </dd>
      )}
      {hint && <dd className="pt-0.5 text-caption text-nv-muted">{hint}</dd>}
    </div>
  )
}

/** Sudut pandang **Pendapatan** · FR-EARN-03. */
function RevenueView({ report }: { report: Report }) {
  const { openRatePct, openRateChangePct, newFans, newFansChangePct, bars, note } = report.revenue

  return (
    <>
      <div className="pt-4">
        <Pair>
          <Cell
            label={t('earnings.openRate')}
            value={`${openRatePct}%`}
            change={openRateChangePct}
            hint={t('earnings.openRateHint')}
          />
          <Cell
            label={t('earnings.newFans')}
            value={formatNumber(newFans)}
            change={newFansChangePct}
          />
        </Pair>
      </div>

      <SectionHeader label={t('earnings.curve')} className="pt-6" />
      <p className="pt-1.5 text-caption text-nv-muted">{t('earnings.curveHint')}</p>
      {/* Batang dibuat dari `<div>` ber-`aria-label`, bukan SVG: tiap hari
          punya angkanya sendiri, dan pembaca layar harus bisa membacanya
          satu per satu. Isinya **emas garis** — batang progres salah satu dari
          enam peran emas (brief §1), dan tinta di sini membuat grafiknya
          terbaca sebagai deretan tombol. */}
      <ol className="flex h-32 items-end gap-2 pt-3" aria-label={t('earnings.curveAria')}>
        {bars.map((bar) => (
          <li key={bar.day} className="flex h-full flex-1 flex-col justify-end gap-1.5">
            {/* Lebarnya dijepit: tanpa `max-w`, tujuh batang di 1280px melebar
                jadi tujuh bidang emas selebar 100px dan grafiknya berhenti
                terbaca sebagai grafik. */}
            <span
              aria-hidden
              className="mx-auto block w-full max-w-12 rounded-nv-sm bg-nv-gold-line"
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
      <p className="mt-3 border-nv-line border-t pt-3 text-body text-nv-text-2">{note}</p>
    </>
  )
}

/** Batang bagian: alurnya emas garis, jalurnya kertas di dalam panel. */
function Bar({ pct }: { pct: number }) {
  return (
    <span aria-hidden className="mt-1.5 block h-1.5 overflow-hidden rounded-nv-pill bg-nv-paper-2">
      <span className="block h-full rounded-nv-pill bg-nv-gold-line" style={{ width: `${pct}%` }} />
    </span>
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
      <SectionHeader label={t('earnings.funnel')} className="pt-6" />
      {report.focusStory ? (
        <>
          <p className="pt-1.5 text-caption text-nv-muted">{report.focusStory.title}</p>
          <ol className="pt-2" aria-label={t('earnings.funnel')}>
            {funnel.map((stage) => (
              <li key={stage.label} className="border-nv-line border-b py-2.5 last:border-0">
                <p className="flex justify-between gap-3 text-body tabular-nums">
                  <span className="min-w-0 truncate">{stage.label}</span>
                  <span className="shrink-0 font-semibold">{stage.pct}%</span>
                </p>
                <Bar pct={stage.pct} />
              </li>
            ))}
          </ol>
          <p className="pt-2 text-caption text-nv-muted">{t('earnings.funnelNote')}</p>
        </>
      ) : (
        <p className="pt-2 text-body text-nv-muted">{t('earnings.funnelEmpty')}</p>
      )}

      <SectionHeader label={t('earnings.drops')} className="pt-6" />
      {drops.length === 0 ? (
        <p className="pt-2 text-body text-nv-muted">{t('earnings.dropsEmpty')}</p>
      ) : (
        <ol className="pt-1" aria-label={t('earnings.drops')}>
          {drops.map((drop) => (
            <li key={drop.label} className="border-nv-line border-b py-2.5 last:border-0">
              <p className="flex justify-between gap-3 text-body tabular-nums">
                <span className="min-w-0 truncate">{drop.label}</span>
                <span className="shrink-0 font-semibold text-nv-danger">
                  {t('earnings.retention')(drop.retentionPct)}
                </span>
              </p>
              <p className="pt-0.5 text-caption text-nv-muted">
                {drop.storyTitle} · {drop.note}
              </p>
            </li>
          ))}
        </ol>
      )}
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
      <SectionHeader label={t('earnings.sources')} className="pt-6" />
      <ol className="pt-1" aria-label={t('earnings.sources')}>
        {report.traffic.sources.map((source) => (
          <li key={source.label} className="border-nv-line border-b py-2.5 last:border-0">
            <p className="flex justify-between gap-3 text-body tabular-nums">
              <span className="min-w-0 truncate">{source.label}</span>
              <span className="shrink-0 font-semibold">{source.pct}%</span>
            </p>
            <Bar pct={source.pct} />
          </li>
        ))}
      </ol>
      <p className="pt-2 text-caption text-nv-muted">
        {t('earnings.peak')(report.traffic.peakHours)}
      </p>

      <SectionHeader label={t('earnings.heat')} className="pt-6" />

      {/* Heatmap sebagai **tabel**, bukan grid `<div>`: tiap sel punya hari,
          slot, dan intensitasnya, dan hanya tabel yang membuat ketiganya
          terbaca pembaca layar tanpa menulis ulang labelnya di setiap sel.

          Tiga tingkatnya **satu emas dengan tiga kepekatan**, bukan skala warna
          baru: `--nv-gold-line` untuk yang paling ramai, `--nv-gold-soft` untuk
          sedang, kertas untuk sepi. */}
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
                        className={cx(
                          'block h-7 rounded-nv-sm',
                          level === 'hot'
                            ? 'bg-nv-gold-line'
                            : level === 'mid'
                              ? 'bg-nv-gold-soft'
                              : 'bg-nv-paper-2',
                        )}
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
      <p className="mt-3 border-nv-line border-t pt-3 text-body text-nv-text-2">
        {report.traffic.actionNote}
      </p>
      {report.traffic.scheduleLink && (
        <Link to={report.traffic.scheduleLink} className={cx(LINK_SECONDARY, 'mt-3')}>
          {t('earnings.scheduleNow')}
        </Link>
      )}
    </>
  )
}

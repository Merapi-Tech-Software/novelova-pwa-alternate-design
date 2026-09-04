import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import type { ScheduleEntry } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { localTimeZone } from '@/lib/date'
import { formatDateTime } from '@/lib/format'
import { useCancelScheduleEntry, useSchedule } from '../hooks/useSchedule'

const TABS = [
  { value: 'all', label: t('schedule.tabAll') },
  { value: 'scheduled', label: t('schedule.tabScheduled') },
  // Celah dan bentrok jadi **satu tab**: keduanya menuntut keputusan, dan
  // memisahkannya membuat penulis harus memeriksa dua tempat untuk pertanyaan
  // yang sama — "apa yang perlu saya urus hari ini?"
  { value: 'action', label: t('schedule.tabAction') },
] as const

/**
 * Jadwal terbit terpadu · FR-STUDIO-37.
 *
 * **Ringkasan, bukan pengganti.** Ketiga penjadwal yang sudah ada — dari kartu
 * cerita, dari daftar bab, dan dari dalam editor — tetap jadi jalur cepat.
 * Layar ini menjawab satu pertanyaan yang tidak bisa dijawab ketiganya: apa yang
 * akan terbit, dan apa yang perlu diurus.
 */
export default function SchedulePage() {
  const [params, setParams] = useSearchParams()
  const toast = useToast()

  const tab = (TABS.find((x) => x.value === params.get('tab')) ?? TABS[0]).value
  const schedule = useSchedule()
  const cancel = useCancelScheduleEntry()
  /**
   * Benar bila perangkat ini membaca jadwal dari zona waktu lain daripada saat
   * ia dibuat. Dulu ini tombol; tombol yang memicu pemberitahuan tentang
   * keadaan nyata adalah pemberitahuan yang tidak pernah muncul saat keadaan
   * itu benar-benar terjadi.
   */
  const tzShifted = useMemo(
    () =>
      (schedule.data ?? []).some((e) => e.publishAtUtc !== null && e.authorTz !== localTimeZone()),
    [schedule.data],
  )

  const entries = useMemo(() => schedule.data ?? [], [schedule.data])

  /** Tiga metrik dihitung **dari daftarnya**, bukan panggilan terpisah. */
  const metrics = useMemo(
    () => ({
      scheduled: entries.filter((e) => e.publishAtUtc !== null).length,
      gap: entries.filter((e) => e.kind === 'gap').length,
      clash: entries.filter((e) => e.kind === 'clash').length,
    }),
    [entries],
  )

  const shown = entries.filter((entry) => {
    if (tab === 'scheduled') return entry.publishAtUtc !== null
    if (tab === 'action') return entry.kind !== 'ok'
    return true
  })

  const clashes = entries.filter((e) => e.kind === 'clash')
  const gaps = entries.filter((e) => e.kind === 'gap')

  async function onCancel(entry: ScheduleEntry) {
    const label = entry.chapterLabel ?? entry.storyTitle
    if (!window.confirm(t('schedule.cancelConfirm')(label))) return
    try {
      await cancel.mutateAsync(entry.id)
      toast.show(t('schedule.cancelled'))
    } catch (error) {
      toast.show(isApiError(error) ? error.message : t('failure.genericTitle'), { tone: 'danger' })
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-10">
      {/* Tanpa `<h1>` dan tanpa tombol kembali sendiri: keduanya sudah dirender
          `TopBarLayout`. Halaman kedalaman kedua yang menulis ulang keduanya
          menghasilkan **dua `<h1>`** dan dua panah kembali bertumpuk. */}
      <p className="text-body text-nv-muted">{t('schedule.subtitle')}</p>

      <dl className="grid grid-cols-3 gap-2 pt-4">
        {[
          { label: t('schedule.mScheduled'), value: metrics.scheduled },
          { label: t('schedule.mGap'), value: metrics.gap },
          { label: t('schedule.mClash'), value: metrics.clash },
        ].map((metric) => (
          <div key={metric.label} className="rounded-nv-lg bg-nv-surface px-3 py-2.5 text-center">
            <dt className="text-caption text-nv-muted">{metric.label}</dt>
            <dd className="pt-0.5 font-display font-bold text-section text-nv-text tabular-nums">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* `SCHED-409` — **sisipan**, karena ia menuntut keputusan sekarang. */}
      {clashes.length > 0 && (
        <div className="pt-4">
          <FailureNotice
            level="inset"
            title={t('schedule.clashTitle')}
            body={t('schedule.clashBody')}
            safety={t('schedule.clashSafe')}
            code="SCHED-409"
          />
        </div>
      )}

      {/* `SCHED-000` — **peringatan, bukan kegagalan**: rehat yang disengaja
          tidak perlu diperbaiki, jadi ia tidak memakai `FailureNotice`. */}
      {gaps.length > 0 && (
        <Card className="mt-4 border-nv-warning/40 p-3.5">
          <p className="font-semibold text-body text-nv-warning">{t('schedule.gapTitle')}</p>
          <p className="pt-1 text-caption text-nv-muted">{t('schedule.gapBody')}</p>
          <p className="pt-1 text-caption text-nv-text">SCHED-000</p>
        </Card>
      )}

      {/* `SCHED-200` — **toast**, karena tidak ada yang perlu diperbaiki: momen
          terbitnya tersimpan UTC dan tidak bergeser, hanya tampilannya.
          Pemicunya keadaan yang sesungguhnya: zona waktu perangkat ini berbeda
          dari zona waktu penulis saat entri itu dijadwalkan. */}
      {tzShifted && (
        <p className="pt-2 text-caption text-nv-muted" role="status">
          {t('schedule.tzShifted')}
        </p>
      )}

      <Tabs
        className="pt-4"
        label={t('schedule.tabsLabel')}
        value={tab}
        onChange={(next) => {
          const search = new URLSearchParams(params)
          if (next === 'all') search.delete('tab')
          else search.set('tab', next)
          setParams(search, { replace: true })
        }}
        items={TABS}
      />

      <p className="pt-3 text-caption text-nv-muted tabular-nums">
        {t('schedule.count')(shown.length)}
      </p>

      <div className="pt-2">
        <AsyncState
          loading={schedule.isPending}
          error={schedule.error}
          data={shown}
          isEmpty={(list) => list.length === 0}
          onRetry={() => void schedule.refetch()}
          empty={
            tab === 'action'
              ? {
                  title: t('schedule.emptyActionTitle'),
                  description: t('schedule.emptyActionBody'),
                }
              : { title: t('schedule.emptyTitle'), description: t('schedule.emptyBody') }
          }
        >
          {(list) => (
            <ul className="grid gap-2.5">
              {list.map((entry) => (
                <li key={entry.id} className="rounded-nv-lg border border-nv-line bg-nv-card p-3.5">
                  <p className="font-semibold text-body text-nv-text">{entry.storyTitle}</p>
                  {entry.chapterLabel && (
                    <p className="truncate pt-0.5 text-caption text-nv-muted">
                      {entry.chapterLabel}
                    </p>
                  )}

                  <p className="pt-1 text-caption text-nv-text tabular-nums">
                    {entry.publishAtUtc
                      ? formatDateTime(new Date(entry.publishAtUtc))
                      : t('schedule.gapTitle')}
                    {' · '}
                    {entry.cadence}
                  </p>
                  {entry.note && (
                    <p
                      className={
                        entry.kind === 'clash'
                          ? 'pt-1 text-caption text-nv-danger'
                          : 'pt-1 text-caption text-nv-warning'
                      }
                    >
                      {entry.note}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2.5">
                    {entry.chapterId ? (
                      <Link
                        to={`/karya/${entry.storyId}/bab`}
                        className="inline-flex h-9 items-center rounded-nv-pill border border-nv-line px-3 font-semibold text-caption text-nv-text"
                      >
                        {t('schedule.reschedule')}
                      </Link>
                    ) : (
                      <Link
                        to="/karya"
                        className="inline-flex h-9 items-center rounded-nv-pill border border-nv-line px-3 font-semibold text-caption text-nv-text"
                      >
                        {t('schedule.reschedule')}
                      </Link>
                    )}

                    {/* Tombol batalkan per entri — diminta PRD, tidak digambar
                        kanvas. Entri celah tidak punya jadwal untuk dibatalkan. */}
                    {entry.publishAtUtc && (
                      <Button variant="ghost" size="sm" onClick={() => void onCancel(entry)}>
                        {t('schedule.cancel')}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AsyncState>
      </div>

      <p className="pt-4 text-caption text-nv-muted">{t('schedule.tzNote')}</p>
      <p className="pt-2 text-caption text-nv-muted">{t('schedule.quickPaths')}</p>
    </div>
  )
}

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
import { formatClock, formatDateTime, formatMonthShort } from '@/lib/format'
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

      {/* Strip tiga sel · `7m`: angka serif, label 9,5px, pembatas garis rambut
          — pola yang sama dengan strip di studio, detail cerita, dan profil. */}
      <dl className="mt-4 grid grid-cols-3 gap-3 border-nv-line border-y py-4">
        {[
          { label: t('schedule.mScheduled'), value: metrics.scheduled },
          { label: t('schedule.mGap'), value: metrics.gap },
          { label: t('schedule.mClash'), value: metrics.clash },
        ].map((metric) => (
          <div key={metric.label}>
            <dd className="font-display font-bold text-page text-nv-text tabular-nums">
              {metric.value}
            </dd>
            <dt className="nv-section-label pt-1">{metric.label}</dt>
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
            <ul className="divide-y divide-nv-line">
              {list.map((entry) => (
                <li key={entry.id} className="flex items-start gap-4 py-4">
                  {/*
                    **Kolom tanggal di samping detailnya** (`7m`), bukan satu
                    baris waktu di bawah judul. Halaman ini dibaca dengan
                    memindai kapan, bukan apa — dan kolom kiri yang seragam
                    membuat tanggal bisa dipindai tanpa membaca judulnya.
                  */}
                  <p className="w-12 shrink-0 text-center">
                    {entry.publishAtUtc ? (
                      <>
                        <span className="nv-section-label block text-nv-gold">
                          {formatMonthShort(new Date(entry.publishAtUtc))}
                        </span>
                        <span className="block font-display text-page font-bold tabular-nums">
                          {new Date(entry.publishAtUtc).getDate()}
                        </span>
                        <span className="block text-caption text-nv-muted tabular-nums">
                          {formatClock(new Date(entry.publishAtUtc))}
                        </span>
                      </>
                    ) : (
                      <span className="nv-section-label block">{t('schedule.mGap')}</span>
                    )}
                  </p>

                  <div className="min-w-0 flex-1">
                    <p className="font-display text-card font-bold text-nv-text">
                      {entry.storyTitle}
                    </p>
                    {entry.chapterLabel && (
                      <p className="truncate pt-0.5 text-caption text-nv-muted">
                        {entry.chapterLabel}
                      </p>
                    )}
                    <p className="pt-0.5 text-caption text-nv-muted tabular-nums">
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

                    <div className="flex flex-wrap gap-2 pt-3">
                      <Link
                        to={entry.chapterId ? `/karya/${entry.storyId}/bab` : '/karya'}
                        className="relative inline-flex h-9 items-center rounded-nv-pill bg-nv-accent px-3.5 font-semibold text-caption text-nv-card after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']"
                      >
                        {t('schedule.reschedule')}
                      </Link>

                      {/* Tombol batalkan per entri — diminta PRD, tidak digambar
                          kanvas. Entri celah tidak punya jadwal untuk dibatalkan. */}
                      {entry.publishAtUtc && (
                        <Button variant="secondary" size="sm" onClick={() => void onCancel(entry)}>
                          {t('schedule.cancel')}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AsyncState>
      </div>

      {/* Dua catatan kaki **serif** (`7m`): keduanya menjelaskan aturan, bukan
          memberi label pada kontrol — dan aturan dibaca, bukan dipindai. */}
      <p className="border-nv-line border-t pt-4 font-display text-card text-nv-text-2">
        {t('schedule.tzNote')}
      </p>
      <p className="pt-3 font-display text-card text-nv-text-2">{t('schedule.quickPaths')}</p>
    </div>
  )
}

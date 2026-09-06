import type { LocaleSettings } from '@/api/contracts'
import { AsyncState } from '@/components/ui/AsyncState'
import { Select } from '@/components/ui/Field'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useToast } from '@/components/ui/Toast'
import { LANGUAGE_OPTIONS } from '@/i18n/content'
import { t } from '@/i18n/t'
import { formatDateTime } from '@/lib/format'
import { useLocale, useSaveLocale } from '../hooks/useSettings'

/**
 * Bahasa & wilayah `/pengaturan/bahasa` · FR-SET-01 · FR-SET-04.
 *
 * **Tersimpan di server**, bukan per perangkat (FR-CORE-01): pengaturan yang
 * hilang saat pengguna berganti ponsel adalah pengaturan yang harus diisi ulang
 * setiap kali.
 *
 * Panel pratinjau **berubah seketika** dari nilai yang sedang tampil di cache —
 * bukan menunggu server. Itu aman karena tidak ada uang di sini, dan pratinjau
 * yang tertinggal satu langkah dari pilihannya tidak menjelaskan apa pun.
 */
export default function LocalePage() {
  const locale = useLocale()
  const save = useSaveLocale()
  const toast = useToast()

  function ubah(patch: Partial<LocaleSettings>) {
    if (!locale.data) return
    save.mutate(
      { ...locale.data, ...patch },
      { onSuccess: () => toast.show(t('settings.localeSaved'), { tone: 'success' }) },
    )
  }

  return (
    <div className="px-4 pb-10">
      <AsyncState
        loading={locale.isPending}
        error={locale.error}
        data={locale.data}
        onRetry={() => void locale.refetch()}
        empty={{ title: t('settings.localeTitle'), description: t('settings.previewNote') }}
      >
        {(data) => (
          <div className="space-y-4">
            <Select
              label={t('settings.appLang')}
              value={data.uiLang}
              options={LANGUAGE_OPTIONS.app}
              onChange={(event) => ubah({ uiLang: event.target.value })}
            />

            <Select
              label={t('settings.translation')}
              value={data.translationPriority}
              options={LANGUAGE_OPTIONS.translation}
              onChange={(event) => ubah({ translationPriority: event.target.value })}
            />

            <Select
              label={t('settings.region')}
              value={data.contentRegion}
              options={LANGUAGE_OPTIONS.region}
              onChange={(event) => ubah({ contentRegion: event.target.value })}
            />

            <Select
              label={t('settings.currency')}
              value={data.currency}
              options={[
                { value: 'IDR', label: 'IDR - Rupiah' },
                { value: 'USD', label: 'USD - Dollar' },
              ]}
              onChange={(event) =>
                ubah({ currency: event.target.value as LocaleSettings['currency'] })
              }
            />

            <Select
              label={t('settings.timezone')}
              value={data.timezone}
              options={LANGUAGE_OPTIONS.timezone}
              onChange={(event) => ubah({ timezone: event.target.value })}
            />

            {/*
              **Zona waktu bukan sekadar tampilan.** Ia acuan tunggal untuk klaim
              check-in harian, kuota iklan, jadwal terbit, dan jam tenang push —
              dan menyebutnya di sini mencegah pengguna mengubahnya tanpa tahu
              apa lagi yang ikut bergeser.
            */}
            <p className="text-caption text-nv-muted">{t('settings.timezoneNote')}</p>

            <section className="nv-card p-4">
              <SectionHeader label={t('settings.previewTitle')} className="mb-3" />
              <dl className="space-y-2 text-body">
                <Baris label={t('settings.appLang')} value={data.uiLang} />
                <Baris label={t('settings.region')} value={data.contentRegion} />
                <Baris
                  label={t('settings.currency')}
                  value={
                    data.currency === 'IDR'
                      ? (1_000_000).toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          maximumFractionDigits: 0,
                        })
                      : (65).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                  }
                />
                <Baris label={t('settings.timezone')} value={waktuDi(data.timezone)} />
              </dl>
              <p className="pt-3 text-caption text-nv-muted">{t('settings.previewNote')}</p>
            </section>
          </div>
        )}
      </AsyncState>
    </div>
  )
}

function Baris({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="min-w-0 text-nv-muted">{label}</dt>
      <dd className="min-w-0 text-right font-semibold text-nv-text">{value}</dd>
    </div>
  )
}

/**
 * Jam sekarang menurut zona yang dipilih.
 *
 * Zona yang tidak dikenal peramban melempar; jatuh ke format bawaan alih-alih
 * menjatuhkan seluruh panel — pratinjau yang meledak karena satu pilihan asing
 * lebih buruk daripada pratinjau yang menyebut waktu lokal.
 */
function waktuDi(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: timezone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date())
  } catch {
    return formatDateTime(new Date())
  }
}

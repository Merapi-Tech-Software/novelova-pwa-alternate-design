import { FileCheck2, ShieldCheck } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import type { AgeVerification } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useToast } from '@/components/ui/Toast'
import { useAgeVerification, useSubmitAgeVerification } from '@/hooks/useAgeVerification'
import { t } from '@/i18n/t'
import { AGE_STATUS_LABEL, ageOn } from '@/lib/age'
import { todayLocalISO } from '@/lib/date'
import { formatDateTime } from '@/lib/format'

/** KTP difoto ponsel jarang di bawah 100 KB dan jarang di atas 8 MB. */
const DOC_MAX_BYTES = 8 * 1024 * 1024

/**
 * Verifikasi usia `/pengaturan/verifikasi-usia` · todo-incoming-features.md A1.
 *
 * Pengguna memilih **verifikasi dokumen (KTP)**, dan itu tidak bisa dibangun
 * jujur tanpa backend + penyimpanan berkas. Yang dibangun di sini adalah
 * **seluruh alurnya** — formulir, empat keadaan, pengajuan ulang setelah
 * ditolak — sementara unggahannya disimulasikan: berkas tidak dikirim ke mana
 * pun, hanya nama dan ukurannya. Halaman ini **mengatakannya terang** di layar,
 * bukan menyembunyikannya.
 *
 * Keputusannya ada di `/dev/kitchen-sink`, alasan yang sama dengan antrean
 * tinjauan: pengguna tidak boleh memverifikasi dirinya sendiri.
 */
export default function AgeVerificationPage() {
  const verification = useAgeVerification()
  const submit = useSubmitAgeVerification()
  const toast = useToast()

  const [birthDate, setBirthDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<{ birthDate?: string; file?: string }>({})

  function ajukan(event: FormEvent) {
    event.preventDefault()
    const next: typeof error = {}
    if (!birthDate) next.birthDate = t('settings.ageBirthDateRequired')
    if (!file) next.file = t('settings.ageDocumentRequired')
    else if (file.size > DOC_MAX_BYTES) next.file = t('settings.ageDocumentTooBig')
    setError(next)
    if (next.birthDate || next.file || !file) return

    submit.mutate(
      { birthDate, documentName: file.name, documentSize: file.size },
      {
        onSuccess: () => toast.show(t('settings.ageSubmitted'), { tone: 'success' }),
        onError: (failure) =>
          toast.show(isApiError(failure) ? failure.message : t('failure.genericTitle'), {
            tone: 'danger',
          }),
      },
    )
  }

  return (
    <div className="px-4 pb-10">
      <AsyncState
        loading={verification.isPending}
        error={verification.error}
        data={verification.data}
        onRetry={() => void verification.refetch()}
        empty={{ title: t('settings.ageTitle'), description: t('settings.ageIntro') }}
      >
        {(data) => (
          <div className="space-y-5">
            <p className="text-body text-nv-text-2">{t('settings.ageIntro')}</p>

            <KartuStatus data={data} />

            {(data.status === 'none' || data.status === 'rejected') && (
              <form onSubmit={ajukan} noValidate className="space-y-4">
                <Input
                  label={t('settings.ageBirthDate')}
                  type="date"
                  value={birthDate}
                  max={todayLocalISO()}
                  onChange={(event) => setBirthDate(event.target.value)}
                  {...(error.birthDate ? { error: error.birthDate } : {})}
                />

                {/*
                  Pemilih berkas dibungkus `<label>` supaya seluruh kotaknya jadi
                  target ketuk 44px+, dan `<input>` aslinya tetap ada — pembaca
                  layar dan papan ketik memakainya, bukan kotak hiasannya.
                */}
                <div>
                  <label
                    htmlFor="berkas-ktp"
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-nv-md border border-nv-line-soft border-dashed px-4 py-3"
                  >
                    <FileCheck2 size={18} aria-hidden className="shrink-0 text-nv-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-semibold">
                        {t('settings.ageDocument')}
                      </span>
                      <span className="block break-words text-caption text-nv-muted">
                        {file
                          ? `${file.name} · ${ukuran(file.size)}`
                          : t('settings.ageDocumentHint')}
                      </span>
                    </span>
                  </label>
                  <input
                    id="berkas-ktp"
                    type="file"
                    accept="image/*,.pdf"
                    className="sr-only"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                  {error.file && (
                    <p role="alert" className="pt-1 text-caption text-nv-danger">
                      {error.file}
                    </p>
                  )}
                </div>

                <Button type="submit" size="lg" block loading={submit.isPending}>
                  {data.status === 'rejected' ? t('settings.ageResubmit') : t('settings.ageSubmit')}
                </Button>

                <p className="text-caption text-nv-muted">{t('settings.ageSimNote')}</p>
              </form>
            )}
          </div>
        )}
      </AsyncState>
    </div>
  )
}

function KartuStatus({ data }: { data: AgeVerification }) {
  const umur = data.birthDate ? ageOn(data.birthDate, todayLocalISO()) : null
  return (
    <section className="nv-card p-4">
      <SectionHeader label={t('settings.ageStatus')} className="mb-2" />
      <p className="flex items-center gap-2 font-display text-section font-semibold">
        {data.status === 'verified' && (
          <ShieldCheck size={20} aria-hidden className="shrink-0 text-nv-gold-line" />
        )}
        {AGE_STATUS_LABEL[data.status]}
      </p>
      <p className="pt-1 text-body text-nv-text-2">
        {data.status === 'pending' && t('settings.agePendingBody')}
        {data.status === 'verified' && umur !== null && t('settings.ageVerifiedBody')(umur)}
        {data.status === 'rejected' && t('settings.ageRejectedBody')}
        {data.status === 'none' && t('settings.ageNoneBody')}
      </p>
      {data.status === 'rejected' && data.rejectReason && (
        <p className="mt-2 rounded-nv-md bg-nv-paper-2 p-3 text-caption text-nv-text-2">
          <b className="font-semibold">{t('settings.ageRejectReason')}</b> {data.rejectReason}
        </p>
      )}
      {data.submittedAt && (
        <p className="pt-2 text-caption text-nv-muted">
          {t('settings.ageSubmittedAt')(formatDateTime(new Date(data.submittedAt)))}
          {data.documentName ? ` · ${data.documentName}` : ''}
        </p>
      )}
    </section>
  )
}

function ukuran(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

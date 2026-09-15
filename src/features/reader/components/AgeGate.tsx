import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router'
import type { AgeVerification } from '@/api/contracts'
import { Skeleton } from '@/components/ui/Card'
import { useAgeVerification } from '@/hooks/useAgeVerification'
import { t } from '@/i18n/t'

/**
 * Gerbang usia di ruang baca · todo-incoming-features.md A1.
 *
 * **Bukan gerbang koin dengan kata lain.** Gerbang koin memperlihatkan awal bab
 * dan menawarkan cara membayar; gerbang ini tidak memperlihatkan apa pun dan
 * tidak menjual apa pun. Yang ditawarkannya cuma satu jalan — verifikasi — dan
 * satu jaminan: **koin tidak terpotong** (§1.4, kalimat kedua).
 *
 * Kalimatnya dipilih dari status verifikasi, supaya pembaca yang dokumennya
 * sedang ditinjau tidak disuruh mengajukan lagi.
 */
export function AgeGate({ storyId }: { storyId: string }) {
  const verification = useAgeVerification()

  return (
    <section
      aria-labelledby="gerbang-usia"
      className="mt-6 rounded-nv-lg border border-nv-line bg-nv-card p-5 text-center"
    >
      <ShieldAlert size={28} aria-hidden className="mx-auto text-nv-gold-line" />
      <h2 id="gerbang-usia" className="pt-3 font-display text-section font-semibold">
        {t('reader.ageGateTitle')}
      </h2>

      {verification.isPending ? (
        <Skeleton lines={2} className="mx-auto mt-3 max-w-xs" />
      ) : (
        <p className="pt-2 text-body text-nv-text-2">{kalimat(verification.data)}</p>
      )}
      <p className="pt-2 text-caption font-semibold text-nv-gold">{t('reader.ageGateSafe')}</p>

      <div className="mt-5 flex flex-col items-center gap-2 min-[360px]:flex-row min-[360px]:justify-center">
        {butuhAjukan(verification.data) && (
          <Link
            to="/pengaturan/verifikasi-usia"
            className="flex h-11 w-full items-center justify-center rounded-nv-pill bg-nv-accent px-5 text-body font-bold text-nv-card min-[360px]:w-auto"
          >
            {t('reader.ageGateVerify')}
          </Link>
        )}
        <Link
          to={`/cerita/${storyId}`}
          className="flex h-11 w-full items-center justify-center rounded-nv-pill border border-nv-line-soft px-5 text-body font-semibold min-[360px]:w-auto"
        >
          {t('reader.ageGateBack')}
        </Link>
      </div>
    </section>
  )
}

function butuhAjukan(v: AgeVerification | undefined): boolean {
  return v === undefined || v.status === 'none' || v.status === 'rejected'
}

function kalimat(v: AgeVerification | undefined): string {
  if (!v || v.status === 'none') return t('reader.ageGateNone')
  if (v.status === 'pending') return t('reader.ageGatePending')
  if (v.status === 'rejected') return t('reader.ageGateRejected')
  // `verified` tetapi sampai di sini berarti usianya belum 18.
  return t('reader.ageGateUnderage')
}

import { AlertCircle, Timer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { t } from '@/i18n/t'

/** Panjang tayangan iklan contoh. Cukup untuk terasa, tidak cukup untuk menyiksa. */
const SECONDS = 5

/**
 * Layar iklan berhitung mundur · FR-READ-18 · mockup `7aa`.
 *
 * **Babnya dibuka hanya setelah tayangan selesai**, dan kuota baru dipotong di
 * saat yang sama — bukan ketika tombol ditekan. Pembaca yang membatalkan di
 * detik ketiga tidak kehilangan apa pun: tidak babnya, tidak kuotanya.
 *
 * Itu sebabnya `onFinish` dipanggil dari timer, bukan dari `onClick`.
 *
 * Kartu "kalau iklan gagal dimuat" **selalu ada**, bukan muncul setelah gagal:
 * ia menjelaskan aturannya sebelum pembaca perlu mengalaminya, dan itu satu
 * kecemasan yang tidak perlu terjadi sama sekali.
 */
export function AdUnlockScreen({
  chapterNumber,
  price,
  adLeft,
  adMax,
  onFinish,
  onCancel,
  onPayInstead,
}: {
  chapterNumber: number
  price: number
  adLeft: number
  adMax: number
  onFinish: () => void
  onCancel: () => void
  onPayInstead: () => void
}) {
  const [left, setLeft] = useState(SECONDS)

  useEffect(() => {
    if (left <= 0) {
      onFinish()
      return
    }
    const timer = setTimeout(() => setLeft((n) => n - 1), 1_000)
    return () => clearTimeout(timer)
  }, [left, onFinish])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-nv-bg px-4 py-5">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center justify-between gap-3">
          <span className="nv-section-label">{t('reader.adLabel')(chapterNumber)}</span>
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 font-semibold text-caption text-nv-muted underline underline-offset-4"
          >
            {t('reader.adCancel')}
          </button>
        </div>

        <div className="mt-3 overflow-hidden rounded-nv-lg border border-nv-line-soft bg-nv-card">
          <div
            // `--nv-jacket-3` adalah nilai `background` lengkap (gradien + warna),
            // bukan sebuah warna — jadi ia dipasang lewat style, sama seperti
            // jaket sampul di `Cover`.
            style={{ background: 'var(--nv-jacket-3)' }}
            className="relative grid h-52 place-items-center px-6 text-center"
          >
            <span
              aria-hidden
              className="absolute top-3 right-3 flex items-center gap-1.5 rounded-nv-pill bg-nv-card/92 px-2.5 py-1 font-semibold text-caption text-nv-text tabular-nums"
            >
              <Timer size={13} />
              {left}s
            </span>

            <span className="block">
              <span className="nv-section-label text-nv-on-scrim/60">
                {t('home.adNativeSource')}
              </span>
              <span className="block pt-1.5 font-display text-page font-bold text-nv-on-scrim">
                {t('reader.adBrand')}
              </span>
              <span className="block pt-1 text-caption text-nv-on-scrim/70">
                {t('reader.adBrandSub')}
              </span>
            </span>

            {/* Garis progres menempel di dasar iklannya, bukan mengambang di
                bawahnya: yang berjalan adalah tayangannya. */}
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-nv-gold-line/25">
              <span
                className="block h-1 bg-nv-gold-line transition-[width] duration-1000 ease-linear"
                style={{ width: `${((SECONDS - left) / SECONDS) * 100}%` }}
              />
            </span>
          </div>

          <div className="p-4">
            <p aria-live="polite" className="font-display text-card font-bold">
              {left > 0 ? t('reader.adTitle') : t('reader.adDone')}
            </p>
            <p className="pt-1.5 text-body text-nv-muted">{t('reader.adRule')}</p>

            <p className="mt-4 flex items-center justify-between gap-3 border-nv-line border-t pt-3">
              <span className="nv-section-label">{t('reader.adQuotaLabel')}</span>
              <span className="shrink-0 font-display text-card font-bold tabular-nums">
                {adLeft}/{adMax}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-nv-lg border border-nv-line-soft p-4">
          <p className="flex items-center gap-2 font-display text-card font-bold">
            <AlertCircle size={15} aria-hidden className="text-nv-danger" />
            {t('reader.adFailed')}
          </p>
          <p className="pt-1.5 text-body text-nv-muted">{t('reader.adFailedBody')}</p>

          <div className="flex flex-wrap gap-2 pt-4">
            <Button size="sm" onClick={() => setLeft(SECONDS)}>
              {t('reader.adRetry')}
            </Button>
            <Button size="sm" variant="secondary" onClick={onPayInstead}>
              {t('reader.adPayInstead')(price)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

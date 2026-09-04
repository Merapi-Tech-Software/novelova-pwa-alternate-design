import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/Card'
import { t } from '@/i18n/t'

/** Panjang tayangan iklan contoh. Cukup untuk terasa, tidak cukup untuk menyiksa. */
const SECONDS = 5

/**
 * Layar iklan berhitung mundur · FR-READ-18.
 *
 * **Babnya dibuka hanya setelah tayangan selesai**, dan kuota baru dipotong di
 * saat yang sama — bukan ketika tombol ditekan. Pembaca yang membatalkan di
 * detik ketiga tidak kehilangan apa pun: tidak babnya, tidak kuotanya.
 *
 * Itu sebabnya `onFinish` dipanggil dari timer, bukan dari `onClick`.
 */
export function AdUnlockScreen({
  onFinish,
  onCancel,
}: {
  onFinish: () => void
  onCancel: () => void
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-nv-bg px-6">
      <p className="font-display text-section font-semibold">{t('reader.adTitle')}</p>

      <div
        aria-hidden
        className="grid h-40 w-full max-w-sm place-items-center rounded-nv-lg border border-nv-line border-dashed bg-nv-paper-2 text-caption text-nv-muted"
      >
        Bersponsor
      </div>

      <div className="w-full max-w-sm">
        <ProgressBar
          value={(SECONDS - left) / SECONDS}
          label={t('reader.adCountdown')(left)}
          showValue
        />
      </div>

      <p aria-live="polite" className="text-body text-nv-muted tabular-nums">
        {left > 0 ? t('reader.adCountdown')(left) : t('reader.adDone')}
      </p>

      <Button variant="ghost" onClick={onCancel}>
        {t('reader.adCancel')}
      </Button>
    </div>
  )
}

import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Modal'
import { t } from '@/i18n/t'

export interface InsufficientCoinsProps {
  open: boolean
  onClose: () => void
  /** Kekurangannya, bukan harga penuhnya. */
  shortBy: number
  balance: number
  storyId: string
  chapterId: string
  /** Iklan hanya ditawarkan bila kuotanya memang masih ada. */
  adLeft: number
  onWatchAd: () => void
}

/**
 * Saldo kurang · FR-READ-17.
 *
 * **Lembar, bukan toast.** Toast hilang sendiri sebelum sempat dibaca, dan yang
 * perlu disampaikan di sini ada empat: berapa kurangnya, berapa saldonya
 * sekarang, ke mana mengisinya, dan bahwa tidak ada koin yang terpotong.
 *
 * Tombol "Isi koin" membawa konteks kembalinya (`?return=&chapter_id=&need=`),
 * jadi setelah mengisi — atau setelah membatalkannya — pembaca mendarat kembali
 * di bab yang sama dengan gerbangnya masih terbuka.
 */
export function InsufficientCoins({
  open,
  onClose,
  shortBy,
  balance,
  storyId,
  chapterId,
  adLeft,
  onWatchAd,
}: InsufficientCoinsProps) {
  const back = `/cerita/${storyId}/bab/${chapterId}`
  const topUp = `/koin?return=${encodeURIComponent(back)}&chapter_id=${chapterId}&need=${shortBy}`

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('reader.shortTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('action.cancel')}
          </Button>
          <Link
            to={topUp}
            className="inline-flex h-11 items-center rounded-nv-pill bg-nv-accent px-4.5 text-body font-semibold text-nv-card"
          >
            {t('reader.topUp')}
          </Link>
        </>
      }
    >
      <p className="font-display text-section font-bold text-nv-danger tabular-nums">
        {t('reader.shortBy')(shortBy)}
      </p>
      <p className="pt-1 text-body text-nv-muted tabular-nums">
        {t('reader.shortBalance')(balance)}
      </p>
      <p className="pt-3 text-body font-semibold text-nv-success">{t('reader.shortSafe')}</p>

      {adLeft > 0 && (
        <Button variant="secondary" block className="mt-4" onClick={onWatchAd}>
          {t('reader.optionAd')} · {t('reader.optionAdQuota')(adLeft)}
        </Button>
      )}
    </Sheet>
  )
}

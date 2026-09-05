import { ChevronRight, Coins, PlayCircle, Ticket } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Sheet } from '@/components/ui/Modal'
import { t } from '@/i18n/t'

export interface InsufficientCoinsProps {
  open: boolean
  onClose: () => void
  /** Kekurangannya, bukan harga penuhnya. */
  shortBy: number
  balance: number
  /** Harga pilihan yang barusan ditolak — dipakai baris keterangan `7z`. */
  price: number
  chapterNumber: number
  storyId: string
  chapterId: string
  /** Iklan hanya ditawarkan bila kuotanya memang masih ada. */
  adLeft: number
  voucherCount: number
  onWatchAd: () => void
  onUseVoucher: () => void
}

/** Satu baris jalan keluar · `7z`: ikon, judul, keterangan, lalu chevron. */
function Jalan({
  icon,
  title,
  body,
  trailing,
  onClick,
  to,
}: {
  icon: ReactNode
  title: string
  body: string
  trailing?: ReactNode
  onClick?: () => void
  to?: string
}) {
  const isi = (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-nv-pill border border-current/15">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-card font-bold">{title}</span>
        <span className="block pt-0.5 text-caption opacity-70">{body}</span>
      </span>
      {trailing ?? <ChevronRight size={18} aria-hidden className="shrink-0 opacity-50" />}
    </>
  )

  const kelas =
    'flex w-full items-center gap-3 rounded-nv-md border border-nv-line-soft px-4 py-3 text-left'

  return to ? (
    <Link to={to} className={kelas}>
      {isi}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={kelas}>
      {isi}
    </button>
  )
}

/**
 * Saldo kurang · FR-READ-17 · mockup `7z`.
 *
 * **Lembar, bukan toast.** Toast hilang sendiri sebelum sempat dibaca, dan yang
 * perlu disampaikan di sini ada empat: berapa kurangnya, berapa saldonya
 * sekarang, ke mana mengisinya, dan bahwa tidak ada koin yang terpotong.
 *
 * **Tiga jalan keluar, bukan dua.** Permintaan produk 4 September menyebut isi
 * koin dan iklan; voucher tetap ada karena ia satu-satunya jalan yang tidak
 * menuntut uang **maupun** menonton iklan, dan lembar buntu yang menawarkan
 * lebih sedikit melanggar `architecture.md` §1.4.
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
  price,
  chapterNumber,
  storyId,
  chapterId,
  adLeft,
  voucherCount,
  onWatchAd,
  onUseVoucher,
}: InsufficientCoinsProps) {
  const back = `/cerita/${storyId}/bab/${chapterId}`
  const topUp = `/koin?return=${encodeURIComponent(back)}&chapter_id=${chapterId}&need=${shortBy}`

  return (
    <Sheet open={open} onClose={onClose} title={t('reader.shortBy')(shortBy)}>
      <p className="pb-4 text-caption text-nv-muted tabular-nums">
        {t('reader.shortNeed')(chapterNumber, price, balance)}
      </p>

      <div className="space-y-2.5">
        {/* Isi koin **utama** — satu-satunya yang berisi penuh, karena ia
            satu-satunya yang pasti menyelesaikan kekurangannya. */}
        <Link
          to={topUp}
          className="flex w-full items-center gap-3 rounded-nv-md bg-nv-accent px-4 py-3 text-left text-nv-card"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-nv-pill border border-nv-card/20">
            <Coins size={17} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-card font-bold">{t('reader.topUp')}</span>
            <span className="block pt-0.5 text-caption text-nv-card/70">
              {t('reader.shortTopUpSub')(shortBy)}
            </span>
          </span>
          <ChevronRight size={18} aria-hidden className="shrink-0 text-nv-card/60" />
        </Link>

        <Jalan
          icon={<Ticket size={17} aria-hidden />}
          title={t('reader.shortVoucher')}
          body={t('reader.shortVoucherSub')(voucherCount)}
          onClick={onUseVoucher}
        />

        {adLeft > 0 && (
          <Jalan
            icon={<PlayCircle size={17} aria-hidden />}
            title={t('reader.optionAd')}
            body={t('reader.optionAdSub')}
            trailing={
              <span className="shrink-0 rounded-nv-pill border border-nv-line px-2.5 py-1 text-caption text-nv-muted tabular-nums">
                {t('reader.optionAdQuota')(adLeft)}
              </span>
            }
            onClick={onWatchAd}
          />
        )}
      </div>

      {/* Menyatakan terang bahwa membatalkan tidak menghilangkan apa pun — dan
          ke mana pembaca kembali. Tanpa itu, menutup lembar terasa seperti
          kehilangan tempat. */}
      <p className="pt-5 font-display text-card text-nv-muted">{t('reader.shortCancelNote')}</p>
    </Sheet>
  )
}

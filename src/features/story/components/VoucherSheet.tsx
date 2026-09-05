import { useEffect, useRef, useState } from 'react'
import type { ChapterSummary } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { Button } from '@/components/ui/Button'
import { Confetti } from '@/components/ui/Confetti'
import { Input } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Modal'
import { useVouchers } from '@/hooks/useVouchers'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import { useApplyVoucher, useRedeemAndApply } from '../hooks/useVoucher'

/** Kode voucher tidak pernah lebih panjang dari ini (FR-DETAIL-09). */
const CODE_MAX = 20
/** Confetti dibersihkan setelah ini — cukup lama untuk terlihat, tidak menetap. */
const CONFETTI_MS = 3_400

export interface VoucherSheetProps {
  open: boolean
  onClose: () => void
  storyId: string
  chapters: ChapterSummary[]
}

/**
 * Voucher · FR-DETAIL-09 · FR-DETAIL-10 · FR-RWD-06.
 *
 * **Voucher yang dimiliki ada di atas kolom kode**, dan bisa dipakai tanpa
 * mengetik apa pun — mengetik ulang kode yang sudah ada di akun sendiri adalah
 * pekerjaan yang tidak seorang pun minta.
 *
 * Kode yang salah **tidak menutup lembar ini**: pengguna yang salah ketik satu
 * huruf harus bisa memperbaikinya di tempat, bukan membuka ulang segalanya.
 */
export function VoucherSheet({ open, onClose, storyId, chapters }: VoucherSheetProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [unlocked, setUnlocked] = useState<number[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const vouchers = useVouchers()
  const redeem = useRedeemAndApply(storyId)
  const apply = useApplyVoucher(storyId)

  // Dibuka ulang berarti mulai dari nol: kode lama dan pesan gagal lama tidak
  // pernah relevan bagi percobaan berikutnya (FR-DETAIL-09).
  useEffect(() => {
    if (!open) return
    setCode('')
    setError('')
    setUnlocked(null)

    // Fokus setelah animasi lembar selesai; memfokuskan di tengah transisi
    // membuat sebagian peramban menggulir halaman di belakangnya.
    const timer = setTimeout(() => inputRef.current?.focus(), 150)
    return () => clearTimeout(timer)
  }, [open])

  function numbersOf(ids: string[]): number[] {
    return ids
      .map((id) => chapters.find((c) => c.id === id)?.number)
      .filter((n): n is number => n !== undefined)
      .sort((a, b) => a - b)
  }

  function fail(message: string) {
    setError(message)
    // Getar diulang dengan melepas kelasnya dulu — tanpa itu, kode salah kedua
    // kali tidak bergetar sama sekali.
    setShake(false)
    requestAnimationFrame(() => setShake(true))
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={unlocked ? t('story.voucherDoneTitle') : t('story.voucherTitle')}
      footer={
        unlocked ? (
          <Button onClick={onClose}>{t('action.close')}</Button>
        ) : (
          <Button
            loading={redeem.isPending}
            onClick={() => {
              const entry = code.trim()
              if (!entry) return
              redeem.mutate(entry, {
                onSuccess: (result) => setUnlocked(numbersOf(result.unlockedChapterIds)),
                onError: (failure) =>
                  fail(isApiError(failure) ? failure.message : t('failure.genericTitle')),
              })
            }}
          >
            {t('story.voucherApply')}
          </Button>
        )
      }
    >
      {unlocked ? (
        <div className="py-2 text-center">
          <p className="text-body font-semibold text-nv-success">
            {unlocked.length === 0
              ? t('story.voucherDoneNothing')
              : t('story.voucherDoneChapters')(unlocked)}
          </p>
          <Confetti active count={36} durationMs={CONFETTI_MS} />
        </div>
      ) : (
        <>
          <p className="nv-section-label mb-2">{t('story.voucherOwned')}</p>
          {vouchers.data && vouchers.data.length > 0 ? (
            <ul className="mb-5 divide-y divide-nv-line-soft">
              {vouchers.data.map((voucher) => (
                <li key={voucher.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    {/* Judul voucher serif — ia nama sebuah barang, bukan label kontrol. */}
                    <span className="block truncate font-display text-card font-semibold">
                      {voucher.title}
                    </span>
                    <span className="block text-caption text-nv-muted">
                      {t('story.voucherExpires')(formatDate(new Date(voucher.expiresAt)))}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={apply.isPending}
                    onClick={() =>
                      apply.mutate(voucher.id, {
                        onSuccess: (result) => setUnlocked(numbersOf(result.unlockedChapterIds)),
                        onError: (failure) =>
                          fail(isApiError(failure) ? failure.message : t('failure.genericTitle')),
                      })
                    }
                  >
                    {t('story.voucherUse')}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-5 text-body text-nv-muted">{t('story.voucherNone')}</p>
          )}

          <div className={cx(shake && 'animate-[nvShake_0.4s_ease-in-out]')}>
            <Input
              ref={inputRef}
              label={t('story.voucherCode')}
              placeholder={t('story.voucherCodePlaceholder')}
              maxLength={CODE_MAX}
              autoCapitalize="characters"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setError('')
              }}
            />
          </div>

          <div role="alert" aria-live="assertive" className="min-h-9 pt-2">
            {error && <span className="text-caption font-semibold text-nv-danger">{error}</span>}
          </div>
        </>
      )}
    </Sheet>
  )
}

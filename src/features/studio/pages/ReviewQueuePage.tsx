import { Link } from 'react-router'
import type { ReviewQueueItem } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import type { BadgeTone } from '@/components/ui/Chip'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
import { formatDateTime } from '@/lib/format'
import { useReviewQueue, useWithdrawFromReview } from '../hooks/useSchedule'

const KIND: Record<ReviewQueueItem['kind'], string> = {
  story: t('review.kStory'),
  chapter: t('review.kChapter'),
  print: t('review.kPrint'),
  report: t('review.kReport'),
}

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  in_review: { label: t('review.stInReview'), tone: 'warning' },
  rejected: { label: t('review.stRejected'), tone: 'danger' },
}

/**
 * Antrean tinjauan · FR-STUDIO-38.
 *
 * **Satu antrean untuk empat sumber** — cerita, bab, pesanan cetak, dan (nanti)
 * laporan pembaca. Penulis melihat satu jenis status tinjauan di seluruh studio,
 * bukan empat layar yang masing-masing memakai kosakatanya sendiri.
 *
 * Isinya diturunkan dari sumbernya: memperbaiki ceritanya menghapus barisnya di
 * sini tanpa ada yang perlu menyinkronkan apa pun.
 */
/** Kata status diwarnai nadanya; lihat alasannya di `StudioCard`. */
const STATUS_TEXT: Record<string, string> = {
  neutral: 'text-nv-muted',
  info: 'text-nv-text-2',
  warning: 'text-nv-gold',
  success: 'text-nv-success',
  danger: 'text-nv-danger',
}

export default function ReviewQueuePage() {
  const toast = useToast()
  const queue = useReviewQueue()
  const withdraw = useWithdrawFromReview()

  async function onWithdraw(item: ReviewQueueItem) {
    if (item.kind !== 'story' && item.kind !== 'chapter') return
    try {
      await withdraw.mutateAsync({ kind: item.kind, refId: item.refId })
      toast.show(t('review.withdrawn'))
    } catch (error) {
      toast.show(isApiError(error) ? error.message : t('failure.genericTitle'), { tone: 'danger' })
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-10">
      {/* Tanpa `<h1>` dan tanpa tombol kembali sendiri: keduanya sudah dirender
          `TopBarLayout`. Halaman kedalaman kedua yang menulis ulang keduanya
          menghasilkan **dua `<h1>`** dan dua panah kembali bertumpuk. */}
      <p className="text-body text-nv-muted">{t('review.subtitle')}</p>

      <div className="pt-5">
        <AsyncState
          loading={queue.isPending}
          error={queue.error}
          data={queue.data}
          isEmpty={(list) => list.length === 0}
          onRetry={() => void queue.refetch()}
          empty={{ title: t('review.emptyTitle'), description: t('review.emptyBody') }}
        >
          {(list) => (
            <ul className="divide-y divide-nv-line">
              {list.map((item) => {
                const status = STATUS[item.status] ?? STATUS.in_review
                return (
                  <li key={item.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {/* Label jenis 9,5px huruf besar (`7n`): ia mengelompokkan
                            antrean yang isinya empat sumber berbeda, dan
                            kelompoknya harus terbaca sebelum judulnya. */}
                        <p className="nv-section-label">{KIND[item.kind]}</p>
                        <p className="pt-1 font-display text-card font-bold text-nv-text">
                          {item.label}
                        </p>
                        {item.context && (
                          <p className="truncate pt-0.5 text-caption text-nv-muted">
                            {item.context}
                          </p>
                        )}
                        <p className="pt-0.5 text-caption text-nv-muted tabular-nums">
                          {t('review.submittedAt')(formatDateTime(new Date(item.submittedAt)))}
                        </p>
                      </div>

                      {/* Kata status, bukan lencana berlatar — sama alasannya
                          dengan daftar karya (`7j`). */}
                      <span
                        className={cx(
                          'shrink-0 font-semibold text-caption',
                          STATUS_TEXT[status?.tone ?? 'warning'],
                        )}
                      >
                        {status?.label ?? t('review.stInReview')}
                      </span>
                    </div>

                    {/* Alasan penolakan **dikutip di balik garis merah** — penulis
                        tidak boleh harus mencarinya (FR-STUDIO-38), dan blok
                        berlatar merah menarik mata lebih dulu daripada judulnya. */}
                    {item.status === 'rejected' && item.reason && (
                      <div className="mt-3 border-nv-danger border-l-2 pl-3">
                        <p className="nv-section-label text-nv-danger">{t('review.reasonLabel')}</p>
                        <p className="pt-1 font-display text-card text-nv-text-2">{item.reason}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-3">
                      <Link
                        to={item.link}
                        className="relative inline-flex h-9 items-center rounded-nv-pill bg-nv-accent px-3.5 font-semibold text-caption text-nv-card after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']"
                      >
                        {item.status === 'rejected' ? t('review.actFix') : t('review.actEdit')}
                      </Link>

                      {/* Membatalkan pengiriman hanya masuk akal selama masih
                          ditinjau — yang sudah ditolak tidak ada yang ditarik. */}
                      {item.status === 'in_review' &&
                        (item.kind === 'story' || item.kind === 'chapter') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => void onWithdraw(item)}
                          >
                            {t('review.actWithdraw')}
                          </Button>
                        )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </AsyncState>
      </div>

      {/* Catatan kaki serif (`7n`): ia menjelaskan kenapa satu antrean memuat
          empat jenis yang tidak mirip — aturan, bukan label. */}
      <p className="border-nv-line border-t pt-4 font-display text-card text-nv-text-2">
        {t('review.oneQueue')}
      </p>
    </div>
  )
}

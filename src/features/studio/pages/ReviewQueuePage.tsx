import { Link } from 'react-router'
import type { ReviewQueueItem } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Chip'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
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
            <ul className="grid gap-2.5">
              {list.map((item) => {
                const status = STATUS[item.status] ?? STATUS.in_review
                return (
                  <li
                    key={item.id}
                    className="rounded-nv-lg border border-nv-line bg-nv-card p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-caption text-nv-muted">{KIND[item.kind]}</p>
                        <p className="truncate font-semibold text-body text-nv-text">
                          {item.label}
                        </p>
                        {item.context && (
                          <p className="truncate text-caption text-nv-muted">{item.context}</p>
                        )}
                      </div>
                      <Badge tone={status?.tone ?? 'warning'} className="shrink-0">
                        {status?.label ?? t('review.stInReview')}
                      </Badge>
                    </div>

                    <p className="pt-1 text-caption text-nv-muted tabular-nums">
                      {t('review.submittedAt')(formatDateTime(new Date(item.submittedAt)))}
                    </p>

                    {/* Alasan penolakan tampil di barisnya sendiri — penulis
                        tidak boleh harus mencarinya (FR-STUDIO-38). */}
                    {item.status === 'rejected' && item.reason && (
                      <div className="mt-2.5 rounded-nv-md bg-nv-danger-bg p-3">
                        <p className="font-semibold text-caption text-nv-danger">
                          {t('review.reasonLabel')}
                        </p>
                        <p className="pt-0.5 text-caption text-nv-text">{item.reason}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2.5">
                      <Link
                        to={item.link}
                        className="inline-flex h-9 items-center rounded-nv-pill border border-nv-line px-3 font-semibold text-caption text-nv-text"
                      >
                        {item.status === 'rejected' ? t('review.actFix') : t('review.actEdit')}
                      </Link>

                      {/* Membatalkan pengiriman hanya masuk akal selama masih
                          ditinjau — yang sudah ditolak tidak ada yang ditarik. */}
                      {item.status === 'in_review' &&
                        (item.kind === 'story' || item.kind === 'chapter') && (
                          <Button variant="ghost" size="sm" onClick={() => void onWithdraw(item)}>
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

      <p className="pt-4 text-caption text-nv-muted">{t('review.oneQueue')}</p>
    </div>
  )
}

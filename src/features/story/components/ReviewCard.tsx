import { useState } from 'react'
import type { Review } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { ModerationActions } from '@/components/patterns/ModerationActions'
import { SpoilerVeil } from '@/components/patterns/SpoilerVeil'
import { StarRating } from '@/components/patterns/StarRating'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { formatDate } from '@/lib/format'
import { useMarkHelpful, useReplyToReview } from '../hooks/useReviews'

export interface ReviewCardProps {
  review: Review
  /** Milik pengguna sendiri: tidak bisa ditandai membantu, tetapi bisa disunting. */
  isMine?: boolean
  /** Benar hanya untuk pemilik cerita · FR-SOCIAL-04. Datang dari server. */
  canReply?: boolean
  onEdit?: () => void
}

/**
 * Satu kartu ulasan · FR-SOCIAL-03 & FR-SOCIAL-04.
 *
 * Rating tanpa teks **tetap dirender sebagai kartu**, bukan disembunyikan: ia
 * ikut membentuk rata-rata, dan menghilangkannya membuat jumlah penilai tidak
 * cocok dengan jumlah kartu yang terlihat.
 */
export function ReviewCard({ review, isMine, canReply, onEdit }: ReviewCardProps) {
  const toast = useToast()
  const helpful = useMarkHelpful()
  const reply = useReplyToReview()
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')

  async function onHelpful() {
    try {
      await helpful.mutateAsync({ reviewId: review.id, on: !review.markedHelpful })
    } catch (error) {
      toast.show(isApiError(error) ? error.message : t('failure.genericTitle'), { tone: 'danger' })
    }
  }

  return (
    <Card className="mt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium text-body">{review.userName}</p>
        <p className="text-caption text-nv-muted tabular-nums">
          {formatDate(new Date(review.createdAt))}
          {review.editedAt ? ` · ${t('social.edited')}` : ''}
        </p>
      </div>
      <StarRating value={review.stars} size={14} className="pt-1" />

      {review.text !== '' &&
        (review.spoiler ? (
          <SpoilerVeil className="mt-2">
            <p className="text-body">{review.text}</p>
          </SpoilerVeil>
        ) : (
          <p className="pt-2 text-body">{review.text}</p>
        ))}

      {review.tags.length > 0 && (
        <p className="pt-2 text-caption text-nv-muted">{review.tags.join(' · ')}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-3">
        {isMine ? (
          <>
            {onEdit && (
              <Button size="sm" variant="secondary" onClick={onEdit}>
                {t('social.edit')}
              </Button>
            )}
            {/* Penghitung yang bisa dinaikkan pemiliknya berhenti mengukur apa
                pun, jadi tombolnya tidak ada — bukan ada tapi mati. */}
            <span className="text-caption text-nv-muted tabular-nums">
              {t('social.helpful')(review.helpfulCount)}
            </span>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant={review.markedHelpful ? 'primary' : 'secondary'}
              onClick={() => void onHelpful()}
            >
              {t('social.helpful')(review.helpfulCount)}
            </Button>
            <ModerationActions
              targetType="review"
              targetId={review.id}
              targetLabel={t('moderation.targetReview')(review.userName)}
              ownerId={review.userId}
              ownerName={review.userName}
            />
          </>
        )}
      </div>

      {review.reply && (
        <div className="mt-3 rounded-nv-md bg-nv-paper p-3">
          <p className="flex flex-wrap items-center gap-2 text-caption">
            <span className="rounded-nv-pill bg-nv-accent px-2 py-0.5 text-nv-card">
              {t('social.authorBadge')}
            </span>
            <span className="font-medium">{review.reply.authorName}</span>
          </p>
          <p className="pt-1 text-body">{review.reply.text}</p>
        </div>
      )}

      {canReply && !review.reply && !replying && (
        <Button size="sm" variant="ghost" className="mt-2" onClick={() => setReplying(true)}>
          {t('social.reply')}
        </Button>
      )}

      {canReply && !review.reply && replying && (
        <div className="pt-3">
          <label className="block">
            <span className="sr-only">{t('social.reply')}</span>
            <textarea
              rows={3}
              value={replyText}
              placeholder={t('social.replyPlaceholder')}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full rounded-nv-md border border-nv-line bg-nv-card p-3 text-body text-nv-text"
            />
          </label>
          <Button
            size="sm"
            className="mt-2"
            disabled={replyText.trim() === '' || reply.isPending}
            onClick={() =>
              void reply.mutateAsync({ reviewId: review.id, text: replyText }).then(() => {
                setReplying(false)
                setReplyText('')
                toast.show(t('social.replied'))
              })
            }
          >
            {t('social.replySave')}
          </Button>
        </div>
      )}
    </Card>
  )
}

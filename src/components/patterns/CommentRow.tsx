import type { CommentBase } from '@/api/contracts'
import { SpoilerVeil } from '@/components/patterns/SpoilerVeil'
import { Button } from '@/components/ui/Button'
import { useLikeComment } from '@/hooks/useComments'
import { t } from '@/i18n/t'
import { formatRelative } from '@/lib/format'
import { ModerationActions } from './ModerationActions'

export interface CommentRowProps {
  comment: CommentBase
  onReply: () => void
}

/**
 * Satu komentar · FR-SOCIAL-05..07.
 *
 * Komentar yang **sedang ditinjau tetap menempati barisnya** dengan isinya
 * diganti keterangan (kanvas layar 18): pembaca lain melihat ada sesuatu di sana
 * dan sedang diproses, bukan konten yang hilang diam-diam.
 */
export function CommentRow({ comment, onReply }: CommentRowProps) {
  const like = useLikeComment()

  return (
    <article className="border-nv-line border-b py-3">
      <p className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-body">{comment.userName}</span>
        {comment.isAuthor && (
          <span className="rounded-nv-pill bg-nv-accent px-2 py-0.5 text-caption text-nv-card">
            {t('comments.authorBadge')}
          </span>
        )}
        <span className="text-caption text-nv-muted">
          {formatRelative(new Date(comment.createdAt))}
        </span>
      </p>

      {comment.underReview ? (
        <p className="pt-1 text-body text-nv-muted italic">{t('comments.underReview')}</p>
      ) : comment.spoiler ? (
        <SpoilerVeil className="mt-1">
          <p className="text-body">{comment.text}</p>
        </SpoilerVeil>
      ) : (
        <p className="pt-1 text-body">{comment.text}</p>
      )}

      {!comment.underReview && (
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            size="sm"
            variant={comment.liked ? 'secondary' : 'ghost'}
            onClick={() => void like.mutateAsync({ commentId: comment.id, on: !comment.liked })}
          >
            {t('comments.like')(comment.likeCount)}
          </Button>
          <Button size="sm" variant="ghost" onClick={onReply}>
            {t('comments.reply')}
          </Button>
          <ModerationActions
            targetType="comment"
            targetId={comment.id}
            targetLabel={t('moderation.targetComment')(comment.userName)}
            ownerId={comment.userId}
            ownerName={comment.userName}
          />
        </div>
      )}
    </article>
  )
}

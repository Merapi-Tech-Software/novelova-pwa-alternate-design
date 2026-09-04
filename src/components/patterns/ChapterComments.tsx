import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import type { CommentBase } from '@/api/contracts'
import { CommentParamsSchema } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/components/ui/Toast'
import { useComments, usePostComment } from '@/hooks/useComments'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
import { COMMENT_MAX_CHARS } from '@/lib/limits'
import { CommentRow } from './CommentRow'

export const COMMENT_SORTS = [
  { value: 'newest', label: t('comments.sNewest') },
  { value: 'liked', label: t('comments.sLiked') },
  { value: 'oldest', label: t('comments.sOldest') },
] as const

export interface ChapterCommentsProps {
  storyId: string
  chapterId: string
  sort: string
  onSort: (next: string) => void
  pageSize: number
  onMore: (next: number) => void
  /**
   * `top` — halaman penuh `7t`: menulis adalah hal pertama yang dilakukan
   * pembaca setelah menutup bab.
   * `bottom` — lembar `7w`: komposer menempel di dasar, karena di lembar yang
   * dibuka **sambil membaca** yang dicari lebih dulu adalah komentar orang lain.
   */
  composerAt: 'top' | 'bottom'
}

/**
 * Isi komentar bab · FR-SOCIAL-05 · mockup `7t` (halaman) dan `7w` (lembar).
 *
 * **Satu komponen, dua wadah.** Brief §8 menyebutnya "isi yang sama dalam dua
 * container", dan itu ditepati secara harfiah: halaman dan lembar merender
 * komponen ini, dan yang berbeda hanya di mana komposernya duduk. Menulisnya dua
 * kali berarti dua tempat yang akan berselisih pada perubahan berikutnya — dan
 * yang berselisih adalah aturan moderasi.
 *
 * **Bab terkunci menolak seluruhnya**, bukan hanya kolom tulisnya: komentar di
 * sini memuat isi babnya, dan membiarkannya terbaca sama dengan membocorkan
 * cerita lewat pintu samping.
 */
export function ChapterComments({
  storyId,
  chapterId,
  sort,
  onSort,
  pageSize,
  onMore,
  composerAt,
}: ChapterCommentsProps) {
  const toast = useToast()
  const params = CommentParamsSchema.parse({ page: 1, pageSize: Math.max(20, pageSize), sort })

  const comments = useComments(chapterId, params)
  const post = usePostComment()

  const [text, setText] = useState('')
  const [spoiler, setSpoiler] = useState(false)
  const [replyTo, setReplyTo] = useState<CommentBase | null>(null)

  async function onSend() {
    try {
      await post.mutateAsync({ chapterId, text, parentId: replyTo?.id ?? null, spoiler })
      setText('')
      setSpoiler(false)
      setReplyTo(null)
      toast.show(t('comments.sent'))
    } catch (error) {
      toast.show(isApiError(error) ? error.message : t('failure.genericTitle'), { tone: 'danger' })
    }
  }

  if (comments.error && isApiError(comments.error) && comments.error.code === 'FORBIDDEN') {
    return (
      <FailureNotice
        level="inset"
        title={t('comments.lockedTitle')}
        body={comments.error.message}
        actions={
          <Link
            to={`/cerita/${storyId}/bab/${chapterId}`}
            className="inline-flex h-11 items-center rounded-nv-pill border border-nv-accent px-4 text-body text-nv-accent"
          >
            {t('comments.lockedAction')}
          </Link>
        }
      />
    )
  }

  const composer = (
    <div
      className={cx(
        composerAt === 'top'
          ? 'mt-3 rounded-nv-lg border border-nv-line-soft bg-nv-card p-4'
          : 'border-nv-line border-t bg-nv-card pt-3',
      )}
    >
      {replyTo && (
        <p className="flex flex-wrap items-center gap-2 pb-2 text-caption text-nv-muted">
          {t('comments.replyTo')(replyTo.userName)}
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="underline underline-offset-4"
          >
            {t('comments.cancelReply')}
          </button>
        </p>
      )}

      <label className="block" htmlFor={`komentar-${composerAt}`}>
        <span className="sr-only">{t('comments.write')}</span>
        {/* Teks serif dan tanpa kotak (`7t`): yang ditulis di sini adalah
            pendapat tentang cerita, bukan isian formulir. */}
        <textarea
          id={`komentar-${composerAt}`}
          rows={composerAt === 'top' ? 2 : 1}
          value={text}
          maxLength={COMMENT_MAX_CHARS}
          placeholder={t('comments.placeholder')}
          onChange={(e) => setText(e.target.value)}
          className="w-full resize-none bg-transparent font-display text-card text-nv-text placeholder:font-ui placeholder:text-body placeholder:text-nv-disabled focus:outline-none"
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 border-nv-line border-t pt-2.5">
        <span className="text-caption text-nv-muted tabular-nums">
          {t('form.charCount')(text.length, COMMENT_MAX_CHARS)}
        </span>
        <div className="flex items-center gap-2.5">
          <span className="text-caption text-nv-muted">{t('comments.spoiler')}</span>
          <Switch checked={spoiler} onChange={setSpoiler} label={t('comments.spoiler')} hideLabel />
          <Button
            size="sm"
            variant={composerAt === 'top' ? 'secondary' : 'primary'}
            disabled={text.trim() === '' || post.isPending}
            onClick={() => void onSend()}
          >
            {t('comments.send')}
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <AsyncState
      loading={comments.isPending}
      error={comments.error}
      data={comments.data}
      onRetry={() => void comments.refetch()}
      empty={{ title: t('comments.emptyTitle'), description: t('comments.emptyBody') }}
    >
      {(page) => (
        <div className={cx(composerAt === 'bottom' && 'flex h-full flex-col')}>
          <SectionHeader
            label={t('comments.subtitle')(page.total)}
            action={
              <span className="relative inline-flex shrink-0 items-center gap-1 font-bold text-caption text-nv-gold">
                {COMMENT_SORTS.find((s) => s.value === sort)?.label ?? COMMENT_SORTS[0].label}
                <ChevronDown size={12} aria-hidden />
                <select
                  aria-label={t('comments.sortLabel')}
                  value={sort}
                  onChange={(e) => onSort(e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                >
                  {COMMENT_SORTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </span>
            }
          />

          {composerAt === 'top' && composer}

          <div className={cx(composerAt === 'bottom' && 'min-h-0 flex-1 overflow-y-auto')}>
            {page.items.length === 0 ? (
              <p className="pt-6 text-body text-nv-muted">{t('comments.emptyBody')}</p>
            ) : (
              <ol className="divide-y divide-nv-line pt-2">
                {page.items.map((comment) => (
                  <li key={comment.id}>
                    <CommentRow comment={comment} onReply={() => setReplyTo(comment)} />
                    {/* Balasan menjorok **satu tingkat saja**: membalas sebuah
                        balasan tetap mendarat di utas ini, dan servernya yang
                        menaikkan `parentId` (FR-SOCIAL-05). */}
                    {comment.replies && comment.replies.length > 0 && (
                      <ol className="border-nv-line border-l pl-3">
                        {comment.replies.map((child) => (
                          <li key={child.id}>
                            <CommentRow comment={child} onReply={() => setReplyTo(child)} />
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                ))}
              </ol>
            )}

            {page.hasMore && (
              <Button variant="secondary" className="mt-4" onClick={() => onMore(pageSize + 20)}>
                {t('comments.more')}
              </Button>
            )}

            <p className="py-4 text-center text-caption text-nv-muted tabular-nums">
              {t('comments.shown')(page.items.length, page.total)}
            </p>
          </div>

          {composerAt === 'bottom' && composer}
        </div>
      )}
    </AsyncState>
  )
}

import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import type { CommentBase } from '@/api/contracts'
import { CommentParamsSchema } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { AsyncState } from '@/components/ui/AsyncState'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { COMMENT_MAX_CHARS } from '@/lib/limits'
import { CommentRow } from '../components/CommentRow'
import { useComments, usePostComment } from '../hooks/useComments'

const SORTS = [
  { value: 'newest', label: t('comments.sNewest') },
  { value: 'liked', label: t('comments.sLiked') },
  { value: 'oldest', label: t('comments.sOldest') },
] as const

/**
 * Komentar bab `/cerita/:storyId/bab/:chapterId/komentar` · FR-SOCIAL-05.
 *
 * Menggantikan tautan menggantung `chapter_comments_thread_best_ads.html` —
 * tautan kedua dari tiga yang di prototipe menuju fitur yang tidak pernah ada.
 *
 * **Bab terkunci menolak seluruh halaman**, bukan hanya kolom tulisnya: komentar
 * di sini memuat isi babnya, dan membiarkannya terbaca sama dengan membocorkan
 * cerita lewat pintu samping.
 */
export default function CommentsPage() {
  const { storyId = '', chapterId = '' } = useParams()
  const [search, setSearch] = useSearchParams()
  const toast = useToast()

  const params = CommentParamsSchema.parse({
    page: 1,
    pageSize: Math.max(20, Number(search.get('muat') ?? 20)),
    sort: search.get('urut') ?? 'newest',
  })

  const comments = useComments(chapterId, params)
  const post = usePostComment()

  const [text, setText] = useState('')
  const [spoiler, setSpoiler] = useState(false)
  const [replyTo, setReplyTo] = useState<CommentBase | null>(null)

  async function onSend() {
    try {
      await post.mutateAsync({
        chapterId,
        text,
        parentId: replyTo?.id ?? null,
        spoiler,
      })
      setText('')
      setSpoiler(false)
      setReplyTo(null)
      toast.show(t('comments.sent'))
    } catch (error) {
      toast.show(isApiError(error) ? error.message : t('failure.genericTitle'), { tone: 'danger' })
    }
  }

  // Bab terkunci: satu sisipan yang menjelaskan **dan** menawarkan jalannya,
  // bukan halaman kosong (arch §1.4).
  if (comments.error && isApiError(comments.error) && comments.error.code === 'FORBIDDEN') {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-10">
        <FailureNotice
          level="inset"
          title={t('comments.lockedTitle')}
          body={comments.error.message}
          actions={
            <Link
              to={`/cerita/${storyId}/bab/${chapterId}`}
              className="inline-flex h-11 items-center rounded-nv-pill border border-nv-accent px-4 text-body text-nv-accent-strong"
            >
              {t('comments.lockedAction')}
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-10">
      <AsyncState
        loading={comments.isPending}
        error={comments.error}
        data={comments.data}
        onRetry={() => void comments.refetch()}
        empty={{ title: t('comments.emptyTitle'), description: t('comments.emptyBody') }}
      >
        {(page) => (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-body text-nv-muted tabular-nums">
                {t('comments.subtitle')(page.total)}
              </p>
              <label className="text-caption text-nv-muted">
                <span className="sr-only">{t('comments.sortLabel')}</span>
                <select
                  className="h-11 rounded-nv-pill border border-nv-line bg-nv-card px-3 text-body text-nv-text"
                  value={params.sort}
                  onChange={(e) => {
                    const query = new URLSearchParams(search)
                    query.set('urut', e.target.value)
                    setSearch(query, { replace: true })
                  }}
                >
                  {SORTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Kolom tulis di atas daftar: setelah membaca bab, yang paling
                sering dilakukan adalah menulis — bukan menggulir ke bawah dulu. */}
            <div className="pt-4">
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
              <label className="block" htmlFor="komentar">
                <span className="sr-only">{t('comments.write')}</span>
                <textarea
                  id="komentar"
                  rows={3}
                  value={text}
                  maxLength={COMMENT_MAX_CHARS}
                  placeholder={t('comments.placeholder')}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full rounded-nv-md border border-nv-line bg-nv-card p-3 text-body text-nv-text"
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-caption text-nv-muted tabular-nums">
                  {t('form.charCount')(text.length, COMMENT_MAX_CHARS)}
                </span>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={spoiler}
                    onChange={setSpoiler}
                    label={t('comments.spoiler')}
                    hideLabel
                  />
                  <span className="text-caption text-nv-muted">{t('comments.spoiler')}</span>
                  <Button
                    size="sm"
                    disabled={text.trim() === '' || post.isPending}
                    onClick={() => void onSend()}
                  >
                    {t('comments.send')}
                  </Button>
                </div>
              </div>
            </div>

            {page.items.length === 0 ? (
              <p className="pt-6 text-body text-nv-muted">{t('comments.emptyBody')}</p>
            ) : (
              <ol className="pt-4">
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
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => {
                  const query = new URLSearchParams(search)
                  query.set('muat', String(params.pageSize + 20))
                  setSearch(query, { replace: true })
                }}
              >
                {t('comments.more')}
              </Button>
            )}
            <p className="pt-3 text-caption text-nv-muted tabular-nums">
              {t('comments.shown')(page.items.length, page.total)}
            </p>
          </>
        )}
      </AsyncState>
    </div>
  )
}

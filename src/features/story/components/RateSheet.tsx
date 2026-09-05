import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { Review } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { StarRating } from '@/components/patterns/StarRating'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Sheet } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { REVIEW_MAX_CHARS, REVIEW_MIN_CHARS, REVIEW_TAGS_MAX } from '@/lib/limits'
import {
  useDeleteRating,
  useDeleteReview,
  useMyRating,
  useRateStory,
  useSubmitReview,
} from '../hooks/useReviews'

/** Daftar tag deskriptif · FR-SOCIAL-02. */
const TAGS = ['slow burn', 'chemistry', 'plot twist', 'world building', 'karakter kuat'] as const

const draftKey = (storyId: string) => `novelova:review-draft-${storyId}`

export interface RateSheetProps {
  storyId: string
  open: boolean
  onClose: () => void
  myReview: Review | null
}

/**
 * Lembar beri rating & tulis ulasan · FR-SOCIAL-01 & FR-SOCIAL-02.
 *
 * Dua langkah, dan **langkah pertama sudah sah sendirian**: memberi bintang
 * langsung tersimpan, lalu ajakan menulis ulasan muncul sebagai tawaran — bukan
 * sebagai syarat. Rating yang menuntut esai adalah rating yang tidak pernah
 * diberikan.
 */
export function RateSheet({ storyId, open, onClose, myReview }: RateSheetProps) {
  const toast = useToast()
  const myRating = useMyRating(storyId)
  const rate = useRateStory()
  const removeRating = useDeleteRating()
  const submit = useSubmitReview()
  const removeReview = useDeleteReview()

  const [writing, setWriting] = useState(false)
  const [text, setText] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [spoiler, setSpoiler] = useState(false)
  const [blocked, setBlocked] = useState<string | null>(null)

  const stars = myRating.data?.stars ?? 0

  /**
   * Draf lokal · FR-SOCIAL-02. Dipulihkan saat lembar dibuka, dan **ulasan yang
   * sudah terkirim menang atas draf** — draf hanya untuk yang belum sampai ke
   * server.
   */
  useEffect(() => {
    if (!open) return
    if (myReview) {
      setText(myReview.text)
      setTags(myReview.tags)
      setSpoiler(myReview.spoiler)
      setWriting(myReview.text !== '')
      return
    }
    const draft = localStorage.getItem(draftKey(storyId))
    if (draft) {
      setText(draft)
      setWriting(true)
      toast.show(t('social.draftRestored'))
    }
  }, [open, storyId, myReview, toast])

  function onText(next: string) {
    setText(next)
    if (myReview) return
    // Hanya draf yang belum pernah terkirim yang perlu diselamatkan.
    if (next.trim() === '') localStorage.removeItem(draftKey(storyId))
    else localStorage.setItem(draftKey(storyId), next)
  }

  async function onStars(next: 1 | 2 | 3 | 4 | 5) {
    try {
      await rate.mutateAsync({ storyId, stars: next })
      setBlocked(null)
      toast.show(t('social.saved')(next))
    } catch (error) {
      // Belum membaca satu bab pun → **ajakan**, bukan penolakan diam-diam.
      setBlocked(isApiError(error) ? error.message : t('failure.genericTitle'))
    }
  }

  async function onSubmit() {
    try {
      await submit.mutateAsync({
        storyId,
        stars: (stars || 1) as 1 | 2 | 3 | 4 | 5,
        text,
        tags,
        spoiler,
      })
      localStorage.removeItem(draftKey(storyId))
      toast.show(myReview ? t('social.updated') : t('social.submitted'))
      onClose()
    } catch (error) {
      toast.show(isApiError(error) ? error.message : t('failure.genericTitle'), { tone: 'danger' })
    }
  }

  const length = text.trim().length
  const textValid = length >= REVIEW_MIN_CHARS && length <= REVIEW_MAX_CHARS

  return (
    <Sheet open={open} onClose={onClose} title={t('social.sheetTitle')}>
      <StarRating value={stars} onChange={(next) => void onStars(next)} size={32} />
      <p className="sr-only">{t('social.starsLabel')}</p>

      {blocked && (
        <div className="mt-3 rounded-nv-md border border-nv-danger p-3">
          <p className="text-body text-nv-danger">{blocked}</p>
          <Link to={`/cerita/${storyId}`} className="nv-tap text-body text-nv-accent underline">
            {t('social.needReadCta')}
          </Link>
        </div>
      )}

      {stars > 0 && !writing && (
        <div className="pt-4">
          <p className="text-body text-nv-muted">{t('social.afterStars')}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" onClick={() => setWriting(true)}>
              {t('social.writeCta')}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              {t('social.later')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                void removeRating.mutateAsync(storyId).then(() => {
                  toast.show(t('social.removed'))
                  onClose()
                })
              }
            >
              {t('social.remove')}
            </Button>
          </div>
        </div>
      )}

      {writing && (
        <div className="pt-4">
          <label className="block" htmlFor="ulasan">
            <span className="text-caption text-nv-muted">{t('social.textLabel')}</span>
            <textarea
              id="ulasan"
              rows={5}
              value={text}
              onChange={(e) => onText(e.target.value)}
              className="mt-1 w-full rounded-nv-md border border-nv-line-soft bg-nv-card p-3 font-display text-card text-nv-text"
            />
          </label>
          <p className="pt-1 text-caption text-nv-muted tabular-nums">
            {t('form.charCount')(length, REVIEW_MAX_CHARS)} ·{' '}
            {t('social.textHint')(REVIEW_MIN_CHARS, REVIEW_MAX_CHARS)}
          </p>

          <fieldset className="pt-3">
            <legend className="text-caption text-nv-muted">
              {t('social.tagsLabel')(REVIEW_TAGS_MAX)}
            </legend>
            <div className="flex flex-wrap gap-2 pt-2">
              {TAGS.map((tag) => (
                <Chip
                  key={tag}
                  selected={tags.includes(tag)}
                  onClick={() =>
                    setTags((current) =>
                      current.includes(tag)
                        ? current.filter((x) => x !== tag)
                        : current.length < REVIEW_TAGS_MAX
                          ? [...current, tag]
                          : current,
                    )
                  }
                >
                  {tag}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center justify-between gap-3 pt-3">
            <span className="text-body">{t('social.spoiler')}</span>
            <Switch checked={spoiler} onChange={setSpoiler} label={t('social.spoiler')} />
          </div>

          <div className="flex flex-wrap gap-2 pt-4">
            <Button disabled={!textValid || submit.isPending} onClick={() => void onSubmit()}>
              {myReview ? t('social.update') : t('social.submit')}
            </Button>
            {myReview && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (!window.confirm(t('social.deleteConfirm'))) return
                  void removeReview.mutateAsync(storyId).then(() => {
                    toast.show(t('social.deleted'))
                    onClose()
                  })
                }}
              >
                {t('social.deleteReview')}
              </Button>
            )}
          </div>
        </div>
      )}
    </Sheet>
  )
}

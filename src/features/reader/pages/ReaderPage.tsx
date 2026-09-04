import { Heart, MessageSquare } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api } from '@/api/client'
import { isApiError, VISIBLE_CODES } from '@/api/errors'
import { AdSlot } from '@/components/patterns/AdSlot'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useStory } from '@/hooks/useStory'
import { useWallet } from '@/hooks/useWallet'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import { useReaderSettings } from '@/stores/readerSettings'
import { AdUnlockScreen } from '../components/AdUnlockScreen'
import { ChapterGate } from '../components/ChapterGate'
import { ChapterEnd, ChapterNav } from '../components/ChapterNav'
import { InsufficientCoins } from '../components/InsufficientCoins'
import { ReaderBar } from '../components/ReaderBar'
import { ReaderSettingsPanel } from '../components/ReaderSettingsPanel'
import { useChapter } from '../hooks/useChapter'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { useTts } from '../hooks/useTts'
import { useAdQuota, useUnlockChapter, useUnlockOptions } from '../hooks/useUnlock'

/** Ambang keterlihatan gerbang sebelum auto-unlock menyala (FR-READ-09). */
const AUTO_UNLOCK_RATIO = 0.35
/** Di bawah ini bacaan dianggap belum benar-benar dimulai. */
const RESUME_MIN = 0.05
/** Di atas ini babnya sudah selesai — tidak ada yang perlu dilanjutkan. */
const RESUME_MAX = 0.9

function sentencesOf(paragraphs: string[]): string[] {
  return paragraphs.flatMap((p) => p.split(/(?<=[.!?])\s+/)).filter((s) => s.trim().length > 0)
}

/**
 * Ruang baca · FR-READ-01 sampai FR-READ-18.
 *
 * Satu halaman yang memikul banyak hal, dan urutannya disengaja: bilah, gerbang
 * (bila terkunci), teks, iklan, reaksi, penutup bab, navigasi. Yang terkunci
 * tidak pernah merender naskahnya sama sekali.
 */
export default function ReaderPage() {
  const { storyId, chapterId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortBy, setShortBy] = useState<number | null>(null)
  const [watchingAd, setWatchingAd] = useState(false)
  const [adFailed, setAdFailed] = useState(false)
  const [liked, setLiked] = useState(false)
  const [resumeAt, setResumeAt] = useState<number | null>(null)
  const [attempt, setAttempt] = useState(() => crypto.randomUUID())
  const autoTried = useRef<string | null>(null)
  const gateRef = useRef<HTMLDivElement>(null)

  const chapter = useChapter(storyId, chapterId)
  const story = useStory(storyId)
  const wallet = useWallet()
  const quota = useAdQuota()
  const settings = useReaderSettings()

  const locked = chapter.data !== undefined && !chapter.data.owned
  const options = useUnlockOptions(chapterId, locked)
  const unlock = useUnlockChapter(storyId, chapterId)

  const body = chapter.data?.owned ? (chapter.data.content[0]?.body ?? []) : []
  const tts = useTts(sentencesOf(body))
  useReadingProgress(storyId, chapterId, chapter.data?.owned === true)

  const balance = wallet.data?.balance ?? 0
  const adLeft = Math.max(0, (quota.data?.max ?? 0) - (quota.data?.used ?? 0))

  /** Berpindah bab: gulir, suara, dan indikator kalimat direset — pengaturan tidak. */
  const go = useCallback(
    (target: string) => {
      tts.stop()
      if (target.startsWith('story:')) {
        navigate(`/cerita/${target.slice('story:'.length)}`)
        return
      }
      navigate(`/cerita/${storyId}/bab/${target}`)
    },
    [navigate, storyId, tts],
  )

  // Pindah bab mereset gulir dan menyetel ulang pengaman auto-unlock — tetapi
  // **tidak** menyentuh pengaturan baca (FR-READ-15).
  // biome-ignore lint/correctness/useExhaustiveDependencies: berpindah bab yang jadi pemicunya
  useEffect(() => {
    window.scrollTo(0, 0)
    autoTried.current = null
    setResumeAt(null)
  }, [chapterId])

  const buy = useCallback(
    (source: 'coin' | 'bundle' | 'full') => {
      unlock.mutate(
        { source, idempotencyKey: attempt },
        {
          onSuccess: () => {
            setAttempt(crypto.randomUUID())
            toast.show(t('reader.unlocked'))
          },
          onError: (failure) => {
            if (isApiError(failure) && failure.code === 'INSUFFICIENT_COINS') {
              setShortBy(Number(failure.detail ?? 0))
              return
            }
            toast.show(isApiError(failure) ? failure.message : t('failure.genericTitle'))
          },
        },
      )
    },
    [attempt, toast, unlock],
  )

  /**
   * Auto-unlock · FR-READ-09. Empat pengaman, dan semuanya perlu:
   * sakelarnya menyala · babnya memang terkunci · belum pernah dicoba untuk bab
   * ini · tidak ada permintaan yang sedang berjalan. Selalu **harga satuan** —
   * membeli bundel tanpa diminta adalah hal terakhir yang boleh dilakukan
   * otomatis.
   */
  const tryAuto = useCallback(() => {
    if (!settings.autoUnlock || !locked || !chapterId) return
    if (autoTried.current === chapterId || unlock.isPending) return

    autoTried.current = chapterId
    buy('coin')
  }, [settings.autoUnlock, locked, chapterId, unlock.isPending, buy])

  useEffect(() => {
    // Evaluasi langsung saat sakelarnya dinyalakan, tanpa menunggu gulir.
    if (settings.autoUnlock) tryAuto()
  }, [settings.autoUnlock, tryAuto])

  useEffect(() => {
    const node = gateRef.current
    if (!node || !locked) return

    // Fallback bila peramban tidak punya IntersectionObserver: gerbang yang
    // sudah terlihat langsung dievaluasi sekali.
    if (typeof IntersectionObserver === 'undefined') {
      tryAuto()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].intersectionRatio >= AUTO_UNLOCK_RATIO) tryAuto()
      },
      { threshold: AUTO_UNLOCK_RATIO },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [locked, tryAuto])

  useEffect(() => {
    if (!storyId || !chapterId || !chapter.data?.owned) return

    void api.getProgress(storyId).then((progress) => {
      if (!progress || progress.lastChapterId !== chapterId) return
      if (progress.scrollPct > RESUME_MIN && progress.scrollPct < RESUME_MAX) {
        setResumeAt(progress.scrollPct)
      }
    })
  }, [storyId, chapterId, chapter.data?.owned])

  if (chapter.isPending) {
    return (
      <div className="mx-auto max-w-[68ch] px-4 py-6">
        <Skeleton lines={10} />
      </div>
    )
  }

  // Bab yang ditarik penulisnya punya layarnya sendiri, bukan pesan gagal biasa
  // (CONTENT-410). Koin yang terpakai sudah dikembalikan server saat ini juga.
  if (chapter.isError && isApiError(chapter.error)) {
    const withdrawn = chapter.error.code === VISIBLE_CODES.CONTENT_WITHDRAWN
    const at = chapter.error.detail

    return (
      <FailureNotice
        level="fullscreen"
        title={withdrawn ? t('reader.withdrawnTitle') : t('failure.genericTitle')}
        body={
          withdrawn && at
            ? t('reader.withdrawnBody')(formatDate(new Date(at)))
            : t('failure.genericBody')
        }
        safety={withdrawn ? t('reader.withdrawnSafe') : t('failure.genericSafe')}
        onRetry={() => void chapter.refetch()}
        actions={
          withdrawn ? (
            <>
              <Button variant="secondary" onClick={() => go(`story:${storyId}`)}>
                {t('reader.backToChapters')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  void api.toggleFollow(storyId ?? '').then(() => toast.show(t('reader.notifyOn')))
                }}
              >
                {t('reader.notifyMe')}
              </Button>
            </>
          ) : undefined
        }
      />
    )
  }

  if (!chapter.data) return null

  const data = chapter.data
  const total = story.data?.stats.chapterCount ?? data.number
  const sentences = sentencesOf(body)
  const middle = Math.floor(body.length / 2)

  return (
    <div>
      <ReaderBar
        chapter={data}
        storyId={storyId ?? ''}
        total={total}
        settingsOpen={settingsOpen}
        onToggleSettings={() => setSettingsOpen((on) => !on)}
        tts={tts}
      />

      <ReaderSettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <article className="mx-auto max-w-[68ch] px-4 py-6 lg:pr-80">
        <h1 className="mb-5 font-display text-page leading-tight font-bold">{data.title}</h1>

        {/* Ditawarkan, bukan dilompati sendiri: pembaca yang membuka bab lagi
            belum tentu ingin melanjutkan dari tempat ia berhenti (FR-READ-16). */}
        {resumeAt !== null && (
          <div className="mb-5 rounded-nv-lg border border-nv-line bg-nv-paper-2 p-4">
            <p className="text-body font-semibold">{t('reader.resumeTitle')}</p>
            <p className="pt-1 text-body text-nv-muted">
              {t('reader.resumeBody')(Math.round(resumeAt * 100))}
            </p>
            <div className="flex gap-2 pt-3">
              <Button
                size="sm"
                onClick={() => {
                  const scrollable = document.documentElement.scrollHeight - window.innerHeight
                  window.scrollTo({ top: scrollable * resumeAt, behavior: 'smooth' })
                  setResumeAt(null)
                }}
              >
                {t('reader.resumeGo')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setResumeAt(null)}>
                {t('reader.resumeStay')}
              </Button>
            </div>
          </div>
        )}

        <div
          className="space-y-4 font-read text-nv-text"
          style={{ fontSize: 'var(--reader-font-size)', lineHeight: 1.8 }}
        >
          {body.map((paragraph, index) => (
            <div key={paragraph.slice(0, 40)}>
              <p
                className={cx(
                  tts.current >= 0 &&
                    paragraph.includes(sentences[tts.current] ?? '\u0000') &&
                    'rounded-nv-sm bg-nv-accent-soft',
                )}
              >
                {paragraph}
              </p>

              {/* Tiga slot: setelah paragraf pertama, di tengah, dan di akhir
                  bab (FR-READ-12) — di sela bacaan, bukan menutupi teksnya. */}
              {(index === 0 || index === middle) && (
                <AdSlot variant="slim" className="mt-4" title={t('home.adSlimTitle')} />
              )}
            </div>
          ))}
        </div>

        {locked && (
          <div ref={gateRef}>
            <ChapterGate
              chapter={data}
              options={options.data ?? []}
              loading={options.isPending}
              balance={balance}
              adLeft={adLeft}
              pending={unlock.isPending}
              onPick={buy}
              onWatchAd={() => setWatchingAd(true)}
            />
          </div>
        )}

        {data.owned && (
          <>
            <AdSlot variant="native" className="mt-8" title={t('home.adNativeTitle')} />

            <div className="mt-6 flex items-center gap-2 border-nv-line border-t pt-4">
              <Button
                size="sm"
                variant={liked ? 'secondary' : 'ghost'}
                iconLeft={<Heart size={15} />}
                onClick={() => {
                  const next = !liked
                  setLiked(next)
                  void api.react({ type: 'chapter', id: data.id }, next)
                }}
              >
                {liked ? t('reader.liked') : t('reader.like')}
              </Button>
              <Link
                to={`/cerita/${storyId}/bab/${data.id}/komentar`}
                className="inline-flex h-9 items-center gap-1.5 rounded-nv-pill px-3.5 text-caption font-semibold text-nv-muted"
              >
                <MessageSquare size={15} aria-hidden />
                {t('reader.comments')(data.commentCount)}
              </Link>
            </div>

            <ChapterEnd chapter={data} storyId={storyId ?? ''} onGo={go} />
          </>
        )}

        {data.owned && data.content[0]?.authorNote && (
          <aside className="mt-8 rounded-nv-lg border border-nv-line border-dashed p-4">
            <p className="text-caption tracking-wide text-nv-muted uppercase">
              {t('reader.authorNote')}
            </p>
            <p className="pt-1 text-body">{data.content[0].authorNote}</p>
          </aside>
        )}
      </article>

      <ChapterNav chapter={data} total={total} onGo={go} />

      <InsufficientCoins
        open={shortBy !== null}
        onClose={() => setShortBy(null)}
        shortBy={shortBy ?? 0}
        balance={balance}
        storyId={storyId ?? ''}
        chapterId={chapterId ?? ''}
        adLeft={adLeft}
        onWatchAd={() => {
          setShortBy(null)
          setWatchingAd(true)
        }}
      />

      {adFailed && (
        <FailureNotice
          level="toast"
          title={t('reader.adFailed')}
          onRetry={() => {
            setAdFailed(false)
            setWatchingAd(true)
          }}
          retryLabel={t('reader.adRetry')}
          className="fixed inset-x-4 bottom-20 z-50"
        />
      )}

      {watchingAd && (
        <AdUnlockScreen
          onFinish={() => {
            setWatchingAd(false)
            unlock.mutate(
              { source: 'ad', idempotencyKey: attempt },
              {
                onSuccess: () => {
                  setAttempt(crypto.randomUUID())
                  toast.show(t('reader.unlocked'))
                },
                onError: (failure) => {
                  // Kuota tidak berkurang saat gagal: server hanya memotongnya
                  // di dalam transaksi yang berhasil.
                  setAdFailed(true)
                  toast.show(isApiError(failure) ? failure.message : t('reader.adFailedBody'))
                },
              },
            )
          }}
          onCancel={() => {
            setWatchingAd(false)
            toast.show(t('reader.adCancelled'))
          }}
        />
      )}
    </div>
  )
}

import { Heart, LockOpen } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { api } from '@/api/client'
import { isApiError, VISIBLE_CODES } from '@/api/errors'
import { AdSlot } from '@/components/patterns/AdSlot'
import { ChapterComments } from '@/components/patterns/ChapterComments'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Card'
import { Sheet } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useChapter } from '@/hooks/useChapter'
import { useStory } from '@/hooks/useStory'
import { useVouchers } from '@/hooks/useVouchers'
import { useWallet } from '@/hooks/useWallet'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import { AdUnlockScreen } from '../components/AdUnlockScreen'
import { BundleBand } from '../components/BundleBand'
import { ChapterGate } from '../components/ChapterGate'
import { ChapterEnd, ChapterNav } from '../components/ChapterNav'
import { InsufficientCoins } from '../components/InsufficientCoins'
import { ReaderBar } from '../components/ReaderBar'
import { ReaderSettingsPanel } from '../components/ReaderSettingsPanel'
import {
  useAutoUnlockAllowed,
  useBundleOffer,
  useDismissBundleOffer,
  useSetAutoUnlock,
} from '../hooks/useAutoUnlock'
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

  /*
   * **Type A: chrome tersembunyi sejak awal** (`7u`), dan satu ketukan pada teks
   * membukanya (`7v`).
   *
   * Bab **terkunci** dikecualikan: bilah atasnya selalu terlihat (`7x`).
   * Alasannya bukan estetika — tanpa bilah, bab terkunci tidak punya tombol
   * kembali sampai pembaca menebak bahwa layar bisa diketuk.
   */
  const [chromeOpen, setChromeOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  /*
   * Urutan dan jumlah muat komentar di **keadaan lokal**, bukan URL: lembar ini
   * dibuka di atas ruang baca dan tidak punya alamatnya sendiri untuk dibagikan.
   * Halaman penuhnya (`7t`) yang menyimpannya di URL.
   */
  const [commentSort, setCommentSort] = useState('newest')
  const [commentSize, setCommentSize] = useState(20)

  const chapter = useChapter(storyId, chapterId)
  const story = useStory(storyId)
  const wallet = useWallet()
  const quota = useAdQuota()
  const voucher = useVouchers()

  const locked = chapter.data !== undefined && !chapter.data.owned
  const options = useUnlockOptions(chapterId, locked)
  const unlock = useUnlockChapter(storyId, chapterId)
  // Izin buka-otomatis **cerita ini** — dari seam, bukan dari `stores/` (§1.19).
  const bolehOtomatis = useAutoUnlockAllowed(storyId)
  const setAuto = useSetAutoUnlock()
  const bundel = useBundleOffer(storyId, chapterId)
  const tolakBundel = useDismissBundleOffer()
  /*
   * **Tercentang bawaan** (FR-READ-09). Ia keadaan layar, bukan keadaan server:
   * yang tersimpan baru terjadi saat pembaca menekan salah satu pilihan bayar,
   * dan sampai saat itu ia cuma niat.
   */
  const [izinDicentang, setIzinDicentang] = useState(true)
  /** Koin yang terpotong pada pembukaan bab ini — `null` bila bukan barusan. */
  const [dibukaBarusan, setDibukaBarusan] = useState<number | null>(null)

  const body = chapter.data?.owned ? (chapter.data.content[0]?.body ?? []) : []
  const tts = useTts(sentencesOf(body))
  const readPct = useReadingProgress(storyId, chapterId, chapter.data?.owned === true)

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
    setDibukaBarusan(null)
  }, [chapterId])

  const buy = useCallback(
    (source: 'coin' | 'bundle' | 'full', opsi?: { auto?: boolean; enableAutoUnlock?: boolean }) => {
      unlock.mutate(
        {
          source,
          idempotencyKey: attempt,
          // Dua bendera, dan keduanya dikirim **bersama pembeliannya**: beli
          // bab dan nyalakan izinnya adalah satu tindakan pembaca di gerbang,
          // dan memecahnya membuka keadaan "koin terpotong, izin gagal
          // tersimpan" (§1.21).
          ...(opsi?.auto ? { auto: true } : {}),
          ...(opsi?.enableAutoUnlock ? { enableAutoUnlock: true } : {}),
        },
        {
          onSuccess: (hasil) => {
            setAttempt(crypto.randomUUID())
            // Dipakai lencana `CHAPTER TERBUKA` di `7y`; direset saat pindah bab.
            setDibukaBarusan(hasil.coinsSpent)
            // Toast pembukaan otomatis **berbunyi beda**: pembaca tidak menekan
            // apa pun, jadi kalimat yang sama akan terbaca seolah ia yang
            // melakukannya.
            toast.show(
              opsi?.auto ? t('reader.unlockedAuto')(hasil.coinsSpent) : t('reader.unlocked'),
            )
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
   * **izin cerita ini menyala** · babnya memang terkunci · belum pernah dicoba
   * untuk bab ini · tidak ada permintaan yang sedang berjalan. Selalu **harga
   * satuan** — membeli bundel atau paket tamat tanpa diminta adalah hal terakhir
   * yang boleh dilakukan otomatis.
   *
   * Izinnya dibaca dari **seam**, bukan dari `stores/`: sejak §1.19 ia per
   * cerita dan tersimpan di server, karena ia memberi wewenang memotong koin.
   */
  const tryAuto = useCallback(() => {
    if (!bolehOtomatis || !locked || !chapterId) return
    if (autoTried.current === chapterId || unlock.isPending) return

    autoTried.current = chapterId
    buy('coin', { auto: true })
  }, [bolehOtomatis, locked, chapterId, unlock.isPending, buy])

  useEffect(() => {
    // Evaluasi langsung begitu izinnya diketahui, tanpa menunggu gulir.
    if (bolehOtomatis) tryAuto()
  }, [bolehOtomatis, tryAuto])

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
      if (!progress) return

      /*
       * Posisi **bab ini**, bukan posisi bab terakhir yang dibaca (R7). Sebelum
       * ini, kembali ke bab yang lebih awal selalu mulai dari atas — dan bagi
       * pembaca itu tidak bisa dibedakan dari kehilangan tempat.
       *
       * `scrollPct` tetap jadi cadangan untuk bab terakhir: progres yang
       * tersimpan sebelum kolom per-bab ada tidak punya entri di sana.
       */
      const posisi =
        // `?.` bukan kehati-hatian berlebihan: baris progres yang ditulis
        // sebelum kolom ini ada tidak punya objeknya sama sekali, dan
        // mengindeks `undefined` melempar — di halaman yang sedang dibaca.
        progress.scrollByChapter?.[chapterId] ??
        (progress.lastChapterId === chapterId ? progress.scrollPct : 0)

      if (posisi > RESUME_MIN && posisi < RESUME_MAX) setResumeAt(posisi)
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
      {(chromeOpen || locked) && (
        <ReaderBar
          chapter={data}
          storyId={storyId ?? ''}
          total={total}
          settingsOpen={settingsOpen}
          onToggleSettings={() => setSettingsOpen((on) => !on)}
          tts={tts}
          locked={locked}
        />
      )}

      <ReaderSettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/*
        Ketukan pada teks membuka/menutup kontrol. Ketukan yang mendarat di
        tautan, tombol, atau kolom **tidak** ikut menutup: kalau ikut, menekan
        "Selengkapnya" atau tombol di dalam gerbang akan menyembunyikan kontrol
        pada saat yang sama — dua hal terjadi dari satu ketukan.
        `onClick` di elemen non-interaktif, jadi ia bukan target keyboard;
        pembaca papan ketik punya bilahnya lewat `Escape`/fokus, dan Type B
        memang tidak pernah menyembunyikannya.
      */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: pengganti keyboard-nya adalah bilah yang memang tidak pernah disembunyikan untuk bab terkunci */}
      <article
        /*
          Ruang untuk bilah melayang **selalu disediakan**, bukan ditambahkan
          saat kontrolnya muncul. Menambahkannya saat diketuk menggeser teks
          ~290px di bawah jari pembaca — mengetuk untuk *melihat* kontrol tidak
          boleh memindahkan yang sedang dibaca. `7u` juga menggambar ruang lega
          di atas pembuka bab meski bilahnya belum ada.
        */
        className="mx-auto max-w-[68ch] px-4 pt-24 pb-36 lg:pr-80"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a,button,input,select,textarea,[role="button"]'))
            return
          setChromeOpen((on) => !on)
        }}
      >
        {/* Pembuka bab `7u`: label kecil, judul serif, garis emas. */}
        <p className="nv-section-label text-center">{t('reader.chapterLabel')(data.number)}</p>
        <h1 className="pt-2 text-center font-display text-page leading-tight font-semibold">
          {data.title}
        </h1>
        <span aria-hidden className="mx-auto mt-4 mb-7 block h-px w-10 bg-nv-gold-line" />

        {/*
          Pita tawaran bundel · FR-READ-19. Di pembuka bab, **tidak menghalangi
          apa pun** — alur ini menjanjikan membaca tanpa terputus, dan lembar
          yang menghentikan pembaca untuk menawarinya belanja adalah kebalikan
          dari yang dibelinya.
        */}
        {bundel.data && (
          <BundleBand
            offer={bundel.data}
            pending={unlock.isPending}
            onTake={() => {
              // **Pembelian eksplisit** — auto-unlock tidak pernah membeli
              // bundel sendiri (FR-READ-09).
              buy('bundle')
              if (storyId) tolakBundel.mutate(storyId)
            }}
            onDismiss={() => storyId && tolakBundel.mutate(storyId)}
          />
        )}

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

        {/*
          **Bagian gratisnya dibaca persis seperti Type A**, lalu berhenti di
          blok gerbang (`7x`). Paragraf pembuka datang dari `preview`; sisanya
          yang diburamkan di dalam gerbang.
        */}
        {locked && data.preview.length > 0 && (
          <div
            className="space-y-4 font-read text-nv-text"
            style={{ fontSize: 'var(--reader-font-size)', lineHeight: 1.8 }}
          >
            <p>{data.preview[0]}</p>
          </div>
        )}

        {locked && (
          <div ref={gateRef}>
            <ChapterGate
              chapter={data}
              censored={data.preview.slice(1)}
              options={options.data ?? []}
              loading={options.isPending}
              balance={balance}
              bonus={wallet.data?.bonus ?? 0}
              adLeft={adLeft}
              pending={unlock.isPending}
              autoUnlock={izinDicentang}
              onAutoUnlockChange={setIzinDicentang}
              // Satu panggilan membawa keduanya: babnya dibeli **dan** izinnya
              // dinyalakan. Di gerbang itu memang satu tindakan pembaca.
              onPick={(source) => buy(source, { enableAutoUnlock: izinDicentang })}
              onWatchAd={() => setWatchingAd(true)}
            />
          </div>
        )}

        {/*
          `7y`: begitu babnya terbuka, buramnya hilang dan **lencana berganti** —
          gembok terbuka, `CHAPTER TERBUKA`, dan berapa koin yang barusan
          terpotong. Ia berdiri di tempat gerbangnya tadi, jadi pembaca melihat
          hasil dari keputusan yang baru saja ia ambil, bukan halaman yang
          tiba-tiba berbeda.
        */}
        {data.owned && dibukaBarusan !== null && (
          <p className="mt-6 flex items-center justify-between gap-3 border-nv-line border-y py-2.5">
            <span className="flex items-center gap-1.5 font-bold text-[0.59375rem] text-nv-gold uppercase tracking-[0.16em]">
              <LockOpen size={13} aria-hidden className="text-nv-gold-line" />
              {t('reader.chapterOpened')}
            </span>
            <span className="text-caption text-nv-muted tabular-nums">
              {t('reader.spent')(dibukaBarusan)}
            </span>
          </p>
        )}

        {data.owned && (
          <>
            {/*
              Baris status izin · `7y`. **Izin yang memotong koin tanpa tombol
              mati bukan izin** — dan tempatnya di sini, di jalur baca, bukan
              terkubur di panel pengaturan.
            */}
            {bolehOtomatis && (
              <p className="mt-8 flex items-center justify-between gap-3 border-nv-line border-t pt-3">
                <span className="nv-section-label">{t('reader.autoUnlockOn')}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!storyId) return
                    setAuto.mutate(
                      { storyId, on: false },
                      { onSuccess: () => toast.show(t('reader.autoUnlockStopped')) },
                    )
                  }}
                  className="shrink-0 font-semibold text-caption text-nv-gold underline underline-offset-4"
                >
                  {t('reader.autoUnlockOff')}
                </button>
              </p>
            )}

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
              {/*
                **Tidak ada tombol komentar di sini.** Brief §7 melarangnya: satu-
                satunya tempatnya baris kedua bilah bawah (`7v`). Komentar yang
                diletakkan di ujung teks hanya bisa dicapai dengan menggulir
                melewati seluruh bab, dan pembaca yang sampai ke sana sudah
                kehilangan tempatnya.
              */}
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

      {chromeOpen ? (
        <>
          <ChapterNav
            chapter={data}
            total={total}
            onGo={go}
            settingsOpen={settingsOpen}
            onToggleSettings={() => setSettingsOpen((on) => !on)}
            onOpenComments={() => setCommentsOpen(true)}
            tts={tts}
          />
          <p className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center">
            <span className="rounded-nv-pill bg-nv-accent px-3.5 py-1.5 text-caption font-semibold text-nv-card">
              {t('reader.tapHint')}
            </span>
          </p>
        </>
      ) : (
        /*
          Satu-satunya yang tersisa saat chrome tersembunyi (`7u`): hairline
          progres 1,5px di dasar layar. `aria-hidden` — posisi baca sudah
          diumumkan bilah bawah saat ia dibuka, dan garis yang bergerak tiap
          gulir akan membanjiri pembaca layar.
        */
        <span aria-hidden className="fixed inset-x-0 bottom-0 z-30 block h-[1.5px] bg-nv-line">
          <span
            className="block h-full bg-nv-gold-line transition-[width]"
            style={{ width: `${Math.round(readPct * 100)}%` }}
          />
        </span>
      )}

      {/*
        Lembar komentar `7w`. **Lembar, bukan navigasi** — ruang bacanya tetap
        terpasang di belakangnya, jadi posisi gulirnya tidak pernah berpindah:
        tidak ada yang perlu dipulihkan karena tidak ada yang hilang.
      */}
      <Sheet
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        title={t('reader.commentsButton')}
      >
        <ChapterComments
          storyId={storyId ?? ''}
          chapterId={chapterId ?? ''}
          composerAt="bottom"
          sort={commentSort}
          onSort={setCommentSort}
          pageSize={commentSize}
          onMore={setCommentSize}
        />
      </Sheet>

      <InsufficientCoins
        open={shortBy !== null}
        onClose={() => setShortBy(null)}
        shortBy={shortBy ?? 0}
        balance={balance}
        price={data.priceCoins}
        chapterNumber={data.number}
        storyId={storyId ?? ''}
        chapterId={chapterId ?? ''}
        adLeft={adLeft}
        voucherCount={voucher.data?.length ?? 0}
        onWatchAd={() => {
          setShortBy(null)
          setWatchingAd(true)
        }}
        // Voucher dijangkau dari sini **dan** dari detail cerita — ini pertama
        // kalinya ia muncul di ruang baca (R4e).
        onUseVoucher={() => {
          setShortBy(null)
          navigate(`/cerita/${storyId}`)
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
          chapterNumber={data.number}
          price={data.priceCoins}
          adLeft={adLeft}
          adMax={quota.data?.max ?? 3}
          onPayInstead={() => {
            setWatchingAd(false)
            buy('coin')
          }}
          onFinish={() => {
            setWatchingAd(false)
            unlock.mutate(
              {
                source: 'ad',
                idempotencyKey: attempt,
                /*
                 * **Izinnya ikut, sama seperti jalur koin.** Tanpa ini sakelar
                 * yang tercentang di gerbang dibuang diam-diam begitu pembaca
                 * memilih membuka lewat iklan: ia sudah menyetujui, menonton
                 * sampai habis, lalu bab berikutnya bergerbang lagi seolah ia
                 * tidak pernah menyetujui apa pun.
                 *
                 * Terukur sebelum perbaikan: jalur koin menyimpan `["s1"]`,
                 * jalur iklan menyimpan `[]`.
                 */
                ...(izinDicentang ? { enableAutoUnlock: true } : {}),
              },
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

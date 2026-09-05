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
import { onVisible } from '@/lib/a11y'
import { formatDate } from '@/lib/format'
import { AdUnlockScreen } from '../components/AdUnlockScreen'
import { BundleBand } from '../components/BundleBand'
import { ChapterBlock, type ChapterMeta } from '../components/ChapterBlock'
import { ChapterGate } from '../components/ChapterGate'
import { ChapterNav, StoryEnd } from '../components/ChapterNav'
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
/*
 * **Rantainya tidak dibatasi, dan itu keputusan sadar.**
 *
 * Percobaan pertama memangkas bab terlama dari depan begitu lewat enam. Itu
 * **merusak bacaannya**: konten di atas layar hilang, peramban tidak mengganti
 * tingginya, dan pembaca tertarik mundur sebanyak bab yang baru dibuang.
 * Gejalanya bukan lompatan yang terlihat melainkan bacaan yang tidak maju —
 * terukur, 200 kali gulir hanya membawa dua bab.
 *
 * Kompensasi gulir pun tidak menyelamatkannya: rantai bertambah di bawah dan
 * berkurang di atas dalam **satu** langkah, jadi selisih tinggi halamannya
 * nyaris nol sementara pergeserannya tidak.
 *
 * ponytail: rantainya tumbuh tanpa batas. Satu bab ~10 paragraf, jadi cerita
 * 120 bab yang dibaca habis dalam satu sesi berarti ~1.200 paragraf di DOM —
 * berat tapi tidak mematikan, dan itu menuntut pembaca membeli 120 bab lebih
 * dulu. Kalau memori benar-benar jadi masalah, jalannya **virtualisasi** yang
 * menahan tinggi elemen yang dilepas — bukan memangkas begitu saja.
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

  /*
   * **Bab terkunci di dalam rantai**, bukan bab tempat pembaca masuk · §1.25.
   *
   * Sebelum ini `locked` dibaca dari bab entri, dan itu benar selama satu
   * halaman = satu bab. Dalam gulir menerus pembaca masuk lewat bab gratis lalu
   * menemui gerbang belasan layar di bawahnya — dan gerbang itu tidak pernah
   * mendapat harga-harganya, karena kuerinya masih menunggu bab entri terkunci.
   * Terukur: tombol `Chapter ini` tidak pernah muncul.
   */
  const [terkunciId, setTerkunciId] = useState<string | null>(null)
  const locked = terkunciId !== null
  const options = useUnlockOptions(terkunciId ?? chapterId, locked)
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

  /*
   * **Rantai bab yang sedang tersambung** · §1.25. Bab tempat pembaca masuk ada
   * di depan; sisanya ditambahkan saat gulirnya mendekati ujung.
   *
   * Dibatasi `MAX_RANTAI`: cerita 120 bab yang seluruhnya disambung menghabiskan
   * memori dan membuat gulirnya tersendat.
   * ponytail: yang terlama dilepas dari depan. Virtualisasi penuh baru perlu
   * kalau batas sederhana ini terbukti tidak cukup.
   */
  const [rantai, setRantai] = useState<string[]>(() => (chapterId ? [chapterId] : []))
  /** Bab yang sedang mengisi layar — penggerak judul, komentar, progres, URL. */
  const [terlihat, setTerlihat] = useState<string>(chapterId ?? '')
  const meta = useRef<Record<string, ChapterMeta>>({})
  /*
   * **Callback ref, bukan `useRef`.** Halaman ini mengembalikan skeleton lebih
   * dulu selama babnya dimuat, jadi efek dengan `useRef` berjalan saat
   * elemennya belum ada — dan efek berdeps `[]` tidak pernah berjalan lagi
   * setelahnya. Akibatnya pengamatnya tidak pernah terpasang dan rantainya
   * tidak pernah tumbuh; terukur: satu bab, nol garis pemisah.
   */
  const [ekor, setEkor] = useState<HTMLDivElement | null>(null)
  const [ujungCerita, setUjungCerita] = useState(false)
  /** Bab yang sudah pernah dicoba dibuka otomatis — pengaman ketiga R4. */
  const autoDicoba = useRef<Set<string>>(new Set())
  /** Cermin `terkunciId` untuk dibaca di dalam callback tanpa jadi dependensi. */
  const terkunciIdRef = useRef<string | null>(null)

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
  /*
   * **Rantai direset hanya saat pembaca benar-benar berpindah**, bukan saat URL
   * berganti mengikuti gulir. Keduanya mengubah `chapterId`, dan membedakannya
   * yang membuat alur ini bekerja: reset saat gulir akan membuang seluruh bab
   * yang sudah tersambung tepat ketika pembaca melewatinya.
   */
  const masuk = useRef(chapterId)
  // biome-ignore lint/correctness/useExhaustiveDependencies: `terlihat` sengaja tidak jadi pemicu — lihat komentar di atas
  useEffect(() => {
    if (!chapterId || chapterId === terlihat) return

    masuk.current = chapterId
    setRantai([chapterId])
    setTerkunciId(null)
    setTerlihat(chapterId)
    meta.current = {}
    autoDicoba.current = new Set()
    window.scrollTo(0, 0)
    setResumeAt(null)
    setDibukaBarusan(null)
  }, [chapterId])

  const buy = useCallback(
    (
      source: 'coin' | 'bundle' | 'full',
      opsi?: { auto?: boolean; enableAutoUnlock?: boolean; chapterId?: string },
    ) => {
      unlock.mutate(
        {
          source,
          idempotencyKey: attempt,
          // Bab mana pun di dalam rantai, bukan selalu bab tempat pembaca masuk.
          ...(opsi?.chapterId ? { chapterId: opsi.chapterId } : {}),
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
            // Lencana `7y` hanya untuk pembukaan yang ditekan pembaca; yang
            // otomatis tidak meninggalkan jejak apa pun di layar.
            setDibukaBarusan(opsi?.auto ? null : hasil.coinsSpent)
            /*
             * **Pembukaan otomatis tidak berbunyi apa pun** · §1.25. Toast
             * `−1.5rb koin` justru yang membuat pembaca sadar, dan "tidak
             * sadar" adalah tujuan yang dinyatakan.
             *
             * Pembukaan yang **ditekan pembaca** tetap berbunyi: ia menekan
             * sesuatu dan berhak tahu apa yang terjadi.
             */
            if (!opsi?.auto) toast.show(t('reader.unlocked'))
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
  /**
   * Membuka bab terkunci **di tengah gulir**, tanpa jeda · §1.25.
   *
   * Empat pengaman, dan semuanya perlu: izin cerita ini menyala · babnya memang
   * terkunci · belum pernah dicoba untuk bab itu · tidak ada permintaan yang
   * sedang berjalan. Selalu **harga satuan** — membeli bundel atau paket tamat
   * tanpa diminta adalah hal terakhir yang boleh dilakukan otomatis.
   *
   * Izinnya dibaca dari **seam**, bukan dari `stores/`: sejak §1.19 ia per
   * cerita dan tersimpan di server, karena ia memberi wewenang memotong koin.
   */
  const bukaDiam = useCallback(
    (id: string) => {
      if (!bolehOtomatis || unlock.isPending) return
      if (autoDicoba.current.has(id)) return
      if (meta.current[id]?.owned !== false) return

      autoDicoba.current.add(id)
      unlock.mutate(
        { chapterId: id, source: 'coin', idempotencyKey: attempt, auto: true },
        {
          onSuccess: () => setAttempt(crypto.randomUUID()),
          onError: (failure) => {
            if (isApiError(failure) && failure.code === 'INSUFFICIENT_COINS') {
              // **Satu-satunya interupsi yang tersisa**, dan ia memang harus
              // menginterupsi: koin habis bukan hal yang boleh terjadi diam-diam.
              setShortBy(Number(failure.detail ?? 0))
              return
            }
            toast.show(isApiError(failure) ? failure.message : t('failure.genericTitle'))
          },
        },
      )
    },
    [attempt, bolehOtomatis, toast, unlock],
  )

  /*
   * **Menyambung bab berikutnya.** Pemicunya sentinel di bawah bab terakhir,
   * jadi pemuatannya mulai saat pembaca *mendekati* ujungnya — bukan saat ia
   * sampai, yang berarti menunggu di depan layar kosong.
   */
  /** Menambahkan bab berikutnya ke rantai — satu tempat, dua pemicu. */
  const sambung = useCallback(() => {
    setRantai((sekarang) => {
      const akhir = sekarang[sekarang.length - 1]
      const terakhir = akhir ? meta.current[akhir] : undefined

      /*
       * **Gerbang adalah dinding.** Selama bab terakhir di rantai masih
       * terkunci, tidak ada yang boleh dimuat melewatinya — kalau tidak,
       * pembaca mendapat tumpukan gerbang, satu per bab, dan pertanyaan yang
       * seharusnya diajukan sekali jadi diajukan enam kali. Terukur sebelum
       * pengaman ini: enam gerbang bertumpuk dalam satu halaman.
       */
      if (terakhir?.owned === false) return sekarang

      const next = terakhir?.nextChapterId ?? null
      if (!next || sekarang.includes(next)) return sekarang
      return [...sekarang, next]
    })
  }, [])

  /*
   * **Dua pemicu, dan keduanya perlu.**
   *
   * `IntersectionObserver` hanya menyala saat elemennya **melintas** batas
   * layar. Begitu sentinel menetap di dalam layar — dan itu keadaan normalnya di
   * dasar halaman — ia berhenti menyala, dan rantainya berhenti tumbuh.
   * Terukur: bacaan mandek di bab kedua, 250 kali gulir tidak memajukannya.
   *
   * Jadi pemicu kedua: tiap kali bab melaporkan dirinya (termasuk saat ia
   * **baru saja terbeli** dan `owned` berubah jadi benar), rantainya dicoba
   * disambung lagi bila sentinelnya memang sedang terlihat.
   */
  const cobaSambung = useCallback(() => {
    const kotak = ekor?.getBoundingClientRect()
    if (kotak && kotak.top < window.innerHeight) sambung()
  }, [ekor, sambung])

  useEffect(() => {
    if (!ekor) return
    return onVisible(ekor, sambung)
  }, [ekor, sambung])

  /** Bab yang barusan dimuat melapor dirinya; di sinilah rantai tumbuh. */
  const catatMeta = useCallback(
    (m: ChapterMeta) => {
      meta.current[m.id] = m
      if (m.owned === false) {
        setTerkunciId(m.id)
        bukaDiam(m.id)
      } else if (m.id === terkunciIdRef.current) {
        // Babnya barusan terbuka — gerbangnya hilang bersamanya.
        setTerkunciId(null)
      }
      // Ujung cerita diketahui dari bab terakhir yang dilaporkan, bukan dari
      // panjang rantai: rantai bisa dipangkas dari depan saat batasnya lewat.
      if (m.nextChapterId === null) setUjungCerita(true)

      // Bab ini mungkin baru saja terbeli — coba sambung lagi, lihat alasannya
      // di `cobaSambung`.
      cobaSambung()
    },
    [bukaDiam, cobaSambung],
  )

  /*
   * **URL mengikuti bab yang terlihat, tanpa navigasi.** `replaceState`, bukan
   * `navigate()`: yang kedua melepas halaman dan membuang posisi gulirnya —
   * persis yang alur ini berusaha hilangkan. Akibatnya tombol kembali peramban
   * tidak menyusuri tiap bab yang dilewati, dan itu benar: pembaca tidak "pergi
   * ke" bab berikutnya, ia terus membaca.
   */
  useEffect(() => {
    terkunciIdRef.current = terkunciId
  }, [terkunciId])

  useEffect(() => {
    if (!storyId || !terlihat) return
    const jalur = `/cerita/${storyId}/bab/${terlihat}`
    if (window.location.pathname !== jalur) window.history.replaceState(null, '', jalur)
  }, [storyId, terlihat])

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
  // Bab yang sedang mengisi layar — satu sumber untuk judul bilah, nomor bab,
  // tombol komentar, dan URL (§1.25).
  const babTerlihat = meta.current[terlihat]
  const total = story.data?.stats.chapterCount ?? data.number
  const sentences = sentencesOf(body)

  return (
    <div>
      {(chromeOpen || locked) && (
        <ReaderBar
          chapter={data}
          currentNumber={babTerlihat?.number ?? data.number}
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
        {/*
          Tawaran melanjutkan dari posisi terakhir · FR-READ-16 · §1.24.
          Ia **tawaran, bukan lompatan otomatis**: melompat sendiri saat halaman
          dibuka membuat pembaca kehilangan konteks yang justru ia cari.
        */}
        {resumeAt !== null && (
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-nv-line border-y py-3">
            <p className="min-w-0 text-caption text-nv-muted tabular-nums">
              {t('reader.resumeBody')(Math.round(resumeAt * 100))}
            </p>
            <span className="flex shrink-0 gap-2">
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
            </span>
          </div>
        )}

        {/*
          **Rantai bab** · §1.25. Bab mengalir ke bawah, dipisah garis rambut
          polos, tanpa satu pun tombol di antaranya. Bab terkunci di tengah
          rantai punya tiga nasib, dan semuanya diputuskan tanpa menghentikan
          bacaan — lihat `bukaDiam` di atas.
        */}
        {rantai.map((id, i) => (
          <ChapterBlock
            key={id}
            storyId={storyId ?? ''}
            chapterId={id}
            first={i === 0}
            spokenSentence={id === terlihat ? (sentences[tts.current] ?? null) : null}
            onMeta={catatMeta}
            onEnter={setTerlihat}
            gate={(bab) => (
              <ChapterGate
                chapter={bab}
                censored={bab.preview.slice(1)}
                options={options.data ?? []}
                loading={options.isPending}
                balance={balance}
                bonus={wallet.data?.bonus ?? 0}
                adLeft={adLeft}
                pending={unlock.isPending}
                autoUnlock={izinDicentang}
                onAutoUnlockChange={setIzinDicentang}
                // Satu panggilan membawa keduanya: babnya dibeli **dan**
                // izinnya dinyalakan. Di gerbang itu memang satu tindakan.
                onPick={(source) =>
                  buy(source, { enableAutoUnlock: izinDicentang, chapterId: bab.id })
                }
                onWatchAd={() => setWatchingAd(true)}
              />
            )}
          />
        ))}

        {/*
          Sentinel penyambung. Ia yang memicu pemuatan bab berikutnya, dan ia
          duduk **di atas** ujung layar supaya pemuatannya mulai saat pembaca
          mendekati ujung — bukan saat ia sampai dan menunggu di depan kosong.
        */}
        {/*
          Pita tawaran bundel · FR-READ-19 · §1.21.
          
          **Di ujung rantai, bukan di pembuka bacaan.** Ia "didapat" setelah
          sepuluh bab terbuka otomatis — dan pada saat itu pembaca sudah sepuluh
          bab di bawah titik masuknya. Terukur saat ia masih di atas: pembaca
          menembus bab 8 sampai 18 tanpa pernah melihatnya sekali pun.

          Tetap **pita, bukan lembar**: alur ini menjanjikan membaca tanpa
          terputus, dan layar penuh yang menghentikan pembaca untuk menawarinya
          belanja adalah kebalikan dari yang dibelinya.
        */}
        {bundel.data && (
          <BundleBand
            offer={bundel.data}
            pending={unlock.isPending}
            onTake={() => {
              // **Pembelian eksplisit** — auto-unlock tidak pernah membeli
              // bundel sendiri (FR-READ-09).
              buy('bundle', { chapterId: terkunciId ?? terlihat })
              if (storyId) tolakBundel.mutate(storyId)
            }}
            onDismiss={() => storyId && tolakBundel.mutate(storyId)}
          />
        )}

        <div ref={setEkor} aria-hidden className="h-px" />

        {/* Ujung cerita — hanya bila bab terakhir di rantai memang tidak punya
            sambungan. Gulir yang berhenti tanpa kabar terbaca sebagai gagal
            memuat, bukan sebagai habis. */}
        {ujungCerita && <StoryEnd storyId={storyId ?? ''} />}

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
            currentNumber={babTerlihat?.number ?? data.number}
            chapter={data}
            total={total}
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
          // **Bab yang terlihat**, bukan bab entri · §1.25. Setelah membaca lima
          // bab, tombol yang membuka komentar bab pertama membuka percakapan
          // tentang sesuatu yang sudah jauh di atas layar.
          chapterId={terlihat}
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
        // Bab yang **terkunci**, bukan bab entri: konteks kembali dari halaman
        // isi koin harus mendarat di bab yang gagal dibuka.
        price={meta.current[terkunciId ?? '']?.priceCoins ?? data.priceCoins}
        chapterNumber={meta.current[terkunciId ?? '']?.number ?? data.number}
        storyId={storyId ?? ''}
        chapterId={terkunciId ?? chapterId ?? ''}
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

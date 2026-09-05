import { useEffect, useState } from 'react'
import type { Chapter } from '@/api/contracts'
import { AdSlot } from '@/components/patterns/AdSlot'
import { Skeleton } from '@/components/ui/Card'
import { useChapter } from '@/hooks/useChapter'
import { t } from '@/i18n/t'
import { onVisible } from '@/lib/a11y'
import { cx } from '@/lib/cx'

export interface ChapterMeta {
  id: string
  number: number
  title: string
  owned: boolean
  priceCoins: number
  commentCount: number
  nextChapterId: string | null
}

export interface ChapterBlockProps {
  storyId: string
  chapterId: string
  /** Bab pertama membawa pembukanya; sambungannya hanya garis rambut. */
  first: boolean
  /** Kalimat yang sedang dibacakan TTS — hanya untuk bab yang terlihat. */
  spokenSentence: string | null
  /** Dipanggil sekali tiap kali datanya berubah; sumber rantai dan keputusan uang. */
  onMeta: (meta: ChapterMeta) => void
  /** Bab ini masuk layar — penggerak judul, komentar, progres, dan URL. */
  onEnter: (chapterId: string) => void
  /** Gerbang `7x`, dirender **sebagai blok** saat izinnya belum ada. */
  gate: (chapter: Chapter) => React.ReactNode
}

/**
 * Satu bab di dalam gulir menerus · `architecture.md` §1.25.
 *
 * **Bab kedua dan seterusnya tidak punya pembuka.** Hanya garis rambut polos —
 * tanpa nomor, tanpa judul, tanpa garis emas. Itu inti permintaannya: pembaca
 * harus bisa melewati batas bab tanpa merasakannya, dan pembuka bab besar
 * adalah jeda visual yang justru menandainya.
 *
 * Bab **pertama** tetap punya pembukanya. Ia bukan sambungan — ia tempat
 * pembaca masuk, lewat tautan langsung atau "Lanjut Baca", dan halaman yang
 * dibuka tanpa menyebutkan bab berapa terbaca sebagai potongan yang salah.
 *
 * Blok ini memuat datanya sendiri. Memuatnya di induk berarti satu `useQueries`
 * yang harus dijaga sinkron dengan rantainya; di sini tiap bab berdiri sendiri
 * dan induknya cukup memegang daftar id.
 */
export function ChapterBlock({
  storyId,
  chapterId,
  first,
  spokenSentence,
  onMeta,
  onEnter,
  gate,
}: ChapterBlockProps) {
  const chapter = useChapter(storyId, chapterId)
  // Callback ref, alasan sama dengan sentinel di `ReaderPage`.
  const [top, setTop] = useState<HTMLDivElement | null>(null)
  const data = chapter.data

  useEffect(() => {
    if (!data) return
    onMeta({
      id: data.id,
      number: data.number,
      title: data.title,
      owned: data.owned,
      priceCoins: data.priceCoins,
      commentCount: data.commentCount,
      nextChapterId: data.nextChapterId,
    })
  }, [data, onMeta])

  useEffect(() => {
    if (!top) return
    return onVisible(top, () => onEnter(chapterId))
  }, [top, chapterId, onEnter])

  if (chapter.isPending) {
    return (
      <div className="pt-8">
        <Skeleton lines={6} />
      </div>
    )
  }
  if (!data) return null

  const body = data.owned ? (data.content[0]?.body ?? []) : []
  const middle = Math.floor(body.length / 2)

  return (
    <div>
      {/*
        Penanda bab yang terlihat. Diberi `scroll-mt` supaya pengamatnya menyala
        saat babnya benar-benar mengisi layar, bukan saat garis pemisahnya baru
        menyentuh tepi bawah.
      */}
      <div ref={setTop} aria-hidden className="h-px scroll-mt-24" />

      {first ? (
        <>
          {/* Pembuka bab `7u` — **hanya untuk bab tempat pembaca masuk**. */}
          <p className="nv-section-label text-center">{t('reader.chapterLabel')(data.number)}</p>
          <h1 className="pt-2 text-center font-display text-page leading-tight font-semibold">
            {data.title}
          </h1>
          <span aria-hidden className="mx-auto mt-4 mb-7 block h-px w-10 bg-nv-gold-line" />
        </>
      ) : (
        /*
          **Garis rambut polos** (§1.25). Tanpa nomor bab, tanpa judul, tanpa
          emas: apa pun yang ditulis di sini akan menghentikan mata, dan itu
          persis yang tidak boleh terjadi.
        */
        <span aria-hidden className="my-10 block h-px bg-nv-line" />
      )}

      {body.length > 0 && (
        <div
          className="space-y-4 font-read text-nv-text"
          style={{ fontSize: 'var(--reader-font-size)', lineHeight: 1.8 }}
        >
          {body.map((paragraph, index) => (
            <div key={paragraph.slice(0, 40)}>
              <p
                className={cx(
                  spokenSentence !== null &&
                    paragraph.includes(spokenSentence) &&
                    'rounded-nv-sm bg-nv-accent-soft',
                )}
              >
                {paragraph}
              </p>

              {/* Dua slot: setelah paragraf pertama dan di tengah (FR-READ-12) —
                  di sela bacaan, bukan menutupi teksnya. */}
              {(index === 0 || index === middle) && (
                <AdSlot variant="slim" className="mt-4" title={t('home.adSlimTitle')} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bagian gratisnya dibaca normal, lalu berhenti di gerbang (`7x`). */}
      {!data.owned && data.preview.length > 0 && (
        <div
          className="space-y-4 font-read text-nv-text"
          style={{ fontSize: 'var(--reader-font-size)', lineHeight: 1.8 }}
        >
          <p>{data.preview[0]}</p>
        </div>
      )}

      {!data.owned && gate(data)}
    </div>
  )
}

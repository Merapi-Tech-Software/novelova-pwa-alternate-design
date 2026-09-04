import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Chapter } from '@/api/contracts'
import { Button } from '@/components/ui/Button'
import { t } from '@/i18n/t'

export interface ChapterNavProps {
  chapter: Chapter
  total: number
  onGo: (chapterId: string) => void
}

/**
 * Navigasi bab · FR-READ-15.
 *
 * Dua tempat, dan keduanya perlu: **tombol besar di akhir bab** untuk pembaca
 * yang baru selesai membaca, dan **panah di bilah bawah** untuk yang ingin
 * melompat kapan saja. Menyediakan satu saja berarti salah satu dari keduanya
 * harus menggulir jauh untuk hal yang paling sering ia lakukan.
 *
 * Bab pertama membuat "sebelumnya" **nonaktif, bukan hilang** — tombol yang
 * lenyap menggeser tata letak dan membuat panah berikutnya berpindah tempat.
 */
export function ChapterNav({ chapter, total, onGo }: ChapterNavProps) {
  return (
    <nav
      aria-label={t('reader.chapterOf')(chapter.number, total)}
      className="sticky bottom-0 z-30 flex items-center gap-2 border-nv-line border-t bg-nv-bg/95 px-3 py-2 backdrop-blur"
    >
      <Button
        size="sm"
        variant="secondary"
        disabled={chapter.prevChapterId === null}
        onClick={() => chapter.prevChapterId && onGo(chapter.prevChapterId)}
        iconLeft={<ChevronLeft size={16} />}
      >
        {t('reader.prevChapter')}
      </Button>

      <span className="flex-1 text-center text-caption text-nv-muted tabular-nums">
        {t('reader.chapterOf')(chapter.number, total)}
      </span>

      <Button
        size="sm"
        variant="secondary"
        disabled={chapter.nextChapterId === null}
        onClick={() => chapter.nextChapterId && onGo(chapter.nextChapterId)}
        iconRight={<ChevronRight size={16} />}
      >
        {t('reader.nextChapter')}
      </Button>
    </nav>
  )
}

/**
 * Penutup bab: tombol besar beserta **judul tujuannya**, atau jalan kembali ke
 * daftar bab bila ini bab terakhir yang terbit.
 */
export function ChapterEnd({
  chapter,
  storyId,
  onGo,
}: Omit<ChapterNavProps, 'total'> & { storyId: string }) {
  if (chapter.nextChapterId === null) {
    return (
      <div className="mt-10 border-nv-line border-t pt-6 text-center">
        <p className="pb-3 text-body text-nv-muted">{t('reader.lastChapterNote')}</p>
        <Button variant="secondary" onClick={() => onGo(`story:${storyId}`)}>
          {t('reader.backToChapters')}
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-10 border-nv-line border-t pt-6">
      <Button
        size="lg"
        block
        onClick={() => chapter.nextChapterId && onGo(chapter.nextChapterId)}
        iconRight={<ChevronRight size={18} />}
      >
        {chapter.nextTitle
          ? t('reader.nextChapterNamed')(chapter.nextTitle)
          : t('reader.nextChapter')}
      </Button>
    </div>
  )
}

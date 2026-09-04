import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  MessageSquare,
  Settings2,
  Square,
} from 'lucide-react'
import type { Chapter } from '@/api/contracts'
import { Button, IconButton } from '@/components/ui/Button'
import { t } from '@/i18n/t'

export interface ChapterNavProps {
  chapter: Chapter
  total: number
  onGo: (chapterId: string) => void
  /** Membuka panel pengaturan — alatnya tinggal di sini untuk bab yang dimiliki. */
  onToggleSettings: () => void
  /**
   * Membuka **lembar** komentar di atas teks (`7w`), bukan berpindah halaman.
   * Brief §7: posisi baca tidak pernah hilang — dan berpindah halaman lalu
   * kembali adalah cara paling pasti untuk menghilangkannya.
   */
  onOpenComments: () => void
  settingsOpen: boolean
  tts: { supported: boolean; speaking: boolean; speak: () => void; stop: () => void }
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
 *
 * **Putaran 7: bilah melayang dua baris** (`7v`). Baris kedua membawa tombol
 * `Komentar bab` beserta jumlahnya — dan itulah **satu-satunya** tempatnya.
 * Brief §7 melarangnya di akhir bab: komentar yang diletakkan di ujung teks
 * hanya bisa dicapai dengan menggulir melewati seluruh bab, dan pembaca yang
 * sampai ke sana sudah kehilangan tempatnya.
 */
export function ChapterNav({
  chapter,
  total,
  onGo,
  onToggleSettings,
  onOpenComments,
  settingsOpen,
  tts,
}: ChapterNavProps) {
  return (
    <nav
      aria-label={t('reader.chapterOf')(chapter.number, total)}
      className="fixed inset-x-3 bottom-3 z-40 space-y-2 rounded-nv-lg border border-nv-line-soft bg-nv-card p-2 shadow-nv"
    >
      <div className="flex items-center gap-2">
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
      </div>

      <div className="flex items-center gap-2 border-nv-line border-t pt-2">
        <button
          type="button"
          onClick={onOpenComments}
          className="flex flex-1 items-center justify-center gap-2 rounded-nv-pill bg-nv-accent px-4 py-2.5 text-caption font-bold text-nv-card"
        >
          <MessageSquare size={14} aria-hidden />
          {t('reader.commentsButton')}
          {/* Lencana nol adalah lencana yang tidak mengatakan apa-apa. */}
          {chapter.commentCount > 0 && (
            <span className="rounded-nv-pill bg-nv-gold-line px-1.5 text-[10px] text-nv-text tabular-nums">
              {chapter.commentCount}
            </span>
          )}
        </button>
        <IconButton
          label={t('reader.settings')}
          size="sm"
          aria-expanded={settingsOpen}
          onClick={onToggleSettings}
        >
          <Settings2 size={16} />
        </IconButton>
        <IconButton
          label={tts.speaking ? t('reader.ttsStop') : t('reader.ttsPlay')}
          size="sm"
          disabled={!tts.supported}
          title={tts.supported ? undefined : t('reader.ttsUnavailable')}
          onClick={() => (tts.speaking ? tts.stop() : tts.speak())}
        >
          {tts.speaking ? <Square size={16} /> : <Headphones size={16} />}
        </IconButton>
      </div>
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
}: {
  chapter: Chapter
  storyId: string
  onGo: (chapterId: string) => void
}) {
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

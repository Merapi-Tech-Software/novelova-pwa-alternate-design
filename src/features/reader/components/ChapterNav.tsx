import { Headphones, MessageSquare, Settings2, Square } from 'lucide-react'
import { Link } from 'react-router'
import type { Chapter } from '@/api/contracts'
import { IconButton } from '@/components/ui/Button'
import { t } from '@/i18n/t'

export interface ChapterNavProps {
  chapter: Chapter
  /** Nomor bab yang sedang terlihat · §1.25. */
  currentNumber: number
  total: number
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
  currentNumber,
  total,
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
      {/*
        **Tombol bab sebelumnya/berikutnya dicabut** · §1.25. Bacaannya mengalir
        terus; tombol lompat di sini akan mengajarkan pembaca bahwa ada batas
        bab yang perlu dilewati, dan justru itu yang alur ini hilangkan.

        Yang tersisa nomor babnya — dan ia **mengikuti bab yang terlihat**, jadi
        pembaca tetap punya satu tempat untuk tahu ia sedang di mana.
      */}
      <p className="text-center text-caption text-nv-muted tabular-nums">
        {t('reader.chapterOf')(currentNumber, total)}
      </p>

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
 * Penutup **cerita** · §1.25.
 *
 * Menggantikan `ChapterEnd` yang dulu membawa tombol `Bab 4 ›`. Dalam gulir
 * menerus tidak ada lagi "bab berikutnya" untuk ditekan — yang tersisa hanya
 * ujung ceritanya, dan gulir yang berhenti tanpa kabar terbaca sebagai gagal
 * memuat, bukan sebagai habis.
 */
export function StoryEnd({ storyId }: { storyId: string }) {
  return (
    <div className="mt-12 border-nv-line border-t pt-6 text-center">
      <p className="pb-3 font-display text-card text-nv-text-2">{t('reader.lastChapterNote')}</p>
      <Link
        to={`/cerita/${storyId}`}
        className="inline-flex h-11 items-center rounded-nv-pill border border-nv-line-soft px-5 text-body font-semibold"
      >
        {t('reader.backToChapters')}
      </Link>
    </div>
  )
}

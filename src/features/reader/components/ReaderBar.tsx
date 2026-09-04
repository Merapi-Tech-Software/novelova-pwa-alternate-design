import { ChevronLeft, Headphones, Settings2, Square } from 'lucide-react'
import type { Chapter } from '@/api/contracts'
import { CoinChip } from '@/components/patterns/CoinChip'
import { IconButton } from '@/components/ui/Button'
import { useWallet } from '@/hooks/useWallet'
import { t } from '@/i18n/t'
import { useBackNavigation } from '@/lib/nav'

export interface ReaderBarProps {
  chapter: Chapter
  storyId: string
  total: number
  settingsOpen: boolean
  onToggleSettings: () => void
  tts: {
    supported: boolean
    speaking: boolean
    rate: number
    speak: () => void
    stop: () => void
    cycleRate: () => void
  }
}

/**
 * Bilah atas ruang baca · FR-READ-01 · FR-READ-05 · FR-READ-14.
 *
 * Lima hal, urutannya tetap: kembali · judul dan posisi bab · saldo · dengarkan
 * · pengaturan. **Tanpa nav bawah** — layar baca adalah satu-satunya tempat
 * pengguna sedang mengerjakan satu hal saja.
 *
 * Bilahnya dirender halaman, bukan `ReaderLayout`, karena hanya halaman yang
 * tahu bab mana yang sedang dibaca; layout-nya tetap kerangka layar penuh.
 */
export function ReaderBar({
  chapter,
  storyId,
  total,
  settingsOpen,
  onToggleSettings,
  tts,
}: ReaderBarProps) {
  const goBack = useBackNavigation(`/cerita/${storyId}`)
  const wallet = useWallet()

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-nv-line border-b bg-nv-bg/95 px-3 py-2 backdrop-blur">
      <IconButton label={t('action.back')} size="sm" onClick={goBack}>
        <ChevronLeft size={18} />
      </IconButton>

      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-semibold">{chapter.title}</p>
        <p className="text-caption text-nv-muted tabular-nums">
          {t('reader.chapterOf')(chapter.number, total)}
        </p>
      </div>

      <CoinChip amount={wallet.data?.balance ?? 0} size="sm" />

      {/* Bab terkunci tidak punya isi untuk dibacakan, jadi tombolnya mati di
          sana — bukan menyala lalu diam (FR-READ-11). */}
      {tts.speaking && (
        <button
          type="button"
          onClick={tts.cycleRate}
          className="shrink-0 rounded-nv-pill border border-nv-line px-2 py-1 text-caption font-semibold text-nv-muted tabular-nums"
        >
          {t('reader.ttsRate')(tts.rate)}
        </button>
      )}
      <IconButton
        label={tts.speaking ? t('reader.ttsStop') : t('reader.ttsPlay')}
        size="sm"
        disabled={!tts.supported || !chapter.owned}
        title={tts.supported ? undefined : t('reader.ttsUnavailable')}
        onClick={() => (tts.speaking ? tts.stop() : tts.speak())}
      >
        {tts.speaking ? <Square size={16} /> : <Headphones size={18} />}
      </IconButton>

      <IconButton
        label={t('reader.settings')}
        size="sm"
        aria-expanded={settingsOpen}
        onClick={onToggleSettings}
      >
        <Settings2 size={18} />
      </IconButton>
    </header>
  )
}

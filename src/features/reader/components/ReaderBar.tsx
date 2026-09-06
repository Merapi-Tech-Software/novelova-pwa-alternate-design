import { BookMarked, BookmarkPlus, ChevronLeft, Headphones, Settings2, Square } from 'lucide-react'
import type { Chapter } from '@/api/contracts'
import { CoinChip } from '@/components/patterns/CoinChip'
import { IconButton } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useOfflineChapters, useToggleOffline } from '@/hooks/useOffline'
import { useWallet } from '@/hooks/useWallet'
import { t } from '@/i18n/t'
import { useBackNavigation } from '@/lib/nav'
import { OFFLINE_MAX } from '@/lib/offline'

export interface ReaderBarProps {
  chapter: Chapter
  /**
   * Nomor bab yang **sedang terlihat**, bukan bab tempat pembaca masuk · §1.25.
   *
   * Dalam gulir menerus keduanya berbeda setelah layar pertama, dan bilah yang
   * masih menyebut "Bab 1" saat pembaca sudah di bab 4 adalah satu-satunya
   * tempat ia bisa tahu posisinya — jadi ia harus benar.
   */
  currentNumber: number
  storyId: string
  total: number
  settingsOpen: boolean
  onToggleSettings: () => void
  /** Bab terkunci: alat baca tinggal di sini, karena bilah bawah tidak dirender. */
  locked: boolean
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
 * Kembali · judul dan posisi bab · saldo. **Tanpa nav bawah** — layar baca
 * adalah satu-satunya tempat pengguna sedang mengerjakan satu hal saja.
 *
 * **Dengarkan dan pengaturan hanya muncul di bab terkunci.** Putaran 7 memisahkan
 * keduanya: `7v` (Type A) memindahkan alatnya ke baris kedua bilah bawah,
 * sementara `7x` (Type B) menahannya di sini karena bilah bawahnya memang tidak
 * ada. Merender keduanya di dua tempat menghasilkan dua tombol bernama sama di
 * satu layar — dan pembaca layar membacanya dua kali.
 *
 * Bilahnya dirender halaman, bukan `ReaderLayout`, karena hanya halaman yang
 * tahu bab mana yang sedang dibaca; layout-nya tetap kerangka layar penuh.
 */
export function ReaderBar({
  chapter,
  currentNumber,
  storyId,
  total,
  settingsOpen,
  onToggleSettings,
  tts,
  locked,
}: ReaderBarProps) {
  const goBack = useBackNavigation(`/cerita/${storyId}`)
  const wallet = useWallet()
  const offline = useOfflineChapters()
  const toggleOffline = useToggleOffline()
  const toast = useToast()

  const tersimpan = (offline.data ?? []).some((row) => row.chapterId === chapter.id)

  return (
    <header className="fixed inset-x-3 top-3 z-40 flex items-center gap-2 rounded-nv-lg border border-nv-line-soft bg-nv-card p-2 shadow-nv">
      <IconButton label={t('action.back')} size="sm" onClick={goBack}>
        <ChevronLeft size={18} />
      </IconButton>

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-body font-semibold">{chapter.storyTitle}</p>
        <p className="truncate text-caption text-nv-muted tabular-nums">
          {t('reader.chapterPos')(currentNumber, total, chapter.readMinutes)}
        </p>
      </div>

      <CoinChip amount={wallet.data?.balance ?? 0} size="sm" />

      {/*
        Simpan offline · architecture.md §10.3 · FR-CORE-03.
        **Hanya untuk bab yang dimiliki** — servernya menolak yang belum
        dibayar, jadi tombolnya tidak digambar untuk bab terkunci: kontrol
        yang pasti ditolak lebih buruk daripada kontrol yang tidak ada.
      */}
      {chapter.owned && (
        <IconButton
          label={tersimpan ? t('pwa.removeOffline') : t('pwa.saveOffline')}
          size="sm"
          disabled={toggleOffline.isPending}
          onClick={() =>
            toggleOffline.mutate(
              { chapterId: chapter.id, simpan: !tersimpan },
              {
                onSuccess: (rows) => {
                  toast.show(tersimpan ? t('pwa.saveOffline') : t('pwa.savedOffline'), {
                    tone: 'success',
                  })
                  if (!tersimpan && rows.length >= OFFLINE_MAX) {
                    toast.show(t('pwa.saveLimit')(OFFLINE_MAX), { tone: 'neutral' })
                  }
                },
                onError: (error) => {
                  toast.show(error instanceof Error ? error.message : t('failure.genericTitle'), {
                    tone: 'danger',
                  })
                },
              },
            )
          }
        >
          {tersimpan ? <BookMarked size={18} /> : <BookmarkPlus size={18} />}
        </IconButton>
      )}

      {locked && (
        <>
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
        </>
      )}
    </header>
  )
}

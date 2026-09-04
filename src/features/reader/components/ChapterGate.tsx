import { Lock } from 'lucide-react'
import type { Chapter, UnlockOption } from '@/api/contracts'
import { CoinChip } from '@/components/patterns/CoinChip'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Chip'
import { t } from '@/i18n/t'

export interface ChapterGateProps {
  chapter: Chapter
  options: UnlockOption[]
  loading: boolean
  balance: number
  adLeft: number
  pending: boolean
  /** Hanya tiga pilihan berbayar; iklan punya alurnya sendiri. */
  onPick: (source: 'coin' | 'bundle' | 'full') => void
  onWatchAd: () => void
}

const LABEL: Record<string, (option: UnlockOption) => string> = {
  coin: () => t('reader.optionSingle'),
  bundle: (o) => t('reader.optionBundle')(o.chapterCount),
  full: () => t('reader.optionFull'),
}

/** Hemat dihitung dari angka server, bukan dari asumsi harga bab seragam. */
function savingOf(option: UnlockOption): number {
  if (option.individualCoins === 0) return 0
  return Math.round((1 - option.coins / option.individualCoins) * 100)
}

/**
 * Gerbang bab terkunci · FR-READ-06 · FR-READ-07.
 *
 * Pratinjaunya **buram dan `aria-hidden`**: mata melihat bahwa ada teks di
 * baliknya, pembaca layar tidak dibacakan potongan kalimat yang tidak lengkap.
 * Menampilkannya jelas lalu memotong di tengah kalimat justru terasa seperti
 * kesalahan aplikasi, bukan seperti batas berbayar.
 */
export function ChapterGate({
  chapter,
  options,
  loading,
  balance,
  adLeft,
  pending,
  onPick,
  onWatchAd,
}: ChapterGateProps) {
  return (
    <section className="mt-6">
      <div aria-hidden className="relative max-h-40 overflow-hidden">
        <div className="space-y-4 font-read text-nv-text blur-[3px] select-none">
          {chapter.preview.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>
        <span className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-nv-bg to-transparent" />
      </div>

      <div className="mt-4 rounded-nv-lg border border-nv-line bg-nv-paper-2 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Lock size={16} aria-hidden className="text-nv-muted" />
          <Badge tone="neutral">{t('reader.locked')}</Badge>
          <CoinChip amount={chapter.priceCoins} format="exact" size="sm" className="ml-auto" />
        </div>

        <p className="font-display text-section font-semibold">{t('reader.gateTitle')}</p>
        <p className="pt-1 pb-4 text-body text-nv-muted">{t('reader.gateBody')}</p>

        {loading && <Skeleton lines={3} />}

        <div className="space-y-2">
          {options.map((option) => {
            const saving = savingOf(option)
            return (
              <Button
                key={option.source}
                block
                variant={option.source === 'coin' ? 'primary' : 'secondary'}
                loading={pending}
                onClick={() => onPick(option.source as 'coin' | 'bundle' | 'full')}
              >
                <span className="flex w-full items-center justify-between gap-3">
                  <span>{LABEL[option.source]?.(option) ?? option.source}</span>
                  <span className="flex items-center gap-2">
                    {saving > 0 && <Badge tone="success">{t('reader.saving')(saving)}</Badge>}
                    <CoinChip amount={option.coins} format="exact" size="sm" />
                  </span>
                </span>
              </Button>
            )
          })}

          {/* Iklan hanya ditawarkan bila kuotanya memang ada — tombol yang
              menolak begitu ditekan lebih buruk daripada tombol yang tidak ada. */}
          <Button block variant="ghost" disabled={adLeft === 0} onClick={onWatchAd}>
            {adLeft > 0
              ? `${t('reader.optionAd')} · ${t('reader.optionAdQuota')(adLeft)}`
              : t('reader.optionAdEmpty')}
          </Button>
        </div>

        <p className="pt-3 text-caption text-nv-muted tabular-nums">
          {t('reader.shortBalance')(balance)}
        </p>
      </div>
    </section>
  )
}

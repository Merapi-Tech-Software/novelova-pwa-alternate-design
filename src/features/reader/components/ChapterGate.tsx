import { Crown } from 'lucide-react'
import type { Chapter, UnlockOption } from '@/api/contracts'
import { Switch } from '@/components/ui/Switch'
import { t } from '@/i18n/t'
import { formatCompactCoin } from '@/lib/coin'
import { cx } from '@/lib/cx'

export interface ChapterGateProps {
  chapter: Chapter
  /** Paragraf yang diburamkan — bagian gratisnya sudah dibaca di atas gerbang. */
  censored: string[]
  options: UnlockOption[]
  loading: boolean
  balance: number
  bonus: number
  adLeft: number
  pending: boolean
  /** Izin buka-otomatis cerita ini — tercentang bawaan (FR-READ-09). */
  autoUnlock: boolean
  onAutoUnlockChange: (on: boolean) => void
  /** Hanya tiga pilihan berbayar; iklan punya alurnya sendiri. */
  onPick: (source: 'coin' | 'bundle' | 'full') => void
  onWatchAd: () => void
}

/** Hemat dihitung dari angka server, bukan dari asumsi harga bab seragam. */
function savingOf(option: UnlockOption): number {
  if (option.individualCoins === 0) return 0
  return Math.round((1 - option.coins / option.individualCoins) * 100)
}

/**
 * Baris kedua tiap pilihan — **apa yang sebenarnya didapat**.
 *
 * `7x` menuliskannya sebagai keterangan kecil di bawah judulnya: `Bab 8 saja`,
 * `1.2rb / bab`, `112 bab tersisa`. Ketiganya diturunkan dari angka server yang
 * sama dengan harganya; tidak ada yang dihitung ulang di sini kecuali pembagian
 * harga per bab, yang memang tidak dikirim seam.
 */
function subOf(option: UnlockOption, chapterNumber: number): string {
  if (option.source === 'coin') return t('reader.optionSingleSub')(chapterNumber)
  if (option.source === 'bundle') {
    return t('reader.optionPerChapter')(Math.round(option.coins / option.chapterCount))
  }
  return t('reader.optionFullSub')(option.chapterCount)
}

const JUDUL: Record<string, (option: UnlockOption) => string> = {
  coin: () => t('reader.optionSingle'),
  bundle: (o) => t('reader.optionBundle')(o.chapterCount),
  full: () => t('reader.optionFull'),
}

/**
 * Gerbang bab terkunci · FR-READ-06 · FR-READ-07 · mockup `7x`.
 *
 * **Pratinjaunya buram dan `aria-hidden`; labelnya tidak.** Mata melihat bahwa
 * ada teks di baliknya, pembaca layar tidak dibacakan potongan kalimat yang
 * tidak lengkap — tetapi kata `PRATINJAU TERSENSOR` tetap terbaca keduanya,
 * karena ia yang menjelaskan kenapa ada blok abu-abu di tengah halaman.
 *
 * **Saldo diulang di dalam gerbang.** Ia sudah ada di bilah atas, dan itu
 * disengaja: keputusan membeli diambil di sini, dan menyuruh pembaca melihat ke
 * ujung layar untuk mengingat saldonya adalah cara membuat ia salah pilih.
 */
export function ChapterGate({
  chapter,
  censored,
  options,
  loading,
  balance,
  bonus,
  adLeft,
  pending,
  autoUnlock,
  onAutoUnlockChange,
  onPick,
  onWatchAd,
}: ChapterGateProps) {
  const mulai = options.length > 0 ? Math.min(...options.map((o) => o.coins)) : chapter.priceCoins

  return (
    <section
      aria-label="Locked continuation gate"
      className="mt-6 rounded-nv-lg border border-nv-line-soft bg-nv-card p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="flex items-center gap-1.5 font-bold text-[0.59375rem] text-nv-gold uppercase tracking-[0.16em]">
          <Crown size={13} aria-hidden className="text-nv-gold-line" />
          {t('reader.gateBadge')}
        </span>
        <span className="text-caption text-nv-muted">{t('reader.gateFrom')(mulai)}</span>
      </div>

      <p className="pt-3 font-display text-card text-nv-text-2">{t('reader.gateBody')}</p>

      <p className="nv-section-label pt-5">{t('reader.gatePreviewLabel')}</p>
      <div aria-hidden className="relative mt-2 max-h-40 overflow-hidden">
        <div className="space-y-4 font-read text-nv-text blur-[4px] select-none">
          {/*
            Yang diburamkan **hanya bagian tersensornya**. Paragraf pembuka bab
            dibaca normal di atas gerbang ini, seperti Type A (`7x`) — kalau
            seluruhnya diburamkan, pembaca tidak pernah tahu ia sedang membaca
            cerita yang mana.
          */}
          {censored.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>
        <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-nv-card to-transparent" />
      </div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-nv-line border-t pt-3">
        <span className="nv-section-label">{t('reader.gateBalance')}</span>
        <span className="flex items-baseline gap-2">
          <span className="font-display text-card font-bold tabular-nums">
            {t('reader.gateBalanceCoins')(balance)}
          </span>
          {bonus > 0 && (
            <span className="font-semibold text-caption text-nv-gold tabular-nums">
              +{formatCompactCoin(bonus)} bonus
            </span>
          )}
        </span>
      </div>

      {loading && (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[4.25rem] animate-pulse rounded-nv-md bg-nv-line-soft" />
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {options.map((option) => {
          const utama = option.source === 'coin'
          const saving = savingOf(option)
          return (
            <button
              key={option.source}
              type="button"
              disabled={pending}
              onClick={() => onPick(option.source as 'coin' | 'bundle' | 'full')}
              className={cx(
                'flex w-full items-center gap-3 rounded-nv-md px-4 py-3 text-left transition disabled:opacity-60',
                utama
                  ? 'bg-nv-accent text-nv-card'
                  : 'border border-nv-line-soft bg-nv-card text-nv-text',
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-card font-bold">
                    {JUDUL[option.source]?.(option) ?? option.source}
                  </span>
                  {saving > 0 && (
                    <span className="rounded-nv-pill bg-nv-gold-soft px-2 py-0.5 font-bold text-[10px] text-nv-gold uppercase">
                      {t('reader.saving')(saving)}
                    </span>
                  )}
                </span>
                <span
                  className={cx(
                    'block truncate pt-0.5 text-caption',
                    utama ? 'text-nv-card/70' : 'text-nv-muted',
                  )}
                >
                  {subOf(option, chapter.number)}
                </span>
              </span>
              <span className="shrink-0 font-display text-card font-bold tabular-nums">
                {option.coins.toLocaleString('id-ID')}
              </span>
            </button>
          )
        })}

        {/* Iklan hanya ditawarkan bila kuotanya memang ada — tombol yang menolak
            begitu ditekan lebih buruk daripada tombol yang tidak ada. */}
        <button
          type="button"
          disabled={adLeft === 0}
          onClick={onWatchAd}
          className="flex w-full items-center gap-3 rounded-nv-md border border-nv-line-soft px-4 py-3 text-left transition disabled:opacity-60"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-display text-card font-bold">{t('reader.optionAd')}</span>
            <span className="block truncate pt-0.5 text-caption text-nv-muted">
              {t('reader.optionAdSub')}
            </span>
          </span>
          <span className="shrink-0 rounded-nv-pill border border-nv-line px-2.5 py-1 text-caption text-nv-muted tabular-nums">
            {adLeft > 0 ? t('reader.optionAdQuota')(adLeft) : t('reader.optionAdEmpty')}
          </span>
        </button>
      </div>

      {/*
        **Izin buka-otomatis menutup gerbang, tercentang bawaan** (FR-READ-09,
        §1.19). Ia diminta di sini karena di sinilah pembaca memang sedang
        memutuskan soal uang — bukan di panel pengaturan, tempat ia dulu tinggal
        sebagai sakelar global yang melanggar aturan struktur #5.
      */}
      <div className="mt-4 border-nv-line border-t pt-4">
        <Switch
          checked={autoUnlock}
          onChange={onAutoUnlockChange}
          label={t('reader.autoUnlock')}
          description={t('reader.autoUnlockHint')}
        />
      </div>
    </section>
  )
}

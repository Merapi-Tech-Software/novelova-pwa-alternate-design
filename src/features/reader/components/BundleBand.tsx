import { Sparkles, X } from 'lucide-react'
import type { BundleOffer } from '@/api/contracts'
import { t } from '@/i18n/t'

/**
 * Tawaran bundel setelah sepuluh bab dibuka otomatis · FR-READ-19 · §1.21.
 *
 * **Pita, bukan lembar dan bukan dialog.** Alur auto-unlock menjanjikan membaca
 * tanpa terputus; menghentikan pembaca dengan layar penuh untuk menawarinya
 * belanja adalah persis kebalikan dari yang dibelinya. Ia duduk di pembuka bab,
 * bisa diabaikan begitu saja, dan tidak menahan apa pun.
 *
 * **Angka hematnya dari `individualCoins`**, bukan persentase tetap: `prd_00`
 * §6 dan `prd_05` §2 sama-sama menulis "hemat 5%" padahal sepuluh bab seed
 * berjumlah 17.200 melawan bundel 12.000 — 30%. Persentase yang ditulis di layar
 * akan berbohong pada tiap cerita yang harganya berbeda.
 *
 * **Mengambilnya adalah pembelian eksplisit.** Auto-unlock tidak pernah membeli
 * bundel atau paket tamat sendiri (FR-READ-09), jadi tombol inilah satu-satunya
 * jalan ke sana.
 */
export function BundleBand({
  offer,
  pending,
  onTake,
  onDismiss,
}: {
  offer: BundleOffer
  pending: boolean
  onTake: () => void
  onDismiss: () => void
}) {
  const hemat =
    offer.individualCoins > 0 ? Math.round((1 - offer.coins / offer.individualCoins) * 100) : 0

  return (
    <aside className="mt-6 rounded-nv-lg border border-nv-gold-line/35 bg-nv-gold-soft p-4">
      <div className="flex items-start gap-2.5">
        <Sparkles size={15} aria-hidden className="mt-0.5 shrink-0 text-nv-gold-line" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-card font-bold text-nv-text">
            {t('reader.bundleTitle')(offer.autoUnlockedCount)}
          </p>
          <p className="pt-1 text-body text-nv-text-2">
            {t('reader.bundleBody')(offer.chapterCount, offer.coins, offer.individualCoins)}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('reader.bundleDismiss')}
          className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-nv-pill text-nv-muted"
        >
          <X size={15} aria-hidden />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-3.5">
        <button
          type="button"
          disabled={pending}
          onClick={onTake}
          className="h-11 shrink-0 rounded-nv-pill bg-nv-accent px-5 text-body font-bold text-nv-card disabled:opacity-60"
        >
          {t('reader.bundleTake')(offer.coins)}
        </button>
        {hemat > 0 && (
          <span className="font-bold text-caption text-nv-gold tabular-nums">
            {t('reader.saving')(hemat)}
          </span>
        )}
      </div>
    </aside>
  )
}

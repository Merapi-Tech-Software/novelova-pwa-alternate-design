import { Coins } from 'lucide-react'
import type { StoryDetail } from '@/api/contracts'
import { t } from '@/i18n/t'

/**
 * Kartu monetisasi · FR-DETAIL-06 · mockup `7b`.
 *
 * Satu kartu garis rambut yang menjawab satu pertanyaan: **berapa yang bisa
 * dibaca gratis, dan berapa sisanya.** Sebelum putaran 7 jawabannya tersebar —
 * status monetisasi jadi lencana, harga per bab hanya terlihat di daftar bab,
 * dan harga akses penuh tidak muncul di halaman ini sama sekali.
 *
 * **Tidak dirender sama sekali untuk cerita yang seluruhnya gratis.** Kartu
 * berbunyi "seluruh bab gratis" terbaca sebagai penawaran, dan cerita gratis
 * tidak sedang menawarkan apa pun.
 *
 * Ketiga angkanya dari server (`freeChapterCount`, `paidPriceFrom`,
 * `fullAccessCoins`) — daftar bab di bawahnya datang 20 per halaman, jadi
 * menghitungnya di layar akan menjawab dari sebagian bab saja.
 */
export function MonetizationCard({ story }: { story: StoryDetail }) {
  if (story.paidPriceFrom === null) return null

  const sisa = story.fullAccessCoins
    ? t('story.monetizeRestFull')(story.paidPriceFrom, story.fullAccessCoins)
    : t('story.monetizeRest')(story.paidPriceFrom)

  return (
    <section className="mb-6 flex items-start gap-3 rounded-nv-lg border border-nv-line-soft bg-nv-card p-4">
      <Coins size={18} aria-hidden className="mt-0.5 shrink-0 text-nv-gold-line" />
      <div className="min-w-0">
        <p className="font-bold text-body">{t('story.monetizeFree')(story.freeChapterCount)}</p>
        <p className="pt-0.5 text-caption text-nv-muted">{sisa}</p>
      </div>
    </section>
  )
}

import type { StoryDetail } from '@/api/contracts'
import { Cover } from '@/components/patterns/Cover'
import { t } from '@/i18n/t'
import { formatCompactCoin } from '@/lib/coin'

const STATUS_LABEL: Record<StoryDetail['status'], string> = {
  ongoing: 'Berjalan',
  completed: 'Tamat',
  hiatus: 'Hiatus',
}

/** `975` → `16 jam` · `48` → `48 menit`. Jam dibulatkan; menit tidak perlu presisi di sel selebar 80px. */
function readDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} menit`
  return `${Math.round(minutes / 60)} jam`
}

/**
 * Kepala halaman cerita · FR-DETAIL-01 · FR-DETAIL-02 · mockup `7b`.
 *
 * **Panel putih dengan sampul kecil, bukan gambar penuh berscrim.** Putaran 7
 * membalik bentuknya: sampul jadi benda di atas panel, bukan latar yang ditimpa
 * teks. Itu sekaligus menghapus satu-satunya gradien besar di layar ini.
 *
 * **Strip statistik empat sel**, dan sel ketiganya `DURASI BACA` — putaran 7
 * mengganti metrik pamer dengan angka yang benar-benar dipakai pembaca untuk
 * memutuskan. Angkanya dari server (`readMinutesTotal`): halaman ini memuat bab
 * 20 per halaman, jadi menjumlahkannya di layar akan menampilkan durasi cerita
 * 120 bab dari 20 bab pertamanya saja.
 */
export function StoryHero({ story }: { story: StoryDetail }) {
  const stats: Array<[label: string, value: string]> = [
    [t('story.ratings'), `★ ${story.stats.rating.toFixed(1).replace('.', ',')}`],
    [t('story.statChapters'), formatCompactCoin(story.stats.chapterCount)],
    [t('story.readDuration'), readDuration(story.readMinutesTotal)],
    [t('story.status'), STATUS_LABEL[story.status]],
  ]

  return (
    <section className="-mx-4 mb-5">
      <div className="flex items-start gap-4 border-nv-line border-b bg-nv-card px-4 py-5">
        <Cover src={story.coverUrl} title={story.title} badge={story.badge} className="w-[94px]" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-page leading-tight font-semibold">{story.title}</h1>
          <p className="pt-1 text-body text-nv-muted">{story.penName}</p>
          <ul className="flex flex-wrap gap-2 pt-3">
            {story.genres.map((genre) => (
              <li
                key={genre}
                className="rounded-nv-pill border border-nv-line-soft px-3 py-1 text-caption font-semibold text-nv-text-2"
              >
                {genre}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/*
        Empat sel di atas kertas, bukan di dalam panel — `7b` memisahkannya dari
        kartu identitas di atasnya. `grid-cols-4` aman sampai 320px: tiap sel
        ~66px, dan `DURASI BACA` yang terpanjang dibungkus dua baris.
      */}
      <dl className="grid grid-cols-4 gap-2 border-nv-line border-b px-4 py-4">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dd className="font-display text-card leading-tight font-bold tabular-nums">{value}</dd>
            <dt className="nv-section-label pt-1 font-ui">{label}</dt>
          </div>
        ))}
      </dl>
    </section>
  )
}

import { Check, ChevronRight, Dot, Lock } from 'lucide-react'
import { Link } from 'react-router'
import type { ChapterSummary } from '@/api/contracts'
import { cx } from '@/lib/cx'
import { CoinChip } from './CoinChip'

export interface ChapterRowProps {
  chapter: ChapterSummary
  /** Bab yang sedang dibaca — penanda ketiga FR-DETAIL-14. */
  current?: boolean
  className?: string
}

/**
 * Satu baris bab.
 *
 * Bab **gratis** menunjukkan chevron; bab **terkunci** menunjukkan harga dan
 * gembok — dan sengaja **tanpa statistik**. Menampilkan jumlah baca di samping
 * gembok membuat baris itu terlihat seperti sudah bisa dibuka.
 *
 * **Tiga penanda FR-DETAIL-14 semuanya hidup di sel kanan** (`7b`): centang untuk
 * yang sudah dibaca, titik emas untuk yang sedang dibaca, chevron untuk yang
 * belum. Sebelumnya penanda "sedang dibaca" berupa kolom ikon kedua di sebelah
 * kiri, sehingga satu baris bisa membawa dua ikon yang mengatakan hal yang sama.
 */
export function ChapterRow({ chapter, current = false, className }: ChapterRowProps) {
  const locked = chapter.access === 'paid' && !chapter.owned

  return (
    <Link
      to={`/cerita/${chapter.storyId}/bab/${chapter.id}`}
      className={cx('flex items-center gap-3 py-3.5 transition hover:opacity-80', className)}
    >
      <span
        aria-hidden
        className="w-6 shrink-0 text-right font-semibold text-caption text-nv-muted tabular-nums"
      >
        {chapter.number}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-card font-semibold">{chapter.title}</span>
        {!locked && (
          <span className="block text-caption text-nv-muted">
            {chapter.readMinutes} menit
            {chapter.finished && ' · selesai'}
          </span>
        )}
      </span>

      {locked ? (
        <span className="flex shrink-0 items-center gap-1.5">
          <CoinChip amount={chapter.priceCoins} format="exact" size="sm" />
          <Lock size={14} className="text-nv-muted" aria-label="Terkunci" />
        </span>
      ) : chapter.finished ? (
        <Check size={16} className="shrink-0 text-nv-text" aria-label="Sudah dibaca" />
      ) : current ? (
        <Dot size={22} className="shrink-0 text-nv-gold-line" aria-label="Sedang dibaca" />
      ) : (
        <ChevronRight size={16} className="shrink-0 text-nv-muted" aria-hidden />
      )}
    </Link>
  )
}

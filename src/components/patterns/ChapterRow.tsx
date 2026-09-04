import { Check, ChevronRight, Lock } from 'lucide-react'
import { Link } from 'react-router'
import type { ChapterSummary } from '@/api/contracts'
import { cx } from '@/lib/cx'
import { CoinChip } from './CoinChip'

export interface ChapterRowProps {
  chapter: ChapterSummary
  className?: string
}

/**
 * Satu baris bab.
 *
 * Bab **gratis** menunjukkan chevron; bab **terkunci** menunjukkan harga dan
 * gembok — dan sengaja **tanpa statistik**. Menampilkan jumlah baca di samping
 * gembok membuat baris itu terlihat seperti sudah bisa dibuka.
 */
export function ChapterRow({ chapter, className }: ChapterRowProps) {
  const locked = chapter.access === 'paid' && !chapter.owned

  return (
    <Link
      to={`/cerita/${chapter.storyId}/bab/${chapter.id}`}
      className={cx(
        'flex items-center gap-3 rounded-nv-md px-3 py-3 transition hover:bg-nv-accent-soft',
        className,
      )}
    >
      <span
        aria-hidden
        className="w-8 shrink-0 text-center font-semibold text-caption text-nv-muted tabular-nums"
      >
        {chapter.number}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-semibold">{chapter.title}</span>
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
        <Check size={16} className="shrink-0 text-nv-success" aria-label="Sudah dibaca" />
      ) : (
        <ChevronRight size={16} className="shrink-0 text-nv-muted" aria-hidden />
      )}
    </Link>
  )
}

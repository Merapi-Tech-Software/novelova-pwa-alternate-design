import { Play, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Story } from '@/api/contracts'
import { formatCompactCoin } from '@/lib/coin'
import { cx } from '@/lib/cx'
import { Cover } from './Cover'

export interface StoryCardProps {
  story: Story
  variant?: 'grid' | 'list'
  /** 0–1. Bila ada, baris progres ikut dirender. */
  progress?: number
  /**
   * Menimpa `story.badge` di sampul — dipakai lencana peringkat `#1 Popular`.
   * `null` **meniadakan** lencana sampul: `7d` memindahkannya ke tepi kanan
   * baris, dan dua lencana untuk satu cerita di baris yang sama membingungkan.
   */
  badge?: ReactNode | null
  /** Sel kanan baris — lencana `HOT` / `BARU` di `7d`. Hanya `variant="list"`. */
  trailing?: ReactNode
  /**
   * Satu baris tambahan di bawah metrik: garis pertumbuhan emas di
   * **Baru & Naik Cepat**, kutipan serif di **Editor's Picks**.
   */
  note?: ReactNode
  /** Nomor urut di kiri baris. Hanya `variant="list"`. */
  rank?: number
  className?: string
}

/**
 * Metrik kartu putaran 7: **`★ rating` lalu jumlah baca** — dua angka, bukan
 * deretan lencana genre.
 *
 * Bintangnya memakai `--nv-gold-line` (emas garis) sementara angkanya memakai
 * `--nv-gold` (emas teks). Ikon boleh lebih terang daripada teks; menukarnya
 * membuat angka rating gagal AA (`architecture.md` §1.20).
 */
function Meta({ story }: { story: Story }) {
  // `<span>`, bukan `<p>`: kartunya seluruhnya berada di dalam `<a>`, dan
  // elemen blok di dalam elemen inline bukan HTML yang sah.
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption">
      <span className="inline-flex items-center gap-1 font-semibold text-nv-gold">
        <Star size={11} className="fill-current text-nv-gold-line" aria-hidden />
        <span className="tabular-nums">{story.stats.rating.toFixed(1).replace('.', ',')}</span>
      </span>
      <span className="text-nv-muted tabular-nums">
        {formatCompactCoin(story.stats.reads)} baca
      </span>
    </span>
  )
}

export function StoryCard({
  story,
  variant = 'grid',
  progress,
  badge,
  note,
  rank,
  trailing,
  className,
}: StoryCardProps) {
  const to = `/cerita/${story.id}`
  // `badge === undefined` berarti "pakai bawaannya"; `null` berarti "jangan ada".
  const cover = (
    <Cover
      src={story.coverUrl}
      title={story.title}
      badge={badge === undefined ? story.badge : badge}
    />
  )

  if (variant === 'list') {
    return (
      <Link to={to} className={cx('flex items-start gap-3 py-3.5', className)}>
        {rank !== undefined && (
          <span
            aria-hidden
            className="w-5 shrink-0 pt-0.5 text-right font-display text-card text-nv-muted tabular-nums"
          >
            {rank}
          </span>
        )}
        <span className="block w-11 shrink-0">{cover}</span>

        <span className="block min-w-0 flex-1">
          <span className="flex items-start gap-2">
            <span className="min-w-0 flex-1 truncate font-display text-card font-semibold">
              {story.title}
            </span>
            {trailing}
          </span>
          <span className="block truncate pt-0.5 text-caption text-nv-muted">{story.penName}</span>
          <span className="block pt-1">
            <Meta story={story} />
          </span>
          {note}

          {progress !== undefined && (
            <span className="mt-2 flex items-center gap-2">
              {/* Batang progres **garis rambut**, bukan pil tebal — `7a` §9. */}
              <span aria-hidden className="h-px flex-1 bg-nv-line">
                <span
                  className="block h-px bg-nv-accent"
                  style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
                />
              </span>
              <span className="shrink-0 text-caption text-nv-muted tabular-nums">
                {Math.round(Math.min(1, Math.max(0, progress)) * 100)}%
              </span>
            </span>
          )}
        </span>

        {progress !== undefined && (
          /* Tombol play **di dalam tautan**, jadi ia `<span>` — bukan `<button>`.
             Seluruh barisnya sudah satu tautan; tombol kedua di dalamnya bukan
             HTML yang sah dan menembakkan navigasi dua kali. */
          <span
            aria-hidden
            className="mt-1 grid size-9 shrink-0 place-items-center rounded-nv-pill bg-nv-accent text-nv-card"
          >
            <Play size={14} className="fill-current" />
          </span>
        )}
      </Link>
    )
  }

  return (
    <Link to={to} className={cx('block', className)}>
      {cover}
      <span className="mt-2.5 block line-clamp-2 font-display text-card leading-snug font-semibold">
        {story.title}
      </span>
      <span className="mt-0.5 block truncate text-caption text-nv-muted">{story.penName}</span>
      <span className="mt-1.5 block">
        <Meta story={story} />
      </span>
      {note}
    </Link>
  )
}

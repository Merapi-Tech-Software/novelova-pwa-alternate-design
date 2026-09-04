import { BookOpen, Star } from 'lucide-react'
import { Link } from 'react-router'
import type { Story } from '@/api/contracts'
import { formatCompactCoin } from '@/lib/coin'
import { cx } from '@/lib/cx'
import { ProgressBar } from '../ui/Card'
import { Badge } from '../ui/Chip'

export interface StoryCardProps {
  story: Story
  variant?: 'grid' | 'list'
  /** 0–1. Bila ada, baris progres ikut dirender. */
  progress?: number
  className?: string
}

/** Cover rasio 2:3 — rasio yang sama yang divalidasi saat penulis mengunggahnya. */
function Cover({ story, className }: { story: Story; className?: string }) {
  return (
    <div
      className={cx(
        'relative aspect-[2/3] shrink-0 overflow-hidden rounded-nv-md bg-nv-accent-soft',
        className,
      )}
    >
      {story.coverUrl ? (
        <img src={story.coverUrl} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <span className="grid size-full place-items-center text-nv-accent-strong/40">
          <BookOpen size={22} aria-hidden />
        </span>
      )}
      {story.badge && (
        <span className="absolute top-1.5 left-1.5 rounded-nv-pill bg-nv-card/90 px-2 py-0.5 font-semibold text-[10px] text-nv-accent-strong uppercase tracking-wide">
          {story.badge}
        </span>
      )}
    </div>
  )
}

function Meta({ story }: { story: Story }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-caption text-nv-muted">
      <span className="inline-flex items-center gap-1">
        <Star size={12} className="text-nv-coin-icon" aria-hidden />
        <span className="tabular-nums">{story.stats.rating.toFixed(1)}</span>
      </span>
      <span className="tabular-nums">{formatCompactCoin(story.stats.reads)} baca</span>
      <span>{story.stats.chapterCount} bab</span>
    </div>
  )
}

export function StoryCard({ story, variant = 'grid', progress, className }: StoryCardProps) {
  const to = `/cerita/${story.id}`

  if (variant === 'list') {
    return (
      <Link
        to={to}
        className={cx(
          'flex gap-3.5 rounded-nv-lg p-2.5 transition hover:bg-nv-accent-soft',
          className,
        )}
      >
        <Cover story={story} className="w-16" />
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate font-bold text-card">{story.title}</h3>
          <p className="truncate text-caption text-nv-muted">{story.penName}</p>
          <Meta story={story} />
          {progress !== undefined && (
            <ProgressBar value={progress} label={`Progres ${story.title}`} className="pt-1" />
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link to={to} className={cx('group block space-y-2', className)}>
      <Cover story={story} className="transition group-hover:shadow-nv-soft" />
      <div className="space-y-1">
        <h3 className="line-clamp-2 font-bold text-card leading-snug">{story.title}</h3>
        <p className="truncate text-caption text-nv-muted">{story.penName}</p>
        <div className="flex flex-wrap gap-1">
          {story.genres.slice(0, 2).map((g) => (
            <Badge key={g} tone="accent">
              {g}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  )
}

import { Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import type { LibraryItem } from '@/api/contracts'
import { IconButton } from '@/components/ui/Button'
import { Badge, type BadgeTone } from '@/components/ui/Chip'
import { Switch } from '@/components/ui/Switch'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'

const STATUS: Record<LibraryItem['story']['status'], { label: string; tone: BadgeTone }> = {
  ongoing: { label: t('library.statusOngoing'), tone: 'info' },
  completed: { label: t('library.statusCompleted'), tone: 'success' },
  hiatus: { label: t('library.statusHiatus'), tone: 'warning' },
}

/**
 * Kartu cerita tersimpan · FR-LIB-02 · FR-LIB-11.
 *
 * Setiap angka di sini datang dari server: status baca, jumlah bab selesai,
 * persentase, dan titik bab baru. Prototipe menuliskannya ke dalam markup, jadi
 * batang progresnya tidak pernah bergerak sedetik pun setelah membaca.
 */
export interface LibraryCardProps {
  item: LibraryItem
  onToggleNotify: (item: LibraryItem) => void
  onRemove: (item: LibraryItem) => void
}

/**
 * Label tombol baca mengikuti progres · FR-LIB-07 — dan tujuannya **bab
 * terakhir yang dibaca**, bukan bab pertama. "Lanjut Baca" yang membuang pembaca
 * ke bab satu adalah janji yang diingkari satu ketukan setelah diucapkan.
 */
const READ_LABEL: Record<LibraryItem['state'], string> = {
  reading: t('library.readContinue'),
  'not-started': t('library.readStart'),
  finished: t('library.readAgain'),
}

export function LibraryCard({ item, onToggleNotify, onRemove }: LibraryCardProps) {
  const { story } = item
  const status = STATUS[story.status]
  const readTo = item.continueChapterId
    ? `/cerita/${story.id}/bab/${item.continueChapterId}`
    : `/cerita/${story.id}`

  return (
    // `<li>` karena ia hidup di dalam `<ul>` sejak `7c` mengubah rak jadi daftar
    // berpembatas. Kartu bergaris dan berlatar sendiri dihapus: brief §1 menaruh
    // konten berulang di daftar, bukan di kartu.
    <li className="flex gap-3 py-4">
      <Link to={`/cerita/${story.id}`} className="relative shrink-0">
        {story.coverUrl ? (
          <img
            src={story.coverUrl}
            alt=""
            loading="lazy"
            className="h-28 w-[74px] rounded-nv-md object-cover"
          />
        ) : (
          <span className="block h-28 w-[74px] rounded-nv-md bg-nv-surface" />
        )}
        {/* Titik merah hanya bila memang ada bab yang belum dibaca. */}
        {item.hasNewChapter && (
          // `role="img"` bukan hiasan: titik tanpa peran adalah elemen kosong,
          // dan `aria-label` di atasnya diabaikan pembaca layar.
          <span
            role="img"
            aria-label={t('library.newChapter')}
            className="absolute -top-1 -right-1 size-3 rounded-nv-pill bg-nv-danger ring-2 ring-nv-card"
          />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/cerita/${story.id}`}
            className="min-w-0 font-semibold text-body text-nv-text hover:underline"
          >
            <h3 className="truncate">{story.title}</h3>
          </Link>
          <Badge tone={status.tone} className="shrink-0">
            {status.label}
          </Badge>
        </div>

        <p className="truncate pt-0.5 text-caption text-nv-muted">
          {story.penName} · {story.genres.join(' · ')} · ★ {story.stats.rating.toFixed(1)}
        </p>

        <div className="flex items-center gap-2 pt-2.5">
          <span
            aria-hidden
            className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-nv-pill bg-nv-surface"
          >
            <span
              className={cx('block h-full rounded-nv-pill', item.pct > 0 && 'bg-nv-accent')}
              style={{ width: `${item.pct}%` }}
            />
          </span>
          <span className="shrink-0 text-caption text-nv-muted tabular-nums">{item.pct}%</span>
        </div>

        <p className="pt-1 text-caption text-nv-muted tabular-nums">
          {item.state === 'not-started'
            ? t('library.notStarted')
            : t('library.progress')(item.finishedCount, item.totalChapters)}
          {' · '}
          {t('library.savedOn')(item.savedAt)}
        </p>

        <div className="flex items-center gap-2 pt-2.5">
          <Link
            to={readTo}
            className="inline-flex h-9 items-center rounded-nv-pill bg-nv-accent px-3.5 font-semibold text-caption text-nv-card"
          >
            {READ_LABEL[item.state]}
          </Link>

          {/* `aria-label` **ikut berubah** saat sakelarnya ditekan — prototipe
              menahannya tetap, jadi pembaca layar selalu mendengar keadaan yang
              salah setelah ketukan pertama (PRD 06 §7 #3). */}
          <Switch
            checked={item.notify}
            onChange={() => onToggleNotify(item)}
            label={
              item.notify ? t('library.notifyOn')(story.title) : t('library.notifyOff')(story.title)
            }
            hideLabel
          />

          <IconButton
            label={t('library.removeAria')(story.title)}
            size="sm"
            className="ml-auto"
            onClick={() => onRemove(item)}
          >
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>
    </li>
  )
}

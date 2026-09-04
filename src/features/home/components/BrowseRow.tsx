import { Bookmark, BookmarkCheck, EyeOff, MoreHorizontal, Share2 } from 'lucide-react'
import { useRef, useState } from 'react'
import type { Story } from '@/api/contracts'
import { StoryCard } from '@/components/patterns/StoryCard'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useHideStory, useToggleLibrary } from '@/hooks/useLibrary'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'

/** Lebar laci aksi yang tersingkap saat kartu digeser ke kiri. */
const REVEAL = 132
/** Di bawah ini gerakan dianggap ketukan, bukan geseran. */
const SLOP = 8

export interface BrowseRowProps {
  story: Story
  saved: boolean
  progress?: number
}

/**
 * Satu baris daftar dengan **aksi geser** · FR-HOME-14.
 *
 * Geser ke kiri menyingkap Simpan · Bagikan · Sembunyikan. Gerakan sentuh saja
 * tidak cukup: tombol **Aksi** membuka laci yang sama lewat papan tik dan tetikus,
 * karena aksi yang hanya bisa dijangkau dengan jari adalah aksi yang tidak ada
 * bagi sebagian pengguna.
 *
 * `Bagikan` memakai Web Share API bila tersedia, dan jatuh ke papan klip bila
 * tidak — keduanya berakhir dengan tautan yang benar-benar bisa dikirim.
 */
export function BrowseRow({ story, saved, progress }: BrowseRowProps) {
  const [open, setOpen] = useState(false)
  const [drag, setDrag] = useState(0)
  const startX = useRef<number | null>(null)

  const toggleLibrary = useToggleLibrary()
  const hideStory = useHideStory()
  const toast = useToast()

  const offset = open ? -REVEAL : Math.max(-REVEAL, Math.min(0, drag))

  async function share() {
    const url = `${window.location.origin}/cerita/${story.id}`
    try {
      if (navigator.share) await navigator.share({ title: story.title, url })
      else {
        await navigator.clipboard.writeText(url)
        toast.show(t('home.shareCopied'))
      }
    } catch {
      // Pengguna membatalkan lembar berbagi, atau papan klip ditolak peramban.
      // Keduanya bukan kegagalan yang perlu dilaporkan.
    }
    setOpen(false)
  }

  return (
    <div className="relative overflow-hidden rounded-nv-lg">
      <div
        className="absolute inset-y-0 right-0 flex items-stretch gap-px"
        style={{ width: REVEAL }}
      >
        <button
          type="button"
          onClick={() => {
            toggleLibrary.mutate(story.id)
            setOpen(false)
          }}
          className="flex flex-1 flex-col items-center justify-center gap-1 bg-nv-accent-soft text-caption font-semibold text-nv-accent-strong"
        >
          {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          {saved ? t('home.saved') : t('home.save')}
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className="flex flex-1 flex-col items-center justify-center gap-1 bg-nv-paper-2 text-caption font-semibold text-nv-muted"
        >
          <Share2 size={16} />
          {t('home.share')}
        </button>
        <button
          type="button"
          onClick={() => {
            hideStory.mutate(story.id)
            toast.show(t('home.hidden'))
          }}
          className="flex flex-1 flex-col items-center justify-center gap-1 bg-nv-danger-bg text-caption font-semibold text-nv-danger"
        >
          <EyeOff size={16} />
          {t('home.hide')}
        </button>
      </div>

      <div
        className={cx(
          'relative bg-nv-bg transition-transform',
          startX.current === null && 'duration-200',
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={(e) => {
          startX.current = e.clientX
        }}
        onPointerMove={(e) => {
          if (startX.current === null) return
          const dx = e.clientX - startX.current
          if (Math.abs(dx) > SLOP) setDrag(open ? dx - REVEAL : dx)
        }}
        onPointerUp={() => {
          if (startX.current !== null) setOpen(offset < -REVEAL / 2)
          startX.current = null
          setDrag(0)
        }}
        onPointerCancel={() => {
          startX.current = null
          setDrag(0)
        }}
      >
        <StoryCard story={story} variant="list" {...(progress === undefined ? {} : { progress })} />

        <div className="flex items-center gap-2 px-3 pb-3">
          <Button
            size="sm"
            variant={saved ? 'secondary' : 'primary'}
            onClick={() => toggleLibrary.mutate(story.id)}
            iconLeft={saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          >
            {saved ? t('home.saved') : t('home.save')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-expanded={open}
            aria-label={t('home.rowActions')}
            onClick={() => setOpen((on) => !on)}
          >
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}

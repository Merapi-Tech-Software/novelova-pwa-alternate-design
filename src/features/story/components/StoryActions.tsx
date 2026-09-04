import { Bell, BellRing, Bookmark, BookmarkCheck, Flag, Share2, Star } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import type { StoryDetail } from '@/api/contracts'
import { ReportSheet } from '@/components/patterns/ReportSheet'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'

export interface StoryActionsProps {
  story: StoryDetail
  onToggleSave: () => void
  onToggleFollow: () => void
}

/**
 * Aksi cerita · FR-DETAIL-03 · FR-DETAIL-04 · FR-DETAIL-13 · FR-DETAIL-15.
 *
 * **Simpan dan Ikuti dua tombol terpisah**, dan itu disengaja: menyimpan berarti
 * "saya mau membacanya", mengikuti berarti "beri tahu saya kalau ada bab baru".
 * Menyimpan menyalakan Ikuti; melepas Ikuti tidak mengeluarkan cerita dari
 * koleksi.
 *
 * **Melepas simpanan minta konfirmasi** — menyimpan satu ketukan, kehilangan
 * koleksi juga satu ketukan bukan pertukaran yang adil.
 */
export function StoryActions({ story, onToggleSave, onToggleFollow }: StoryActionsProps) {
  const [confirmUnsave, setConfirmUnsave] = useState(false)
  const [report, setReport] = useState(false)
  const toast = useToast()

  /** Satu perilaku untuk semua tombol bagikan di halaman ini (FR-DETAIL-15). */
  async function share() {
    const url = `${window.location.origin}/cerita/${story.id}`
    try {
      if (navigator.share) await navigator.share({ title: story.title, url })
      else {
        await navigator.clipboard.writeText(url)
        toast.show(t('story.shareCopied'))
      }
    } catch {
      // Pengguna membatalkan lembar berbagi, atau papan klip ditolak peramban.
    }
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        <Button
          block
          variant={story.inLibrary ? 'secondary' : 'primary'}
          onClick={() => (story.inLibrary ? setConfirmUnsave(true) : onToggleSave())}
          iconLeft={story.inLibrary ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        >
          {story.inLibrary ? t('story.saved') : t('story.save')}
        </Button>
        <Button
          block
          variant="secondary"
          onClick={onToggleFollow}
          aria-pressed={story.following}
          iconLeft={story.following ? <BellRing size={16} /> : <Bell size={16} />}
        >
          {story.following ? t('story.following') : t('story.follow')}
        </Button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {/* Rating dan ulasan hidup di halamannya sendiri (Fase 10), jadi ini
            tautan — bukan tombol yang membuka lembar yang belum ada. */}
        <Link
          to={`/cerita/${story.id}/ulasan`}
          className="inline-flex h-9 items-center gap-1.5 rounded-nv-pill px-3.5 text-caption font-semibold text-nv-muted"
        >
          <Star size={14} aria-hidden />
          {t('story.review')}
        </Link>
        <Button
          size="sm"
          variant="ghost"
          iconLeft={<Share2 size={14} />}
          onClick={() => void share()}
        >
          {t('story.share')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          iconLeft={<Flag size={14} />}
          onClick={() => setReport(true)}
        >
          {t('story.report')}
        </Button>
      </div>

      <Modal
        open={confirmUnsave}
        onClose={() => setConfirmUnsave(false)}
        title={t('story.unsaveTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmUnsave(false)}>
              {t('action.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onToggleSave()
                setConfirmUnsave(false)
              }}
            >
              {t('story.unsaveConfirm')}
            </Button>
          </>
        }
      >
        <p className="text-body text-nv-muted">{t('story.unsaveBody')}</p>
      </Modal>

      <ReportSheet
        open={report}
        onClose={() => setReport(false)}
        targetLabel={story.title}
        onSubmit={() => {
          setReport(false)
          toast.show('Laporan terkirim.')
        }}
      />
    </>
  )
}

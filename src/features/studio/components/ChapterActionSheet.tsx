import { Link } from 'react-router'
import type { AuthorChapter } from '@/api/contracts'
import { Sheet } from '@/components/ui/Modal'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'

type Action =
  | { kind: 'link'; label: string; to: string; danger?: false }
  | { kind: 'button'; label: string; run: () => void; danger?: boolean }

export interface ChapterActionSheetProps {
  chapter: AuthorChapter | null
  storyId: string
  onClose: () => void
  onPublish: (chapter: AuthorChapter) => void
  onSchedule: (chapter: AuthorChapter) => void
  onUnschedule: (chapter: AuthorChapter) => void
  onDelete: (chapter: AuthorChapter) => void
}

/**
 * Menu aksi bab · FR-STUDIO-10.
 *
 * Daftarnya **dibangun dari status**, bukan dirender seluruhnya lalu sebagian
 * disembunyikan — dan karena ia lahir dari `chapter` yang sedang dibuka, membuka
 * menu bab lain tidak pernah menyisakan aksi bab sebelumnya.
 *
 * Prototipe menentukan jenis elemen dari **teks** aksinya (memuat kata "Edit"
 * atau "Akses" → dibuat `<a>`); di sini jenisnya bagian dari datanya. Menebak
 * peran elemen dari kata di label akan pecah pada terjemahan pertama.
 */
export function ChapterActionSheet({
  chapter,
  storyId,
  onClose,
  onPublish,
  onSchedule,
  onUnschedule,
  onDelete,
}: ChapterActionSheetProps) {
  if (!chapter) return null

  const edit: Action = {
    kind: 'link',
    label: chapter.authorStatus === 'draft' ? t('chapters.actWrite') : t('chapters.aEditContent'),
    to: `/karya/${storyId}/bab/${chapter.id}/ubah`,
  }
  const access: Action = {
    kind: 'link',
    label: t('chapters.aAccess'),
    to: `/karya/${storyId}/bab/${chapter.id}/akses`,
  }
  const preview: Action = {
    kind: 'link',
    label: t('chapters.aPreview'),
    to: `/cerita/${storyId}/bab/${chapter.id}`,
  }
  const remove = (label: string): Action => ({
    kind: 'button',
    label,
    run: () => onDelete(chapter),
    danger: true,
  })

  const byStatus: Record<AuthorChapter['authorStatus'], Action[]> = {
    draft: [
      edit,
      { kind: 'button', label: t('chapters.actPublish'), run: () => onPublish(chapter) },
      { kind: 'button', label: t('chapters.actSchedule'), run: () => onSchedule(chapter) },
      access,
      preview,
      remove(t('chapters.aDelete')),
    ],
    scheduled: [
      edit,
      { kind: 'button', label: t('chapters.actReschedule'), run: () => onSchedule(chapter) },
      { kind: 'button', label: t('chapters.aCancelSchedule'), run: () => onUnschedule(chapter) },
      access,
      preview,
    ],
    published: [
      edit,
      access,
      { ...preview, label: t('chapters.aPreviewReader') },
      { kind: 'link', label: t('chapters.aStats'), to: `/karya/${storyId}/analitik` },
      // Menghapus bab berbayar menuntut pengembalian koin pembelinya — labelnya
      // menyebutkan itu, dan servernya yang menegakkannya.
      remove(t('chapters.aDeleteRefund')),
    ],
    private: [
      edit,
      access,
      preview,
      { kind: 'button', label: t('chapters.aPrivateReason'), run: onClose },
      remove(t('chapters.aDelete')),
    ],
    in_review: [
      edit,
      preview,
      { kind: 'button', label: t('chapters.aReviewPending'), run: onClose },
    ],
    rejected: [
      edit,
      preview,
      { kind: 'button', label: t('chapters.aReviewReason'), run: onClose },
      remove(t('chapters.aDelete')),
    ],
  }
  const actions = byStatus[chapter.authorStatus]

  return (
    <Sheet open onClose={onClose} title={chapter.title}>
      <p className="text-caption text-nv-muted">
        {chapter.authorStatus === 'draft'
          ? t('chapters.menuDraftSub')
          : t('chapters.menuStatusSub')(chapter.authorStatus)}
      </p>

      <ul className="pt-3">
        {actions.map((action) => (
          <li key={action.label} className="border-nv-line border-b last:border-0">
            {action.kind === 'link' ? (
              <Link
                to={action.to}
                onClick={onClose}
                className="block py-3 text-body text-nv-text hover:text-nv-accent-strong"
              >
                {action.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={action.run}
                className={cx(
                  'block w-full py-3 text-left text-body',
                  action.danger ? 'font-semibold text-nv-danger' : 'text-nv-text',
                )}
              >
                {action.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </Sheet>
  )
}

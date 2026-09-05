import { Link } from 'react-router'
import type { StudioStory } from '@/api/contracts'
import { Button } from '@/components/ui/Button'
import { t } from '@/i18n/t'
import { formatCompactCoin } from '@/lib/coin'
import { cx } from '@/lib/cx'
import { formatDateTime } from '@/lib/format'

/** Nada status; dipetakan ke warna teks lewat `STATUS_TEXT`, bukan ke lencana. */
type Nada = 'neutral' | 'info' | 'danger' | 'warning' | 'success' | 'accent'

const STATUS: Record<StudioStory['studioStatus'], { label: string; tone: Nada }> = {
  draft: { label: t('studio.stDraft'), tone: 'neutral' },
  in_review: { label: t('studio.stInReview'), tone: 'info' },
  rejected: { label: t('studio.stRejected'), tone: 'danger' },
  scheduled: { label: t('studio.stScheduled'), tone: 'warning' },
  published: { label: t('studio.stPublished'), tone: 'success' },
  completed: { label: t('studio.stCompleted'), tone: 'accent' },
  archived: { label: t('studio.stArchived'), tone: 'neutral' },
}

export interface StudioCardProps {
  item: StudioStory
  onSchedule: (item: StudioStory) => void
  onPrint: (item: StudioStory) => void
  onDelete: (item: StudioStory) => void
}

/**
 * Kartu karya · FR-STUDIO-02 · FR-STUDIO-38.
 *
 * Empat aksi selalu ada (Edit · Bab · Pratinjau · Hapus); tiga sisanya muncul
 * **hanya bila berlaku**, bukan muncul-lalu-dinonaktifkan. Tombol mati yang
 * tetap terlihat mengajari penulis mencoba hal yang tidak akan pernah bekerja.
 *
 * Aturan Analisa **dibalik dari prototipe** (PRD 07 §7 #1): di sana justru
 * cerita terbit yang kehilangan tautan analitiknya — padahal hanya cerita terbit
 * yang punya angka untuk dianalisa.
 */
/**
 * Kata status diwarnai **nadanya**, bukan diberi latar.
 *
 * `danger` tetap tinta merah untuk teks — brief §5 melarang *isi* merah pada
 * tombol destruktif, bukan melarang warna sebagai penanda status. Yang dilarang
 * adalah blok merah yang menarik mata lebih dulu daripada judul ceritanya.
 */
const STATUS_TEXT: Record<Nada, string> = {
  neutral: 'text-nv-muted',
  info: 'text-nv-text-2',
  accent: 'text-nv-gold',
  warning: 'text-nv-gold',
  success: 'text-nv-success',
  danger: 'text-nv-danger',
}

export function StudioCard({ item, onSchedule, onPrint, onDelete }: StudioCardProps) {
  const { story, studioStatus } = item
  const status = STATUS[studioStatus]

  /*
   * **Tiga metrik, bukan enam** (`7j`). Enam angka berjajar di satu baris pecah
   * jadi tiga baris di 390px dan berhenti terbaca sebagai ringkasan. Yang tiga
   * ini yang dipakai penulis untuk memutuskan: berapa yang membaca, seberapa
   * disukai, sudah berapa bab. Sisanya ada lengkap di halaman analitik.
   */
  const metrics = [
    { label: t('studio.mViews'), value: formatCompactCoin(story.stats.reads) },
    {
      label: t('studio.mRating'),
      value: story.stats.rating > 0 ? `★ ${story.stats.rating.toFixed(1)}` : '★ —',
    },
    { label: t('studio.mChapters'), value: String(story.stats.chapterCount) },
  ]

  return (
    <article className="py-4">
      <div className="flex items-start gap-3">
        {story.coverUrl ? (
          <img
            src={story.coverUrl}
            alt=""
            loading="lazy"
            className="h-20 w-14 shrink-0 rounded-nv-md object-cover"
          />
        ) : (
          <span className="block h-20 w-14 shrink-0 rounded-nv-md bg-nv-paper-2" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 font-display text-card font-bold text-nv-text">{story.title}</h3>
            {/* **Kata status, bukan lencana berlatar** (`7j`): satu kata berwarna
                statusnya sudah cukup, dan pil berlatar di tiap baris membuat
                daftar delapan cerita terlihat seperti delapan peringatan. */}
            <span className={cx('shrink-0 text-caption font-semibold', STATUS_TEXT[status.tone])}>
              {status.label}
            </span>
          </div>
          <p className="truncate pt-0.5 text-caption text-nv-muted">
            {[...story.genres, story.updatedAt].join(' · ')}
          </p>
          <p className="pt-1 text-caption text-nv-muted tabular-nums">
            {metrics
              .map((m) =>
                m.value.startsWith('★') ? m.value : `${m.value} ${m.label.toLowerCase()}`,
              )
              .join(' · ')}
          </p>
        </div>
      </div>

      {/* Alasan penolakan tampil di kartunya sendiri — penulis tidak boleh harus
          mencarinya (FR-STUDIO-38). */}
      {studioStatus === 'rejected' && item.rejectReason && (
        <div className="mt-3 border-nv-danger border-l-2 pl-3">
          <p className="nv-section-label text-nv-danger">{t('studio.rejectedLabel')}</p>
          <p className="pt-1 font-display text-card text-nv-text-2">{item.rejectReason}</p>
        </div>
      )}

      {/* Jadwal terbit sebagai kutipan di balik garis emas (`7j`) — ia kabar,
          bukan peringatan, jadi ia tidak berlatar. */}
      {item.scheduledAt && (
        <p className="mt-3 border-nv-gold-line border-l-2 pl-3 font-display text-card text-nv-text-2">
          {t('studio.scheduledFor')(formatDateTime(new Date(item.scheduledAt)))}
        </p>
      )}

      {/* Satu bab terbit adalah momen paling tepat mengingatkan ritme rilis —
          dan satu-satunya yang bisa dikenali dari angka (FR-STUDIO-35). */}
      {item.publishedChapters === 1 && (
        <div className="mt-3 rounded-nv-md bg-nv-accent-soft p-3">
          <p className="text-caption text-nv-text">{t('studio.nudgeFirstChapter')}</p>
          <div className="flex flex-wrap gap-3 pt-1.5">
            <Link
              to={`/karya/${story.id}/bab/baru`}
              className="text-caption font-semibold text-nv-accent underline"
            >
              {t('studio.nudgeSchedule')}
            </Link>
            <Link
              to={`/karya/${story.id}/bab`}
              className="text-caption font-semibold text-nv-accent underline"
            >
              {t('studio.nudgeAccess')}
            </Link>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <ActionLink to={`/karya/${story.id}/ubah`} primary>
          {t('studio.actEdit')}
        </ActionLink>
        <ActionLink to={`/karya/${story.id}/bab`}>{t('studio.actChapters')}</ActionLink>
        <ActionLink to={`/cerita/${story.id}`}>{t('studio.actPreview')}</ActionLink>

        {studioStatus === 'draft' && (
          <Button variant="secondary" size="sm" onClick={() => onSchedule(item)}>
            {t('studio.actSchedule')}
          </Button>
        )}

        {(studioStatus === 'published' || studioStatus === 'completed') && (
          <ActionLink to={`/karya/${story.id}/analitik`}>{t('studio.actAnalytics')}</ActionLink>
        )}

        {studioStatus === 'completed' && (
          <Button variant="secondary" size="sm" onClick={() => onPrint(item)}>
            {t('studio.actPrint')}
          </Button>
        )}

        {/* `Hapus` **didorong ke kanan sebagai teks redup** (`7j`). Ia tetap
            destruktif dan tetap minta konfirmasi — yang berubah cuma bahwa ia
            berhenti bersaing perhatian dengan empat aksi yang dipakai tiap hari. */}
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="relative ml-auto h-9 px-1 font-semibold text-caption text-nv-muted after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']"
        >
          {t('studio.actDelete')}
        </button>
      </div>
    </article>
  )
}

/** Tautan yang tampil seperti tombol kecil sekunder — tujuan, bukan aksi. */
function ActionLink({
  to,
  primary,
  children,
}: {
  to: string
  primary?: boolean
  children: string
}) {
  return (
    <Link
      to={to}
      className={cx(
        // Kotak sentuh 44px lewat `::after`, sama seperti tombol `sm` (R7).
        "relative inline-flex h-9 items-center rounded-nv-pill px-3.5 font-semibold text-caption transition after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        primary
          ? 'bg-nv-accent text-nv-card'
          : 'border border-nv-line-soft text-nv-text hover:bg-nv-paper-2',
      )}
    >
      {children}
    </Link>
  )
}

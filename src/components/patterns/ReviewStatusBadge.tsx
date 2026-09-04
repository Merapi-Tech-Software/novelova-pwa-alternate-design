import type { ReviewState } from '@/api/contracts'
import { Badge } from '../ui/Chip'

export interface ReviewStatusBadgeProps {
  state: ReviewState
  /** Wajib terisi saat `rejected` — penolakan harus bisa ditindaklanjuti. */
  reason?: string | null
}

/**
 * Status tinjauan (FR-STUDIO-38) — dipakai cerita, bab, dan pesanan cetak.
 *
 * `published` tidak merender apa pun: lencana "Terbit" di samping cerita yang
 * jelas sudah terbit hanya menambah kebisingan.
 */
export function ReviewStatusBadge({ state, reason }: ReviewStatusBadgeProps) {
  if (state === 'published') return null

  if (state === 'draft') return <Badge tone="neutral">Draf</Badge>

  if (state === 'in_review') return <Badge tone="warning">Dalam tinjauan</Badge>

  return (
    <span className="inline-flex flex-col gap-1">
      <Badge tone="danger">Ditolak</Badge>
      {reason && <span className="text-caption text-nv-muted">{reason}</span>}
    </span>
  )
}

import { Link } from 'react-router'
import type { UserRowData } from '@/api/contracts'
import { cx } from '@/lib/cx'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Chip'

export interface UserRowProps {
  user: UserRowData
  /** Optimistis: berubah seketika, dikembalikan disertai pesan bila server menolak. */
  onToggleFollow?: (userId: string) => void
  pending?: boolean
  className?: string
}

/** Avatar inisial — tanpa gambar, tanpa permintaan jaringan tambahan. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
}

/**
 * Satu baris pengguna — dipakai daftar pengikut, daftar mengikuti, dan hasil
 * pencarian pengguna (FR-PROF-09).
 *
 * Baris aktivitas berbunyi *"Aktivitas disembunyikan"* bila `activity` kosong.
 * Itu bukan keadaan gagal: pengguna memang mematikan visibilitasnya, dan
 * privasinya benar-benar berlaku ke pengunjung (FR-PROF-10).
 */
export function UserRow({ user, onToggleFollow, pending = false, className }: UserRowProps) {
  return (
    <div className={cx('flex items-center gap-3 py-2.5', className)}>
      <Link
        to={`/pengguna/${user.id}`}
        className="grid size-11 shrink-0 place-items-center rounded-nv-pill bg-nv-accent-soft font-semibold text-caption text-nv-accent-strong"
        aria-hidden
      >
        {initials(user.displayName)}
      </Link>

      <div className="min-w-0 flex-1">
        <Link to={`/pengguna/${user.id}`} className="flex items-center gap-2">
          <span className="truncate text-body font-semibold">{user.displayName}</span>
          {user.role === 'author' && <Badge tone="accent">Penulis</Badge>}
        </Link>
        <p className="truncate text-caption text-nv-muted">
          @{user.username}
          {' · '}
          {user.activity ?? 'Aktivitas disembunyikan'}
        </p>
      </div>

      {onToggleFollow && (
        <Button
          size="sm"
          variant={user.isFollowing ? 'secondary' : 'primary'}
          loading={pending}
          onClick={() => onToggleFollow(user.id)}
        >
          {user.isFollowing ? 'Mengikuti' : 'Ikuti'}
        </Button>
      )}
    </div>
  )
}

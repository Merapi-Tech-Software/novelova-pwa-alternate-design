import { Bell } from 'lucide-react'
import { Link } from 'react-router'
import { useUnreadCount } from '@/hooks/useUnreadCount'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
import { badgeCount } from '@/lib/notif'

/**
 * Lonceng notifikasi beserta lencananya · FR-NOTIF-03.
 *
 * Di `patterns/` karena lencananya harus sama di mana pun loncengnya muncul —
 * dan menghitung "9+" di dua tempat berarti dua tempat yang bisa berbeda.
 * Aturannya sendiri hidup di `lib/notif.ts` (`badgeCount`) supaya bisa diuji
 * tanpa merender apa pun.
 *
 * **Nol tidak menampilkan lencana sama sekali**, bukan `0`: lencana yang selalu
 * ada berhenti berarti, dan titik kecil yang permanen di kepala beranda terbaca
 * sebagai cacat.
 */
export function NotificationBell({ className }: { className?: string }) {
  const unread = useUnreadCount()
  const badge = badgeCount(unread.data ?? 0)

  return (
    <Link
      to="/notifikasi"
      // Namanya membawa jumlahnya: lencana visual tidak terbaca pembaca layar,
      // dan "Notifikasi" saja menyembunyikan justru bagian yang baru.
      aria-label={t('notif.bell')(unread.data ?? 0)}
      title={t('notif.title')}
      className={cx('relative', className)}
    >
      <Bell size={18} aria-hidden />
      {badge && (
        <span
          aria-hidden
          className={cx(
            'absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-nv-pill',
            'bg-nv-gold px-1 font-semibold text-[10px] text-nv-card leading-none tabular-nums',
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}

import {
  BookOpenText,
  CalendarClock,
  Coins,
  Gift,
  MessageSquareText,
  Package,
  ShieldAlert,
  Ticket,
  UserPlus,
  Wallet,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Notification, NotifKind } from '@/api/contracts'
import { t } from '@/i18n/t'
import { cx } from '@/lib/cx'
import { formatRelative } from '@/lib/format'
import { NOTIF_KINDS } from '@/lib/notif'

/**
 * Ikon per **jenis**, bukan per saringan · FR-NOTIF-01.
 *
 * Sebelas jenis dapat sebelas ikon karena barisnya harus bisa dikenali sebelum
 * dibaca — empat ikon untuk sebelas kabar yang berbeda membuat daftar ini
 * terlihat seragam justru di tempat perbedaannya paling berguna.
 */
const ICON: Record<NotifKind, ReactNode> = {
  'bab-baru': <BookOpenText size={16} aria-hidden />,
  'bab-terjadwal': <CalendarClock size={16} aria-hidden />,
  'cerita-terjadwal': <CalendarClock size={16} aria-hidden />,
  'cetak-status': <Package size={16} aria-hidden />,
  topup: <Coins size={16} aria-hidden />,
  checkin: <Gift size={16} aria-hidden />,
  'voucher-kedaluwarsa': <Ticket size={16} aria-hidden />,
  'ulasan-komentar': <MessageSquareText size={16} aria-hidden />,
  'pengikut-baru': <UserPlus size={16} aria-hidden />,
  penarikan: <Wallet size={16} aria-hidden />,
  keamanan: <ShieldAlert size={16} aria-hidden />,
}

/**
 * Satu baris pusat notifikasi · FR-NOTIF-01 · FR-NOTIF-03.
 *
 * **Menekannya melakukan dua hal**: menandainya terbaca dan membuka tujuannya.
 * Keduanya di satu ketukan — memisahkannya jadi "tandai" dan "buka" berarti
 * daftar yang sudah dibuka seluruhnya tetap penuh penanda belum dibaca.
 *
 * Latar belum-dibaca memakai `--nv-accent-soft` (FR-NOTIF-03), **ditambah**
 * titik penanda: latar aksen yang sangat lembut adalah pembeda 6 % kecerahan,
 * dan itu tidak cukup sendirian untuk mata yang membedakan warna dengan susah.
 */
export function NotificationRow({
  notif,
  onOpen,
}: {
  notif: Notification
  onOpen: (id: string) => void
}) {
  const unread = notif.readAt === null

  return (
    <Link
      to={notif.deepLink}
      onClick={() => onOpen(notif.id)}
      className={cx(
        'flex items-start gap-3 border-nv-line border-b px-4 py-3 transition last:border-0',
        unread ? 'bg-nv-accent-soft' : 'hover:bg-nv-paper-2',
      )}
    >
      <span
        className={cx(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-nv-pill',
          unread ? 'bg-nv-card text-nv-gold' : 'bg-nv-paper-2 text-nv-muted',
        )}
      >
        {ICON[notif.kind]}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span
            className={cx(
              'min-w-0 flex-1 text-body',
              unread ? 'font-semibold text-nv-text' : 'text-nv-text-2',
            )}
          >
            {notif.title}
          </span>
          {unread && (
            <span
              className="mt-1.5 size-2 shrink-0 rounded-nv-pill bg-nv-gold-line"
              title={t('notif.unreadDot')}
            >
              <span className="sr-only">{t('notif.unreadDot')}</span>
            </span>
          )}
        </span>

        {/*
          Latar belum-dibaca (`--nv-accent-soft` di atas kertas)
          menaikkan lantai kontrasnya: `--nv-muted` yang 5,4:1 di atas kertas
          tinggal **4,35:1** di sini — terukur axe, dan 1.4.3 menuntut 4,5:1.
          Teks sekunder yang lebih gelap membetulkannya sekaligus menegaskan
          barisnya, jadi dua hal dibayar satu perubahan.
        */}
        <span
          className={cx(
            'block truncate pt-0.5 text-caption',
            unread ? 'text-nv-text-2' : 'text-nv-muted',
          )}
        >
          {notif.body}
        </span>

        <span
          className={cx('block pt-1 text-caption', unread ? 'text-nv-text-2' : 'text-nv-muted')}
        >
          {[
            NOTIF_KINDS[notif.kind].label,
            formatRelative(new Date(notif.createdAt)),
            notif.groupCount > 1 ? t('notif.grouped')(notif.groupCount) : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
    </Link>
  )
}

/** Kerangka pemuatan **setinggi barisnya**, bukan spinner (FR-CORE-03). */
export function NotificationSkeleton() {
  return (
    <ul className="divide-y divide-nv-line">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i} className="flex items-start gap-3 px-4 py-3">
          <span className="size-8 shrink-0 animate-pulse rounded-nv-pill bg-nv-paper-2" />
          <span className="min-w-0 flex-1 space-y-2 pt-1">
            <span className="block h-3.5 w-3/4 animate-pulse rounded-nv-sm bg-nv-paper-2" />
            <span className="block h-3 w-1/2 animate-pulse rounded-nv-sm bg-nv-paper-2" />
          </span>
        </li>
      ))}
    </ul>
  )
}

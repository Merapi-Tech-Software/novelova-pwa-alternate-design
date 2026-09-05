import {
  Bell,
  BookOpen,
  ChevronRight,
  CircleHelp,
  PenLine,
  Receipt,
  Settings2,
  Ticket,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { api } from '@/api/client'
import { CoinChip } from '@/components/patterns/CoinChip'
import { useVouchers } from '@/hooks/useVouchers'
import { useWallet } from '@/hooks/useWallet'
import { t } from '@/i18n/t'
import { formatCompactCoin } from '@/lib/coin'
import { useSession } from '@/stores/session'
import { useReaderStats } from '../hooks/useReaderStats'

/** Satu baris menu akun · `7i`: ikon, label, nilai redup opsional, chevron. */
function Baris({
  icon,
  label,
  value,
  to,
}: {
  icon: ReactNode
  label: string
  value?: string
  to: string
}) {
  return (
    <li>
      <Link to={to} className="flex min-h-11 items-center gap-3 py-3">
        <span className="shrink-0 text-nv-muted">{icon}</span>
        <span className="min-w-0 flex-1 truncate font-display text-card font-semibold">
          {label}
        </span>
        {value && <span className="shrink-0 text-caption text-nv-muted">{value}</span>}
        <ChevronRight size={16} aria-hidden className="shrink-0 text-nv-muted" />
      </Link>
    </li>
  )
}

/**
 * Profil · FR-PROF-01 · mockup `7i`.
 *
 * **Tiga blok, tiga peran.** Kepala menjawab "siapa saya di sini"; panel koin
 * putih menjawab "berapa yang saya punya" dan memberi satu jalan mengisinya;
 * daftar `AKUN` menjawab "apa yang bisa saya ubah". Strip tiga sel di antaranya
 * adalah satu-satunya tempat pembaca melihat rekam jejaknya sendiri.
 *
 * **Ketiga angkanya diturunkan server** (`getReaderStats`), bukan penghitung
 * tersimpan — penghitung akan berselisih dengan sumbernya pada penghapusan
 * pertama, dan yang berselisih di sini adalah klaim tentang pengguna sendiri.
 *
 * `Keluar` sengaja **teks redup, bukan tombol merah**: ia bukan tindakan
 * destruktif, dan brief §5 melarang isi merah untuk tindakan yang bisa
 * dibatalkan dengan masuk lagi.
 */
export default function ProfilePage() {
  const profile = useSession((s) => s.profile)
  const clearSession = useSession((s) => s.clearSession)
  const wallet = useWallet()
  const voucher = useVouchers()
  const stats = useReaderStats()

  const aktif = voucher.data?.length ?? 0
  const huruf = (profile?.displayName ?? '?').trim().charAt(0).toUpperCase()

  return (
    <div className="pb-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="nv-section-label">{t('profile.label')}</span>
        <Link
          to="/pengaturan/keamanan"
          aria-label={t('profile.settings')}
          className="grid size-11 shrink-0 place-items-center rounded-nv-pill text-nv-text"
        >
          <Settings2 size={18} aria-hidden />
        </Link>
      </div>

      <header className="flex items-center gap-4">
        <span
          aria-hidden
          className="grid size-16 shrink-0 place-items-center rounded-nv-pill bg-nv-gold-soft font-display text-page text-nv-gold"
        >
          {huruf}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-page font-bold">{profile?.displayName ?? '—'}</p>
          <p className="truncate pt-0.5 text-caption text-nv-muted">
            {t('profile.since')(profile?.joinedYear ?? new Date().getFullYear())}
          </p>
        </div>
        <Link
          to="/profil/ubah"
          className="flex h-11 shrink-0 items-center rounded-nv-pill border border-nv-line-soft px-4 text-body font-semibold"
        >
          {t('profile.edit')}
        </Link>
      </header>

      {/* Panel koin: satu-satunya blok putih di halaman ini, dan itu disengaja —
          ia satu-satunya yang membawa uang. */}
      <section className="mt-5 flex items-center gap-4 rounded-nv-lg bg-nv-card p-4">
        <div className="min-w-0 flex-1">
          <p className="nv-section-label">{t('profile.coinLabel')}</p>
          <p className="pt-1">
            <CoinChip amount={wallet.data?.balance ?? 0} size="md" className="text-page" />
          </p>
          <p className="pt-1 text-caption text-nv-muted">{t('profile.vouchers')(aktif)}</p>
        </div>
        <Link
          to="/koin"
          className="flex h-11 shrink-0 items-center rounded-nv-pill bg-nv-accent px-5 text-body font-bold text-nv-card"
        >
          {t('profile.topUp')}
        </Link>
      </section>

      {/* Strip tiga sel · `7i`. Angka serif, label 9,5px — pola yang sama dengan
          strip empat sel di detail cerita dan studio. */}
      <dl className="mt-5 grid grid-cols-3 gap-3 border-nv-line border-y py-4">
        {[
          [stats.data?.storiesRead ?? 0, t('profile.statStories')],
          [stats.data?.hoursRead ?? 0, t('profile.statHours')],
          [stats.data?.reviewCount ?? 0, t('profile.statReviews')],
        ].map(([value, label]) => (
          <div key={String(label)}>
            <dd className="font-display text-page font-bold tabular-nums">
              {formatCompactCoin(Number(value))}
            </dd>
            <dt className="nv-section-label pt-1">{label}</dt>
          </div>
        ))}
      </dl>

      <p className="nv-section-label pt-5 pb-1">{t('profile.account')}</p>
      <ul className="divide-y divide-nv-line">
        <Baris
          icon={<Receipt size={17} aria-hidden />}
          label={t('profile.transactions')}
          to="/koin/transaksi"
        />
        <Baris
          icon={<Ticket size={17} aria-hidden />}
          label={t('profile.myVouchers')}
          value={String(aktif)}
          to="/hadiah"
        />
        <Baris
          icon={<BookOpen size={17} aria-hidden />}
          label={t('profile.readerSettings')}
          to="/pengaturan/bahasa"
        />
        <Baris
          icon={<Bell size={17} aria-hidden />}
          label={t('profile.notifications')}
          to="/notifikasi/pengaturan"
        />
        <Baris icon={<PenLine size={17} aria-hidden />} label={t('profile.myWorks')} to="/karya" />
        <Baris
          icon={<CircleHelp size={17} aria-hidden />}
          label={t('profile.help')}
          to="/bantuan"
        />
      </ul>

      <div className="pt-6 text-center">
        <button
          type="button"
          onClick={() => {
            // Server diberi tahu, lalu keadaan lokal dibersihkan. Urutannya
            // begitu supaya cookie refresh benar-benar dicabut, bukan hanya
            // dilupakan perangkat ini.
            void api.logout().finally(clearSession)
          }}
          className="h-11 px-4 font-semibold text-body text-nv-muted"
        >
          {t('profile.signOut')}
        </button>
      </div>
    </div>
  )
}

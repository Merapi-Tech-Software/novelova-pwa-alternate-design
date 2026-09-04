import { Coins } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { useWallet } from '@/hooks/useWallet'
import { t } from '@/i18n/t'
import { formatCompactCoin } from '@/lib/coin'

/**
 * Pintasan isi koin · FR-HOME-08.
 *
 * Mengambang di atas bilah bawah pada HP, dan **menjadi tombol biasa di dalam
 * sidebar** pada `≥1024` — di layar lebar tidak ada bilah bawah untuk
 * ditumpangi, dan tombol mengambang di sudut layar besar hanya menutupi konten.
 *
 * Disembunyikan saat pengguna sudah berada di halaman isi koin: pintasan menuju
 * halaman yang sedang dibuka bukan pintasan.
 *
 * **Saldonya ikut tampil** (FR-WALLET-17), dan angkanya datang dari `useWallet`
 * yang sama dengan bilah pembaca dan halaman isi koin — bukan dari hitungan
 * sendiri. Prototipe punya empat angka berbeda untuk satu dompet justru karena
 * tiap tempat menghitung ulang.
 */
export function TopupFab() {
  const { pathname } = useLocation()
  const wallet = useWallet()
  if (pathname.startsWith('/koin')) return null

  return (
    <Link
      to="/koin"
      aria-label={t('home.topup')}
      title={t('home.topup')}
      className="fixed right-4 bottom-[calc(var(--nv-bottom-nav)+0.75rem)] z-40 flex h-14 items-center gap-2 rounded-nv-pill bg-nv-accent px-4 font-semibold text-body text-nv-card shadow-nv transition hover:bg-nv-accent-strong lg:hidden"
    >
      <Coins size={22} aria-hidden />
      {wallet.data && (
        <span className="tabular-nums">{formatCompactCoin(wallet.data.balance)}</span>
      )}
    </Link>
  )
}

/** Bentuk sidebar: teks penuh, bukan ikon mengambang. */
export function TopupSidebarButton() {
  const { pathname } = useLocation()
  const wallet = useWallet()
  if (pathname.startsWith('/koin')) return null

  return (
    <Link
      to="/koin"
      className="mt-auto flex items-center gap-3 rounded-nv-pill bg-nv-accent px-4 py-2.5 text-body font-semibold text-nv-card transition hover:bg-nv-accent-strong"
    >
      <Coins size={18} aria-hidden />
      {t('home.topup')}
      {wallet.data && (
        <span className="ml-auto tabular-nums">{formatCompactCoin(wallet.data.balance)}</span>
      )}
    </Link>
  )
}

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
  // **Tidak dirender di halaman yang sudah punya bilah aksi sendiri.** Detail
  // cerita membawa bilah lengket "Lanjutkan" di posisi yang sama, dan dua
  // elemen melayang di sudut yang sama saling menindih — `7b` juga tidak
  // menggambar FAB di sana. Pintasan yang menutupi aksi utama bukan pintasan.
  if (pathname.startsWith('/koin') || pathname.startsWith('/cerita')) return null

  return (
    <Link
      to="/koin"
      // Saldonya tidak lagi tercetak di FAB (`7a` menggambarnya sebagai lingkaran
      // polos) tetapi **tetap diumumkan** di sini, dan tetap terlihat mata lewat
      // chip koin di kepala beranda. FR-WALLET-17 menuntut saldo terlihat di
      // beranda, bukan menuntut ia ada di tombol ini.
      aria-label={
        wallet.data
          ? `${t('home.topup')} · saldo ${formatCompactCoin(wallet.data.balance)} koin`
          : t('home.topup')
      }
      title={t('home.topup')}
      // Lingkaran 48px di **kiri** bawah (`7a`). Dua hal berubah sekaligus, dan
      // memang harus sekaligus: pil selebar ~110px di kanan menindih `See all`
      // yang rata kanan, sedangkan memindahkannya ke kiri tanpa mengecilkan
      // hanya menukar siapa yang tertutup — di 320px tab genre justru ada di
      // kiri. Saldonya tetap terbaca lewat nama aksesibel dan chip di kepala.
      className="fixed bottom-[calc(var(--nv-bottom-nav)+0.75rem)] left-4 z-40 grid size-12 place-items-center rounded-nv-pill bg-nv-accent text-nv-card shadow-nv transition lg:hidden"
    >
      <Coins size={20} aria-hidden />
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
      className="mt-auto flex items-center gap-3 rounded-nv-pill bg-nv-accent px-4 py-2.5 text-body font-semibold text-nv-card transition hover:bg-nv-accent"
    >
      <Coins size={18} aria-hidden />
      {t('home.topup')}
      {wallet.data && (
        <span className="ml-auto tabular-nums">{formatCompactCoin(wallet.data.balance)}</span>
      )}
    </Link>
  )
}

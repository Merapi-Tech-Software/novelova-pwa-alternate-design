import {
  Bell,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Download,
  Gift,
  PenLine,
  Receipt,
  Settings2,
  Ticket,
  Wallet,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Link } from 'react-router'
import { api } from '@/api/client'
import { CoinChip } from '@/components/patterns/CoinChip'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useVouchers } from '@/hooks/useVouchers'
import { useWallet } from '@/hooks/useWallet'
import { t } from '@/i18n/t'
import { formatCompactCoin } from '@/lib/coin'
import { usePwa } from '@/stores/pwa'
import { useSession } from '@/stores/session'

/** Berapa kali aplikasi ini dibuka di perangkat ini. Gagal baca = nol. */
function bacaJumlahSesi(): number {
  try {
    return Number.parseInt(localStorage.getItem('novelova:visit-count') ?? '0', 10) || 0
  } catch {
    return 0
  }
}

/** Masih ada naskah bab yang belum sampai ke server? */
function adaDrafLokal(): boolean {
  try {
    return Object.keys(localStorage).some((key) => key.startsWith('novelova:chapter-draft'))
  } catch {
    return false
  }
}

import { useAuthorProfile } from '@/features/studio/hooks/useAuthorProfile'
import { useReaderStats } from '../hooks/useReaderStats'
import { useWeeklyRecap } from '../hooks/useSettings'

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
  const recap = useWeeklyRecap()
  const author = useAuthorProfile()

  /**
   * Langkah penulis yang belum selesai · FR-STUDIO-33.
   *
   * **Diturunkan dari profil penulis**, bukan daftar tetap: langkah yang sudah
   * selesai tidak boleh tetap tampil sebagai tugas, dan itu satu-satunya cara
   * daftar ini berhenti berbohong seiring waktu.
   */
  const langkahPenulis = author.data
    ? [
        author.data.payoutVerified ? null : t('settings.stepPayout'),
        author.data.twoFactor ? null : t('settings.stepTwoFactor'),
        author.data.termsAcceptedAt ? null : t('settings.stepTerms'),
      ].filter((x) => x !== null)
    : []

  /** `none` berarti belum mendaftar — dan pintasan penghasilan tidak berlaku. */
  const penulisTerdaftar = author.data ? author.data.tier !== 'none' : false
  const [konfirmasiKeluar, setKonfirmasiKeluar] = useState(false)

  /**
   * Dua keadaan yang hanya diketahui perangkat ini, jadi keduanya dibaca dari
   * penyimpanannya — bukan dari server.
   *
   * `sesiCukup` menghitung berapa kali aplikasi dibuka; `adaDraf` memeriksa
   * apakah masih ada naskah bab yang tersimpan lokal tetapi belum sampai ke
   * server (kunci `novelova:chapter-draft-*`, editor bab Fase 8d).
   */
  const sesiCukup = bacaJumlahSesi() >= 3
  const installPrompt = usePwa((s) => s.installPrompt)
  const sudahTerpasang = usePwa((s) => s.sudahTerpasang)
  const setInstallPrompt = usePwa((s) => s.setInstallPrompt)
  const toast = useToast()
  const adaDraf = adaDrafLokal()

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

      {/*
        Dua pintasan uang lain · FR-PROF-03. Ditaruh **di bawah panel koin**,
        bukan di dalamnya: panel itu menjawab "berapa yang saya punya", dan
        menempelkan dua tautan lagi ke sana membuat satu-satunya blok putih
        halaman ini memikul tiga pertanyaan sekaligus.
      */}
      <ul className="mt-3 grid grid-cols-2 gap-3">
        <li>
          <Link
            to="/hadiah"
            className="nv-tap flex w-full items-center gap-2 rounded-nv-md border border-nv-line-soft px-3 py-2.5 text-body"
          >
            <Gift size={16} aria-hidden className="shrink-0 text-nv-muted" />
            <span className="min-w-0 truncate">{t('settings.rewardsShortcut')}</span>
          </Link>
        </li>
        {/*
          **Hanya untuk penulis terdaftar** · FR-EARN-10. Halaman penghasilan
          dijaga `RequireAuthor`, jadi menampilkannya ke pembaca biasa berarti
          menawarkan pintu yang menolaknya — dan pintu yang menolak lebih buruk
          daripada pintu yang tidak digambar.
        */}
        {penulisTerdaftar && (
          <li>
            <Link
              to="/penulis/analitik"
              className="nv-tap flex w-full items-center gap-2 rounded-nv-md border border-nv-line-soft px-3 py-2.5 text-body"
            >
              <Wallet size={16} aria-hidden className="shrink-0 text-nv-muted" />
              <span className="min-w-0 truncate">{t('settings.earningsShortcut')}</span>
            </Link>
          </li>
        )}
      </ul>

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

      {/*
        Dua statistik koneksi · FR-PROF-09. **Tab yang terbuka ditentukan yang
        ditekan** — menekan "Pengikut" lalu mendarat di tab "Mengikuti" adalah
        tautan yang membohongi labelnya sendiri.
      */}
      <ul className="grid grid-cols-2 gap-3 pt-4">
        <li>
          <Link
            to="/profil/koneksi?tab=followers"
            className="nv-tap flex w-full items-center justify-between gap-2 rounded-nv-md border border-nv-line-soft px-3 py-2.5"
          >
            <span className="text-body">{t('settings.followers')}</span>
            <ChevronRight size={15} aria-hidden className="shrink-0 text-nv-muted" />
          </Link>
        </li>
        <li>
          <Link
            to="/profil/koneksi?tab=following"
            className="nv-tap flex w-full items-center justify-between gap-2 rounded-nv-md border border-nv-line-soft px-3 py-2.5"
          >
            <span className="text-body">{t('settings.following')}</span>
            <ChevronRight size={15} aria-hidden className="shrink-0 text-nv-muted" />
          </Link>
        </li>
      </ul>

      {/*
        Rekap mingguan · FR-PROF-02, berlabel **HANYA KAMU**.
        Label itu bukan hiasan: ia satu-satunya blok di halaman ini yang tidak
        pernah tampil ke orang lain apa pun nilai sakelar privasinya, dan tanpa
        labelnya pembaca tidak punya cara tahu.
      */}
      <section className="mt-5 rounded-nv-md border border-nv-line-soft p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-card font-semibold">{t('settings.recapTitle')}</h2>
          <span className="nv-section-label shrink-0">{t('settings.onlyYou')}</span>
        </div>
        {recap.data && recap.data.chapters > 0 ? (
          <>
            <p className="pt-2 text-body text-nv-text">
              {t('settings.recapLine')(recap.data.chapters, recap.data.minutes, recap.data.stories)}
            </p>
            <p className="pt-0.5 text-caption text-nv-muted">
              {t('settings.recapChange')(recap.data.changePct)}
            </p>
          </>
        ) : (
          <p className="pt-2 text-body text-nv-muted">{t('settings.recapEmpty')}</p>
        )}
      </section>

      <p className="nv-section-label pt-5 pb-1">{t('profile.account')}</p>

      {/*
        Status penulis · FR-STUDIO-33. Ditaruh di kelompok Akun, bukan di studio:
        yang bertanya "sudah sampai mana pendaftaranku" adalah orang yang belum
        masuk ke studio, dan menaruh jawabannya di dalam studio menuntut dia tahu
        lebih dulu bahwa ia sudah boleh masuk.
      */}
      {author.data && (
        <Link
          to={penulisTerdaftar ? '/karya' : '/karya/daftar-penulis'}
          className="mb-1 flex items-center gap-3 rounded-nv-md border border-nv-line-soft px-3 py-2.5"
        >
          <PenLine size={17} aria-hidden className="shrink-0 text-nv-muted" />
          <span className="min-w-0 flex-1">
            <span className="block text-body text-nv-text">{t('settings.authorStatus')}</span>
            <span className="block pt-0.5 text-caption text-nv-muted">
              {[
                author.data.tier === 'verified'
                  ? t('settings.authorTierVerified')
                  : author.data.tier === 'registered'
                    ? t('settings.authorTierRegistered')
                    : t('settings.authorTierNone'),
                langkahPenulis.length > 0
                  ? t('settings.authorNextSteps')(langkahPenulis.length)
                  : t('settings.authorAllDone'),
              ].join(' · ')}
            </span>
            {langkahPenulis.length > 0 && (
              <span className="block pt-1 text-caption text-nv-gold">
                {langkahPenulis.join(' · ')}
              </span>
            )}
          </span>
          <ChevronRight size={16} aria-hidden className="shrink-0 text-nv-muted" />
        </Link>
      )}

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

      {/*
        Ajakan memasang aplikasi · muncul setelah pengguna cukup sering kembali.
        Ambangnya **tiga sesi**: menawarkannya pada kunjungan pertama adalah
        meminta komitmen sebelum ada alasan untuk memberikannya.
      */}
      {sesiCukup && !sudahTerpasang && (
        <section className="mt-6 rounded-nv-md border border-nv-line-soft p-4">
          <div className="flex items-start gap-3">
            <Download size={17} aria-hidden className="mt-0.5 shrink-0 text-nv-muted" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-card font-semibold">{t('settings.installApp')}</h2>
              <p className="pt-1 text-caption text-nv-muted">{t('settings.installBody')}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => {
                  /*
                   * Prompt yang **ditahan** `PwaBridge` dipakai di sini · §10.2.
                   *
                   * Peramban hanya mengizinkan `prompt()` dipanggil dari gestur
                   * pengguna, dan hanya sekali per peristiwa — jadi setelah
                   * dipakai ia dibuang. Peramban yang tidak pernah mengirim
                   * peristiwanya (Safari, Firefox desktop) dijawab kalimat yang
                   * menyebut itu, bukan tombol yang diam.
                   */
                  if (!installPrompt) {
                    toast.show(t('pwa.installFailed'), { tone: 'neutral' })
                    return
                  }
                  void installPrompt.prompt().then(async () => {
                    const { outcome } = await installPrompt.userChoice
                    if (outcome === 'accepted') toast.show(t('pwa.installed'), { tone: 'success' })
                    setInstallPrompt(null)
                  })
                }}
              >
                {t('settings.installApp')}
              </Button>
            </div>
          </div>
        </section>
      )}

      <div className="pt-6 text-center">
        <button
          type="button"
          onClick={() => setKonfirmasiKeluar(true)}
          className="h-11 px-4 font-semibold text-body text-nv-muted"
        >
          {t('profile.signOut')}
        </button>
      </div>

      {/*
        Keluar **dengan konfirmasi** · FR-PROF-05, FR-AUTH-12 — dan peringatannya
        berbeda saat ada draf yang belum tersimpan ke server. Draf bab hidup di
        penyimpanan perangkat ini; keluar tidak menghapusnya, tetapi perangkat
        berikutnya tidak akan melihatnya, dan itu perlu dikatakan sebelum
        ditekan, bukan sesudah.
      */}
      {konfirmasiKeluar && (
        <Modal open onClose={() => setKonfirmasiKeluar(false)} title={t('settings.signOutConfirm')}>
          {adaDraf && (
            <p className="pb-3 text-body text-nv-text-2">{t('settings.signOutDraftWarning')}</p>
          )}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setKonfirmasiKeluar(false)}
            >
              {t('settings.signOutCancel')}
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                // Server diberi tahu, lalu keadaan lokal dibersihkan. Urutannya
                // begitu supaya cookie refresh benar-benar dicabut, bukan hanya
                // dilupakan perangkat ini.
                void api.logout().finally(clearSession)
              }}
            >
              {t('profile.signOut')}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

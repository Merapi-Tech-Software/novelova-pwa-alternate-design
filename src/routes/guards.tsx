import { Link, Navigate, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router'
import type { AuthorTier } from '@/api/contracts'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { Skeleton } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthorProfile } from '@/features/studio/hooks/useAuthorProfile'
import { useReaderPrefs } from '@/hooks/useReaderPrefs'
import { t } from '@/i18n/t'
import { safeNext } from '@/lib/nav'
import { useSession } from '@/stores/session'

/**
 * Penjaga rute · FR-AUTH-12 · FR-STUDIO-33 · architecture.md §8.
 *
 * Guard-nya **komponen**, bukan `loader` data router. Alasannya bisa diuji:
 * `createMemoryRouter` membuat `Request` pada tiap navigasi dan `AbortSignal`
 * milik jsdom ditolak `Request` bawaan Node, sehingga alur "rute terlindungi →
 * `/masuk?next=…` → kembali ke tujuan" tidak bisa diuji sama sekali dengan
 * loader. Guard sebagai komponen berjalan di `MemoryRouter` biasa.
 *
 * Karena itu berkasnya `.tsx`, bukan `guards.ts` seperti tertulis di rencana.
 */

/** Selama sesi dihidrasi. Kerangka, bukan spinner — layar tidak berkedip kosong. */
function Hydrating() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Skeleton lines={6} />
      <span className="sr-only">{t('session.hydrating')}</span>
    </div>
  )
}

/**
 * Rute yang menuntut sesi. Tanpa sesi → `/masuk?next=<tujuan asal>`, sehingga
 * setelah masuk pengguna mendarat di halaman yang tadi dituju — bukan di beranda.
 */
export function RequireAuth() {
  const status = useSession((s) => s.status)
  const location = useLocation()

  if (status === 'unknown') return <Hydrating />
  if (status === 'guest') {
    const from = `${location.pathname}${location.search}`
    return (
      <Navigate replace to={from === '/' ? '/masuk' : `/masuk?next=${encodeURIComponent(from)}`} />
    )
  }
  return <Outlet />
}

/**
 * Kebalikannya: `/masuk` dan `/daftar` tidak ada gunanya bagi yang sudah masuk.
 * Tujuannya diambil dari `?next=`, jadi tautan masuk yang dibuka dua kali tetap
 * mendarat di tempat yang sama.
 *
 * **Yang belum melewati pengenalan mendarat di `/mulai`** (FR-AUTH-11).
 * Aturannya di sini, bukan di `RegisterPage`, karena guard inilah yang benar-benar
 * memutuskan: `navigate('/mulai')` milik halaman daftar **selalu kalah** —
 * React Query menunggu `onSuccess` miliknya sendiri lebih dulu, jadi sesi sudah
 * jadi `authenticated` satu render sebelum navigasinya jalan, dan guard ini
 * sudah melempar pendaftar baru ke `/` sebelum ia sempat melihat pengenalan.
 * Akibatnya **tidak ada satu pun akun baru yang pernah melihat `/mulai`** —
 * ditemukan saat R8, dan tidak terlihat sebelumnya karena perangkat contoh
 * memulai dalam keadaan sudah masuk dan sudah selesai onboarding.
 *
 * Menaruhnya di sini sekaligus menutup jalan kedua: yang meninggalkan pengenalan
 * di tengah lalu membuka `/masuk` lagi dikembalikan ke pengenalan, bukan ke
 * beranda yang belum tahu apa pun tentang seleranya.
 */
export function RequireGuest() {
  const status = useSession((s) => s.status)
  const [params] = useSearchParams()
  // Hanya ditanyakan saat sesinya ada; tanpa sesi, servernya menolak.
  const prefs = useReaderPrefs(status === 'authenticated')

  if (status === 'unknown') return <Hydrating />
  if (status === 'authenticated') {
    // Selama jawabannya belum datang, jangan mengambil keputusan: menebak
    // "sudah onboarding" akan melempar pendaftar baru ke beranda, dan menebak
    // sebaliknya akan menyeret pengguna lama ke pengenalan yang sudah dilewatinya.
    if (prefs.isPending) return <Hydrating />
    // `?next=` tetap menang: ia permintaan eksplisit dari tautan yang diklik.
    const next = params.get('next')
    if (!next && prefs.data && !prefs.data.onboardedAt) return <Navigate replace to="/mulai" />
    return <Navigate replace to={safeNext(next)} />
  }
  return <Outlet />
}

const RANK: Record<AuthorTier, number> = { none: 0, registered: 1, verified: 2 }

/**
 * Tiga tingkat penulis, bukan satu sakelar (FR-STUDIO-33).
 *
 * - `none` → halaman pendaftaran penulis, karena halaman itu **adalah** ajakannya.
 * - `registered` → boleh menulis dan menerbitkan gratis.
 * - `verified` → boleh menetapkan bab berbayar dan mencairkan penghasilan.
 *
 * Guard ini tidak pernah memblokir menulis. Yang tingkatnya kurang untuk halaman
 * uang tidak diusir, hanya dijelaskan apa yang kurang — mengusirnya di tengah
 * pekerjaan adalah cara tercepat kehilangan penulis.
 */
export function RequireAuthor({ min }: { min: 'registered' | 'verified' }) {
  const { data, isPending, isError, refetch } = useAuthorProfile()
  const location = useLocation()
  const navigate = useNavigate()

  if (isPending) return <Hydrating />

  if (isError || !data) {
    return (
      <FailureNotice
        level="inset"
        className="m-4"
        title={t('session.authorCheckFailed')}
        body={t('session.authorCheckFailedBody')}
        safety={t('session.authorCheckFailedSafe')}
        onRetry={() => {
          void refetch()
        }}
      />
    )
  }

  if (RANK[data.tier] >= RANK[min]) return <Outlet />

  if (data.tier === 'none') {
    return (
      <Navigate
        replace
        to={`/karya/daftar-penulis?next=${encodeURIComponent(location.pathname)}`}
      />
    )
  }

  return (
    <EmptyState
      title={t('session.verifyTitle')}
      description={t('session.verifyBody')}
      action={{
        label: t('session.verifyAction'),
        onClick: () => navigate('/karya/daftar-penulis'),
      }}
      secondary={<Link to="/karya">{t('session.verifyBack')}</Link>}
    />
  )
}

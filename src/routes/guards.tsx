import { Link, Navigate, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router'
import type { AuthorTier } from '@/api/contracts'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { Skeleton } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthorProfile } from '@/features/studio/hooks/useAuthorProfile'
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
 */
export function RequireGuest() {
  const status = useSession((s) => s.status)
  const [params] = useSearchParams()

  if (status === 'unknown') return <Hydrating />
  if (status === 'authenticated') return <Navigate replace to={safeNext(params.get('next'))} />
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

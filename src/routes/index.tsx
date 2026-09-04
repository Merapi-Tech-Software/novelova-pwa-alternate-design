import type { ReactElement } from 'react'
import { lazy } from 'react'
import {
  createBrowserRouter,
  Outlet,
  type RouteObject,
  ScrollRestoration,
  useNavigate,
} from 'react-router'
import { AppShell } from '@/app/layouts/AppShell'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { ReaderLayout } from '@/app/layouts/ReaderLayout'
import { TopBarLayout } from '@/app/layouts/TopBarLayout'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { EmptyState } from '@/components/ui/EmptyState'
import { RequireAuth, RequireAuthor, RequireGuest } from './guards'

/**
 * **`ROUTES` adalah tabel architecture.md §8 dalam bentuk kode** — 42 rute,
 * kolom yang sama: path, judul, layout, guard.
 *
 * Ditulis sebagai data, bukan JSX bersarang, karena tabel ini punya dua pembaca:
 * router di bawah, dan pemeriksaan tautan otomatis yang menolak setiap `to=`
 * internal tanpa entri di sini (FR-CORE-05 — prototipe punya sembilan rujukan ke
 * halaman yang tidak pernah ada).
 *
 * Halaman diisi per fase lewat `element: lazy(() => import(...))`. Selama belum
 * ada, rutenya tetap hidup dengan penampung bernama: guard, layout, dan tombol
 * kembali sudah bisa dicoba sebelum layar pertamanya ditulis.
 */

export type RouteLayout = 'shell' | 'topbar' | 'reader' | 'auth'
export type RouteGuard = 'auth' | 'guest' | 'none' | 'penulis' | 'penulis-verified'

export interface RouteDef {
  path: string
  title: string
  layout: RouteLayout
  guard: RouteGuard
  /** Tujuan tombol kembali bila halaman dibuka lewat tautan langsung. */
  fallback?: string
  element?: ReactElement
}

// Halaman dimuat per modul; bundel awal hanya berisi shell dan penjaga rute.
const HomePage = lazy(() => import('@/features/home/pages/HomePage'))
const BrowsePage = lazy(() => import('@/features/home/pages/BrowsePage'))
const SearchPage = lazy(() => import('@/features/search/pages/SearchPage'))
const StoryDetailPage = lazy(() => import('@/features/story/pages/StoryDetailPage'))
const ReviewsPage = lazy(() => import('@/features/story/pages/ReviewsPage'))
const CommentsPage = lazy(() => import('@/features/story/pages/CommentsPage'))
const ReaderPage = lazy(() => import('@/features/reader/pages/ReaderPage'))
const SignInPage = lazy(() => import('@/features/auth/pages/SignInPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'))
const OnboardingPage = lazy(() => import('@/features/auth/pages/OnboardingPage'))
const TopupPage = lazy(() => import('@/features/wallet/pages/TopupPage'))
const StudioPage = lazy(() => import('@/features/studio/pages/StudioPage'))
const AuthorSignupPage = lazy(() => import('@/features/studio/pages/AuthorSignupPage'))
const ManageChaptersPage = lazy(() => import('@/features/studio/pages/ManageChaptersPage'))
const StoryFormPage = lazy(() => import('@/features/studio/pages/StoryFormPage'))
const ChapterEditorPage = lazy(() => import('@/features/studio/pages/ChapterEditorPage'))
const ChapterAccessPage = lazy(() => import('@/features/studio/pages/ChapterAccessPage'))
const AnalyticsPage = lazy(() => import('@/features/studio/pages/AnalyticsPage'))
const EarningsPage = lazy(() => import('@/features/studio/pages/EarningsPage'))
const PayoutHistoryPage = lazy(() => import('@/features/studio/pages/PayoutHistoryPage'))
const WithdrawPage = lazy(() => import('@/features/studio/pages/WithdrawPage'))
const PrintHistoryPage = lazy(() => import('@/features/studio/pages/PrintHistoryPage'))
const SchedulePage = lazy(() => import('@/features/studio/pages/SchedulePage'))
const ReviewQueuePage = lazy(() => import('@/features/studio/pages/ReviewQueuePage'))
const LibraryPage = lazy(() => import('@/features/library/pages/LibraryPage'))
const TransactionsPage = lazy(() => import('@/features/wallet/pages/TransactionsPage'))
const TransactionDetailPage = lazy(() => import('@/features/wallet/pages/TransactionDetailPage'))
const KitchenSink = lazy(() => import('./KitchenSink'))

/**
 * Pembagian tingkat penulis mengikuti aturan §8 "verifikasi baru diminta saat
 * menyentuh uang": jadwal dan analitik cukup `registered`, pencairan menuntut
 * `verified`.
 */
export const ROUTES: RouteDef[] = [
  // ── sebelum sesi ──────────────────────────────────────────────────────────
  { path: '/masuk', title: 'Masuk', layout: 'auth', guard: 'guest', element: <SignInPage /> },
  { path: '/daftar', title: 'Daftar', layout: 'auth', guard: 'guest', element: <RegisterPage /> },
  {
    path: '/lupa-sandi',
    title: 'Lupa kata sandi',
    layout: 'auth',
    guard: 'none',
    element: <ForgotPasswordPage />,
  },
  { path: '/mulai', title: 'Mulai', layout: 'auth', guard: 'auth', element: <OnboardingPage /> },

  // ── discovery ─────────────────────────────────────────────────────────────
  { path: '/', title: 'Beranda', layout: 'shell', guard: 'auth', element: <HomePage /> },
  { path: '/cari', title: 'Pencarian', layout: 'shell', guard: 'auth', element: <SearchPage /> },
  { path: '/notifikasi', title: 'Notifikasi', layout: 'topbar', guard: 'auth' },
  {
    // Fase 11 mengubahnya jadi rute modal di atas `/notifikasi`; sampai lembarnya
    // ada, halaman biasa dengan URL yang sama sudah cukup untuk ditautkan.
    path: '/notifikasi/pengaturan',
    title: 'Preferensi notifikasi',
    layout: 'topbar',
    guard: 'auth',
    fallback: '/notifikasi',
  },
  {
    path: '/jelajah/:kategori',
    title: 'Lihat semua',
    layout: 'topbar',
    guard: 'auth',
    element: <BrowsePage />,
  },

  // ── cerita & ruang baca ───────────────────────────────────────────────────
  {
    path: '/cerita/:storyId',
    title: 'Detail cerita',
    layout: 'shell',
    guard: 'auth',
    element: <StoryDetailPage />,
  },
  {
    path: '/cerita/:storyId/ulasan',
    title: 'Ulasan',
    layout: 'topbar',
    guard: 'auth',
    fallback: '/',
    element: <ReviewsPage />,
  },
  {
    path: '/cerita/:storyId/bab/:chapterId',
    title: 'Ruang baca',
    layout: 'reader',
    guard: 'auth',
    element: <ReaderPage />,
  },
  {
    path: '/cerita/:storyId/bab/:chapterId/komentar',
    title: 'Komentar bab',
    layout: 'topbar',
    guard: 'auth',
    fallback: '/',
    element: <CommentsPage />,
  },

  // ── perpustakaan & dompet ─────────────────────────────────────────────────
  {
    path: '/pustaka',
    title: 'Perpustakaan',
    layout: 'shell',
    guard: 'auth',
    element: <LibraryPage />,
  },
  { path: '/koin', title: 'Isi Koin', layout: 'shell', guard: 'auth', element: <TopupPage /> },
  {
    path: '/koin/transaksi',
    title: 'Riwayat transaksi',
    layout: 'topbar',
    guard: 'auth',
    fallback: '/koin',
    element: <TransactionsPage />,
  },
  {
    path: '/koin/transaksi/:txId',
    title: 'Detail transaksi',
    layout: 'topbar',
    guard: 'auth',
    fallback: '/koin/transaksi',
    element: <TransactionDetailPage />,
  },
  { path: '/hadiah', title: 'Pusat hadiah', layout: 'topbar', guard: 'auth', fallback: '/koin' },

  // ── author studio ─────────────────────────────────────────────────────────
  { path: '/karya', title: 'Karya saya', layout: 'shell', guard: 'auth', element: <StudioPage /> },
  {
    path: '/karya/baru',
    title: 'Buat cerita',
    layout: 'topbar',
    guard: 'auth',
    fallback: '/karya',
    element: <StoryFormPage mode="baru" />,
  },
  {
    path: '/karya/:storyId/ubah',
    title: 'Ubah cerita',
    layout: 'topbar',
    guard: 'auth',
    fallback: '/karya',
    element: <StoryFormPage mode="sunting" />,
  },
  {
    path: '/karya/:storyId/bab',
    title: 'Kelola bab',
    layout: 'shell',
    guard: 'auth',
    element: <ManageChaptersPage />,
  },
  {
    path: '/karya/:storyId/bab/baru',
    title: 'Tulis bab',
    layout: 'topbar',
    guard: 'auth',
    fallback: '/karya',
    element: <ChapterEditorPage mode="baru" />,
  },
  {
    path: '/karya/:storyId/bab/:chapterId/ubah',
    title: 'Ubah bab',
    layout: 'topbar',
    guard: 'auth',
    fallback: '/karya',
    element: <ChapterEditorPage mode="ubah" />,
  },
  {
    path: '/karya/:storyId/bab/:chapterId/akses',
    title: 'Akses bab',
    layout: 'topbar',
    guard: 'auth',
    fallback: '/karya',
    element: <ChapterAccessPage />,
  },
  {
    path: '/karya/:storyId/analitik',
    title: 'Analitik cerita',
    layout: 'topbar',
    guard: 'penulis',
    fallback: '/karya',
    element: <AnalyticsPage />,
  },
  {
    path: '/karya/jadwal',
    title: 'Jadwal terbit',
    layout: 'topbar',
    guard: 'penulis',
    fallback: '/karya',
    element: <SchedulePage />,
  },
  {
    // `[LUAR]` — antrean tinjauan tidak punya rute di tabel §8, tetapi
    // FR-STUDIO-38 menuntut satu tempat untuk empat sumber. Menempelkannya ke
    // layar jadwal akan mencampur dua pertanyaan yang berbeda.
    path: '/karya/tinjauan',
    title: 'Antrean tinjauan',
    layout: 'topbar',
    guard: 'penulis',
    fallback: '/karya',
    element: <ReviewQueuePage />,
  },
  {
    path: '/karya/cetak',
    title: 'Riwayat cetak',
    layout: 'topbar',
    guard: 'penulis',
    fallback: '/karya',
    element: <PrintHistoryPage />,
  },
  {
    path: '/karya/daftar-penulis',
    title: 'Daftar sebagai penulis',
    layout: 'topbar',
    guard: 'auth',
    fallback: '/karya',
    element: <AuthorSignupPage />,
  },

  // ── penghasilan ───────────────────────────────────────────────────────────
  {
    path: '/penulis/analitik',
    title: 'Penghasilan',
    layout: 'topbar',
    // Tombol kembali menuju `/karya` · FR-EARN-10: ujung rantai kerja penulis
    // harus pulang ke tempat ia bekerja, bukan ke halaman bantuan.
    guard: 'penulis',
    fallback: '/karya',
    element: <EarningsPage />,
  },
  {
    path: '/penulis/penarikan',
    title: 'Tarik penghasilan',
    layout: 'topbar',
    guard: 'penulis-verified',
    fallback: '/karya',
    element: <WithdrawPage />,
  },
  {
    path: '/penulis/penarikan/riwayat',
    title: 'Riwayat pencairan',
    layout: 'topbar',
    guard: 'penulis-verified',
    fallback: '/penulis/penarikan',
    element: <PayoutHistoryPage />,
  },

  // ── profil, pengaturan, bantuan, legal ────────────────────────────────────
  { path: '/profil', title: 'Profil', layout: 'shell', guard: 'auth' },
  {
    path: '/profil/ubah',
    title: 'Ubah profil',
    layout: 'topbar',
    guard: 'auth',
    fallback: '/profil',
  },
  {
    path: '/profil/koneksi',
    title: 'Pengikut & mengikuti',
    layout: 'topbar',
    guard: 'auth',
    fallback: '/profil',
  },
  { path: '/pengguna/:userId', title: 'Profil pengguna', layout: 'topbar', guard: 'auth' },
  {
    path: '/pengaturan/bahasa',
    title: 'Bahasa & wilayah',
    layout: 'topbar',
    guard: 'auth',
    fallback: '/profil',
  },
  {
    path: '/pengaturan/keamanan',
    title: 'Keamanan',
    layout: 'topbar',
    guard: 'auth',
    fallback: '/profil',
  },
  {
    path: '/bantuan',
    title: 'Pusat bantuan',
    layout: 'topbar',
    guard: 'auth',
    fallback: '/profil',
  },
  { path: '/legal/ketentuan', title: 'Ketentuan Layanan', layout: 'topbar', guard: 'none' },
  { path: '/legal/privasi', title: 'Kebijakan Privasi', layout: 'topbar', guard: 'none' },
]

/** Halaman dev tidak masuk `ROUTES` supaya tabelnya tetap persis §8. */
const DEV_ROUTES: RouteDef[] = import.meta.env.DEV
  ? [
      {
        path: '/dev/kitchen-sink',
        title: 'Kitchen sink',
        layout: 'shell',
        guard: 'none',
        element: <KitchenSink />,
      },
    ]
  : []

/**
 * Penampung untuk rute yang layarnya belum ditulis. `EmptyState`, bukan
 * `FailureNotice`: belum dibangun bukan kegagalan, dan mencampur keduanya persis
 * kebiasaan yang dilarang FR-CORE-03.
 */
function Placeholder({ title }: { title: string }) {
  return (
    <EmptyState
      title={title}
      description="Layar ini dibangun pada fase berikutnya. Rute, guard, dan tombol kembalinya sudah aktif."
    />
  )
}

/**
 * 404 · `ROUTE-404`. Memakai router, bukan `window.location` — memuat ulang
 * seluruh aplikasi hanya untuk pindah ke beranda membuang sesi yang sudah
 * dihidrasi dan seluruh cache, demi satu tautan yang salah ketik.
 */
function NotFound() {
  const navigate = useNavigate()
  return (
    <FailureNotice
      level="fullscreen"
      title="Halaman tidak ditemukan"
      body="Alamat yang kamu buka tidak ada di aplikasi ini."
      safety="Akun dan koinmu tidak terpengaruh."
      onRetry={() => navigate('/')}
      retryLabel="Ke beranda"
      code="ROUTE-404"
    />
  )
}

const LAYOUTS: Record<RouteLayout, ReactElement> = {
  shell: <AppShell />,
  topbar: <TopBarLayout />,
  reader: <ReaderLayout />,
  auth: <AuthLayout />,
}

function toRoute(def: RouteDef): RouteObject {
  return {
    path: def.path,
    element: def.element ?? <Placeholder title={def.title} />,
    handle: { title: def.title, fallback: def.fallback ?? '/' },
  }
}

/**
 * Rute berlayout sama berbagi satu induk, supaya bilah nav dan bilah atas tidak
 * di-mount ulang tiap kali halaman berpindah.
 */
function byLayout(defs: RouteDef[]): RouteObject[] {
  const groups = new Map<RouteLayout, RouteDef[]>()
  for (const def of defs) {
    const list = groups.get(def.layout)
    if (list) list.push(def)
    else groups.set(def.layout, [def])
  }
  return [...groups].map(([layout, list]) => ({
    element: LAYOUTS[layout],
    children: list.map(toRoute),
  }))
}

const all = [...ROUTES, ...DEV_ROUTES]
const pick = (guard: RouteGuard) => all.filter((r) => r.guard === guard)

/**
 * Akar tanpa path.
 *
 * Ada demi `ScrollRestoration`: kembali dari `/cari` atau dari detail cerita
 * harus mendarat di posisi gulir yang sama, bukan di puncak daftar yang baru
 * saja digulir jauh (FR-SRCH-01, FR-CORE-05). React Router hanya bisa
 * melakukannya sekali di satu tempat, jadi tempatnya di sini.
 */
function Root() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  )
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        // Guard penulis bersarang **di dalam** `RequireAuth`: tanpa sesi jawabannya
        // "masuk dulu", bukan "tingkat penulismu tidak bisa diperiksa".
        element: <RequireAuth />,
        children: [
          ...byLayout(pick('auth')),
          { element: <RequireAuthor min="registered" />, children: byLayout(pick('penulis')) },
          {
            element: <RequireAuthor min="verified" />,
            children: byLayout(pick('penulis-verified')),
          },
        ],
      },
      { element: <RequireGuest />, children: byLayout(pick('guest')) },
      { element: <Outlet />, children: byLayout(pick('none')) },
      { path: '*', element: <NotFound /> },
    ],
  },
])

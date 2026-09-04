import { Outlet, useMatches } from 'react-router'
import { TopBar } from '@/components/patterns/Nav'

/**
 * Halaman kedalaman kedua: bilah atas dengan tombol kembali, tanpa nav
 * (architecture.md §8).
 *
 * Judul dibaca dari `handle` rute, bukan dari prop yang ditulis ulang di tiap
 * halaman. Dengan begitu tabel rute tetap satu-satunya sumber nama halaman, dan
 * mengganti nama tidak menuntut menyunting dua tempat.
 */
export interface RouteHandle {
  title?: string
  /** Tujuan tombol kembali bila halaman dibuka lewat tautan langsung. */
  fallback?: string
}

export function TopBarLayout() {
  const handle = useMatches().at(-1)?.handle as RouteHandle | undefined

  return (
    <>
      <TopBar title={handle?.title ?? ''} fallback={handle?.fallback ?? '/'} />
      <main className="mx-auto max-w-3xl px-4 pt-5 pb-24 lg:pb-8">
        <Outlet />
      </main>
    </>
  )
}

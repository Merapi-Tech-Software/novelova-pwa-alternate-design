import { Outlet } from 'react-router'
import { BottomNav, SideNav } from '@/components/patterns/Nav'
import { TopupFab } from '@/components/patterns/TopupFab'

/**
 * Kerangka untuk halaman bernavigasi: bilah bawah di `<1024`, sidebar 240px di
 * `≥1024` (architecture.md §9.4).
 *
 * `pb-36` di HP menyediakan ruang untuk bilah bawah **dan** FAB isi koin yang
 * keduanya `fixed` — tanpa itu, baris terakhir setiap daftar tertutup keduanya
 * (FR-HOME-08). Di `≥1024` FAB pindah ke sidebar, jadi ruang itu tidak perlu.
 */
export function AppShell() {
  return (
    <>
      <SideNav />
      <div className="min-h-dvh pb-[calc(var(--nv-bottom-nav)+4.75rem)] lg:pb-8 lg:pl-60">
        <main id="konten" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-5 lg:px-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <TopupFab />
    </>
  )
}

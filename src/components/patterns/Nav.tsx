import { BookOpen, ChevronLeft, Coins, Library, PenLine, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router'
import { cx } from '@/lib/cx'
import { useBackNavigation } from '@/lib/nav'
import { IconButton } from '../ui/Button'
import { TopupSidebarButton } from './TopupFab'

/**
 * Isi bilah nav ditetapkan `NovelovaNav.dc.html`: lima tab, dengan tab ketiga
 * berlabel **Pustaka** (pendek, untuk nav) sementara judul halamannya
 * "Perpustakaan".
 *
 * Tab aktif ditentukan dari **prefix path**, bukan dari prop yang di-hardcode
 * tiap halaman — itu sumber bug di prototipe, di mana beberapa halaman menyorot
 * tab yang salah (PRD 04 §7 #7, FR-CORE-05).
 */
export const NAV_TABS = [
  { to: '/', label: 'Beranda', Icon: BookOpen, match: /^\/$/ },
  { to: '/koin', label: 'Isi Koin', Icon: Coins, match: /^\/koin/ },
  { to: '/pustaka', label: 'Pustaka', Icon: Library, match: /^\/pustaka/ },
  { to: '/karya', label: 'Karya', Icon: PenLine, match: /^\/karya|^\/penulis/ },
  { to: '/profil', label: 'Profil', Icon: User, match: /^\/profil|^\/pengaturan/ },
] as const

function useActiveTab(): string {
  const { pathname } = useLocation()
  return NAV_TABS.find((t) => t.match.test(pathname))?.to ?? ''
}

/**
 * Bilah bawah untuk `<1024` — `ModernTabBar` putaran 7: putih penuh, 86px,
 * label di bawah ikon, dan **titik emas 5px** di bawah tab aktif.
 *
 * Titiknya `aria-hidden`: yang menyampaikan "halaman ini" ke pembaca layar
 * adalah `aria-current`, bukan lingkaran kecil. Ia dirender walau tab tidak
 * aktif — dengan `opacity-0` — supaya tinggi barisnya tidak berubah saat tab
 * berpindah, yang tanpa itu menggeser seluruh bilah satu-dua piksel.
 */
export function BottomNav() {
  const active = useActiveTab()

  return (
    <nav
      aria-label="Navigasi utama"
      // `min-h` mengikat tingginya ke `--nv-bottom-nav`, jadi tokennya
      // **menentukan** tinggi bilah ini — bukan sekadar menebaknya.
      className="fixed inset-x-0 bottom-0 z-40 min-h-[var(--nv-bottom-nav)] border-nv-line border-t bg-nv-card lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {NAV_TABS.map(({ to, label, Icon }) => {
          const on = active === to
          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                aria-current={on ? 'page' : undefined}
                className={cx(
                  'flex flex-col items-center gap-1.5 py-1 text-caption transition',
                  on ? 'font-bold text-nv-text' : 'font-medium text-nv-muted',
                )}
              >
                <Icon size={22} strokeWidth={on ? 2 : 1.6} aria-hidden />
                {label}
                <span
                  aria-hidden
                  className={cx(
                    'size-[5px] rounded-nv-pill bg-nv-gold-line transition-opacity',
                    on ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Sidebar persisten 240px untuk `≥1024` (architecture.md §9.4). */
export function SideNav() {
  const active = useActiveTab()

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-1 border-nv-line border-r bg-nv-card px-3 py-6 lg:flex"
    >
      <span className="px-3 pb-4 font-display text-section font-semibold">Novelova</span>
      {NAV_TABS.map(({ to, label, Icon }) => {
        const on = active === to
        return (
          <NavLink
            key={to}
            to={to}
            aria-current={on ? 'page' : undefined}
            className={cx(
              'flex items-center gap-3 rounded-nv-md px-3 py-2.5 text-body transition',
              on
                ? 'bg-nv-accent-soft font-semibold text-nv-accent'
                : 'font-medium text-nv-muted hover:bg-nv-accent-soft',
            )}
          >
            <Icon size={18} strokeWidth={on ? 2.2 : 1.7} aria-hidden />
            {label}
          </NavLink>
        )
      })}

      <TopupSidebarButton />
    </nav>
  )
}

export interface TopBarProps {
  title: string
  /** Ke mana tombol kembali menuju bila tidak ada riwayat. */
  fallback?: string
  action?: ReactNode
  subtitle?: string
}

/**
 * Bilah atas dengan tombol kembali bertingkat — logikanya di `useBackNavigation`
 * supaya **semua** tombol kembali di aplikasi ini berperilaku sama (FR-CORE-05).
 */
export function TopBar({ title, fallback = '/', action, subtitle }: TopBarProps) {
  const goBack = useBackNavigation(fallback)

  return (
    <header className="sticky top-0 z-30 border-nv-line border-b bg-nv-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <IconButton label="Kembali" size="sm" onClick={goBack}>
          <ChevronLeft size={18} />
        </IconButton>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-section font-semibold">{title}</h1>
          {subtitle && <p className="truncate text-caption text-nv-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  )
}

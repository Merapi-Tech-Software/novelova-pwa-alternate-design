import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

export interface SectionHeaderProps {
  /** Ditulis apa adanya. Label bahasa Inggris di mockup (`POPULAR`, `NEW & TRENDING`) memang final. */
  label: string
  /** Aksi rata kanan — biasanya `See all`. */
  action?: ReactNode
  className?: string
}

/**
 * Kepala section putaran 7: label 9,5px / 800 / `.16em` huruf besar, garis 1px
 * yang mengisi sisa lebar, lalu aksi rata kanan bila ada.
 *
 * **Garisnya bagian dari kepala, bukan pembatas section.** Itu yang membuat
 * label pendek dan label panjang tetap terbaca sebagai satu keluarga: yang
 * konstan bukan panjang labelnya, melainkan garis yang menutup sisa barisnya.
 *
 * Dirender sebagai `<h2>` supaya urutan heading halaman tetap utuh; ukurannya
 * kecil, tetapi perannya tetap judul.
 */
export function SectionHeader({ label, action, className }: SectionHeaderProps) {
  return (
    <div className={cx('flex items-center gap-3', className)}>
      <h2 className="nv-section-label shrink-0 font-ui">{label}</h2>
      <span aria-hidden className="h-px flex-1 bg-nv-line" />
      {action}
    </div>
  )
}

export interface SeeAllProps {
  children: ReactNode
  className?: string
}

/**
 * Pembungkus aksi `See all`. Emas **teks** (`--nv-gold`), bukan emas garis —
 * ia salah satu dari enam peran yang brief §1 izinkan memakai emas, dan
 * satu-satunya di kepala section.
 */
export function SeeAllAction({ children, className }: SeeAllProps) {
  return (
    /*
      `nv-tap` di sini, bukan di `<Link>` pembungkusnya: yang diukur pengguna —
      dan pengukur target ketuk — adalah kotak elemen yang bisa ditekan, dan
      tautan yang membungkus teks sependek "See all" mengambil ukuran teksnya.
      Terukur 38×22 sebelum ini.
    */
    <span
      className={cx('nv-tap justify-end shrink-0 font-bold text-caption text-nv-gold', className)}
    >
      {children}
    </span>
  )
}

import { Outlet } from 'react-router'
import { t } from '@/i18n/t'

/**
 * Layar sebelum sesi ada: masuk, daftar, lupa sandi, onboarding.
 *
 * Tanpa nav — sebelum masuk tidak ada tempat lain untuk dituju, dan bilah nav
 * yang semua tabnya menolak diklik hanya menjanjikan sesuatu yang tidak ada.
 */
export function AuthLayout() {
  return (
    /*
      `grid-cols-1` **wajib**, bukan hiasan: grid tanpa kolom eksplisit membuat
      satu track `auto`, dan track `auto` tidak pernah turun di bawah min-content
      anaknya. Isi apa pun yang `whitespace-nowrap` — `truncate` termasuk — lalu
      melebarkan wadah ini melewati layar. Terukur 343px di dalam layar 320px di
      langkah 3 `/mulai`, dan luberannya muncul di **header**, jauh dari
      penyebabnya. `grid-cols-1` = `minmax(0,1fr)`, yang minimumnya nol.
    */
    <div className="grid min-h-dvh grid-cols-1 place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          <p className="font-display text-page font-bold">{t('app.name')}</p>
          <p className="mt-1 text-body text-nv-muted">{t('app.tagline')}</p>
        </header>
        <Outlet />
      </div>
    </div>
  )
}

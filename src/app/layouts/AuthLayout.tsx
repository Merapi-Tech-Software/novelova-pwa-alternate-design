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
    <div className="grid min-h-dvh place-items-center px-5 py-10">
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

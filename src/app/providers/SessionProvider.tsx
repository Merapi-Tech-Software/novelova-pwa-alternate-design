import type { ReactNode } from 'react'
import { VISIBLE_CODES } from '@/api/errors'
import { FailureNotice } from '@/components/patterns/FailureNotice'
import { ReauthSheet } from '@/features/auth/components/ReauthSheet'
import { useSessionBootstrap } from '@/features/auth/hooks/useSessionBootstrap'
import { t } from '@/i18n/t'
import { APP_VERSION, MIN_APP_VERSION, useApp } from '@/stores/app'

/**
 * Versi klien di bawah minimum · `APP-426`.
 *
 * Layar penuh, dan memang harus: kalau server menolak versi ini, tidak ada satu
 * bagian pun yang bisa dikerjakan. Yang wajib dinyatakan justru bagian yang
 * tidak terpengaruh — bacaan dan koin — karena "perbarui aplikasi" terdengar
 * seperti "mulai dari nol" bagi orang yang punya saldo di dalamnya.
 */
function OutdatedScreen() {
  return (
    <FailureNotice
      level="fullscreen"
      title={t('failure.appOutdatedTitle')}
      body={t('failure.appOutdatedBody')(APP_VERSION)}
      safety={t('failure.appOutdatedSafe')}
      onRetry={() => window.location.reload()}
      retryLabel={t('auth.updateApp')}
      code={`${VISIBLE_CODES.APP_OUTDATED} · minimum ${MIN_APP_VERSION}`}
    />
  )
}

/**
 * Menghidrasi sesi sekali di akar aplikasi, lalu menaungi seluruh isi dengan dua
 * hal yang berlaku lintas halaman: layar versi kedaluwarsa dan lembar masuk
 * ulang.
 *
 * Provider ini **tidak menahan render** sesi: guard rute yang memutuskan apa
 * yang tampil selama status masih `unknown`, sehingga halaman tanpa guard —
 * legal, lupa sandi — muncul seketika tanpa menunggu jawaban server.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const outdated = useApp((s) => s.outdated)
  useSessionBootstrap()

  if (outdated) return <OutdatedScreen />

  return (
    <>
      {children}
      <ReauthSheet />
    </>
  )
}

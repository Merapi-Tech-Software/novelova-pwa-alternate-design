import { BookMarked, WifiOff } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/ui/EmptyState'
import { useOfflineChapters } from '@/hooks/useOffline'
import { t } from '@/i18n/t'

/**
 * Layar penuh tanpa koneksi · kanvas layar 33 · architecture.md §1.4.
 *
 * **Jalan keluarnya daftar bab tersimpan, bukan tombol muat ulang.** Menyuruh
 * memuat ulang saat jaringan mati adalah menyuruh mencoba hal yang baru saja
 * gagal — dan pembaca yang menekannya dua kali menyimpulkan aplikasinya rusak,
 * bukan jaringannya.
 *
 * Layar ini **tidak punya tombol "coba lagi" sama sekali**. Ia pulih sendiri
 * lewat listener `online` di `useOnline`: begitu jaringan kembali, komponen yang
 * merendernya berhenti merendernya. Pengguna tidak menekan apa pun.
 *
 * Tiga hal berurutan (§1.4): apa yang terjadi → apakah bacaanmu aman → satu
 * tindakan.
 */
export function OfflineScreen() {
  const tersimpan = useOfflineChapters()
  const rows = tersimpan.data ?? []

  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-md text-center">
        <WifiOff size={28} aria-hidden className="mx-auto text-nv-muted" />
        <h1 className="pt-3 font-display text-page font-semibold">{t('pwa.offlineTitle')}</h1>
        <p className="pt-1.5 text-body text-nv-text-2">{t('pwa.offlineBody')}</p>
        <p className="pt-1 font-semibold text-body text-nv-gold">{t('pwa.offlineSafe')}</p>
      </div>

      <div className="mx-auto max-w-md pt-6">
        {rows.length === 0 ? (
          <EmptyState
            variant="first-run"
            title={t('pwa.offlineAction')}
            description={t('pwa.installBody')}
          />
        ) : (
          <>
            <p className="nv-section-label pb-2">{t('pwa.savedCount')(rows.length)}</p>
            <ul className="divide-y divide-nv-line">
              {rows.map((row) => (
                <li key={row.chapterId}>
                  <Link
                    to={`/cerita/${row.storyId}/bab/${row.chapterId}`}
                    className="flex items-center gap-3 py-3"
                  >
                    <BookMarked size={16} aria-hidden className="shrink-0 text-nv-gold" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body text-nv-text">
                        {row.chapterLabel}
                      </span>
                      <span className="block truncate text-caption text-nv-muted">
                        {row.storyTitle}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

import { WifiOff } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useToast } from '@/components/ui/Toast'
import { useOnline } from '@/hooks/useOnline'
import { t } from '@/i18n/t'

/**
 * Bilah tipis status jaringan · FR-CORE-03 · architecture.md §10.3.
 *
 * **Menempel di atas, bukan di bawah.** Dasar layar sudah dipakai bilah navigasi
 * dan FAB isi koin, dan bilah ketiga di sana akan menutupi salah satunya — cacat
 * yang sudah pernah terjadi sekali dan hanya muncul di HP (CLAUDE.md §8).
 *
 * `role="status"` dan bukan `alert`: kehilangan sinyal bukan keadaan darurat,
 * dan pembaca layar tidak boleh dipotong di tengah kalimat karenanya.
 */
export function OfflineBanner() {
  const online = useOnline()
  const toast = useToast()
  const pernahOffline = useRef(false)

  useEffect(() => {
    if (!online) {
      pernahOffline.current = true
      return
    }
    // Kabar "koneksi kembali" hanya untuk yang **memang sempat kehilangan**.
    // Memberitahukannya saat aplikasi baru dibuka adalah menjawab pertanyaan
    // yang tidak pernah diajukan.
    if (pernahOffline.current) {
      pernahOffline.current = false
      toast.show(t('pwa.backOnline'), { tone: 'success' })
    }
  }, [online, toast])

  if (online) return null

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-nv-warning-bg px-4 py-1.5 text-caption text-nv-warning"
    >
      <WifiOff size={13} aria-hidden className="shrink-0" />
      <span className="min-w-0 truncate">{t('pwa.offlineBanner')}</span>
    </div>
  )
}

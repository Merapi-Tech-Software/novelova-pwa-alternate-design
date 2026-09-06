import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/i18n/t'
import { type InstallPromptEvent, usePwa } from '@/stores/pwa'

/**
 * Jembatan antara peristiwa peramban dan React · architecture.md §10.2 · §10.4.
 *
 * Tiga hal yang lahir di luar pohon komponen dan harus sampai ke dalamnya:
 *
 * 1. **Pembaruan service worker** → toast "Versi baru tersedia — Muat ulang".
 *    Tidak pernah `skipWaiting` diam-diam; layar tidak boleh berubah di tengah
 *    bab.
 * 2. **`beforeinstallprompt`** → ditahan, disimpan, dan baru dipakai saat
 *    pengguna menekan tombolnya di Profil.
 * 3. **Klik push** → service worker mengirim `NAVIGATE`, dan navigasinya
 *    dijalankan router — bukan `location.href`, yang akan memuat ulang seluruh
 *    aplikasi dan membuang posisi baca.
 *
 * Merender `null`. Ia dipasang **di dalam** router karena butuh `useNavigate`,
 * dan di dalam `ToastProvider` karena butuh toast.
 */
export function PwaBridge() {
  const navigate = useNavigate()
  const toast = useToast()
  const updateSiap = usePwa((s) => s.updateSiap)
  const terapkanUpdate = usePwa((s) => s.terapkanUpdate)
  const setInstallPrompt = usePwa((s) => s.setInstallPrompt)
  const setSudahTerpasang = usePwa((s) => s.setSudahTerpasang)

  // ── 1 · toast pembaruan ───────────────────────────────────────────────────
  useEffect(() => {
    if (!updateSiap || !terapkanUpdate) return
    toast.show(t('pwa.updateReady'), {
      tone: 'neutral',
      // Toast pembaruan tidak boleh hilang sendiri: yang menutupnya harus
      // keputusan pengguna, bukan lima detik yang lewat sementara ia membaca.
      durationMs: 0,
      action: { label: t('pwa.reload'), onClick: terapkanUpdate },
    })
  }, [updateSiap, terapkanUpdate, toast])

  // ── 2 · prompt pasang, ditahan ────────────────────────────────────────────
  useEffect(() => {
    function tahan(event: Event) {
      // Mencegah peramban menyembur promptnya sendiri. Yang menentukan kapan ia
      // muncul adalah pengguna, di Profil, setelah ≥3 sesi.
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    function terpasang() {
      setSudahTerpasang(true)
    }

    window.addEventListener('beforeinstallprompt', tahan)
    window.addEventListener('appinstalled', terpasang)

    // Sudah berjalan sebagai aplikasi terpasang? Tombol "Pasang" tidak perlu ada.
    if (window.matchMedia('(display-mode: standalone)').matches) setSudahTerpasang(true)

    return () => {
      window.removeEventListener('beforeinstallprompt', tahan)
      window.removeEventListener('appinstalled', terpasang)
    }
  }, [setInstallPrompt, setSudahTerpasang])

  // ── 3 · deep link dari push ───────────────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    function pesan(event: MessageEvent) {
      const data = event.data as { type?: string; to?: string } | undefined
      if (data?.type === 'NAVIGATE' && typeof data.to === 'string') navigate(data.to)
    }
    navigator.serviceWorker.addEventListener('message', pesan)
    return () => navigator.serviceWorker.removeEventListener('message', pesan)
  }, [navigate])

  return null
}

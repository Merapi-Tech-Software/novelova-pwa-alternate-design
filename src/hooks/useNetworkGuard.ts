import { useCallback } from 'react'
import { useToast } from '@/components/ui/Toast'
import { useOnline } from '@/hooks/useOnline'
import { t } from '@/i18n/t'

/**
 * Menahan aksi yang butuh jaringan, **disertai penjelasan** · FR-CORE-03.
 *
 * Bukan `disabled`: tombol mati tidak mengatakan kenapa, dan pengguna yang
 * menekannya tanpa hasil menyimpulkan aplikasinya rusak — bukan jaringannya.
 * Tombolnya tetap bisa ditekan; yang berubah, ketukannya dijawab kalimat yang
 * menyebut sebabnya dan mengatakan bahwa aksinya bisa diulang nanti.
 *
 * Bukan pula "gagal diam-diam": tanpa ini, mutasi saat offline melempar error
 * jaringan yang muncul sebagai pesan generik — benar, tetapi menyesatkan.
 *
 * Dipakai untuk mutasi yang **menyentuh server**. Aksi yang seluruhnya lokal —
 * pengaturan baca, tandai offline, buka bab tersimpan — tidak lewat sini.
 *
 * ```tsx
 * const jaga = useNetworkGuard()
 * <Button onClick={jaga('Isi koin', () => bayar.mutate(input))}>Bayar</Button>
 * ```
 */
export function useNetworkGuard() {
  const online = useOnline()
  const toast = useToast()

  return useCallback(
    (namaAksi: string, aksi: () => void) => () => {
      if (online) {
        aksi()
        return
      }
      toast.show(t('pwa.needsNetworkBody')(namaAksi), { tone: 'danger' })
    },
    [online, toast],
  )
}

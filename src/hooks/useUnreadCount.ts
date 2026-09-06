import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

/**
 * Kunci cache jumlah belum dibaca — **diekspor** karena dua tempat menyentuhnya:
 * lonceng yang membacanya, dan `useMarkRead` yang menurunkannya secara
 * optimistis. Dua string yang harus sama dan ditulis dua kali akan menyimpang.
 */
export const NOTIF_UNREAD_KEY = ['notif-unread'] as const

/**
 * Jumlah notifikasi belum dibaca · FR-NOTIF-03.
 *
 * Di `src/hooks/` bersama `useWallet` dan karena alasan yang sama: lencananya
 * tampil di luar fitur notifikasi — sekarang di kepala beranda — dan
 * `components/patterns/` tidak boleh mengimpor dari `features/`.
 *
 * `refetchOnWindowFocus` dibiarkan menyala (bawaan React Query): PRD menuntut
 * angkanya disegarkan **saat beranda dibuka dan saat aplikasi kembali dari latar
 * belakang**, dan `focusManager` React Query sudah mendengarkan
 * `visibilitychange` — jalur kedua itu yang penting di PWA, karena di HP
 * aplikasi jarang benar-benar ditutup.
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: NOTIF_UNREAD_KEY,
    queryFn: () => api.getUnreadCount(),
    staleTime: 30_000,
  })
}

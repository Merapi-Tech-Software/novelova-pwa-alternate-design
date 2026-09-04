import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { LibraryParams } from '@/api/contracts'

/**
 * Rak pembaca · FR-LIB-11.
 *
 * Seluruh saringannya ikut ke dalam kunci cache, jadi mengganti tab, kueri, atau
 * urutan **meminta ulang barisnya ke server** — bukan menyaring kartu yang
 * kebetulan sudah ada. `keepPreviousData` menahan daftar lama tetap terlihat
 * selama permintaan baru berjalan, supaya mengetik tidak membuat layar berkedip.
 */
export function useShelf(params: LibraryParams) {
  return useQuery({
    queryKey: ['library', 'shelf', params],
    queryFn: () => api.getLibrary(params),
    placeholderData: keepPreviousData,
  })
}

/**
 * Empat metrik kepala halaman · FR-LIB-01.
 *
 * Panggilan terpisah, dan sengaja: angkanya **tidak boleh ikut berubah saat
 * pembaca menyaring**. Menurunkannya dari daftar yang sedang tampil akan
 * membuatnya berubah, dan itu penghitung hasil — bukan ringkasan koleksi.
 */
export function useShelfSummary() {
  return useQuery({
    queryKey: ['library', 'summary'],
    queryFn: () => api.getLibrarySummary(),
    staleTime: 30_000,
  })
}

/**
 * Sakelar notifikasi per cerita · FR-LIB-08.
 *
 * **Optimistis** — tidak menyentuh uang, dan kalau gagal keadaannya kembali
 * tanpa ada yang hilang (architecture.md §1.4). Sakelar yang menunggu jaringan
 * terasa rusak justru karena ia benar.
 */
export function useToggleNotify() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (storyId: string) => api.toggleNotify(storyId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['library'] }),
  })
}

/**
 * Hapus dari koleksi · FR-LIB-09.
 *
 * Berpasangan dengan `useUndoRemove`: keduanya membatalkan cache yang sama, jadi
 * "Urungkan" mengembalikan kartunya ke posisi semula — bukan ke atas daftar.
 */
export function useRemoveFromLibrary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (storyId: string) => api.removeFromLibrary(storyId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['library'] }),
  })
}

export function useUndoRemove() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (storyId: string) => api.undoRemove(storyId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['library'] }),
  })
}

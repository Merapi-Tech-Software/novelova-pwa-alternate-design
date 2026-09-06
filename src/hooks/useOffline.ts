import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'

/**
 * Bab tersimpan offline · architecture.md §10.3.
 *
 * Di `src/hooks/` karena tiga fitur berbeda membacanya: tombol simpan di ruang
 * baca, penanda di perpustakaan, dan layar penuh tanpa koneksi. `features/*`
 * tidak boleh saling impor (aturan struktur #2).
 */

const KEY = ['offline-chapters'] as const

export function useOfflineChapters() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.listOfflineChapters(),
    // Harus tetap terjawab saat jaringan mati: sumbernya IndexedDB, bukan
    // jaringan, jadi mencoba ulang hanya menunda jawaban yang sudah ada.
    retry: false,
    staleTime: 30_000,
  })
}

export function useToggleOffline() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ chapterId, simpan }: { chapterId: string; simpan: boolean }) =>
      simpan ? api.saveChapterOffline(chapterId) : api.removeChapterOffline(chapterId),
    onSuccess: (rows) => {
      queryClient.setQueryData(KEY, rows)
      // Penanda "Tersedia offline" di perpustakaan ikut berubah.
      void queryClient.invalidateQueries({ queryKey: ['library'] })
    },
  })
}

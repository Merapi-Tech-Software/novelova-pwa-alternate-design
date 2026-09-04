import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'

/**
 * Cerita yang sudah ada di rak pembaca · FR-DETAIL-13.
 *
 * Di `src/hooks/` karena dipakai lintas fitur: kartu di beranda, halaman
 * lihat-semua, detail cerita, dan perpustakaan menanyakan hal yang sama.
 *
 * Satu permintaan berisi seluruh id, bukan satu per kartu — dua puluh kartu
 * berarti dua puluh permintaan, dan tombolnya berkedip satu per satu.
 */
export function useLibraryIds() {
  const query = useQuery({
    queryKey: ['library', 'ids'],
    queryFn: () => api.listLibrary({ page: 1, pageSize: 200 }),
    staleTime: 60_000,
  })

  return new Set((query.data?.items ?? []).map((s) => s.id))
}

/**
 * Simpan / lepas dari rak. **Optimistis** — ini salah satu dari sedikit mutasi
 * yang boleh (architecture.md §1.4): tidak menyentuh uang, dan kalau gagal
 * keadaannya dikembalikan tanpa ada yang hilang.
 */
export function useToggleLibrary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (storyId: string) => api.toggleLibrary(storyId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['library'] }),
  })
}

/** Progres baca seluruh cerita, dipetakan per `storyId`. */
export function useProgressMap() {
  const query = useQuery({
    queryKey: ['progress', 'all'],
    queryFn: () => api.listProgress(),
    staleTime: 60_000,
  })

  return new Map((query.data ?? []).map((p) => [p.storyId, p]))
}

/**
 * Sembunyikan cerita dari rekomendasi. Seluruh daftar dibuang dari cache
 * sesudahnya — cerita yang baru saja ditolak tidak boleh tetap terlihat di tab
 * sebelah.
 */
export function useHideStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (storyId: string) => api.hideStory(storyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['home'] })
      void queryClient.invalidateQueries({ queryKey: ['section'] })
    },
  })
}

import { type QueryKey, useMutation, useQueryClient } from '@tanstack/react-query'
import { toApiError } from '@/api/errors'
import { useToast } from '@/components/ui/Toast'

export interface OptimisticOptions<TVars, TData, TSnapshot> {
  /** Kueri yang tampilannya ikut berubah seketika. */
  queryKey: QueryKey
  mutationFn: (vars: TVars) => Promise<TData>
  /** Mengubah cache sebelum server menjawab. */
  optimisticUpdate: (previous: TSnapshot | undefined, vars: TVars) => TSnapshot | undefined
  /** Pesan yang ditampilkan bila server menolak dan perubahan dikembalikan. */
  rollbackMessage?: string
}

/**
 * Pembungkus mutasi optimistis dengan pengembalian **disertai pesan**
 * (FR-CORE-03, architecture.md §5 aturan 5).
 *
 * Dipakai untuk mutasi yang punya pasangan tampilan langsung: simpan ke
 * perpustakaan, follow, sakelar notifikasi, reaksi, dan tandai terbaca.
 *
 * **Bukan** untuk mutasi uang. Saldo hanya berubah setelah server mengonfirmasi
 * — menampilkan saldo yang lalu ditarik kembali adalah cara tercepat membuat
 * pengguna berhenti mempercayai angkanya.
 */
export function useOptimistic<TVars, TData, TSnapshot>({
  queryKey,
  mutationFn,
  optimisticUpdate,
  rollbackMessage = 'Perubahan dibatalkan karena gagal disimpan.',
}: OptimisticOptions<TVars, TData, TSnapshot>) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation<TData, unknown, TVars, { previous: TSnapshot | undefined }>({
    mutationFn,

    async onMutate(vars) {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<TSnapshot>(queryKey)
      queryClient.setQueryData<TSnapshot>(queryKey, (old) => optimisticUpdate(old, vars))
      return { previous }
    },

    onError(error, _vars, context) {
      // Mengembalikan tampilan ke nilai sebelumnya — lalu **memberi tahu**.
      // Perubahan yang diam-diam kembali membuat pengguna mengira ia salah lihat.
      queryClient.setQueryData(queryKey, context?.previous)
      const apiError = toApiError(error)
      toast.show(apiError.retryable ? rollbackMessage : apiError.message, { tone: 'danger' })
    },

    onSettled() {
      void queryClient.invalidateQueries({ queryKey })
    },
  })
}

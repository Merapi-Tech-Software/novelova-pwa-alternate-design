import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { UnlockInput } from '@/api/contracts'

/** Pilihan pembayaran beserta angkanya, dihitung server (FR-READ-07). */
export function useUnlockOptions(chapterId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['unlock', 'options', chapterId],
    queryFn: () => api.getUnlockOptions(chapterId as string),
    enabled: enabled && chapterId !== undefined,
    staleTime: 30_000,
  })
}

/** Kuota iklan hari ini · FR-READ-18. Tanggalnya zona waktu pengguna, di server. */
export function useAdQuota() {
  return useQuery({
    queryKey: ['ad-quota'],
    queryFn: () => api.getAdQuota(),
    staleTime: 30_000,
  })
}

/**
 * Membuka bab · FR-READ-07.
 *
 * **Tidak optimistis, dan tidak pernah boleh jadi optimistis.** Saldo hanya
 * berubah setelah server mengonfirmasi; menampilkan bab terbuka lalu
 * mengembalikannya karena saldo ternyata kurang adalah cara tercepat kehilangan
 * kepercayaan pada angka koin.
 *
 * `idempotencyKey` dibuat pemanggil dan **tetap sama** selama satu percobaan:
 * ketukan kedua karena jaringan lambat memakai kunci yang sama, dan server
 * memotong sekali.
 */
export function useUnlockChapter(storyId: string | undefined, chapterId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Omit<UnlockInput, 'chapterId'>) =>
      api.unlockChapter({ ...input, chapterId: chapterId as string }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chapter', storyId, chapterId] })
      void queryClient.invalidateQueries({ queryKey: ['story', storyId] })
      void queryClient.invalidateQueries({ queryKey: ['wallet'] })
      void queryClient.invalidateQueries({ queryKey: ['ad-quota'] })
      void queryClient.invalidateQueries({ queryKey: ['unlock', 'options', chapterId] })
      /*
       * **Preferensi ikut dibatalkan.** `unlockChapter` bisa membawa
       * `enableAutoUnlock` dan `auto`, dan keduanya menulis ke `readerPrefs` di
       * server. Tanpa baris ini izinnya tersimpan tetapi layar tidak pernah
       * tahu — baris status "buka otomatis aktif" tidak muncul, dan pembaca
       * dimintai persetujuan yang sama lagi di bab berikutnya.
       */
      void queryClient.invalidateQueries({ queryKey: ['reader', 'prefs'] })
      // Penghitungnya baru saja naik, jadi tawaran bundelnya bisa berubah.
      void queryClient.invalidateQueries({ queryKey: ['bundle-offer'] })
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'

/**
 * Menukar kode lalu memakainya · FR-RWD-06.
 *
 * Dua langkah di server (`redeemVoucher` menaruhnya di daftar,
 * `applyVoucher` membuka babnya) yang **terlihat sebagai satu aksi** di layar.
 * Pengguna yang baru saja mengetik kode tidak punya alasan menekan tombol kedua
 * untuk memakai apa yang baru ia tukar.
 */
export function useRedeemAndApply(storyId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (code: string) => {
      const voucher = await api.redeemVoucher(code)
      return api.applyVoucher(voucher.id, storyId as string)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vouchers'] })
      void queryClient.invalidateQueries({ queryKey: ['story', storyId] })
    },
  })
}

/** Memakai voucher yang sudah ada di daftar, tanpa mengetik kodenya lagi. */
export function useApplyVoucher(storyId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (voucherId: string) => api.applyVoucher(voucherId, storyId as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vouchers'] })
      void queryClient.invalidateQueries({ queryKey: ['story', storyId] })
    },
  })
}

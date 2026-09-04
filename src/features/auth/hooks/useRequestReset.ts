import { useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'

/**
 * Kirim tautan reset · FR-AUTH-08. Tidak pernah menolak, jadi tidak ada jalur
 * gagal yang perlu dirender — hanya "belum dikirim" dan "sudah dikirim".
 */
export function useRequestReset() {
  return useMutation({
    mutationFn: (identity: string) => api.requestReset(identity),
  })
}

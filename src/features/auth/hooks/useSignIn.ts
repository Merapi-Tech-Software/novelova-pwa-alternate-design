import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { LoginInput } from '@/api/contracts'
import { useSession } from '@/stores/session'

/**
 * Masuk · FR-AUTH-01.
 *
 * `queryClient.clear()` bukan basa-basi: cache masih memegang data pengguna
 * sebelumnya — saldo, pustaka, naskah. Membiarkannya berarti akun baru melihat
 * milik akun lama selama beberapa detik pertama.
 */
export function useSignIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: LoginInput) => api.login(input),
    onSuccess: (session, input) => {
      queryClient.clear()
      useSession.getState().setSession(session, input.identity)
    },
  })
}

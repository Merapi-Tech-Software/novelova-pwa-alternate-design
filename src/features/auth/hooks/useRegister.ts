import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { RegisterInput } from '@/api/contracts'
import { useSession } from '@/stores/session'

/** Daftar · FR-AUTH-05. Sukses langsung membuka sesi, lalu onboarding. */
export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RegisterInput) => api.register(input),
    onSuccess: (session, input) => {
      queryClient.clear()
      useSession.getState().setSession(session, input.email)
    },
  })
}

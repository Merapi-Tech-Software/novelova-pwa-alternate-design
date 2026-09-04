import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { ReportInput } from '@/api/contracts'

/**
 * Laporan & blokir · FR-SOCIAL-07.
 *
 * Blokir menyegarkan **seluruh** kueri sosial: komentar dan ulasan pengguna
 * yang diblokir harus lenyap dari kedua daftar sekaligus, bukan hanya dari yang
 * sedang dibuka.
 */
export function useReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ReportInput) => api.report(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social'] }),
  })
}

export function useBlockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, on }: { userId: string; on: boolean }) => api.blockUser(userId, on),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social'] }),
  })
}

export function useBlocks() {
  return useQuery({
    queryKey: ['social', 'blocks'],
    queryFn: () => api.listBlocks(),
    staleTime: 0,
  })
}

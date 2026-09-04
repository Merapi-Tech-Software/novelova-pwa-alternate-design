import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { ReviewTarget } from '@/api/contracts'

/**
 * Jadwal terpadu · FR-STUDIO-37.
 *
 * `staleTime` nol: bentrok dan celah dihitung server dari hubungan antar entri,
 * jadi satu penggeseran mengubah baris lain juga — dan daftar basi di sini
 * berarti peringatan yang menunjuk slot yang sudah kosong.
 */
export function useSchedule() {
  return useQuery({
    queryKey: ['studio', 'schedule'],
    queryFn: () => api.listSchedule(),
    staleTime: 0,
  })
}

export function useCancelScheduleEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (entryId: string) => api.cancelScheduleEntry(entryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studio'] }),
  })
}

/** Antrean tinjauan · FR-STUDIO-38. Diturunkan dari empat sumbernya. */
export function useReviewQueue() {
  return useQuery({
    queryKey: ['studio', 'review-queue'],
    queryFn: () => api.listReviewQueue(),
    staleTime: 0,
  })
}

export function useWithdrawFromReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (target: ReviewTarget) => api.withdrawFromReview(target),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studio'] }),
  })
}

export function useSubmitForReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (target: ReviewTarget) => api.submitForReview(target),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studio'] }),
  })
}

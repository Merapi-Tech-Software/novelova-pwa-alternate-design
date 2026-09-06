import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Reward } from '@/api/contracts'

/**
 * Pusat hadiah · FR-RWD-01..07.
 *
 * **Tidak ada satu pun mutasi optimistis di sini**, dan itu disengaja: setiap
 * klaim menambah koin, dan saldo hanya berubah setelah server mengonfirmasi
 * (`architecture.md` §5 aturan 5). Menampilkan koin yang lalu ditarik kembali
 * adalah cara tercepat membuat pengguna berhenti mempercayai angkanya.
 */

const REWARDS = ['rewards'] as const

/** Kunci yang wajib ikut disegarkan setelah klaim — koin bergerak di keempatnya. */
function segarkanSetelahKlaim(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.setQueryData<Reward>(REWARDS, undefined)
  void queryClient.invalidateQueries({ queryKey: REWARDS })
  void queryClient.invalidateQueries({ queryKey: ['wallet'] })
  void queryClient.invalidateQueries({ queryKey: ['transactions'] })
  void queryClient.invalidateQueries({ queryKey: ['reward-history'] })
  void queryClient.invalidateQueries({ queryKey: ['vouchers'] })
}

export function useRewards() {
  return useQuery({ queryKey: REWARDS, queryFn: () => api.getRewards() })
}

export function useReferral() {
  return useQuery({
    queryKey: ['referral'],
    queryFn: () => api.getReferral(),
    staleTime: 5 * 60_000,
  })
}

export function useRewardHistory() {
  return useQuery({ queryKey: ['reward-history'], queryFn: () => api.listRewardHistory() })
}

export function useClaimCheckIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.claimCheckIn(),
    onSuccess: (next) => {
      queryClient.setQueryData<Reward>(REWARDS, next)
      segarkanSetelahKlaim(queryClient)
    },
  })
}

export function useClaimMission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (missionId: string) => api.claimMission(missionId),
    onSuccess: (next) => {
      queryClient.setQueryData<Reward>(REWARDS, next)
      segarkanSetelahKlaim(queryClient)
    },
  })
}

/** Cerita tempat sebuah voucher berlaku · FR-RWD-06. Diminta saat lembarnya dibuka. */
export function useVoucherTargets(voucherId: string | null) {
  return useQuery({
    queryKey: ['voucher-targets', voucherId],
    queryFn: () => api.listVoucherTargets(voucherId as string),
    enabled: voucherId !== null,
  })
}

export function useApplyVoucher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ voucherId, storyId }: { voucherId: string; storyId: string }) =>
      api.applyVoucher(voucherId, storyId),
    onSuccess: () => {
      segarkanSetelahKlaim(queryClient)
      // Bab yang baru terbuka mengubah halaman ceritanya juga.
      void queryClient.invalidateQueries({ queryKey: ['story'] })
      void queryClient.invalidateQueries({ queryKey: ['chapters'] })
    },
  })
}

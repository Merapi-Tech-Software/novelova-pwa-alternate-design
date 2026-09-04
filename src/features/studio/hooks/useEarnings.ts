import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { AuthorAnalyticsParams, WithdrawInput } from '@/api/contracts'

/**
 * Penghasilan penulis · prd_08.
 *
 * Rentang dan sudut pandang ikut **query key**: keduanya meminta ulang datanya
 * ke server, jadi berpindah sudut pandang benar-benar mengganti isi — bukan
 * hanya gaya tombolnya (PRD 08 §7 #4).
 */
export function useAuthorAnalytics(params: AuthorAnalyticsParams) {
  return useQuery({
    queryKey: ['penulis', 'analytics', params],
    queryFn: () => api.getAuthorAnalytics(params),
    placeholderData: keepPreviousData,
  })
}

/** Saldo pencairan — sudah dikurangi pengajuan yang masih diproses. */
export function usePayoutBalance() {
  return useQuery({
    queryKey: ['penulis', 'payout-balance'],
    queryFn: () => api.getPayoutBalance(),
    staleTime: 0,
  })
}

/** Riwayat pencairan · FR-EARN-12. Terbaru lebih dulu, diurutkan server. */
export function useWithdrawals() {
  return useQuery({
    queryKey: ['penulis', 'withdrawals'],
    queryFn: () => api.listWithdrawals({ page: 1, pageSize: 50 }),
    staleTime: 0,
  })
}

/**
 * Kurs koin → rupiah beserta contoh perhitungannya · FR-EARN-12.
 *
 * `staleTime` panjang: ini kebijakan, bukan angka yang bergerak tiap menit.
 */
export function usePayoutRate() {
  return useQuery({
    queryKey: ['penulis', 'payout-rate'],
    queryFn: () => api.getPayoutRate(),
    staleTime: 5 * 60_000,
  })
}

/** Rekening tujuan · FR-EARN-07. Nomornya sudah tersamar dari server. */
export function usePayoutAccount() {
  return useQuery({
    queryKey: ['penulis', 'payout-account'],
    queryFn: () => api.getPayoutAccount(),
    staleTime: 60_000,
  })
}

/**
 * Pengajuan pencairan · FR-EARN-11.
 *
 * Menyentuh uang, jadi **tidak pernah optimistis**: saldo baru dibaca ulang
 * setelah server mengonfirmasi. Seluruh kueri penghasilan ikut disegarkan,
 * karena saldo tersedia langsung ditahan sebesar pengajuannya.
 */
export function useRequestWithdrawal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: WithdrawInput) => api.requestWithdrawal(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['penulis'] }),
  })
}

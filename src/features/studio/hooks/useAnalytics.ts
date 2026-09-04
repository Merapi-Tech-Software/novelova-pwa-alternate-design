import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { AnalyticsParams, PrintOrderParams } from '@/api/contracts'

/**
 * Analitik cerita · FR-STUDIO-27..31.
 *
 * Rentang dan urutan ikut **query key**, jadi keduanya benar-benar meminta
 * ulang datanya ke server. `keepPreviousData` menahan angka lama tetap terbaca
 * selama permintaan baru berjalan — kartu metrik yang berkedip jadi kosong tiap
 * kali rentang diganti membuat perbandingan mustahil.
 */
export function useStoryAnalytics(storyId: string, params: AnalyticsParams) {
  return useQuery({
    queryKey: ['studio', 'analytics', storyId, params],
    queryFn: () => api.getStoryAnalytics(storyId, params),
    placeholderData: keepPreviousData,
  })
}

/** Riwayat cetak · FR-STUDIO-32. Tabnya menyaring di server, bukan di layar. */
export function usePrintOrders(params: PrintOrderParams) {
  return useQuery({
    queryKey: ['studio', 'print-orders', params],
    queryFn: () => api.listPrintOrders(params),
    placeholderData: keepPreviousData,
  })
}

function usePrintMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studio', 'print-orders'] }),
  })
}

export function useCancelPrintOrder() {
  return usePrintMutation((orderId: string) => api.cancelPrintOrder(orderId))
}

export function useApprovePrintCost() {
  return usePrintMutation((orderId: string) => api.approvePrintCost(orderId))
}

export function useRegeneratePrintFile() {
  return usePrintMutation(({ orderId, parts }: { orderId: string; parts: number }) =>
    api.regeneratePrintFile(orderId, parts),
  )
}

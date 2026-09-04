import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { TopupInput, TxListParams } from '@/api/contracts'

/** Metode pembayaran yang tersedia · FR-WALLET-04. Jarang berubah. */
export function usePayMethods() {
  return useQuery({
    queryKey: ['pay-methods'],
    queryFn: () => api.listPayMethods(),
    staleTime: 5 * 60_000,
  })
}

/**
 * Metode yang terakhir benar-benar dipakai · FR-WALLET-04.
 *
 * Dibaca dari buku besar, bukan dari penyimpanan perangkat: pengguna yang
 * berganti ponsel tetap melihat pintasan yang sama, dan tidak ada angka kedua
 * yang bisa menyimpang dari kenyataan.
 */
export function useLastTopupMethod() {
  return useQuery({
    queryKey: ['transactions', 'last-topup'],
    queryFn: async () => {
      const page = await api.listTransactions({ page: 1, pageSize: 1, kind: 'topup' })
      return page.items[0]?.method ?? null
    },
    staleTime: 60_000,
  })
}

export function useCreateTopupOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: TopupInput) => api.createTopupOrder(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

/**
 * Pelunasan · FR-WALLET-10.
 *
 * **Tidak optimistis.** Saldo baru hanya muncul setelah server mengonfirmasi;
 * menampilkan koin yang belum tentu masuk adalah cara tercepat membuat angka
 * koin tidak bisa dipercaya lagi.
 */
export function useConfirmTopup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => api.confirmTopupOrder(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wallet'] })
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useCancelTopup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => api.cancelTopupOrder(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

/**
 * "Periksa status" · FR-WALLET-11.
 *
 * Membaca pesanan, **tidak membayar apa pun**. Dipakai saat statusnya belum
 * pasti: satu-satunya tindakan aman di situ adalah bertanya lagi.
 */
export function useRecheckTopup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => api.getTopupOrder(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wallet'] })
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

/**
 * Buku besar · FR-WALLET-15.
 *
 * Saringannya ikut ke dalam kunci cache, jadi mengganti saringan
 * **meminta ulang barisnya ke server** — bukan menyembunyikan sebagian baris
 * yang sudah telanjur diambil. Itu cacat prototipe (PRD 09 §7 #7): baris yang
 * lahir setelah pemuatan tidak pernah ikut tersaring.
 */
export function useTransactions(params: TxListParams) {
  return useQuery({
    queryKey: ['transactions', 'list', params],
    queryFn: () => api.listTransactions(params),
    placeholderData: keepPreviousData,
  })
}

/**
 * Seluruh mutasi untuk brankas dan dua panel analitik.
 *
 * ponytail: satu halaman 200 baris, bukan agregasi di server. Batasnya jelas —
 * begitu ada pengguna dengan ribuan transaksi, angkanya harus dihitung server.
 */
export function useWalletSummary() {
  return useQuery({
    queryKey: ['transactions', 'summary'],
    queryFn: () => api.listTransactions({ page: 1, pageSize: 200 }),
    staleTime: 30_000,
  })
}

export function useTransaction(txId: string | undefined) {
  return useQuery({
    queryKey: ['transactions', 'detail', txId],
    queryFn: () => api.getTransaction(txId as string),
    enabled: txId !== undefined,
  })
}

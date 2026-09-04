import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

/**
 * Saldo koin · FR-WALLET-17.
 *
 * Di `src/hooks/` karena saldo tampil di banyak tempat sekaligus — bilah
 * pembaca, gerbang bab, FAB, dompet — dan **semuanya harus menunjukkan angka
 * yang sama**. Satu kunci cache berarti membuka satu bab memperbarui seluruh
 * tampilan saldo di layar itu juga.
 */
export function useWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.getWallet(),
    // **Selalu segar** (FR-WALLET-17): saldo ditarik ulang tiap halaman dibuka
    // dan sesudah tiap mutasi uang. Angka koin basi selama lima belas detik
    // adalah angka koin yang salah — dan tidak ada yang tahu sejak kapan.
    staleTime: 0,
  })
}

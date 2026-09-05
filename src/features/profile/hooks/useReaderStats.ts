import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

/**
 * Tiga angka kepala profil · `7i`.
 *
 * `staleTime` panjang: ketiganya berubah pelan (satu bab selesai, satu ulasan
 * ditulis), dan meminta ulang tiap kali halaman dibuka hanya menambah kedipan
 * pada angka yang nyaris tidak pernah bergerak.
 */
export function useReaderStats() {
  return useQuery({
    queryKey: ['reader', 'stats'],
    queryFn: () => api.getReaderStats(),
    staleTime: 60_000,
  })
}

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

/**
 * Voucher yang dimiliki pengguna · FR-RWD-06.
 *
 * Di `src/hooks/`, bukan di dalam `features/story/`: sejak R4e lembar saldo
 * kurang di **ruang baca** juga menyebut berapa voucher yang aktif, dan
 * `features/*` tidak boleh saling impor (aturan struktur #2). Mutasi memakainya
 * — menukar kode, memakai voucher — tetap tinggal di `features/story/`, karena
 * hanya lembar voucher di sana yang melakukannya.
 */
export function useVouchers() {
  return useQuery({
    queryKey: ['vouchers'],
    queryFn: () => api.listVouchers(),
    staleTime: 60_000,
  })
}

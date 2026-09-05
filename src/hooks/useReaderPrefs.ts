import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

/**
 * Preferensi pembaca · FR-AUTH-11.
 *
 * Ada di `src/hooks/`, bukan di dalam salah satu fitur, karena **dua fitur
 * memakainya**: onboarding menulisnya, beranda membacanya untuk mengurutkan tab.
 * `features/*` tidak boleh saling impor (architecture.md §3), jadi state server
 * bersama naik ke atas — persis seperti komponen bersama naik ke
 * `components/patterns/`.
 */
export function useReaderPrefs(enabled = true) {
  return useQuery({
    queryKey: ['reader', 'prefs'],
    queryFn: () => api.getReaderPrefs(),
    staleTime: 5 * 60_000,
    // `enabled` hanya dipakai penjaga rute `RequireGuest`, yang ikut hidup saat
    // belum ada sesi — dan tanpa sesi permintaan ini dijawab `AUTH-401`, yang
    // akan memunculkan lembar masuk ulang tepat di atas halaman `/masuk`.
    enabled,
  })
}

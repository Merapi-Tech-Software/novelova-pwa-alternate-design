import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { AgeVerificationInput } from '@/api/contracts'

/**
 * Verifikasi usia · todo-incoming-features.md A1.
 *
 * Di `src/hooks/`, bukan di satu feature: ruang baca, detail cerita, profil,
 * dan pengaturan sama-sama membacanya, dan `features/*` tidak boleh saling
 * mengimpor (aturan struktur #2).
 */
export function useAgeVerification() {
  return useQuery({
    queryKey: ['age-verification'],
    queryFn: () => api.getAgeVerification(),
    staleTime: 60_000,
  })
}

/**
 * Sesudah mengajukan, **semua yang bergantung pada izin dewasa disegarkan**:
 * bab yang tadinya tertahan, detail cerita, dan beranda. Status baru tanpa
 * penyegaran cuma mengubah satu kartu status sambil membiarkan gerbang lama
 * tetap berdiri.
 */
function segarkanKonten(queryClient: ReturnType<typeof useQueryClient>): void {
  for (const key of [['chapter'], ['story'], ['home'], ['section'], ['search']]) {
    void queryClient.invalidateQueries({ queryKey: key })
  }
}

export function useSubmitAgeVerification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AgeVerificationInput) => api.submitAgeVerification(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(['age-verification'], saved)
      segarkanKonten(queryClient)
    },
  })
}

export function useSetShowAdultContent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (on: boolean) => api.setShowAdultContent(on),
    onSuccess: (prefs) => {
      queryClient.setQueryData(['reader', 'prefs'], prefs)
      segarkanKonten(queryClient)
    },
  })
}

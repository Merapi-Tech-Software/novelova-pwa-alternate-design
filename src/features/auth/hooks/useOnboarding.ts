import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'

/**
 * Kunci `['reader', 'prefs']` menentukan apakah `/mulai` masih tampil: onboarding
 * hanya sekali, dan yang memutuskan "sekali" adalah server — bukan penanda di
 * peramban ini, yang membuat pengguna mengulanginya di tiap perangkat baru.
 *
 * Pembacanya sendiri ada di `@/hooks/useReaderPrefs` karena beranda ikut
 * memakainya.
 */
export { useReaderPrefs } from '@/hooks/useReaderPrefs'

export function useStarterPicks(genres: string[], enabled: boolean) {
  return useQuery({
    queryKey: ['reader', 'starter-picks', genres],
    queryFn: () => api.getStarterPicks(genres),
    enabled,
    staleTime: 60_000,
  })
}

export function useFinishOnboarding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (genres: string[]) => api.finishOnboarding(genres),
    onSuccess: (prefs) => {
      queryClient.setQueryData(['reader', 'prefs'], prefs)
    },
  })
}

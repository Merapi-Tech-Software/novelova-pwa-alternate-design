import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { LocaleSettings } from '@/api/contracts'

/** Bahasa & wilayah · FR-SET-04. Onboarding langkah 2 menulis ke sini juga. */
export function useLocaleSettings() {
  return useQuery({
    queryKey: ['settings', 'locale'],
    queryFn: () => api.getLocaleSettings(),
    staleTime: 5 * 60_000,
  })
}

export function useSaveLocaleSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: LocaleSettings) => api.setLocaleSettings(settings),
    onSuccess: (settings) => queryClient.setQueryData(['settings', 'locale'], settings),
  })
}

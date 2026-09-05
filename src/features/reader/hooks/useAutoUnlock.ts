import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useReaderPrefs } from '@/hooks/useReaderPrefs'

/**
 * Izin buka-otomatis **per cerita** · FR-READ-09 · `architecture.md` §1.19.
 *
 * Dulu sakelar global di `stores/readerSettings.ts`, dan itu melanggar aturan
 * struktur #5: ia memberi wewenang **memotong koin**, jadi ia harus ikut saat
 * pengguna berganti perangkat. Izin yang tertinggal di ponsel lama berarti
 * pembaca dimintai persetujuan lagi di perangkat baru — atau lebih buruk,
 * koinnya terpotong di satu perangkat tanpa jejak di perangkat lain.
 */
export function useAutoUnlockAllowed(storyId: string | undefined): boolean {
  const prefs = useReaderPrefs()
  if (!storyId) return false
  return prefs.data?.autoUnlockStoryIds.includes(storyId) ?? false
}

/** Mematikan izinnya dari baris status di ruang baca · FR-READ-09. */
export function useSetAutoUnlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ storyId, on }: { storyId: string; on: boolean }) =>
      api.setAutoUnlock(storyId, on),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['reader', 'prefs'] }),
  })
}

/**
 * Tawaran bundel · FR-READ-19 · §1.21.
 *
 * **Server yang memutuskan kapan ia muncul**, jadi hook ini tidak punya syarat
 * sendiri selain "ada babnya". Menaruh ambangnya di sini berarti kebijakan
 * pemasaran hidup di dua tempat, dan yang di layar akan lapuk lebih dulu.
 */
export function useBundleOffer(storyId: string | undefined, chapterId: string | undefined) {
  return useQuery({
    queryKey: ['bundle-offer', storyId, chapterId],
    queryFn: () => api.getBundleOffer(storyId as string, chapterId as string),
    enabled: storyId !== undefined && chapterId !== undefined,
    staleTime: 0,
  })
}

export function useDismissBundleOffer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (storyId: string) => api.dismissBundleOffer(storyId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['bundle-offer'] })
      void queryClient.invalidateQueries({ queryKey: ['reader', 'prefs'] })
    },
  })
}

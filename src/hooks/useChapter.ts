import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

/**
 * Satu bab · FR-READ-06.
 *
 * Kunci-nya per bab, jadi berpindah bab memuat yang baru tanpa membuang yang
 * lama — kembali ke bab sebelumnya terasa seketika, seperti membalik halaman.
 */
export function useChapter(storyId: string | undefined, chapterId: string | undefined) {
  return useQuery({
    queryKey: ['chapter', storyId, chapterId],
    queryFn: () => api.getChapter(storyId as string, chapterId as string),
    enabled: storyId !== undefined && chapterId !== undefined,
    staleTime: 60_000,
  })
}

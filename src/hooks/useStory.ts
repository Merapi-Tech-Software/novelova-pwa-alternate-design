import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { StoryDetail } from '@/api/contracts'

/**
 * Detail cerita & babnya · prd_04.
 *
 * Ada di `src/hooks/` karena **dua fitur** memakainya: halaman detail dan ruang
 * baca (bilah atasnya perlu judul dan jumlah bab). `features/*` tidak boleh
 * saling impor, jadi yang dipakai bersama naik ke atas.
 */
export function useStory(storyId: string | undefined) {
  return useQuery({
    queryKey: ['story', storyId],
    queryFn: () => api.getStory(storyId as string),
    enabled: storyId !== undefined,
    staleTime: 30_000,
  })
}

export interface ChapterListParams {
  sort: 'asc' | 'desc'
  q: string
}

/** Daftar bab, 20 per muat (FR-DETAIL-14). */
export function useChapters(storyId: string | undefined, params: ChapterListParams) {
  return useInfiniteQuery({
    queryKey: ['story', storyId, 'chapters', params],
    queryFn: ({ pageParam }) =>
      api.getChapters(storyId as string, {
        page: pageParam,
        pageSize: 20,
        sort: params.sort,
        ...(params.q.trim() ? { q: params.q.trim() } : {}),
      }),
    enabled: storyId !== undefined,
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    staleTime: 30_000,
  })
}

/**
 * Simpan & Ikuti · FR-DETAIL-13.
 *
 * **Optimistis dengan pengembalian**: tombolnya berubah seketika, dan kalau
 * server menolak, keadaannya dikembalikan persis seperti semula. Ini salah satu
 * dari sedikit mutasi yang boleh optimistis — ia tidak menyentuh uang.
 */
function useStoryToggle(
  storyId: string | undefined,
  action: (id: string) => Promise<unknown>,
  patch: (story: StoryDetail) => StoryDetail,
) {
  const queryClient = useQueryClient()
  const key = ['story', storyId]

  return useMutation({
    mutationFn: () => action(storyId as string),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<StoryDetail>(key)
      if (previous) queryClient.setQueryData(key, patch(previous))
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key })
      void queryClient.invalidateQueries({ queryKey: ['library'] })
    },
  })
}

export function useToggleSave(storyId: string | undefined) {
  return useStoryToggle(
    storyId,
    (id) => api.toggleLibrary(id),
    (story) => ({
      ...story,
      inLibrary: !story.inLibrary,
      // Menyimpan menyalakan follow; melepas simpanan tidak mematikannya.
      following: story.inLibrary ? story.following : true,
    }),
  )
}

export function useToggleFollow(storyId: string | undefined) {
  return useStoryToggle(
    storyId,
    (id) => api.toggleFollow(id),
    (story) => ({
      ...story,
      following: !story.following,
    }),
  )
}

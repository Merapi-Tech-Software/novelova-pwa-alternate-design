import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { AuthorChapterParams, ScheduleChapterInput } from '@/api/contracts'
import { mintaIzinPush } from '@/stores/pwa'

/**
 * Daftar bab bagi penulisnya · FR-STUDIO-09.
 *
 * Saringan ikut ke kunci cache, seperti di seluruh aplikasi ini: mengganti tab
 * meminta ulang ke server, bukan menyembunyikan baris yang sudah diambil.
 */
export function useAuthorChapters(storyId: string | undefined, params: AuthorChapterParams) {
  return useQuery({
    queryKey: ['studio', 'chapters', storyId, params],
    queryFn: () => api.getChaptersForAuthor(storyId as string, params),
    enabled: storyId !== undefined,
    placeholderData: keepPreviousData,
  })
}

/** Tiga penghitung + pemberitahuan — agregat, tidak ikut saringan (FR-STUDIO-07). */
export function useChapterBoard(storyId: string | undefined) {
  return useQuery({
    queryKey: ['studio', 'chapter-board', storyId],
    queryFn: () => api.getChapterBoard(storyId as string),
    enabled: storyId !== undefined,
    staleTime: 30_000,
  })
}

function useChapterMutation<TInput, TOut>(fn: (input: TInput) => Promise<TOut>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      // Satu bab berubah menggeser penghitung, pemberitahuan, dan daftarnya
      // sekaligus — membatalkan satu per satu hanya menyisakan yang terlupa.
      void queryClient.invalidateQueries({ queryKey: ['studio'] })
      void queryClient.invalidateQueries({ queryKey: ['chapters'] })
    },
  })
}

export const usePublishChapter = () => useChapterMutation((id: string) => api.publishChapter(id))
export const useUnscheduleChapter = () =>
  useChapterMutation((id: string) => api.unscheduleChapter(id))
export const useDeleteChapter = () => useChapterMutation((id: string) => api.deleteChapter(id))
/**
 * Menjadwalkan bab · momen kedua yang boleh meminta izin push · FR-NOTIF-05.
 *
 * Penulis yang menaruh bab di jam tertentu jelas ingin tahu saat bab itu benar
 * terbit — dan itu satu-satunya kabar yang datangnya tidak bisa ia tunggui.
 * Ditaruh di hook karena dua halaman menjadwalkan lewat mutasi yang sama.
 */
export const useScheduleChapter = () =>
  useChapterMutation(async (input: ScheduleChapterInput) => {
    const chapter = await api.scheduleChapter(input)
    void mintaIzinPush()
    return chapter
  })

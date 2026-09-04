import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type {
  AuthorSignupInput,
  PrintOrderInput,
  ScheduleStoryInput,
  StudioParams,
} from '@/api/contracts'

/**
 * Tingkat penulis (FR-STUDIO-33). Dipakai guard rute, jadi cache-nya panjang:
 * nilainya hanya berubah saat pengguna mendaftar penulis atau lolos verifikasi,
 * dan keduanya menginvalidasi kunci ini sendiri.
 */
export function useAuthorProfile() {
  return useQuery({
    queryKey: ['author', 'profile'],
    queryFn: () => api.getAuthorProfile(),
    staleTime: 5 * 60_000,
  })
}

/**
 * Karya penulis · FR-STUDIO-03.
 *
 * Saringannya ikut ke kunci cache — sama seperti perpustakaan, mengganti tab
 * atau kueri **meminta ulang ke server**, bukan menyaring kartu yang kebetulan
 * sudah ada.
 */
export function useMyStories(params: StudioParams) {
  return useQuery({
    queryKey: ['studio', 'stories', params],
    queryFn: () => api.getMyStories(params),
    placeholderData: keepPreviousData,
  })
}

/** Empat metrik agregat — terpisah supaya tidak ikut berubah saat menyaring. */
export function useStudioSummary() {
  return useQuery({
    queryKey: ['studio', 'summary'],
    queryFn: () => api.getStudioSummary(),
    staleTime: 30_000,
  })
}

export function useRegisterAuthor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AuthorSignupInput) => api.registerAuthor(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['author', 'profile'] })
      void queryClient.invalidateQueries({ queryKey: ['studio'] })
    },
  })
}

export function useDeleteStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (storyId: string) => api.deleteStory(storyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studio'] }),
  })
}

export function useScheduleStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ScheduleStoryInput) => api.scheduleStory(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studio'] }),
  })
}

export function useCreatePrintOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: PrintOrderInput) => api.createPrintOrder(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['print-orders'] }),
  })
}

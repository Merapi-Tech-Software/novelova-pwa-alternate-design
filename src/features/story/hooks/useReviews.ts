import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { ReviewInput, ReviewParams } from '@/api/contracts'

/**
 * Rating & ulasan · FR-SOCIAL-01..04.
 *
 * Seluruh mutasi menyegarkan **`['story']` juga**, bukan hanya `['social']`:
 * rata-rata cerita ikut berubah setiap kali ada yang menilai, dan angka itu
 * tampil di kartu, statbar, dan detail. Melewatkannya membuat bintang di halaman
 * ulasan berbeda dari bintang di kartunya sendiri.
 */
function useSocialMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['social'] })
      void queryClient.invalidateQueries({ queryKey: ['story'] })
    },
  })
}

export function useMyRating(storyId: string) {
  return useQuery({
    queryKey: ['social', 'my-rating', storyId],
    queryFn: () => api.getMyRating(storyId),
    staleTime: 0,
  })
}

export function useReviews(storyId: string, params: ReviewParams) {
  return useQuery({
    queryKey: ['social', 'reviews', storyId, params],
    queryFn: () => api.listReviews(storyId, params),
    placeholderData: keepPreviousData,
  })
}

export function useRateStory() {
  return useSocialMutation(({ storyId, stars }: { storyId: string; stars: 1 | 2 | 3 | 4 | 5 }) =>
    api.rateStory(storyId, stars),
  )
}

export function useDeleteRating() {
  return useSocialMutation((storyId: string) => api.deleteRating(storyId))
}

export function useSubmitReview() {
  return useSocialMutation((input: ReviewInput) => api.submitReview(input))
}

export function useDeleteReview() {
  return useSocialMutation((storyId: string) => api.deleteReview(storyId))
}

export function useMarkHelpful() {
  return useSocialMutation(({ reviewId, on }: { reviewId: string; on: boolean }) =>
    api.react({ type: 'review', id: reviewId }, on),
  )
}

export function useReplyToReview() {
  return useSocialMutation(({ reviewId, text }: { reviewId: string; text: string }) =>
    api.replyToReview(reviewId, text),
  )
}

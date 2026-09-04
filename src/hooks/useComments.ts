import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { CommentInput, CommentParams } from '@/api/contracts'

/**
 * Komentar bab · FR-SOCIAL-05.
 *
 * `staleTime` nol: utas komentar adalah tempat yang paling sering dibuka ulang
 * setelah menulis, dan daftar basi di sini berarti komentar sendiri tidak
 * muncul setelah dikirim.
 */
export function useComments(chapterId: string, params: CommentParams) {
  return useQuery({
    queryKey: ['social', 'comments', chapterId, params],
    queryFn: () => api.listComments(chapterId, params),
    placeholderData: keepPreviousData,
    staleTime: 0,
    retry: false,
  })
}

function useCommentMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social', 'comments'] }),
  })
}

export function usePostComment() {
  return useCommentMutation((input: CommentInput) => api.postComment(input))
}

export function useLikeComment() {
  return useCommentMutation(({ commentId, on }: { commentId: string; on: boolean }) =>
    api.react({ type: 'comment', id: commentId }, on),
  )
}

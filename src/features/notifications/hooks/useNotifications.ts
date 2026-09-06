import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Notification, NotificationPrefs, NotifParams, Paged } from '@/api/contracts'
import { toApiError } from '@/api/errors'
import { useToast } from '@/components/ui/Toast'
import { NOTIF_UNREAD_KEY } from '@/hooks/useUnreadCount'
import { t } from '@/i18n/t'

const LIST = 'notif-list'
const UNREAD = NOTIF_UNREAD_KEY
const PREFS = ['notif-prefs'] as const

export function useNotifications(params: NotifParams) {
  return useQuery({
    queryKey: [LIST, params],
    queryFn: () => api.listNotifications(params),
    placeholderData: keepPreviousData,
  })
}

/**
 * Menandai terbaca, optimistis · FR-NOTIF-03.
 *
 * **Tidak memakai `lib/useOptimistic`**, dan itu disengaja: pembungkus itu
 * memotret satu kunci kueri, sementara satu ketukan di sini mengubah **dua**
 * tampilan sekaligus — baris di daftar dan lencana di lonceng. Memotret satu
 * saja berarti salah satunya bisa kembali sendiri tanpa yang lain, dan pengguna
 * melihat lencana `3` di atas daftar yang seluruhnya sudah terbaca.
 *
 * Disiplinnya tetap sama persis: potret sebelum, kembalikan **beserta pesan**
 * bila gagal, lalu segarkan keduanya.
 */
export function useMarkRead() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation<
    void,
    unknown,
    string[] | 'all',
    { lists: [unknown, unknown][]; unread: number | undefined }
  >({
    mutationFn: (ids) => api.markRead(ids),

    async onMutate(ids) {
      await queryClient.cancelQueries({ queryKey: [LIST] })
      await queryClient.cancelQueries({ queryKey: UNREAD })

      const lists = queryClient.getQueriesData({ queryKey: [LIST] })
      const unread = queryClient.getQueryData<number>(UNREAD)
      const at = new Date().toISOString()

      // Berapa yang benar-benar berpindah keadaan — bukan berapa yang diketuk.
      // Menandai ulang yang sudah terbaca tidak boleh menurunkan lencana.
      let turned = 0
      queryClient.setQueriesData<Paged<Notification>>({ queryKey: [LIST] }, (page) => {
        if (!page) return page
        return {
          ...page,
          items: page.items.map((n) => {
            const hit = ids === 'all' || ids.includes(n.id)
            if (!hit || n.readAt !== null) return n
            turned += 1
            return { ...n, readAt: at }
          }),
        }
      })

      queryClient.setQueryData<number>(UNREAD, (old) =>
        ids === 'all' ? 0 : Math.max(0, (old ?? 0) - turned),
      )

      return { lists, unread }
    },

    onError(error, _ids, context) {
      for (const [key, data] of context?.lists ?? []) {
        queryClient.setQueryData(key as readonly unknown[], data)
      }
      queryClient.setQueryData(UNREAD, context?.unread)
      const apiError = toApiError(error)
      toast.show(apiError.retryable ? t('notif.markAllFailed') : apiError.message, {
        tone: 'danger',
      })
    },

    onSettled() {
      void queryClient.invalidateQueries({ queryKey: [LIST] })
      void queryClient.invalidateQueries({ queryKey: UNREAD })
    },
  })
}

export function useNotifPrefs() {
  return useQuery({
    queryKey: PREFS,
    queryFn: () => api.getNotificationPrefs(),
    staleTime: 5 * 60_000,
  })
}

/**
 * Menyimpan preferensi · FR-NOTIF-04.
 *
 * Optimistis karena sakelar yang menunggu server terasa rusak — tetapi
 * **dikembalikan beserta pesan** bila ditolak. Kanal keamanan tidak lewat sini
 * sama sekali: layarnya tidak mengirimkannya, dan server memaksanya menyala
 * lagi kalaupun ada yang mencoba.
 */
export function useSaveNotifPrefs() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation<void, unknown, NotificationPrefs, { previous: NotificationPrefs | undefined }>(
    {
      mutationFn: (prefs) => api.setNotificationPrefs(prefs),

      async onMutate(prefs) {
        await queryClient.cancelQueries({ queryKey: PREFS })
        const previous = queryClient.getQueryData<NotificationPrefs>(PREFS)
        queryClient.setQueryData<NotificationPrefs>(PREFS, prefs)
        return { previous }
      },

      onError(error, _prefs, context) {
        queryClient.setQueryData(PREFS, context?.previous)
        const apiError = toApiError(error)
        toast.show(apiError.retryable ? t('notif.saveFailed') : apiError.message, {
          tone: 'danger',
        })
      },

      onSettled() {
        void queryClient.invalidateQueries({ queryKey: PREFS })
      },
    },
  )
}

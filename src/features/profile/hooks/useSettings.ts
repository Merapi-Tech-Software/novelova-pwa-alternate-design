import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type {
  ExportCategory,
  ListParams,
  LocaleSettings,
  PrivacySettings,
  ProfileUpdateInput,
} from '@/api/contracts'
import { useOptimistic } from '@/lib/useOptimistic'

/** Profil, koneksi, privasi, bahasa, keamanan · FR-PROF-* · FR-SET-*. */

export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: ['public-profile', userId],
    queryFn: () => api.getPublicProfile(userId),
  })
}

export function useWeeklyRecap() {
  return useQuery({
    queryKey: ['weekly-recap'],
    queryFn: () => api.getWeeklyRecap(),
    staleTime: 5 * 60_000,
  })
}

export function useConnections(kind: 'followers' | 'following', params: ListParams) {
  return useQuery({
    queryKey: ['connections', kind, params],
    queryFn: () => api.listConnections(kind, params),
    placeholderData: keepPreviousData,
  })
}

/**
 * Ikuti / berhenti mengikuti **langsung dari daftar** · FR-PROF-09.
 *
 * Optimistis, dan itu aman: mengikuti bukan mutasi uang. Yang dipotret kunci
 * daftar yang sedang tampil, jadi barisnya berubah seketika dan kembali
 * **beserta pesan** bila server menolak.
 */
type FollowSnapshot =
  | { items: Array<{ id: string; isFollowing: boolean }> }
  | { user: { isFollowing: boolean } }

export function useToggleFollow(queryKey: readonly unknown[]) {
  return useOptimistic<string, { following: boolean }, FollowSnapshot>({
    queryKey,
    mutationFn: (userId) => api.toggleFollowUser(userId),
    /*
     * Dua bentuk snapshot, satu hook: daftar koneksi menyimpan `items`, profil
     * publik menyimpan `user`. Sebelum ini hanya bentuk pertama yang ditangani,
     * jadi di profil publik `previous.items.map` melempar di dalam `onMutate` —
     * dan **tombol Ikuti di profil publik tidak pernah bekerja**: mutasinya
     * dibatalkan sebelum sampai ke server, dengan toast "Gagal menyimpan".
     * Ketahuan saat A2 memberi tombol itu akibat yang terlihat di beranda.
     */
    optimisticUpdate: (previous, userId) => {
      if (!previous) return previous
      if ('items' in previous) {
        return {
          ...previous,
          items: previous.items.map((row) =>
            row.id === userId ? { ...row, isFollowing: !row.isFollowing } : row,
          ),
        }
      }
      return { ...previous, user: { ...previous.user, isFollowing: !previous.user.isFollowing } }
    },
    rollbackMessage: 'Gagal menyimpan. Status mengikuti dikembalikan.',
    // Section "Dari Penulis yang Kamu Ikuti" (A2) dibangun dari tabel follows,
    // jadi beranda ikut basi begitu tombol ini ditekan.
    alsoInvalidate: [['home']],
  })
}

export function usePrivacy() {
  return useQuery({ queryKey: ['privacy'], queryFn: () => api.getPrivacySettings() })
}

export function useSavePrivacy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: PrivacySettings) => api.setPrivacySettings(settings),
    onSuccess: (saved) => {
      queryClient.setQueryData(['privacy'], saved)
      // Profil publik ikut berubah bentuknya — tabnya bisa hilang.
      void queryClient.invalidateQueries({ queryKey: ['public-profile'] })
    },
  })
}

export function useLocale() {
  return useQuery({ queryKey: ['locale'], queryFn: () => api.getLocaleSettings() })
}

export function useSaveLocale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: LocaleSettings) => api.setLocaleSettings(settings),
    onSuccess: (saved) => queryClient.setQueryData(['locale'], saved),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProfileUpdateInput) => api.updateProfile(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['public-profile'] })
      void queryClient.invalidateQueries({ queryKey: ['connections'] })
    },
  })
}

export function useSecurity() {
  return useQuery({ queryKey: ['security'], queryFn: () => api.getSecurityOverview() })
}

export function useRevokeSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string | 'all-others') => api.revokeDeviceSession(sessionId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['security'] }),
  })
}

export function useClearHistory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.clearReadingHistory(),
    onSuccess: () => {
      // Progres hilang di banyak layar sekaligus; rak **tidak** ikut.
      void queryClient.invalidateQueries({ queryKey: ['library'] })
      void queryClient.invalidateQueries({ queryKey: ['home'] })
      void queryClient.invalidateQueries({ queryKey: ['weekly-recap'] })
      void queryClient.invalidateQueries({ queryKey: ['reader', 'stats'] })
    },
  })
}

export function useDeletionCheck() {
  return useQuery({ queryKey: ['deletion-check'], queryFn: () => api.getDeletionCheck() })
}

export function useRequestExport() {
  return useMutation({
    mutationFn: (categories: ExportCategory[]) => api.requestDataExport(categories),
  })
}

export function useRequestDeletion() {
  return useMutation({ mutationFn: () => api.requestAccountDeletion() })
}

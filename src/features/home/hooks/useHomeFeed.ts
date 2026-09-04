import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useReaderPrefs } from '@/hooks/useReaderPrefs'
import { GENRE_TABS } from '@/i18n/content'

/**
 * Isi beranda · FR-HOME-13.
 *
 * Tab ikut ke `queryKey`, jadi berpindah tab memuat ulang dari server dengan
 * keadaan "memuat" yang sungguhan — bukan menyaring array di klien, yang akan
 * berbohong begitu katalognya lebih besar dari satu halaman.
 */
export function useHomeFeed(tab: string | null) {
  return useQuery({
    queryKey: ['home', 'feed', tab],
    queryFn: () => api.getHomeFeed(tab ?? undefined),
    staleTime: 30_000,
  })
}

/**
 * Urutan tab: favorit onboarding di depan, sisanya menyusul dengan urutan asli
 * (FR-HOME-13). Genre yang dipilih pengguna **tidak** menghilangkan yang lain —
 * seluruh katalog tetap dapat dijelajahi, hanya jaraknya yang berubah.
 */
export function orderGenreTabs(favorites: string[]): string[] {
  const known = favorites.filter((g) => GENRE_TABS.some((tab) => tab === g))
  return [...known, ...GENRE_TABS.filter((tab) => !known.includes(tab))]
}

export function useGenreTabs(): string[] {
  const prefs = useReaderPrefs()
  return orderGenreTabs(prefs.data?.genres ?? [])
}

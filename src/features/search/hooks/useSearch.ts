import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import type { SearchParams } from '@/api/contracts'
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '@/lib/limits'

/** Dua puluh per muat, sama dengan halaman lihat-semua (FR-SRCH-02). */
const PAGE_SIZE = 20

/**
 * Kueri yang tertunda · FR-SRCH-02.
 *
 * Mengetik lima huruf cepat harus menghasilkan **satu** permintaan, bukan lima.
 * Debounce-nya di sini, bukan di komponen, supaya kolom masukan tetap responsif
 * seketika sementara yang tertunda hanya permintaannya.
 */
export function useDebounced(value: string, delay = SEARCH_DEBOUNCE_MS): string {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return settled
}

/**
 * Hasil pencarian katalog.
 *
 * Di bawah dua karakter **tidak ada permintaan sama sekali** — bukan permintaan
 * yang hasilnya dibuang. Satu huruf cocok dengan hampir seluruh katalog, dan
 * jawabannya tidak berguna bagi siapa pun.
 *
 * `keepPreviousData` menahan hasil sebelumnya selama kueri baru berjalan,
 * sehingga daftarnya tidak berkedip kosong di antara dua ketikan.
 */
export function useSearch(query: string, filters: Omit<SearchParams, 'page' | 'pageSize'>) {
  const enabled = query.trim().length >= SEARCH_MIN_CHARS

  return useInfiniteQuery({
    // Saringan ikut ke kunci: menggantinya memulai daftar dari halaman pertama,
    // bukan menambah hasil baru di bawah hasil yang aturannya sudah berbeda.
    queryKey: ['search', query.trim().toLowerCase(), filters],
    queryFn: ({ pageParam }) =>
      api.search(query.trim(), { ...filters, page: pageParam, pageSize: PAGE_SIZE }),
    enabled,
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

/**
 * Saran sambil mengetik · FR-SRCH-03.
 *
 * Kueri yang sudah ditunda dipakai ulang di sini — saran yang muncul per ketukan
 * berkedip lebih cepat daripada yang bisa dibaca siapa pun.
 */
export function useSuggestions(query: string, enabled: boolean) {
  return useQuery({
    queryKey: ['search', 'suggestions', query.trim().toLowerCase()],
    queryFn: () => api.getSuggestions(query.trim()),
    enabled: enabled && query.trim().length >= SEARCH_MIN_CHARS,
    staleTime: 60_000,
  })
}

/**
 * Kata kunci populer · FR-SRCH-03. Cache-nya panjang: daftarnya berubah dalam
 * hitungan jam, bukan detik, dan ia dibuka tiap kali halaman pencarian dibuka.
 */
export function useTrendingQueries() {
  return useQuery({
    queryKey: ['search', 'trending'],
    queryFn: () => api.getTrendingQueries(),
    staleTime: 5 * 60_000,
  })
}

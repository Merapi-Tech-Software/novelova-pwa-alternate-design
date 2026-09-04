import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { SectionId, SectionParams } from '@/api/contracts'

/**
 * Judul section untuk halaman lihat-semua.
 *
 * Kata rute `/jelajah/:kategori` **adalah** id section-nya sejak Fase 3b, jadi
 * tidak ada lagi tabel pemetaan. Judulnya tetap disalin di klien karena halaman
 * ini menampilkannya sebelum jawaban server tiba; sumber kebenarannya tetap
 * registry di `api/mock/handlers/sections.ts`.
 */
export const SECTION_TITLE: Record<string, string> = {
  populer: 'Populer',
  terbaru: 'Baru & Naik Cepat',
  terbuka: 'Paling Banyak Dibuka',
  tamat: 'Tamat & Siap Dibaca',
  gratis: 'Gratis Hari Ini',
  ramai: 'Sedang Ramai Dibicarakan',
  'pembaca-baru': 'Pilihan Pembaca Baru',
  'romance-kantor': 'Kantor & CEO',
  'romance-musuh': 'Musuh Jadi Cinta',
  'kisah-pilu': 'Kisah Pilu',
  'kisah-lucu': 'Kisah Lucu',
  'fantasy-dunia': 'Dunia Lain',
  'fantasy-sihir': 'Sihir & Ramalan',
  'mystery-kasus': 'Kasus Tertutup',
  'mystery-twist': 'Twist di Bab Akhir',
  'drama-keluarga': 'Keluarga',
  'drama-kehilangan': 'Kehilangan & Pulih',
  'ceo-kontrak': 'Pernikahan Kontrak',
  'ceo-dendam': 'Balas Dendam Karier',
  'thriller-kejar': 'Kejar-kejaran',
  'thriller-psikologis': 'Psikologis',
}

/**
 * Daftar lihat-semua, dimuat bertahap 20 per muat (FR-HOME-14).
 *
 * `queryKey` memuat seluruh saringan, jadi mengubah urutan atau chip memang
 * memulai daftar dari halaman pertama — bukan menambahkan hasil baru di bawah
 * hasil lama yang aturannya sudah berbeda.
 */
export function useInfiniteSection(id: SectionId | undefined, params: SectionParams) {
  return useInfiniteQuery({
    queryKey: ['section', 'infinite', id, params],
    queryFn: ({ pageParam }) => api.getSection(id as SectionId, { ...params, page: pageParam }),
    enabled: id !== undefined,
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    staleTime: 30_000,
  })
}

export function useSection(id: SectionId | undefined, params: SectionParams) {
  return useQuery({
    queryKey: ['section', id, params],
    queryFn: () => api.getSection(id as SectionId, params),
    enabled: id !== undefined,
    staleTime: 30_000,
  })
}

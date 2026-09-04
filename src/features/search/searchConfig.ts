import { GENRE_TABS } from '@/i18n/content'

/**
 * Kontrol pencarian · FR-SRCH-04.
 *
 * Satu tempat untuk pilihan urutan dan tiga penyaring, supaya bilah kontrol,
 * pil saringan aktif, dan pembacaan URL memakai kosakata yang sama persis.
 */
export interface Option {
  value: string
  label: string
}

export const SEARCH_SORTS: Option[] = [
  { value: 'relevan', label: 'Paling relevan' },
  { value: 'populer', label: 'Paling banyak dibaca' },
  { value: 'rating', label: 'Rating tertinggi' },
  { value: 'terbaru', label: 'Terbaru diperbarui' },
]

/**
 * Genre cerita, bukan tab beranda: "My Kisah" tidak pernah jadi genre sebuah
 * cerita, jadi ia tidak muncul di penyaring pencarian.
 */
export const SEARCH_GENRES: Option[] = GENRE_TABS.filter((g) => g !== 'My Kisah').map((g) => ({
  value: g,
  label: g,
}))

export const SEARCH_STATUS: Option[] = [
  { value: 'ongoing', label: 'Berjalan' },
  { value: 'completed', label: 'Tamat' },
  { value: 'hiatus', label: 'Hiatus' },
]

export const SEARCH_LANGUAGES: Option[] = [
  { value: 'Indonesia', label: 'Indonesia' },
  { value: 'English', label: 'English' },
]

/** Nama parameter URL untuk tiap penyaring — dipakai juga oleh pil saringan. */
export const FILTER_PARAMS = ['genre', 'status', 'lang'] as const
export type FilterParam = (typeof FILTER_PARAMS)[number]

export const FILTER_LABEL: Record<FilterParam, string> = {
  genre: 'Genre',
  status: 'Status',
  lang: 'Bahasa',
}

export const FILTER_OPTIONS: Record<FilterParam, Option[]> = {
  genre: SEARCH_GENRES,
  status: SEARCH_STATUS,
  lang: SEARCH_LANGUAGES,
}

import { GENRE_TABS } from '@/i18n/content'

/**
 * Kontrol per kategori · FR-HOME-11.
 *
 * Setiap kategori punya urutan, chip, dan dua penyaringnya sendiri — tabel di
 * requirement ditulis ulang di sini apa adanya, satu tempat, supaya menambah
 * kategori berarti menambah satu baris dan bukan menyunting empat komponen.
 *
 * Pilihan pertama tiap daftar adalah bawaannya.
 */
export interface Option {
  value: string
  label: string
}

export interface BrowseConfig {
  sorts: Option[]
  chips: Option[]
  /** Penyaring kedua; yang pertama selalu genre. */
  extra: { param: 'status' | 'language'; label: string; options: Option[] } | null
}

const STATUS: Option[] = [
  { value: 'ongoing', label: 'Berjalan' },
  { value: 'completed', label: 'Tamat' },
]

const LANGUAGE: Option[] = [
  { value: 'Indonesia', label: 'Indonesia' },
  { value: 'English', label: 'English' },
]

export const GENRE_OPTIONS: Option[] = GENRE_TABS.map((g) => ({ value: g, label: g }))

/** Section tematik memakai kontrol seadanya: urutan umum, tanpa chip khusus. */
export const BROWSE_DEFAULT: BrowseConfig = {
  sorts: [
    { value: 'reads', label: 'Paling banyak dibaca' },
    { value: 'rating', label: 'Rating tertinggi' },
    { value: 'updated', label: 'Terbaru diperbarui' },
  ],
  chips: [
    { value: 'semua', label: 'Semua' },
    { value: 'minggu', label: 'Minggu ini' },
    { value: 'bulan', label: 'Bulan ini' },
  ],
  extra: { param: 'status', label: 'Status', options: STATUS },
}

export const BROWSE: Record<string, BrowseConfig> = {
  populer: {
    sorts: [
      { value: 'reads', label: 'Paling banyak dibaca' },
      { value: 'rating', label: 'Rating tertinggi' },
      { value: 'saved', label: 'Paling banyak disimpan' },
      { value: 'updated', label: 'Terbaru diperbarui' },
    ],
    chips: [
      { value: 'hari', label: 'Hari ini' },
      { value: 'minggu', label: 'Minggu ini' },
      { value: 'bulan', label: 'Bulan ini' },
      { value: 'semua', label: 'Sepanjang masa' },
    ],
    extra: { param: 'status', label: 'Status', options: STATUS },
  },

  terbaru: {
    sorts: [
      { value: 'growth', label: 'Pertumbuhan tercepat' },
      { value: 'published', label: 'Terbaru terbit' },
      { value: 'rating', label: 'Rating tertinggi' },
      { value: 'comments', label: 'Paling banyak dikomentari' },
    ],
    chips: [
      { value: 'minggu', label: 'Minggu ini' },
      { value: 'bulan', label: 'Bulan ini' },
      { value: '3bulan', label: '3 bulan ini' },
    ],
    extra: { param: 'language', label: 'Bahasa', options: LANGUAGE },
  },

  terbuka: {
    sorts: [
      { value: 'unlocked', label: 'Paling banyak dibuka' },
      { value: 'rating', label: 'Rating tertinggi' },
      { value: 'saved', label: 'Paling banyak disimpan' },
    ],
    chips: [
      { value: 'semua', label: 'Semua' },
      { value: 'terbaik', label: 'Karya terbaik' },
      { value: 'permata', label: 'Hidden gem' },
      { value: 'penulis-baru', label: 'Penulis baru' },
      { value: 'bulan-ini', label: 'Pilihan bulan ini' },
    ],
    extra: { param: 'status', label: 'Status', options: STATUS },
  },
}

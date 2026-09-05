import type { Story } from '../../contracts'

/**
 * Registry section beranda · Fase 3b.
 *
 * Satu tempat yang memetakan id section → judul, aturan penyaring, dan apakah
 * ia punya halaman lihat-semua. Dibaca dua pemakai: perakit feed beranda dan
 * `getSection`, sehingga halaman lihat-semua **tidak mungkin** menampilkan
 * aturan yang berbeda dari section yang baru saja diketuk pembaca.
 *
 * Susunannya: empat blok pertama tetap di semua tab, lalu dua section generik
 * dan dua section kurasi yang berganti mengikuti tab, ditutup Lanjut Membaca.
 */

export interface SectionDef {
  /** Sekaligus kata rute `/jelajah/:id`. */
  id: string
  title: string
  /** Aturan tambahan di atas saringan tab. */
  match?: (story: Story) => boolean
  order: (a: Story, b: Story) => number
  /** Kurasi editorial dan bacaan pribadi tidak ikut tersaring tab. */
  unfiltered?: boolean
  /** `false` untuk blok yang tidak punya halaman daftar sendiri. */
  browsable?: boolean
}

const byReads = (a: Story, b: Story) => b.stats.reads - a.stats.reads
const byRating = (a: Story, b: Story) => b.stats.rating - a.stats.rating
const byUpdated = (a: Story, b: Story) => b.updatedAt.localeCompare(a.updatedAt)
const byUnlocks = (a: Story, b: Story) => b.stats.unlockCount - a.stats.unlockCount
const byComments = (a: Story, b: Story) => b.stats.commentCount - a.stats.commentCount

const hasTag = (tag: string) => (story: Story) => story.tags.includes(tag)

/** Tiga section yang **selalu ada**, di tab mana pun, tetap ikut tersaring. */
export const FIXED: SectionDef[] = [
  { id: 'populer', title: 'Populer', order: byReads },
  { id: 'terbaru', title: 'Baru & Naik Cepat', order: byUpdated },
  {
    // Menggantikan "Pilihan Editor": angka ekonomi yang jujur — berapa bab yang
    // benar-benar dibuka pakai koin — bukan kurasi manual yang tidak ada
    // redaksinya. Cerita gratis tidak punya bab berbayar untuk dibuka.
    id: 'terbuka',
    title: 'Paling Banyak Dibuka',
    match: (s) => s.stats.unlockCount > 0,
    order: byUnlocks,
  },
]

/** Dua section yang bentuknya sama di semua tab, hanya berganti saringan. */
export const GENERIC: SectionDef[] = [
  {
    id: 'tamat',
    title: 'Tamat & Siap Dibaca',
    match: (s) => s.status === 'completed',
    order: byReads,
  },
  {
    id: 'gratis',
    title: 'Gratis Hari Ini',
    match: (s) => s.monetizeType === 'free',
    order: byRating,
  },
]

const tagged = (id: string, title: string, tag: string): SectionDef => ({
  id,
  title,
  match: hasTag(tag),
  order: byReads,
})

/** Dua section khas tiap tab. Kosakatanya tag cerita, bukan genre. */
export const CURATED: Record<string, SectionDef[]> = {
  Romance: [
    tagged('romance-kantor', 'Kantor & CEO', 'kantor'),
    tagged('romance-musuh', 'Musuh Jadi Cinta', 'musuh jadi cinta'),
  ],
  'My Kisah': [
    tagged('kisah-pilu', 'Kisah Pilu', 'tragedi'),
    tagged('kisah-lucu', 'Kisah Lucu', 'komedi'),
  ],
  Fantasy: [
    tagged('fantasy-dunia', 'Dunia Lain', 'dunia lain'),
    tagged('fantasy-sihir', 'Sihir & Ramalan', 'sihir'),
  ],
  Mystery: [
    tagged('mystery-kasus', 'Kasus Tertutup', 'kasus tertutup'),
    tagged('mystery-twist', 'Twist di Bab Akhir', 'twist'),
  ],
  Drama: [
    tagged('drama-keluarga', 'Keluarga', 'keluarga'),
    tagged('drama-kehilangan', 'Kehilangan & Pulih', 'kehilangan'),
  ],
  CEO: [
    tagged('ceo-kontrak', 'Pernikahan Kontrak', 'pernikahan kontrak'),
    tagged('ceo-dendam', 'Balas Dendam Karier', 'balas dendam'),
  ],
  Thriller: [
    tagged('thriller-kejar', 'Kejar-kejaran', 'kejar-kejaran'),
    tagged('thriller-psikologis', 'Psikologis', 'psikologis'),
  ],
}

/** Tab "Semua" tidak punya tema, jadi kurasinya lintas genre. */
export const DEFAULT_CURATED: SectionDef[] = [
  { id: 'ramai', title: 'Sedang Ramai Dibicarakan', order: byComments },
  {
    id: 'pembaca-baru',
    title: 'Pilihan Pembaca Baru',
    match: (s) => s.stats.rating >= 4.5 && s.monetizeType !== 'premium',
    order: byRating,
  },
]

export const BANNER: SectionDef = {
  id: 'banner',
  title: 'Unggulan',
  match: (s) => s.badge === 'HOT',
  order: byReads,
  unfiltered: true,
  browsable: false,
}

export const CONTINUE: SectionDef = {
  id: 'lanjut-baca',
  title: 'Lanjut Membaca',
  order: byUpdated,
  unfiltered: true,
  browsable: false,
}

/**
 * Saringan sebuah tab.
 *
 * "My Kisah" menyaring `kind`, bukan `genres` — ia kisah nyata yang bisa
 * bergenre apa pun, dan itulah alasan tab ini tidak pernah bisa jadi salah satu
 * nilai `GenreSchema`.
 */
export function tabFilter(tab: string | undefined): (story: Story) => boolean {
  if (!tab) return () => true
  if (tab === 'My Kisah') return (story) => story.kind === 'kisah'
  return (story) => story.genres.some((g) => g === tab)
}

/**
 * Section yang **ikut tersaring tab**, tanpa banner dan Lanjut Membaca.
 *
 * `FIXED` sengaja **tidak** ada di sini sejak `architecture.md` §1.22: ketiganya
 * kini peringkat global yang dibangun dari seluruh katalog, sejajar dengan
 * `BANNER` dan `CONTINUE`. Yang memaksanya adalah susunan barunya — tab genre
 * duduk *di bawah* ketiganya, dan kontrol yang efeknya di luar layar terbaca
 * sebagai kontrol yang rusak.
 */
export function filteredSectionsFor(tab: string | undefined): SectionDef[] {
  return [...GENERIC, ...(tab ? (CURATED[tab] ?? []) : DEFAULT_CURATED)]
}

/** Dipakai `getSection`: mencari definisi mana pun berdasarkan id-nya. */
export function findSection(id: string): SectionDef | undefined {
  const all = [
    ...FIXED,
    ...GENERIC,
    ...DEFAULT_CURATED,
    ...Object.values(CURATED).flat(),
    BANNER,
    CONTINUE,
  ]
  return all.find((s) => s.id === id)
}

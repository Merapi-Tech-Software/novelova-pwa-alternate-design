import { z } from 'zod'
import {
  AudienceSchema,
  GenreSchema,
  IdSchema,
  IsoDateTimeSchema,
  ListParamsSchema,
  LocalDateSchema,
  ReviewStateSchema,
} from './common'

/** prd_03 · prd_04 · prd_06 · prd_07 */

export const StoryStatusSchema = z.enum(['ongoing', 'completed', 'hiatus'])

/**
 * Fiksi atau kisah nyata · Fase 3b.
 *
 * **Tegak lurus dengan genre, bukan sejajar.** Sebuah kisah nyata tetap bisa
 * bergenre Horor atau Drama — dan justru itu isi tab "My Kisah", yang karena
 * itu tidak pernah bisa jadi salah satu nilai `GenreSchema`.
 */
export const StoryKindSchema = z.enum(['fiksi', 'kisah'])
export type StoryKind = z.infer<typeof StoryKindSchema>
export const VisibilitySchema = z.enum(['public', 'unlisted', 'private'])
export const MonetizeSchema = z.enum(['free', 'partial', 'premium'])

/** Label peringatan isi — dipakai formulir penulis dan kartu cerita. */
export const ContentLabelSchema = z.enum(['kekerasan', 'bahasa-kasar', 'sensitif', 'spoiler-berat'])
export type ContentLabel = z.infer<typeof ContentLabelSchema>

export const StoryStatsSchema = z.object({
  /** Angka **mentah** — bentuk ringkasnya dihasilkan `formatCompactCoin`. */
  reads: z.number().int().nonnegative(),
  saves: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),
  chapterCount: z.number().int().nonnegative(),
  /**
   * Pembaca baru minggu ini. Angka, bukan kalimat `"+24rb pembaca"` — urutan
   * "Pertumbuhan Tercepat" (FR-HOME-11) tidak bisa dibangun di atas teks.
   */
  weeklyReads: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
  /**
   * Pembaca unik — berbeda dari `reads`, yang menghitung pembukaan bab. Dipakai
   * kartu studio (FR-STUDIO-02); tidak bisa diturunkan di klien.
   */
  readers: z.number().int().nonnegative(),
  /**
   * Koin yang sudah dihasilkan cerita ini bagi penulisnya.
   *
   * **Datang dari server, bukan dihitung dari `unlockCount × AUTHOR_SHARE`** —
   * `lib/coin.ts` melarang tegas memakai konstanta bagi hasil untuk angka
   * penghasilan yang ditampilkan (FR-EARN-12), karena bagiannya bisa berubah
   * tanpa rilis aplikasi.
   */
  coinsEarned: z.number().int().nonnegative(),
  /**
   * Bab yang dibuka pakai koin. Dasar section **Paling Banyak Dibuka** — angka
   * ekonomi yang jujur, bukan proxy yang kelihatan ramai.
   */
  unlockCount: z.number().int().nonnegative(),
})

export const StorySchema = z.object({
  id: IdSchema,
  title: z.string().min(1),
  synopsis: z.string(),
  coverUrl: z.string().nullable(),
  /**
   * Gambar lanskap untuk banner unggulan (FR-HOME-02). Terpisah dari `coverUrl`
   * karena rasionya berbeda: sampul 2:3, banner melebar. Memakai sampul sebagai
   * banner berarti memotongnya sampai judulnya sendiri hilang.
   */
  bannerUrl: z.string().nullable(),
  authorId: IdSchema,
  penName: z.string(),
  genres: z.array(GenreSchema).min(1),
  tags: z.array(z.string()),
  audience: AudienceSchema,
  language: z.enum(['Indonesia', 'English', 'Malay']),
  status: StoryStatusSchema,
  kind: StoryKindSchema,
  review: ReviewStateSchema,
  rejectReason: z.string().nullable(),
  visibility: VisibilitySchema,
  monetizeType: MonetizeSchema,
  fullAccessCoins: z.number().int().nonnegative().nullable(),
  badge: z.string().nullable(),
  updatedAt: LocalDateSchema,
  /**
   * Tujuh pengaturan yang ditetapkan penulis di formulir cerita (FR-STUDIO-15).
   *
   * Semuanya **terlihat pembaca**, jadi tempatnya memang di sini dan bukan di
   * tabel terpisah: label konten jadi peringatan, dedikasi dan catatan penulis
   * tampil di halaman cerita, dan sakelar komentar menentukan apakah kolom
   * komentar ada sama sekali.
   */
  commentsEnabled: z.boolean(),
  moderateComments: z.boolean(),
  allowTranslation: z.boolean(),
  allowFanfiction: z.boolean(),
  contentLabels: z.array(ContentLabelSchema),
  dedication: z.string(),
  authorNote: z.string(),
  stats: StoryStatsSchema,
})
export type Story = z.infer<typeof StorySchema>

/** Detail cerita menambahkan apa yang hanya relevan di halamannya sendiri. */
export const StoryDetailSchema = StorySchema.extend({
  editorNote: z.string().nullable(),
  growthNote: z.string().nullable(),
  inLibrary: z.boolean(),
  following: z.boolean(),
  /** Bab terakhir yang dibaca — dasar tombol "Lanjutkan — Bab N" (FR-DETAIL-14). */
  continueChapterId: IdSchema.nullable(),
  continueChapterNumber: z.number().int().nullable(),
  myRating: z.number().int().min(1).max(5).nullable(),
  /**
   * Total menit baca seluruh bab terbit — sel `DURASI BACA` di strip statistik
   * (`7b`), yang di putaran 7 menggantikan metrik pamer.
   *
   * Dihitung **server**, bukan klien: halaman detail memuat bab 20 per halaman,
   * jadi menjumlahkannya di layar akan menampilkan durasi cerita 120 bab dari 20
   * bab pertamanya saja — dan angkanya bertambah tiap pembaca menekan "muat
   * lagi".
   */
  readMinutesTotal: z.number().int().nonnegative(),
  /**
   * Berapa bab pembuka yang gratis, dan harga bab berbayar termurah — dua angka
   * kartu monetisasi `7b` ("7 bab pertama gratis · sisanya mulai 1.500 koin per
   * bab").
   *
   * Dihitung **server**, alasan yang sama dengan `readMinutesTotal`: daftar bab
   * datang 20 per halaman, jadi menghitungnya di layar akan menjawab
   * "berapa yang gratis" dengan melihat sebagian bab saja — dan jawabannya
   * berubah tiap pembaca menekan "muat lagi".
   *
   * `paidPriceFrom` `null` berarti tidak ada bab berbayar sama sekali.
   */
  freeChapterCount: z.number().int().nonnegative(),
  paidPriceFrom: z.number().int().nonnegative().nullable(),
})
export type StoryDetail = z.infer<typeof StoryDetailSchema>

/**
 * Entri perpustakaan. `removed` adalah tombstone, bukan penghapusan baris —
 * supaya "batalkan" setelah menghapus tidak kehilangan tanggal simpan aslinya.
 */
export const LibraryEntrySchema = z.object({
  userId: IdSchema,
  storyId: IdSchema,
  savedAt: LocalDateSchema,
  notify: z.boolean(),
  removed: z.boolean(),
})
export type LibraryEntry = z.infer<typeof LibraryEntrySchema>

/** Tiga status baca · FR-LIB-04/11. Dihitung server, bukan ditebak kartu. */
export const ReadStateSchema = z.enum(['not-started', 'reading', 'finished'])
export type ReadState = z.infer<typeof ReadStateSchema>

/**
 * Satu kartu perpustakaan · FR-LIB-02 · FR-LIB-11.
 *
 * Cerita **beserta apa yang sudah dibaca darinya**. Digabungkan di server karena
 * setiap angka di sini butuh daftar bab terbit dan progres sekaligus —
 * menghitungnya di klien berarti mengirim 120 bab per kartu hanya untuk
 * menampilkan satu batang progres.
 */
export const LibraryItemSchema = z.object({
  story: StorySchema,
  savedAt: LocalDateSchema,
  notify: z.boolean(),
  state: ReadStateSchema,
  finishedCount: z.number().int().nonnegative(),
  /** Bab **terbit**, bukan seluruh bab: draf penulis bukan urusan pembaca. */
  totalChapters: z.number().int().nonnegative(),
  pct: z.number().int().min(0).max(100),
  /** Tujuan "Lanjut Baca" — bab terakhir yang dibaca, bukan bab pertama. */
  continueChapterId: IdSchema.nullable(),
  continueChapterNumber: z.number().int().positive().nullable(),
  /** Ada bab terbit setelah kunjungan terakhir — dasar titik merah. */
  hasNewChapter: z.boolean(),
  /** Tanggal bab terakhir terbit (`data-updated`). */
  chapterUpdatedAt: LocalDateSchema,
})
export type LibraryItem = z.infer<typeof LibraryItemSchema>

export const LibrarySortSchema = z.enum(['saved', 'updated', 'az', 'rating'])
export type LibrarySort = z.infer<typeof LibrarySortSchema>

/**
 * Saringan perpustakaan · FR-LIB-11.
 *
 * Seluruhnya dikerjakan **server** dengan paginasi. Prototipe menyaring kartu
 * yang kebetulan ada di DOM, jadi koleksi ke-43 tidak pernah ikut tersaring.
 */
export const LibraryParamsSchema = ListParamsSchema.extend({
  state: z.enum(['all', 'not-started', 'reading', 'finished']).default('all'),
  sort: LibrarySortSchema.default('saved'),
})
export type LibraryParams = z.infer<typeof LibraryParamsSchema>

/**
 * Empat metrik kepala halaman · FR-LIB-01.
 *
 * **Agregat seluruh koleksi**, sengaja terpisah dari daftar: angkanya tidak
 * boleh ikut berubah saat pembaca menyaring, dan menurunkannya dari halaman
 * yang sedang tampil akan membuatnya berubah.
 */
export const LibrarySummarySchema = z.object({
  saved: z.number().int().nonnegative(),
  reading: z.number().int().nonnegative(),
  done: z.number().int().nonnegative(),
  fresh: z.number().int().nonnegative(),
})
export type LibrarySummary = z.infer<typeof LibrarySummarySchema>

/**
 * Progres baca **milik server** (FR-CORE-01) — bukan `localStorage`.
 * Kalau tidak ikut saat pengguna berganti perangkat, janji "lanjut baca" bohong.
 */
export const ReadingProgressSchema = z.object({
  userId: IdSchema,
  storyId: IdSchema,
  lastChapterId: IdSchema.nullable(),
  scrollPct: z.number().min(0).max(1),
  finishedChapterIds: z.array(IdSchema),
  updatedAt: IsoDateTimeSchema,
  /**
   * Posisi gulir **per bab** · FR-READ-16 · R7.
   *
   * `scrollPct` di atas hanya menyimpan posisi bab yang terakhir dibaca, jadi
   * kembali ke bab yang lebih awal selalu mulai dari atas — dan bagi pembaca
   * itu tidak bisa dibedakan dari kehilangan tempat. Kolom ini menyimpan satu
   * angka per bab, sehingga tiap bab punya posisinya sendiri.
   *
   * `Record`, bukan larik: yang dicari selalu satu bab tertentu, dan larik
   * menuntut pencarian linear pada cerita 120 bab.
   */
  scrollByChapter: z.record(IdSchema, z.number().min(0).max(1)).default({}),
  /**
   * Tanggal lokal saat tiap bab **selesai** dibaca · FR-RWD-07.
   *
   * `finishedChapterIds` menjawab *"bab mana yang sudah selesai"*; kolom ini
   * menjawab *"kapan"* — dan misi harian "Baca 3 bab hari ini" tidak bisa
   * dijawab tanpanya. Ditambahkan dengan cara yang sama seperti
   * `scrollByChapter` di R7: kolom baru berpendamping default, bukan mengganti
   * yang lama, supaya seluruh pembaca `finishedChapterIds` tetap benar.
   *
   * Tanggal lokal, bukan stempel waktu: yang menentukan "hari ini" adalah
   * kalender pengguna (FR-RWD-07), dan menyimpan UTC di sini akan menolak misi
   * yang sah setiap pagi di WIB.
   */
  finishedAt: z.record(IdSchema, LocalDateSchema).default({}),
})
export type ReadingProgress = z.infer<typeof ReadingProgressSchema>

/**
 * Id blok beranda · Fase 3b.
 *
 * **Bukan lagi daftar tertutup.** Empat blok pertama tetap (`banner` · `populer`
 * · `terbaru` · `terbuka`) dan `lanjut-baca` menutup, tetapi ekornya berganti
 * mengikuti tab — `romance-ceo`, `kisah-pilu`, `fantasy-sihir`, dan seterusnya.
 * Daftar yang mengunci nilainya berarti menambah satu section kurasi menuntut
 * perubahan kontrak.
 *
 * Id-nya sengaja aman untuk URL: ia sekaligus jadi kata rute `/jelajah/:id`.
 * Satu registry di `api/mock/handlers/sections.ts` memetakannya ke judul dan
 * aturan penyaringnya.
 */
export const SectionIdSchema = z.string().min(1)
export type SectionId = z.infer<typeof SectionIdSchema>

export const HomeSectionSchema = z.object({
  id: SectionIdSchema,
  /** Judulnya berbahasa Inggris — label yang sama dipakai popover pengaturan. */
  title: z.string(),
  subtitle: z.string().nullable(),
  /** Kata rute lihat-semua, atau `null` bila tautannya bukan `/jelajah/*`. */
  seeAll: z.string().nullable(),
  stories: z.array(StorySchema),
  /**
   * Progres baca per cerita, 0–1 — **hanya diisi `lanjut-baca`**, `null` di
   * section lain.
   *
   * Datang dari server, bukan dihitung ulang di klien: angkanya harus persis
   * sama dengan batang progres `/pustaka`, dan satu-satunya cara itu tidak bisa
   * lapuk adalah memakai **satu fungsi** di kedua tempat
   * (`readingCounts` di `api/mock/handlers/library.ts`).
   */
  progress: z.record(IdSchema, z.number().min(0).max(1)).nullable(),
})

export type HomeSection = z.infer<typeof HomeSectionSchema>

/**
 * Parameter halaman lihat-semua. `genre` ikut dari beranda supaya penyaring yang
 * baru saja dipilih pembaca tidak hilang saat ia menekan "Lihat semua"
 * (FR-HOME-13). Chip periode dan saringan lanjutan menyusul bersama FR-HOME-14.
 */
export const SectionParamsSchema = ListParamsSchema.extend({
  /**
   * Tab beranda yang sedang aktif. **Bukan selalu genre**: "My Kisah" menyaring
   * `Story.kind`, bukan `Story.genres` (Fase 3b).
   */
  tab: z.string().optional(),
  /**
   * Chip aktif. Artinya **berbeda per kategori** (FR-HOME-11): pada Populer dan
   * New & Trending ia periode (`hari` · `minggu` · `bulan` · `3bulan`), pada
   * Pilihan Editor ia jenis kurasi (`terbaik` · `permata` · `penulis-baru` ·
   * `bulan-ini`). Satu parameter, karena kontrolnya memang satu deret chip yang
   * hanya boleh punya satu pilihan aktif.
   */
  chip: z.string().optional(),
  status: StoryStatusSchema.optional(),
  language: z.string().optional(),
})
export type SectionParams = z.infer<typeof SectionParamsSchema>

export const HomeFeedSchema = z.object({
  /**
   * Tab yang sedang aktif, atau `null` untuk "Semua". Bertipe string, bukan
   * `GenreSchema`: kosakata tab beranda (`GENRE_TABS`) memuat "My Kisah" yang
   * tidak pernah jadi genre sebuah cerita.
   */
  genre: z.string().nullable(),
  sections: z.array(HomeSectionSchema),
})
export type HomeFeed = z.infer<typeof HomeFeedSchema>

import { z } from 'zod'
import { ChapterSummarySchema } from './chapter'
import {
  AudienceSchema,
  GenreSchema,
  IdSchema,
  IsoDateTimeSchema,
  ListParamsSchema,
  LocalDateSchema,
  ReviewStateSchema,
} from './common'
import {
  ContentLabelSchema,
  MonetizeSchema,
  StorySchema,
  StoryStatusSchema,
  VisibilitySchema,
} from './story'

/** prd_07 · FR-STUDIO-* */

/**
 * Status cerita di studio · FR-STUDIO-02 + FR-STUDIO-38.
 *
 * **Tujuh, bukan lima.** FR-STUDIO-02 menyebut lima; FR-STUDIO-38 menambahkan
 * *"dua status baru **melengkapi** lima status cerita yang sudah ada"*. Jadi
 * daftar enam tab di FR-STUDIO-03 ikut bertambah — tanpa itu, cerita yang
 * ditolak tidak punya satu pun saringan yang menampilkannya, dan penulisnya
 * tidak pernah menemukan alasan penolakannya.
 *
 * Bukan kolom baru di basis data: diturunkan server dari `review` × `status` ×
 * `visibility` × jadwal terbit. Satu keadaan yang disimpan dua kali cepat atau
 * lambat akan berselisih dengan dirinya sendiri.
 */
export const StudioStatusSchema = z.enum([
  'draft',
  'in_review',
  'rejected',
  'scheduled',
  'published',
  'completed',
  'archived',
])
export type StudioStatus = z.infer<typeof StudioStatusSchema>

/** Satu kartu di `/karya` · FR-STUDIO-02. */
export const StudioStorySchema = z.object({
  story: StorySchema,
  studioStatus: StudioStatusSchema,
  /** Waktu terbit terjadwal, bila statusnya `scheduled`. */
  scheduledAt: IsoDateTimeSchema.nullable(),
  /** Alasan penolakan — spesifik dan dapat ditindaklanjuti (FR-STUDIO-38). */
  rejectReason: z.string().nullable(),
  /**
   * Bab yang **sudah terbit** — berbeda dari `stats.chapterCount` yang menghitung
   * draf juga. Dipakai ajakan lanjutan setelah bab pertama terbit
   * (FR-STUDIO-35): satu bab terbit adalah momen paling tepat mengingatkan
   * ritme rilis, dan satu-satunya momen yang bisa dikenali dari angka.
   */
  publishedChapters: z.number().int().nonnegative(),
})
export type StudioStory = z.infer<typeof StudioStorySchema>

export const StudioSortSchema = z.enum(['updated', 'popular', 'az'])

/** Cari, saring, urut — seluruhnya di server, seperti perpustakaan. */
export const StudioParamsSchema = ListParamsSchema.extend({
  status: z.union([StudioStatusSchema, z.literal('all')]).default('all'),
  sort: StudioSortSchema.default('updated'),
})
export type StudioParams = z.infer<typeof StudioParamsSchema>

/**
 * Empat metrik kepala studio · FR-STUDIO-01.
 *
 * Agregat seluruh karya, terpisah dari daftar — alasan yang sama dengan
 * ringkasan perpustakaan: angkanya tidak boleh ikut berubah saat menyaring.
 */
export const StudioSummarySchema = z.object({
  stories: z.number().int().nonnegative(),
  views: z.number().int().nonnegative(),
  subs: z.number().int().nonnegative(),
  coins: z.number().int().nonnegative(),
})
export type StudioSummary = z.infer<typeof StudioSummarySchema>

/**
 * Pendaftaran penulis · FR-STUDIO-33.
 *
 * Tiga prasyarat yang sudah dinyatakan prototipe di tiga tempat berbeda, kini
 * ditegakkan di satu tempat. Menyetujui ketentuan sudah cukup untuk **menulis**;
 * dua sisanya baru dituntut saat menyentuh uang.
 */
export const AuthorSignupInputSchema = z.object({
  termsAccepted: z.literal(true),
  payoutVerified: z.boolean(),
  twoFactor: z.boolean(),
})
export type AuthorSignupInput = z.infer<typeof AuthorSignupInputSchema>

/** Jadwal terbit cerita utuh — bukan bab tertentu (FR-STUDIO-04). */
export const ScheduleStoryInputSchema = z.object({
  storyId: IdSchema,
  /** Tanggal lokal penulis, `YYYY-MM-DD`. Minimum hari ini. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** `HH:MM` 24 jam. */
  time: z.string().regex(/^\d{2}:\d{2}$/),
  cadence: z.enum(['once', 'daily', 'weekly', 'mon-thu']),
})
export type ScheduleStoryInput = z.infer<typeof ScheduleStoryInputSchema>

/**
 * Pesanan cetak · FR-STUDIO-05.
 *
 * Softcopy hanya butuh konfigurasi berkas; hardcopy menambah pengiriman. Satu
 * bentuk untuk keduanya, dengan `shipping` yang wajib ada **hanya** saat
 * `kind === 'hard'` — diperiksa server, bukan dipercayakan ke layar.
 */
export const PrintOrderInputSchema = z.object({
  storyId: IdSchema,
  kind: z.enum(['soft', 'hard']),
  spec: z.string().min(1),
  copies: z.number().int().positive().max(100).default(1),
  shipping: z
    .object({
      name: z.string().trim().min(1),
      phone: z.string().trim().min(6),
      address: z.string().trim().min(10),
      city: z.string().trim().min(1),
      postalCode: z.string().trim().min(4),
      note: z.string().max(300),
    })
    .nullable()
    .default(null),
})
export type PrintOrderInput = z.infer<typeof PrintOrderInputSchema>

/**
 * Status bab di studio · FR-STUDIO-08 + FR-STUDIO-38.
 *
 * Enam, dengan alasan yang sama seperti tujuh status cerita di §1.9: dua status
 * tinjauan **melengkapi** empat status bab yang sudah ada, dan status yang tidak
 * punya saringan adalah status yang penulisnya tidak akan pernah temukan.
 */
export const AuthorChapterStatusSchema = z.enum([
  'draft',
  'in_review',
  'rejected',
  'scheduled',
  'published',
  'private',
])
export type AuthorChapterStatus = z.infer<typeof AuthorChapterStatusSchema>

export const AuthorChapterSchema = ChapterSummarySchema.extend({
  authorStatus: AuthorChapterStatusSchema,
  /** Perkiraan kelengkapan draf, dari jumlah kata terhadap target satu bab. */
  progressPct: z.number().int().min(0).max(100),
})
export type AuthorChapter = z.infer<typeof AuthorChapterSchema>

export const ChapterSortSchema = z.enum(['number', 'edited', 'views', 'rating'])

export const AuthorChapterParamsSchema = ListParamsSchema.extend({
  status: z.union([AuthorChapterStatusSchema, z.literal('all')]).default('all'),
  sort: ChapterSortSchema.default('number'),
})
export type AuthorChapterParams = z.infer<typeof AuthorChapterParamsSchema>

/**
 * Papan kepala halaman kelola bab · FR-STUDIO-07.
 *
 * Tiga penghitung **dan** pemberitahuan tindak lanjut, keduanya diturunkan
 * server dari keadaan bab — bukan daftar yang ditulis tangan. Pemberitahuan yang
 * tidak lahir dari data akan tetap berbunyi setelah penyebabnya hilang.
 */
export const ChapterNoticeSchema = z.object({
  id: IdSchema,
  kind: z.enum(['publishing-soon', 'stale-draft', 'hidden', 'milestone']),
  text: z.string(),
  actionLabel: z.string(),
  /** Ke mana tindak lanjutnya — selalu ada; pemberitahuan buntu tidak dikirim. */
  href: z.string().min(1),
})
export type ChapterNotice = z.infer<typeof ChapterNoticeSchema>

export const ChapterBoardSchema = z.object({
  draft: z.number().int().nonnegative(),
  scheduled: z.number().int().nonnegative(),
  published: z.number().int().nonnegative(),
  notices: z.array(ChapterNoticeSchema),
})
export type ChapterBoard = z.infer<typeof ChapterBoardSchema>

/** Jadwal terbit **satu bab** — terpisah dari penjadwal cerita (FR-STUDIO-11). */
export const ScheduleChapterInputSchema = z.object({
  chapterId: IdSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  cadence: z.enum(['once', 'every-3-days', 'weekly', 'mon-thu']),
})
export type ScheduleChapterInput = z.infer<typeof ScheduleChapterInputSchema>

/**
 * Satu versi bahasa dalam editor bab.
 *
 * `body` di sini **satu untai**, bukan larik paragraf seperti `ChapterContent`:
 * yang diketik penulis adalah teks, dan pemecahannya jadi paragraf terjadi di
 * seam. Memaksa editor bekerja dengan larik berarti setiap ketikan menyusun
 * ulang struktur yang hanya relevan saat menyimpan.
 */
export const ChapterLangDraftSchema = z.object({
  title: z.string(),
  body: z.string(),
  authorNote: z.string(),
})
export type ChapterLangDraft = z.infer<typeof ChapterLangDraftSchema>

/**
 * Naskah bab sebagaimana penulis menyuntingnya · FR-STUDIO-19 · FR-STUDIO-34.
 *
 * Mencakup **kedua bahasa beserta catatan penulisnya** — itu yang dituntut
 * autosave: menyimpan separuh naskah lalu memulihkannya sebagai naskah utuh
 * lebih berbahaya daripada tidak menyimpan sama sekali.
 */
export const ChapterDraftSchema = z.object({
  chapterId: IdSchema,
  storyId: IdSchema,
  /** Judul cerita induk — kepala editor menyebutkannya (FR-STUDIO-35). */
  storyTitle: z.string(),
  number: z.number().int().positive(),
  id: ChapterLangDraftSchema,
  en: ChapterLangDraftSchema,
  updatedAt: IsoDateTimeSchema,
})
export type ChapterDraft = z.infer<typeof ChapterDraftSchema>

/**
 * `chapterId` boleh `null`: bab baru belum punya baris sampai penyimpanan
 * pertama. Server yang membuatkannya, lalu mengembalikan id-nya — sehingga
 * editor tidak perlu membuat bab kosong hanya untuk bisa menyimpan.
 */
export const ChapterDraftInputSchema = z.object({
  chapterId: IdSchema.nullable(),
  storyId: IdSchema,
  id: ChapterLangDraftSchema,
  en: ChapterLangDraftSchema,
})
export type ChapterDraftInput = z.infer<typeof ChapterDraftInputSchema>

export const PrivateReasonSchema = z.enum(['revisi', 'sensitif', 'ditarik', 'lainnya'])
export type PrivateReason = z.infer<typeof PrivateReasonSchema>

/**
 * Keadaan akses satu bab · FR-STUDIO-23..26 · FR-STUDIO-36.
 *
 * Membawa **konteks babnya**, bukan hanya nilainya. Prototipe menampilkan
 * "412 pembeli" dan "3 koin" untuk bab mana pun dari mana pun halaman itu
 * dibuka; setiap angka di sini datang dari bab yang benar-benar sedang diatur.
 */
export const ChapterAccessInfoSchema = z.object({
  chapterId: IdSchema,
  storyId: IdSchema,
  number: z.number().int().positive(),
  title: z.string(),
  access: z.enum(['free', 'paid', 'private']),
  priceCoins: z.number().int().nonnegative(),
  previewPct: z.number().int().min(0).max(50),
  privateReason: PrivateReasonSchema.nullable(),
  privateUntil: LocalDateSchema.nullable(),
  wordCount: z.number().int().nonnegative(),
  /** Pembeli bab ini — angka nyata yang dipakai konfirmasi ubah-ke-gratis. */
  buyers: z.number().int().nonnegative(),
  /** Bab nomor 1 tidak boleh diprivatkan — pintu masuk cerita harus terbuka. */
  canBePrivate: z.boolean(),
  /**
   * Sisa hari sebelum bab gratis boleh kembali berbayar (FR-STUDIO-23).
   * `0` berarti bebas berubah.
   */
  freeLockDaysLeft: z.number().int().nonnegative(),
  /** Bab berbayar menuntut penulis terverifikasi (FR-STUDIO-33/36). */
  authorVerified: z.boolean(),
  /**
   * Bagi hasil penulis dalam persen, **dari server**.
   *
   * Bukan dari `AUTHOR_SHARE` di `lib/coin.ts`: konstanta itu nilai bawaan
   * seed, dan FR-EARN-12 mensyaratkan angka yang ditampilkan datang dari
   * konfigurasi server — ia bisa berubah tanpa rilis aplikasi.
   */
  authorSharePct: z.number().int().min(0).max(100),
})
export type ChapterAccessInfo = z.infer<typeof ChapterAccessInfoSchema>

export const ChapterAccessInputSchema = z.object({
  chapterId: IdSchema,
  access: z.enum(['free', 'paid', 'private']),
  priceCoins: z.number().int(),
  previewPct: z.number().int(),
  privateReason: PrivateReasonSchema.nullable().default(null),
  privateUntil: LocalDateSchema.nullable().default(null),
})
export type ChapterAccessInput = z.infer<typeof ChapterAccessInputSchema>

/**
 * Formulir cerita. **Angkanya dari PRD, bukan dari kanvas** (arch §1.5):
 * kanvas menggambar judul 80 / sinopsis 1200; yang berlaku 100 / 1000.
 */
export const StoryFormSchema = z.object({
  title: z.string().trim().min(1, 'Judul story tidak boleh kosong').max(100),
  synopsis: z.string().trim().min(50, 'Sinopsis minimal 50 karakter').max(1_000),
  penName: z.string().trim().min(1, 'Nama pena wajib diisi'),
  coverUrl: z.string().nullable(),
  genre: GenreSchema,
  extraGenres: z.array(GenreSchema).max(2, 'Genre tambahan maksimal 2'),
  tags: z.array(z.string()).max(10, 'Tag maksimal 10'),
  audience: AudienceSchema,
  language: z.enum(['Indonesia', 'English', 'Malay']),
  monetizeType: MonetizeSchema,
  fullAccessCoins: z.number().int().nonnegative().nullable(),
  visibility: VisibilitySchema,
  /**
   * Status penerbitan — hanya mode `sunting` yang mengubahnya (FR-STUDIO-18).
   * Cerita baru selalu lahir `ongoing`; server yang memaksakannya.
   */
  status: StoryStatusSchema,
  commentsEnabled: z.boolean(),
  moderateComments: z.boolean(),
  allowTranslation: z.boolean(),
  allowFanfiction: z.boolean(),
  contentLabels: z.array(ContentLabelSchema),
  dedication: z.string().max(300),
  authorNote: z.string().max(1_000),
})
export type StoryForm = z.infer<typeof StoryFormSchema>

/**
 * Lini masa pesanan cetak — **enam tahap PRD** (FR-STUDIO-32), bukan empat
 * langkah yang digambar kanvas. Keputusannya di arch §1.5.
 */
export const PRINT_STAGES = [
  'Diajukan',
  'Dikonfirmasi',
  'Dibayar',
  'Dicetak',
  'Dikirim',
  'Diterima',
] as const
export type PrintStage = (typeof PRINT_STAGES)[number]

/**
 * Status pesanan cetak. Empat nilai terakhir hanya ada di kanvas seksi 8a —
 * seluruhnya menyentuh uang penulis, jadi tunduk pada kontrak copy §1.4.
 */
export const PrintStatusSchema = z.enum([
  'submitted',
  'confirmed',
  'paid',
  'printing',
  'shipped',
  'received',
  'rejected',
  'cancelled',
  /** PRINT-504 — naskah melewati batas waktu pemrosesan. */
  'build_failed',
  /** PRINT-410 — berkas lewat masa simpan 30 hari. */
  'expired',
  /** PRINT-402 — admin mengubah biaya; menunggu persetujuan penulis. */
  'cost_changed',
])
export type PrintStatus = z.infer<typeof PrintStatusSchema>

export const PrintOrderSchema = z.object({
  /** `#SFT-YYYYMMDD-NNN` atau `#HDC-YYYYMMDD-NNN` — jenisnya terbaca dari nomornya. */
  id: IdSchema,
  userId: IdSchema,
  storyId: IdSchema,
  storyTitle: z.string(),
  kind: z.enum(['soft', 'hard']),
  spec: z.string(),
  status: PrintStatusSchema,
  /** Indeks tahap saat ini pada `PRINT_STAGES`; `null` untuk softcopy. */
  stageIndex: z.number().int().min(0).max(5).nullable(),
  costQuoted: z.number().int().nonnegative().nullable(),
  costFinal: z.number().int().nonnegative().nullable(),
  /** Alasan penolakan yang konkret — mis. syarat minimum 10 bab aktif. */
  rejectReason: z.string().nullable(),
  trackingNumber: z.string().nullable(),
  etaNote: z.string().nullable(),
  fileName: z.string().nullable(),
  fileSize: z.string().nullable(),
  fileExpiresAt: IsoDateTimeSchema.nullable(),
  note: z.string().nullable(),
  createdAt: IsoDateTimeSchema,
})
export type PrintOrder = z.infer<typeof PrintOrderSchema>

/**
 * Satu entri jadwal terbit. Waktu disimpan **UTC beserta zona waktu penulis**,
 * lalu ditampilkan menurut zona pembaca (FR-STUDIO-37).
 */
export const ScheduleEntrySchema = z.object({
  id: IdSchema,
  storyId: IdSchema,
  storyTitle: z.string(),
  chapterId: IdSchema.nullable(),
  chapterLabel: z.string().nullable(),
  publishAtUtc: IsoDateTimeSchema.nullable(),
  authorTz: z.string(),
  cadence: z.string(),
  /** `gap` dan `clash` sama-sama menuntut keputusan; `ok` tidak. */
  kind: z.enum(['ok', 'gap', 'clash']),
  note: z.string().nullable(),
})
export type ScheduleEntry = z.infer<typeof ScheduleEntrySchema>

/**
 * Satu antrean untuk empat sumber: cerita, bab, laporan, pesanan cetak.
 *
 * **Diturunkan, bukan disimpan.** Barisnya dihitung dari sumbernya masing-masing
 * setiap kali antrean dibaca; tabel antrean tersendiri berarti dua tempat yang
 * menyimpan keadaan tinjauan yang sama, dan cepat atau lambat keduanya
 * berselisih — alasan yang sama dengan status studio di §1.9.
 */
export const ReviewQueueItemSchema = z.object({
  id: IdSchema,
  kind: z.enum(['story', 'chapter', 'report', 'print']),
  refId: IdSchema,
  label: z.string(),
  /** Cerita induknya — baris bab menyebut ceritanya, bukan hanya nomornya. */
  context: z.string().nullable(),
  status: ReviewStateSchema,
  reason: z.string().nullable(),
  /** Ke mana penulis pergi untuk menindaklanjutinya. Selalu ada. */
  link: z.string().min(1),
  submittedAt: IsoDateTimeSchema,
  decidedAt: IsoDateTimeSchema.nullable(),
})
export type ReviewQueueItem = z.infer<typeof ReviewQueueItemSchema>

/** Sasaran aksi tinjauan — cerita atau bab; laporan dan cetak punya jalurnya sendiri. */
export const ReviewTargetSchema = z.object({
  kind: z.enum(['story', 'chapter']),
  refId: IdSchema,
})
export type ReviewTarget = z.infer<typeof ReviewTargetSchema>

/**
 * Analitik cerita · FR-STUDIO-27..31.
 *
 * Seluruhnya **diturunkan** dari cerita, bab, komentar, dan kepemilikan — sama
 * alasannya dengan §1.9 dan §1.11: angka yang disimpan akan berselisih dengan
 * sumbernya begitu satu bab berubah, dan yang salah selalu yang dilihat penulis.
 */
export const ANALYTICS_RANGES = ['7h', '30h', '3b', '1t', 'custom'] as const
export const AnalyticsRangeSchema = z.enum(ANALYTICS_RANGES)
export type AnalyticsRange = z.infer<typeof AnalyticsRangeSchema>

/**
 * Lima urutan performa bab · FR-STUDIO-29. Diurutkan **server** (PRD 07 §7 #9).
 * Berbeda dari `ChapterSortSchema` milik daftar kelola bab: yang itu mengurutkan
 * pekerjaan, yang ini mengurutkan hasil.
 */
export const PERF_SORTS = ['views', 'comments', 'purchases', 'rating', 'newest'] as const
export const PerfSortSchema = z.enum(PERF_SORTS)
export type PerfSort = z.infer<typeof PerfSortSchema>

export const AnalyticsParamsSchema = z.object({
  range: AnalyticsRangeSchema.default('7h'),
  /** Hanya dipakai saat `range === 'custom'`; dijepit maksimum hari ini. */
  from: LocalDateSchema.nullable().default(null),
  to: LocalDateSchema.nullable().default(null),
  chapterSort: PerfSortSchema.default('views'),
})
export type AnalyticsParams = z.infer<typeof AnalyticsParamsSchema>

/** Satu hari pada grafik tren — dua lapisan berbagi satu sumbu waktu. */
export const AnalyticsPointSchema = z.object({
  date: LocalDateSchema,
  views: z.number().int().nonnegative(),
  newReaders: z.number().int().nonnegative(),
})
export type AnalyticsPoint = z.infer<typeof AnalyticsPointSchema>

/**
 * Kartu metrik · FR-STUDIO-27. `target` adalah **bagian tujuan**, bukan URL:
 * menekan kartu menggulir mulus ke sana, jadi tautannya tidak pernah bisa
 * menunjuk bagian yang tidak dirender.
 */
export const AnalyticsMetricSchema = z.object({
  key: z.enum(['views', 'readers', 'comments', 'revenue']),
  value: z.number().int().nonnegative(),
  /** Perubahan terhadap periode sebelumnya yang **sama panjang**. */
  changePct: z.number().int(),
  target: z.enum(['tren', 'sentimen', 'pendapatan']),
})
export type AnalyticsMetric = z.infer<typeof AnalyticsMetricSchema>

/**
 * Performa satu bab · FR-STUDIO-29.
 *
 * `badge` `drop` menang atas harga: bab yang kehilangan pembaca adalah masalah
 * yang harus terbaca lebih dulu daripada harganya.
 */
export const ChapterPerfSchema = z.object({
  chapterId: IdSchema,
  number: z.number().int().positive(),
  title: z.string(),
  views: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
  purchases: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5),
  /** Skor relatif 0–100 terhadap bab terbaik cerita ini — untuk batang rating. */
  score: z.number().int().min(0).max(100),
  badge: z.enum(['price', 'free', 'drop']),
  priceCoins: z.number().int().nonnegative(),
  /** Retensi terhadap bab sebelumnya, dalam persen. Bab pertama selalu 100. */
  retentionPct: z.number().int().nonnegative(),
  /** Peran bab dalam satu kalimat — "entry point terbaik", "retensi menurun". */
  note: z.string(),
  publishedAt: IsoDateTimeSchema.nullable(),
})
export type ChapterPerf = z.infer<typeof ChapterPerfSchema>

export const StoryAnalyticsSchema = z.object({
  storyId: IdSchema,
  storyTitle: z.string(),
  range: AnalyticsRangeSchema,
  /** Label rentang yang sudah jadi kalimat — "7 hari terakhir". */
  rangeLabel: z.string(),
  from: LocalDateSchema,
  to: LocalDateSchema,
  metrics: z.array(AnalyticsMetricSchema),
  series: z.array(AnalyticsPointSchema),
  chapters: z.array(ChapterPerfSchema),
  /**
   * Sentimen komentar · FR-SOCIAL-08. Jumlahnya nyata (milik bab); pecahan
   * nadanya belum — reaksi komentar baru ada di Fase 10.
   */
  sentiment: z.object({
    positive: z.number().int().min(0).max(100),
    neutral: z.number().int().min(0).max(100),
    negative: z.number().int().min(0).max(100),
    total: z.number().int().nonnegative(),
  }),
  origin: z.object({
    sources: z.array(z.object({ label: z.string(), pct: z.number().int().min(0).max(100) })),
    peakHours: z.string(),
  }),
  /** Tanggal penerbitan bab pada bulan berjalan — kalender aktivitas publish. */
  publishDays: z.array(LocalDateSchema),
  /**
   * Waktu terbit terbaik menurut hari paling ramai — menutup sisa FR-STUDIO-37,
   * yang menuntut rekomendasi ini jadi **pintasan pengisian** di penjadwal.
   * Karena itu ia membawa slot yang bisa langsung dipakai, bukan hanya
   * kalimatnya: rekomendasi yang masih harus diterjemahkan sendiri ke tanggal
   * bukan pintasan.
   */
  bestTime: z.object({
    label: z.string(),
    date: LocalDateSchema,
    time: z.string(),
  }),
})
export type StoryAnalytics = z.infer<typeof StoryAnalyticsSchema>

/**
 * Empat tab riwayat cetak · `[DESAIN]`. `running` = pesanan yang masih bergerak
 * — bukan status tersendiri, melainkan pertanyaan "apa yang belum selesai?".
 */
export const PrintOrderParamsSchema = ListParamsSchema.extend({
  tab: z.enum(['all', 'soft', 'hard', 'running']).default('all'),
})
export type PrintOrderParams = z.infer<typeof PrintOrderParamsSchema>

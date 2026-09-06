import { z } from 'zod'
import { IdempotentSchema, IdSchema, IsoDateTimeSchema, LocalDateSchema } from './common'

/** prd_09 E · prd_08 · FR-RWD-* · FR-EARN-* */

/**
 * Voucher punya **cakupan**, bukan sekadar nilai (FR-RWD-06): satu bab, N bab
 * pertama, satu cerita penuh, atau lintas cerita. Tanpa cakupan, "voucher"
 * hanyalah diskon yang tidak tahu ia berlaku di mana.
 */
export const VoucherScopeSchema = z.enum(['chapter', 'firstN', 'story', 'cross'])

export const VoucherSchema = z.object({
  id: IdSchema,
  code: z.string(),
  ownerId: IdSchema.nullable(),
  title: z.string(),
  scope: VoucherScopeSchema,
  storyIds: z.array(IdSchema),
  chapterIds: z.array(IdSchema),
  /** `free` membuka penuh; `pct` memotong harga sebesar `percentOff`. */
  value: z.enum(['free', 'pct']),
  percentOff: z.number().int().min(1).max(100).nullable(),
  firstN: z.number().int().positive().nullable(),
  /** Syarat yang harus dipenuhi sebelum voucher bisa dipakai. */
  unlockCond: z.string().nullable(),
  maxUses: z.number().int().positive(),
  usedCount: z.number().int().nonnegative(),
  expiresAt: IsoDateTimeSchema,
  /**
   * **Diturunkan server, bukan disimpan** · FR-RWD-06. Voucher dengan
   * `unlockCond` tidak dapat dipilih sampai syaratnya terpenuhi — dan yang tahu
   * apakah syaratnya terpenuhi hanya server (streak, bab selesai). Layar yang
   * menghitungnya sendiri akan menghidupkan tombol yang servernya tolak.
   */
  locked: z.boolean().default(false),
})
export type Voucher = z.infer<typeof VoucherSchema>

/** Cerita tempat sebuah voucher benar-benar berlaku · FR-RWD-06. */
export const VoucherTargetSchema = z.object({
  storyId: IdSchema,
  title: z.string(),
  coverUrl: z.string().nullable(),
  /** Berapa bab terkunci yang akan terbuka bila voucher ini dipakai di sini. */
  unlockCount: z.number().int().nonnegative(),
})
export type VoucherTarget = z.infer<typeof VoucherTargetSchema>

export const RedeemResultSchema = z.object({
  voucher: VoucherSchema,
  unlockedChapterIds: z.array(IdSchema),
  message: z.string(),
})
export type RedeemResult = z.infer<typeof RedeemResultSchema>

/**
 * Jenis misi menentukan **dari mana progresnya dibaca** · FR-RWD-07.
 *
 * Disimpan, bukan ditebak dari judulnya: judul boleh diubah copywriter kapan
 * saja, dan misi yang progresnya berhenti terbaca karena judulnya diperhalus
 * adalah cacat yang tidak akan pernah dicurigai.
 */
export const MissionKindSchema = z.enum(['read', 'review', 'ad'])
export type MissionKind = z.infer<typeof MissionKindSchema>

export const MissionSchema = z.object({
  id: IdSchema,
  kind: MissionKindSchema,
  title: z.string(),
  description: z.string(),
  progress: z.number().int().nonnegative(),
  target: z.number().int().positive(),
  rewardCoins: z.number().int().positive(),
  claimedAt: IsoDateTimeSchema.nullable(),
  /** Ke mana tombolnya membawa saat misi belum selesai · FR-RWD-07, FR-CORE-05. */
  actionLink: z.string(),
  actionLabel: z.string(),
})
export type Mission = z.infer<typeof MissionSchema>

/** Satu hari di kalender check-in · FR-RWD-02. */
export const CheckInDaySchema = z.object({
  day: z.number().int().min(1).max(7),
  coins: z.number().int().nonnegative(),
  voucherTitle: z.string().nullable(),
  claimed: z.boolean(),
  /** Hari yang bisa diklaim sekarang — tepat satu, atau tidak ada sama sekali. */
  claimable: z.boolean(),
})
export type CheckInDay = z.infer<typeof CheckInDaySchema>

/**
 * Bentuk yang **tersimpan** — hanya yang tidak bisa dihitung ulang.
 *
 * Dipisah dari `Reward` yang dibaca layar karena selisihnya seluruhnya turunan:
 * streak yang berlaku, kalender tujuh hari, progres misi, dan ringkasan tiga
 * angka semuanya dihitung dari tanggal hari ini dan dari aktivitas nyata. Kalau
 * turunan ikut disimpan, ia akan basi tanpa ada yang tahu — dan streak yang
 * basi berarti hadiah yang bisa diambil dua kali (`architecture.md` §1.38).
 */
export const RewardStateSchema = z.object({
  userId: IdSchema,
  checkInStreak: z.number().int().nonnegative(),
  /**
   * Tanggal **lokal pengguna** (FR-RWD-07). Memakai tanggal UTC di sini adalah
   * bug yang menolak klaim sah setiap pagi di WIB.
   */
  lastCheckIn: LocalDateSchema.nullable(),
  missions: z.array(MissionSchema),
  referralCode: z.string(),
})
export type RewardState = z.infer<typeof RewardStateSchema>

export const RewardSchema = RewardStateSchema.extend({
  /**
   * **Koin hadiah periode berjalan, bukan saldo kedua** · FR-RWD-01,
   * FR-WALLET-17. Dijumlahkan dari buku besar (`kind: 'reward'`) bulan ini —
   * angka kedua yang mengaku saldo adalah cara tercepat membuat pengguna
   * berhenti mempercayai keduanya.
   */
  coinsThisPeriod: z.number().int().nonnegative(),
  voucherCount: z.number().int().nonnegative(),
  /** Berapa voucher yang tinggal beberapa hari lagi · FR-RWD-01. */
  expiringSoon: z.number().int().nonnegative(),
  /** Kalender tujuh hari, sudah dihitung server · FR-RWD-02. */
  checkIn: z.array(CheckInDaySchema),
  claimedToday: z.boolean(),
})
export type Reward = z.infer<typeof RewardSchema>

/**
 * Program referral · FR-RWD-04 · FR-RWD-07.
 *
 * Tiap undangan membawa **keadaannya**, bukan cuma namanya: hadiah baru
 * diberikan setelah teman mendaftar **dan** menyelesaikan bab pertamanya, dan
 * daftar yang tidak menunjukkan bedanya membuat syarat itu terasa seperti
 * penolakan sewenang-wenang.
 */
export const ReferralInviteSchema = z.object({
  /**
   * Id **yang diundang**, bukan yang mengundang.
   *
   * Semula kolomnya bernama `userId`, dan itu satu nama untuk dua arti: baris
   * Dexie memakai `userId` sebagai pemilik (indeksnya), sementara isinya
   * seharusnya orang yang bergabung. Akibatnya ketiga undangan memakai id yang
   * sama, dan React mengeluh soal kunci ganda — gejala yang muncul di layar,
   * bukan di typecheck, karena kedua arti itu sama-sama `string`.
   */
  inviteeId: IdSchema,
  name: z.string(),
  joinedAt: IsoDateTimeSchema,
  readFirstChapter: z.boolean(),
  rewardedCoins: z.number().int().nonnegative(),
})
export type ReferralInvite = z.infer<typeof ReferralInviteSchema>

export const ReferralSchema = z.object({
  code: z.string(),
  rewardCoins: z.number().int().positive(),
  condition: z.string(),
  invites: z.array(ReferralInviteSchema),
  earnedCoins: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
})
export type Referral = z.infer<typeof ReferralSchema>

/**
 * Riwayat klaim · FR-RWD-05.
 *
 * **Diturunkan dari buku besar**, bukan tabel kedua: riwayat klaim dan dompet
 * yang dihitung terpisah akan berbeda, dan yang salah tidak akan ketahuan
 * sampai ada yang menjumlahkan keduanya.
 */
export const RewardHistoryEntrySchema = z.object({
  id: IdSchema,
  title: z.string(),
  coins: z.number().int(),
  at: IsoDateTimeSchema,
})
export type RewardHistoryEntry = z.infer<typeof RewardHistoryEntrySchema>

export const WithdrawStatusSchema = z.enum(['submitted', 'review', 'transferred', 'rejected'])

export const WithdrawalSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  amount: z.number().int().positive(),
  fee: z.number().int().nonnegative(),
  net: z.number().int().positive(),
  bankName: z.string(),
  bankAccountMasked: z.string(),
  status: WithdrawStatusSchema,
  /** Wajib terisi saat `rejected` — penolakan harus bisa ditindaklanjuti. */
  reason: z.string().nullable(),
  proofUrl: z.string().nullable(),
  requestedAt: IsoDateTimeSchema,
  settledAt: IsoDateTimeSchema.nullable(),
})
export type Withdrawal = z.infer<typeof WithdrawalSchema>

/** Pencairan menyentuh uang → wajib idempoten. */
export const WithdrawInputSchema = IdempotentSchema.extend({
  amount: z.number().int().min(100_000, 'Minimum pencairan Rp 100.000'),
  bankAccountId: IdSchema,
  /** Tujuan pencairan · FR-EARN-07. Ikut tercatat di pengajuan. `[LUAR]` */
  purpose: z.string().min(1).default('Pembayaran pendapatan penulis'),
})
export type WithdrawInput = z.infer<typeof WithdrawInputSchema>

/**
 * Analitik penulis · FR-EARN-01..05.
 *
 * Berbeda dari analitik **cerita** (`StoryAnalytics`, prd_07): yang itu satu
 * judul, yang ini seluruh karya — dan satu-satunya tempat koin bertemu rupiah.
 * Rentang waktunya sengaja memakai enum yang sama, menutup PRD 08 §7 #5: dua
 * halaman analitik dengan pemilih rentang berbeda memaksa penulis belajar dua
 * kali untuk pertanyaan yang sama.
 */
export const AUTHOR_VIEWPOINTS = ['revenue', 'retention', 'traffic'] as const
export const AuthorViewpointSchema = z.enum(AUTHOR_VIEWPOINTS)
export type AuthorViewpoint = z.infer<typeof AuthorViewpointSchema>

/**
 * Satu tahap corong pembaca · FR-EARN-04. Empat tahap berurutan, persentasenya
 * menurun: Dibuka → Bab 3 → Premium → Bayar.
 */
export const FunnelStageSchema = z.object({
  label: z.string(),
  pct: z.number().int().min(0).max(100),
})
export type FunnelStage = z.infer<typeof FunnelStageSchema>

/**
 * Satu sel heatmap rilis · FR-EARN-05. Tiga tingkat intensitas, dan yang
 * terpanas **wajib jatuh pada `bestTime`** — heatmap yang menunjuk satu jam
 * sementara rekomendasinya menyebut jam lain membuat keduanya tidak bisa
 * dipercaya.
 */
export const HeatCellSchema = z.object({
  day: z.string(),
  slot: z.string(),
  level: z.enum(['low', 'mid', 'hot']),
  pct: z.number().int().min(0).max(100),
})
export type HeatCell = z.infer<typeof HeatCellSchema>

/** Satu batang kurva pendapatan · FR-EARN-03. Tujuh hari, Sen–Min. */
export const RevenueBarSchema = z.object({
  day: z.string(),
  coins: z.number().int().nonnegative(),
  /** Tinggi relatif terhadap hari terkuat, 0–100. */
  pct: z.number().int().min(0).max(100),
})
export type RevenueBar = z.infer<typeof RevenueBarSchema>

export const AuthorAnalyticsSchema = z.object({
  range: z.enum(['7h', '30h', '3b', '1t', 'custom']),
  rangeLabel: z.string(),
  /**
   * Tiga KPI berurutan tetap · FR-EARN-01: Pendapatan · Dibaca · Rating.
   * Agregat **seluruh karya**, bukan satu cerita.
   */
  kpi: z.object({
    revenueRupiah: z.number().int().nonnegative(),
    reads: z.number().int().nonnegative(),
    rating: z.number().min(0).max(5),
  }),
  /** Kurs dan bagi hasil dari konfigurasi server — menutup PRD 08 §7 #9. */
  coinRateRupiah: z.number().int().positive(),
  authorSharePct: z.number().int().min(0).max(100),
  /**
   * Cerita yang dianalisis corong dan tingkat buka · FR-EARN-04.
   *
   * **Bukan agregat.** FR-EARN-04 mensyaratkan tahap "Bayar" sama dengan metrik
   * "Tingkat buka" FR-EARN-03, dan satu-satunya cara dua angka itu konsisten
   * adalah keduanya dihitung dari cerita yang sama. KPI di kepala halaman tetap
   * agregat seluruh karya (FR-EARN-01) — itu pertanyaan yang berbeda.
   */
  focusStory: z.object({ id: IdSchema, title: z.string() }).nullable(),
  revenue: z.object({
    /** Sama dengan tahap terakhir `funnel` — satu angka, dua tempat. */
    openRatePct: z.number().int().min(0).max(100),
    openRateChangePct: z.number().int(),
    newFans: z.number().int().nonnegative(),
    newFansChangePct: z.number().int(),
    bars: z.array(RevenueBarSchema),
    /** Satu kalimat yang menyebut hari terkuat — bukan pengulangan angkanya. */
    note: z.string(),
  }),
  /** Sudut pandang **Retensi**: corong pembaca + bab tempat mereka berhenti. */
  retention: z.object({
    funnel: z.array(FunnelStageSchema),
    drops: z.array(
      z.object({
        storyTitle: z.string(),
        label: z.string(),
        retentionPct: z.number().int().nonnegative(),
        note: z.string(),
      }),
    ),
  }),
  /** Sudut pandang **Traffic**: dari mana pembaca datang, dan kapan. */
  traffic: z.object({
    sources: z.array(z.object({ label: z.string(), pct: z.number().int().min(0).max(100) })),
    peakHours: z.string(),
    /** Heatmap rilis · FR-EARN-05: empat slot waktu × tujuh hari. */
    heatSlots: z.array(z.string()),
    heatDays: z.array(z.string()),
    heat: z.array(HeatCellSchema),
    /**
     * Catatan aksi · FR-EARN-05 — **rekomendasi yang bisa dijalankan**, bukan
     * pengamatan. Karena itu ia membawa `scheduleLink`: penjadwal yang terbuka
     * dengan waktunya sudah terisi, bukan kalimat yang harus diterjemahkan
     * sendiri jadi tanggal.
     */
    actionNote: z.string(),
    scheduleLink: z.string().nullable(),
  }),
})
export type AuthorAnalytics = z.infer<typeof AuthorAnalyticsSchema>

/** Parameter analitik penulis — rentang **dan** sudut pandang menyaring di server. */
export const AuthorAnalyticsParamsSchema = z.object({
  range: z.enum(['7h', '30h', '3b', '1t', 'custom']).default('30h'),
  viewpoint: AuthorViewpointSchema.default('revenue'),
})
export type AuthorAnalyticsParams = z.infer<typeof AuthorAnalyticsParamsSchema>

/**
 * Konversi koin → rupiah · FR-EARN-12.
 *
 * PRD 08 §7 #9: analitik memakai koin, pencairan memakai rupiah, dan sampai
 * sekarang tidak ada kurs yang terlihat di mana pun. Bentuk ini membawa
 * **rantai lengkapnya** — pembaca membayar, platform memotong, penulis dapat
 * koin, koin jadi rupiah — beserta satu contoh yang angkanya nyata.
 */
export const PayoutRateSchema = z.object({
  coinRateRupiah: z.number().int().positive(),
  authorSharePct: z.number().int().min(0).max(100),
  platformSharePct: z.number().int().min(0).max(100),
  feeRupiah: z.number().int().nonnegative(),
  minRupiah: z.number().int().positive(),
  /** Contoh perhitungan dari satu bab berbayar sungguhan milik penulis ini. */
  example: z.object({
    chapterPriceCoins: z.number().int().positive(),
    readerPaysCoins: z.number().int().positive(),
    platformCoins: z.number().int().nonnegative(),
    authorCoins: z.number().int().nonnegative(),
    authorRupiah: z.number().int().nonnegative(),
  }),
})
export type PayoutRate = z.infer<typeof PayoutRateSchema>

/**
 * Rekening tujuan pencairan · FR-EARN-07.
 *
 * Nomornya **tidak pernah dikirim penuh** — server hanya mengirim bentuk
 * tersamar. Yang tidak pernah meninggalkan server tidak bisa bocor dari klien.
 *
 * `payoutVerified` dan `twoFactor` ikut di sini karena keduanya adalah tingkat
 * 4 dan 5 tangga validasi (FR-EARN-11): layar perlu tahu keduanya untuk
 * mematikan tombolnya **sebelum** ditekan.
 */
export const PayoutAccountSchema = z.object({
  bankName: z.string(),
  ownerName: z.string(),
  masked: z.string(),
  payoutVerified: z.boolean(),
  twoFactor: z.boolean(),
})
export type PayoutAccount = z.infer<typeof PayoutAccountSchema>

/** Tiga tujuan pencairan · FR-EARN-07. */
export const PAYOUT_PURPOSES = [
  'Pembayaran pendapatan penulis',
  'Penyelesaian bulanan',
  'Koreksi manual',
] as const
export const PayoutPurposeSchema = z.enum(PAYOUT_PURPOSES)
export type PayoutPurpose = z.infer<typeof PayoutPurposeSchema>

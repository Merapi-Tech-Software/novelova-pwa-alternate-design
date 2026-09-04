import { z } from 'zod'
import { ONBOARDING_GENRES_MAX, PASSWORD_MIN } from '@/lib/limits'
import { IdSchema, IsoDateTimeSchema } from './common'

/** prd_10 · prd_02 · FR-STUDIO-33 */

export const UserSchema = z.object({
  id: IdSchema,
  displayName: z.string().min(1),
  username: z.string().min(1),
  avatarUrl: z.string().nullable(),
  role: z.enum(['reader', 'author']),
  tier: z.number().int().min(1).max(5),
  joinedYear: z.number().int(),
  penName: z.string().nullable(),
})
export type User = z.infer<typeof UserSchema>

/**
 * Sesi. Token akses hidup **di memori**, refresh token di cookie `HttpOnly` —
 * karena itu `refreshToken` tidak pernah muncul di kontrak ini (FR-AUTH-12).
 */
export const SessionSchema = z.object({
  user: UserSchema,
  accessToken: z.string().min(1),
  expiresAt: IsoDateTimeSchema,
})
export type Session = z.infer<typeof SessionSchema>

/**
 * **Satu kolom identitas menerima email maupun nomor HP** (FR-AUTH-01), supaya
 * pengguna tidak perlu memilih jenis identitasnya lebih dulu. Bentuknya tidak
 * divalidasi di klien: menebak-nebak apakah `081…` itu nomor HP atau email
 * salah ketik hanya menghasilkan penolakan yang keliru — server yang tahu
 * identitas mana yang benar-benar ada.
 */
export const LoginInputSchema = z.object({
  identity: z.string().trim().min(1, 'Masukkan email atau nomor HP.'),
  password: z.string().min(PASSWORD_MIN, `Kata sandi minimal ${PASSWORD_MIN} karakter.`),
  remember: z.boolean().default(false),
})
export type LoginInput = z.infer<typeof LoginInputSchema>

/**
 * Pendaftaran · FR-AUTH-05. Nomor HP **opsional**, dan persetujuan ketentuan
 * ikut ke server: dasar hukum pemakaian data tidak boleh hanya hidup sebagai
 * centang di layar yang dibuang setelah submit (FR-AUTH-07).
 */
export const RegisterInputSchema = z.object({
  displayName: z.string().trim().min(1, 'Isi nama tampilan.'),
  email: z.email('Format email tidak valid.'),
  phone: z.string().trim().optional(),
  password: z.string().min(PASSWORD_MIN, `Kata sandi minimal ${PASSWORD_MIN} karakter.`),
  acceptedTerms: z.literal(true),
})
export type RegisterInput = z.infer<typeof RegisterInputSchema>

/**
 * Preferensi pembaca dari onboarding · FR-AUTH-11.
 *
 * Ada di server, bukan di `stores/`: preferensi ini harus ikut saat pengguna
 * berganti perangkat, dan "onboarding sudah pernah dijalani" yang hanya hidup
 * di satu peramban berarti pengguna mengulanginya di setiap perangkat baru
 * (FR-CORE-01).
 *
 * `genres` **mengurutkan**, tidak menyaring. Seluruh katalog tetap terbuka.
 */
export const ReaderPrefsSchema = z.object({
  userId: IdSchema,
  genres: z.array(z.string()).max(ONBOARDING_GENRES_MAX),
  /**
   * Cerita yang disembunyikan pembaca lewat aksi geser (FR-HOME-14). Di server,
   * bukan di perangkat: yang sudah ditolak sekali tidak boleh muncul lagi hanya
   * karena pengguna berganti ponsel.
   */
  hiddenStoryIds: z.array(IdSchema).default([]),
  /** `null` = belum pernah. Melewati onboarding juga mengisinya. */
  onboardedAt: IsoDateTimeSchema.nullable(),
})
export type ReaderPrefs = z.infer<typeof ReaderPrefsSchema>

/** Jawaban permintaan reset · FR-AUTH-08. */
export const ResetRequestSchema = z.object({
  /** Identitas apa adanya, atau frasa pengganti bila kolomnya dikosongkan. */
  sentTo: z.string(),
  expiresInMinutes: z.number().int().positive(),
})
export type ResetRequest = z.infer<typeof ResetRequestSchema>

/**
 * Tiga tingkat penulis, bukan satu sakelar (FR-STUDIO-33).
 * `registered` boleh menulis dan menerbitkan gratis; hanya `verified` boleh
 * menetapkan bab berbayar dan mencairkan — uang hanya mengalir ke identitas
 * yang sudah diperiksa.
 */
export const AuthorTierSchema = z.enum(['none', 'registered', 'verified'])
export type AuthorTier = z.infer<typeof AuthorTierSchema>

export const AuthorProfileSchema = z.object({
  userId: IdSchema,
  tier: AuthorTierSchema,
  payoutVerified: z.boolean(),
  twoFactor: z.boolean(),
  termsAcceptedAt: IsoDateTimeSchema.nullable(),
})
export type AuthorProfile = z.infer<typeof AuthorProfileSchema>

/**
 * Visibilitas profil publik — **disimpan di server** (FR-PROF-10).
 * Nilai di `localStorage` hanyalah cermin lokal; kalau keduanya berbeda, server
 * yang benar. Mematikan kategori menghilangkan tab-nya sepenuhnya dari profil
 * publik, bukan mengosongkannya.
 */
export const PrivacySettingsSchema = z.object({
  userId: IdSchema,
  readingActivity: z.boolean(),
  library: z.boolean(),
  reviews: z.boolean(),
  wallet: z.boolean(),
})
export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>

export const LocaleSettingsSchema = z.object({
  userId: IdSchema,
  uiLang: z.string(),
  translationPriority: z.string(),
  contentRegion: z.string(),
  currency: z.enum(['IDR', 'USD']),
  timezone: z.string(),
})
export type LocaleSettings = z.infer<typeof LocaleSettingsSchema>

export const FollowSchema = z.object({
  followerId: IdSchema,
  followeeId: IdSchema,
  createdAt: IsoDateTimeSchema,
})
export type Follow = z.infer<typeof FollowSchema>

/** Satu baris di daftar pengikut / mengikuti / hasil pencarian pengguna. */
export const UserRowSchema = UserSchema.extend({
  /** `"412 bab tahun ini"` — atau `null` bila pengguna menyembunyikan aktivitasnya. */
  activity: z.string().nullable(),
  isFollowing: z.boolean(),
})
export type UserRowData = z.infer<typeof UserRowSchema>

/** Sesi aktif di perangkat lain. FR-SET-03. */
export const DeviceSessionSchema = z.object({
  id: IdSchema,
  device: z.string(),
  location: z.string(),
  lastActiveAt: IsoDateTimeSchema,
  current: z.boolean(),
})
export type DeviceSession = z.infer<typeof DeviceSessionSchema>

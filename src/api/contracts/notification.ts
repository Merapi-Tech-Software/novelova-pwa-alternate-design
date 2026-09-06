import { z } from 'zod'
import { IdSchema, IsoDateTimeSchema } from './common'

/** prd_11 · FR-NOTIF-* */

/**
 * **Saringan** di pusat notifikasi · FR-NOTIF-01. Lima tab: Semua + keempat ini.
 *
 * Sengaja **bukan** daftar jenisnya: jenis ada sebelas (`NotifKind`), dan
 * sebelas tab tidak muat di 320px. Pemetaan jenis → saringan hidup di
 * `lib/notif.ts`, satu tabel yang dibaca layar **dan** server-mock.
 */
export const NotifTypeSchema = z.enum(['cerita', 'dompet', 'hadiah', 'sistem'])
export type NotifType = z.infer<typeof NotifTypeSchema>

/**
 * **Sebelas jenis notifikasi** · FR-NOTIF-02 — satu baris per baris tabel PRD.
 *
 * Masing-masing punya pemicu yang **sudah ada di aplikasi** dan tujuan buka yang
 * spesifik; tidak ada notifikasi yang hanya bisa dibaca. Jenisnya disimpan
 * (bukan diturunkan dari `deepLink`) karena tiga hal bergantung padanya dan
 * ketiganya harus sepakat: ikon barisnya, saringan mana yang memuatnya, dan
 * kelompok preferensi mana yang bisa mematikannya.
 */
export const NotifKindSchema = z.enum([
  'bab-baru',
  'bab-terjadwal',
  'cerita-terjadwal',
  'cetak-status',
  'topup',
  'checkin',
  'voucher-kedaluwarsa',
  'ulasan-komentar',
  'pengikut-baru',
  'penarikan',
  'keamanan',
])
export type NotifKind = z.infer<typeof NotifKindSchema>

/**
 * **Empat kelompok preferensi** · FR-NOTIF-04.
 *
 * Berbeda dari `NotifType`, dan perbedaannya disengaja: saringan menjawab *"apa
 * yang ingin saya lihat sekarang"*, kelompok preferensi menjawab *"apa yang
 * boleh mengganggu saya"*. Notifikasi penarikan disaring sebagai **Dompet**
 * tetapi dimatikan bersama **Karya saya** — dan menyatukan kedua sumbu itu
 * memaksa salah satunya salah.
 */
export const NotifPrefGroupSchema = z.enum(['cerita', 'dompetHadiah', 'karya', 'sistem'])
export type NotifPrefGroup = z.infer<typeof NotifPrefGroupSchema>

export const NotificationSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  kind: NotifKindSchema,
  type: NotifTypeSchema,
  title: z.string(),
  body: z.string(),
  /**
   * **Setiap notifikasi punya tujuan** (FR-NOTIF-02) — tidak ada yang hanya bisa
   * dibaca. Push memakai rute yang sama sebagai deep link.
   */
  deepLink: z.string().min(1),
  /** Notifikasi sejenis digabung: *"3 bab baru di …"* (FR-NOTIF-03). */
  groupKey: z.string().nullable(),
  groupCount: z.number().int().positive(),
  readAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
})
export type Notification = z.infer<typeof NotificationSchema>

export const NotifChannelSchema = z.object({
  inApp: z.boolean(),
  push: z.boolean(),
  email: z.boolean(),
})
export type NotifChannel = z.infer<typeof NotifChannelSchema>

/**
 * Preferensi per **kelompok**, tiga kanal masing-masing · FR-NOTIF-04.
 *
 * Kanal keamanan terkunci `true` untuk Dalam aplikasi dan Push — pengguna tidak
 * boleh mematikan pemberitahuan masuk dari perangkat baru. Email tetap boleh
 * dimatikan: ia bukan jalur peringatannya, ia salinannya.
 */
export const NotificationPrefsSchema = z.object({
  userId: IdSchema,
  cerita: NotifChannelSchema,
  dompetHadiah: NotifChannelSchema,
  karya: NotifChannelSchema,
  sistem: NotifChannelSchema.extend({
    inApp: z.literal(true),
    push: z.literal(true),
  }),
  quietHours: z.object({
    enabled: z.boolean(),
    from: z.number().int().min(0).max(23),
    to: z.number().int().min(0).max(23),
  }),
})
export type NotificationPrefs = z.infer<typeof NotificationPrefsSchema>

export const NotifParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(20),
  type: NotifTypeSchema.optional(),
  unreadOnly: z.boolean().default(false),
})
export type NotifParams = z.infer<typeof NotifParamsSchema>

export const PushSubscriptionSchema = z.object({
  userId: IdSchema,
  endpoint: z.string(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
  createdAt: IsoDateTimeSchema,
})
export type PushSubscriptionRecord = z.infer<typeof PushSubscriptionSchema>

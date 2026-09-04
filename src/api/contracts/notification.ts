import { z } from 'zod'
import { IdSchema, IsoDateTimeSchema } from './common'

/** prd_11 · FR-NOTIF-* */

export const NotifTypeSchema = z.enum(['cerita', 'dompet', 'hadiah', 'sistem'])
export type NotifType = z.infer<typeof NotifTypeSchema>

export const NotificationSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
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

const ChannelSchema = z.object({
  inApp: z.boolean(),
  push: z.boolean(),
  email: z.boolean(),
})

/**
 * Preferensi per jenis. Kanal **keamanan terkunci `true`** — pengguna tidak
 * boleh mematikan pemberitahuan masuk dari perangkat baru (FR-NOTIF-04).
 */
export const NotificationPrefsSchema = z.object({
  userId: IdSchema,
  cerita: ChannelSchema,
  dompet: ChannelSchema,
  hadiah: ChannelSchema,
  sistem: ChannelSchema.extend({
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

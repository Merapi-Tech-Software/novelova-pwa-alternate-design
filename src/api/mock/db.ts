import Dexie, { type EntityTable } from 'dexie'
import type {
  AdQuota,
  AuthorProfile,
  Block,
  ChapterContent,
  ChapterSummary,
  Comment,
  DeviceSession,
  Follow,
  LibraryEntry,
  LocaleSettings,
  Notification,
  NotificationPrefs,
  Ownership,
  PayMethod,
  PrintOrder,
  PrivacySettings,
  Rating,
  ReaderPrefs,
  ReadingProgress,
  Review,
  ReviewQueueItem,
  Reward,
  ScheduleEntry,
  Story,
  TopupOrder,
  Transaction,
  User,
  Voucher,
  Wallet,
  Withdrawal,
} from '../contracts'

/**
 * Skema server tiruan.
 *
 * **Dexie ada di sisi server dari seam, bukan sisi klien** (architecture.md §5).
 * Yang disimpan di sini adalah data yang *seharusnya* hidup di server, dan ia
 * dibaca hanya oleh `api/mock/`. Aturan lint di `biome.json` menolak `import
 * 'dexie'` dari mana pun di luar folder ini — kalau aturan itu perlu dilonggarkan,
 * seam-nya sudah bocor dan janji "ganti satu folder" batal.
 */

/** Catatan idempotency: kunci → hasil yang sudah pernah dikembalikan. */
export interface IdempotencyRecord {
  key: string
  operation: string
  resultJson: string
  createdAt: string
}

/** Percobaan masuk per perangkat — dasar AUTH-429 (5 gagal → tahan 15 menit). */
export interface LoginAttempt {
  id: string
  deviceId: string
  failedAt: string
}

/** Kunci-nilai untuk hal tunggal: sesi aktif, versi seed, dsb. */
export interface KeyValue {
  key: string
  value: unknown
}

export class NovelovaDb extends Dexie {
  // katalog
  users!: EntityTable<User, 'id'>
  stories!: EntityTable<Story, 'id'>
  chapters!: EntityTable<ChapterSummary, 'id'>
  chapterContents!: EntityTable<ChapterContent & { id: string }, 'id'>

  // kepemilikan & progres — milik server (FR-CORE-01)
  ownerships!: EntityTable<Ownership & { id: string }, 'id'>
  libraryEntries!: EntityTable<LibraryEntry & { id: string }, 'id'>
  progress!: EntityTable<ReadingProgress & { id: string }, 'id'>

  // dompet
  wallets!: EntityTable<Wallet, 'userId'>
  transactions!: EntityTable<Transaction, 'id'>
  topupOrders!: EntityTable<TopupOrder, 'id'>
  payMethods!: EntityTable<PayMethod, 'id'>
  adQuotas!: EntityTable<AdQuota & { id: string }, 'id'>

  // sosial
  ratings!: EntityTable<Rating & { id: string }, 'id'>
  reviews!: EntityTable<Review, 'id'>
  comments!: EntityTable<Comment, 'id'>
  reactions!: EntityTable<
    { id: string; userId: string; targetType: string; targetId: string },
    'id'
  >
  /**
   * Laporan pengguna · FR-SOCIAL-07. `status` dipakai antrean tinjauan Fase 8f,
   * dan `targetType` memisahkan laporan cerita dari komentar yang kebetulan
   * ber-id sama.
   */
  reports!: EntityTable<
    {
      id: string
      reporterId: string
      targetType: 'story' | 'review' | 'comment' | 'user'
      targetId: string
      reason: string
      note: string
      status: 'open' | 'resolved'
      createdAt: string
    },
    'id'
  >
  blocks!: EntityTable<Block & { id: string }, 'id'>

  // notifikasi
  notifications!: EntityTable<Notification, 'id'>
  notificationPrefs!: EntityTable<NotificationPrefs, 'userId'>

  // studio & penghasilan
  authorProfiles!: EntityTable<AuthorProfile, 'userId'>
  printOrders!: EntityTable<PrintOrder, 'id'>
  scheduleEntries!: EntityTable<ScheduleEntry, 'id'>
  reviewQueue!: EntityTable<ReviewQueueItem, 'id'>
  withdrawals!: EntityTable<Withdrawal, 'id'>

  // hadiah
  rewards!: EntityTable<Reward, 'userId'>
  vouchers!: EntityTable<Voucher, 'id'>

  // profil & pengaturan
  follows!: EntityTable<Follow & { id: string }, 'id'>
  privacySettings!: EntityTable<PrivacySettings, 'userId'>
  readerPrefs!: EntityTable<ReaderPrefs, 'userId'>
  localeSettings!: EntityTable<LocaleSettings, 'userId'>
  deviceSessions!: EntityTable<DeviceSession, 'id'>

  // infrastruktur server tiruan
  idempotency!: EntityTable<IdempotencyRecord, 'key'>
  loginAttempts!: EntityTable<LoginAttempt, 'id'>
  kv!: EntityTable<KeyValue, 'key'>

  constructor() {
    super('novelova')

    // Indeks majemuk ada di tempat yang benar-benar disaring: kepemilikan per
    // pengguna, transaksi per tanggal, notifikasi per jenis. Daftar besar
    // disaring di sini, bukan di DOM (architecture.md §5 aturan 6).
    this.version(1).stores({
      users: 'id, username, role',
      stories: 'id, authorId, status, review, updatedAt, *genres, *tags',
      chapters: 'id, storyId, [storyId+number], state, access',
      chapterContents: 'id, [chapterId+lang]',

      ownerships: 'id, userId, chapterId, [userId+chapterId]',
      libraryEntries: 'id, userId, storyId, [userId+storyId], savedAt',
      progress: 'id, userId, storyId, [userId+storyId], updatedAt',

      wallets: 'userId',
      transactions: 'id, userId, kind, status, createdAt, [userId+createdAt]',
      topupOrders: 'id, userId, status, expiresAt, idempotencyKey',
      payMethods: 'id, type',
      adQuotas: 'id, [userId+date]',

      ratings: 'id, userId, storyId, [userId+storyId]',
      reviews: 'id, storyId, userId, [storyId+userId], createdAt',
      comments: 'id, chapterId, userId, parentId, createdAt',
      reactions: 'id, [userId+targetType+targetId]',
      reports: 'id, reporterId, targetId',
      blocks: 'id, [userId+blockedUserId]',

      notifications: 'id, userId, type, readAt, createdAt, groupKey',
      notificationPrefs: 'userId',

      authorProfiles: 'userId, tier',
      printOrders: 'id, userId, storyId, status, kind, createdAt',
      scheduleEntries: 'id, storyId, publishAtUtc, kind',
      reviewQueue: 'id, kind, status',
      withdrawals: 'id, userId, status, requestedAt',

      rewards: 'userId',
      vouchers: 'id, code, ownerId, expiresAt',

      follows: 'id, followerId, followeeId, [followerId+followeeId]',
      privacySettings: 'userId',
      localeSettings: 'userId',
      deviceSessions: 'id, current',

      idempotency: 'key, operation, createdAt',
      loginAttempts: 'id, deviceId, failedAt',
      kv: 'key',
    })

    // Preferensi onboarding datang belakangan (Fase 2). Versi baru, bukan
    // menyunting versi 1: peramban yang sudah memegang database lama harus bisa
    // ikut naik tanpa kehilangan isinya.
    this.version(2).stores({ readerPrefs: 'userId' })
  }
}

export const db = new NovelovaDb()

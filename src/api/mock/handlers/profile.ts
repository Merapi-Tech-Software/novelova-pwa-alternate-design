import { todayLocalISO } from '@/lib/date'
import {
  DELETION_GRACE_DAYS,
  pointsFor,
  SECURITY_FACTORS,
  type SecurityFacts,
  STALE_SESSION_DAYS,
  securityLevel,
  securityScore,
} from '@/lib/security'
import type { NovelovaApi } from '../../client'
import type {
  DataExport,
  DeletionCheck,
  DeviceSession,
  ExportCategory,
  ListParams,
  Paged,
  PrivacySettings,
  ProfileUpdateInput,
  PublicProfile,
  PublicProfileTab,
  SecurityOverview,
  SecurityTip,
  UserRowData,
  WeeklyRecap,
} from '../../contracts'
import { ApiError, INTERNAL_CODES } from '../../errors'
import { db } from '../db'
import { currentUserId } from './session'

/**
 * Profil, koneksi, privasi, keamanan · FR-PROF-* · FR-SET-*.
 *
 * Tiga aturan yang membentuk seluruh berkas ini:
 *
 * 1. **Privasi disimpan di server** (FR-PROF-10, FR-CORE-01). Ia harus berlaku
 *    di semua perangkat dan tidak boleh hilang karena data peramban dibersihkan.
 * 2. **Sakelar yang mati menghapus tabnya**, bukan mengosongkannya. Karena itu
 *    daftar tab dikirim server — layar yang menyaring sendiri akan merender tab
 *    yang isinya tidak pernah datang.
 * 3. **Dompet tidak pernah tampil di profil orang lain**, apa pun nilai
 *    sakelarnya. Itu aturan platform, bukan preferensi, jadi ia dijepit di sini
 *    dan bukan diserahkan ke layar.
 */

const DAY = 86_400_000

async function privacyOf(userId: string): Promise<PrivacySettings> {
  const saved = await db.privacySettings.get(userId)
  return saved ?? { userId, readingActivity: true, library: true, reviews: true, wallet: false }
}

async function userOf(userId: string) {
  const user = await db.users.get(userId)
  if (!user) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Pengguna ini tidak ada.')
  return user
}

/** Ringkasan aktivitas satu baris, atau `null` bila ia menyembunyikannya. */
async function activityLineOf(userId: string): Promise<string | null> {
  const privacy = await privacyOf(userId)
  if (!privacy.readingActivity) return null

  const rows = await db.progress.where('userId').equals(userId).toArray()
  const bab = rows.reduce((sum, r) => sum + r.finishedChapterIds.length, 0)
  return bab === 0 ? 'Belum ada bab selesai' : `${bab} bab selesai`
}

async function toRow(userId: string, viewerId: string): Promise<UserRowData> {
  const user = await userOf(userId)
  const follows = await db.follows.toArray()
  return {
    ...user,
    activity: await activityLineOf(userId),
    isFollowing: follows.some((f) => f.followerId === viewerId && f.followeeId === userId),
  }
}

export const profileHandlers: Pick<
  NovelovaApi,
  | 'listConnections'
  | 'toggleFollowUser'
  | 'getPrivacySettings'
  | 'setPrivacySettings'
  | 'updateProfile'
  | 'getPublicProfile'
  | 'getWeeklyRecap'
  | 'getSecurityOverview'
  | 'clearReadingHistory'
  | 'getDeletionCheck'
  | 'requestDataExport'
  | 'requestAccountDeletion'
  | 'listDeviceSessions'
  | 'revokeDeviceSession'
> = {
  /**
   * Pengikut / mengikuti · FR-PROF-09.
   *
   * Mencari dan memaginasi **di sini**. Daftar yang disaring di layar berhenti
   * benar begitu ada halaman kedua — dan halaman kedua muncul di 21 baris.
   */
  async listConnections(
    kind: 'followers' | 'following',
    params: ListParams,
  ): Promise<Paged<UserRowData>> {
    const me = currentUserId()
    const follows = await db.follows.toArray()

    const ids =
      kind === 'followers'
        ? follows.filter((f) => f.followeeId === me).map((f) => f.followerId)
        : follows.filter((f) => f.followerId === me).map((f) => f.followeeId)

    let rows = await Promise.all([...new Set(ids)].map((id) => toRow(id, me)))

    const q = params.q?.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (r) => r.displayName.toLowerCase().includes(q) || r.username.toLowerCase().includes(q),
      )
    }

    const start = (params.page - 1) * params.pageSize
    const items = rows.slice(start, start + params.pageSize)
    return {
      items,
      total: rows.length,
      page: params.page,
      pageSize: params.pageSize,
      hasMore: start + items.length < rows.length,
    }
  },

  async toggleFollowUser(userId: string): Promise<{ following: boolean }> {
    const me = currentUserId()
    if (userId === me) {
      throw new ApiError(INTERNAL_CODES.VALIDATION, 'Tidak bisa mengikuti diri sendiri.')
    }
    const existing = await db.follows.where('[followerId+followeeId]').equals([me, userId]).first()

    if (existing) {
      await db.follows.delete(`${me}-${userId}`)
      return { following: false }
    }
    await db.follows.put({
      id: `${me}-${userId}`,
      followerId: me,
      followeeId: userId,
      createdAt: new Date().toISOString(),
    })
    return { following: true }
  },

  async getPrivacySettings(): Promise<PrivacySettings> {
    return privacyOf(currentUserId())
  },

  /**
   * Simpan privasi · FR-PROF-10.
   *
   * **Dompet dipaksa `false` di server.** Menyalakannya di layar minta
   * konfirmasi, tetapi yang benar-benar menahannya ada di sini: aturan platform
   * yang hanya dijaga layar adalah aturan yang bisa dilewati satu permintaan.
   */
  async setPrivacySettings(settings: PrivacySettings): Promise<PrivacySettings> {
    const userId = currentUserId()
    const next: PrivacySettings = { ...settings, userId, wallet: false }
    await db.privacySettings.put(next)
    return next
  },

  async updateProfile(input: ProfileUpdateInput): Promise<UserRowData> {
    const userId = currentUserId()
    const nama = input.displayName.trim()
    if (nama === '') {
      throw new ApiError(INTERNAL_CODES.VALIDATION, 'Nama tampilan wajib diisi.')
    }

    const user = await userOf(userId)
    await db.users.put({
      ...user,
      displayName: nama,
      username: input.username.trim() || user.username,
      avatarUrl: input.avatarUrl,
    })

    const author = await db.authorProfiles.get(userId)
    if (author) await db.authorProfiles.put(author)

    return toRow(userId, userId)
  },

  async getPublicProfile(userId: string): Promise<PublicProfile> {
    const me = currentUserId()
    const privacy = await privacyOf(userId)
    const row = await toRow(userId, me)
    const follows = await db.follows.toArray()

    const tabs: PublicProfileTab[] = []
    if (privacy.readingActivity) tabs.push('activity')
    if (privacy.library) tabs.push('books')
    if (privacy.reviews) tabs.push('reviews')

    const progressRows = await db.progress.where('userId').equals(userId).toArray()

    // Isi tiap tab hanya diambil bila tabnya memang ada. Mengirim isi untuk tab
    // yang disembunyikan berarti data pribadi tetap sampai ke klien — dan
    // "disembunyikan di layar" bukan disembunyikan.
    const activity = privacy.readingActivity
      ? progressRows
          .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
          .slice(0, 5)
          .map((r) => ({
            id: `${r.userId}-${r.storyId}`,
            text: `${r.finishedChapterIds.length} bab selesai`,
            at: r.updatedAt,
          }))
      : []

    const books = privacy.library
      ? await Promise.all(
          (await db.libraryEntries.where('userId').equals(userId).toArray())
            .filter((e) => !e.removed)
            .slice(0, 6)
            .map(async (e) => {
              const story = await db.stories.get(e.storyId)
              return {
                storyId: e.storyId,
                title: story?.title ?? 'Cerita',
                coverUrl: story?.coverUrl ?? null,
              }
            }),
        )
      : []

    const reviews = privacy.reviews
      ? await Promise.all(
          (await db.reviews.toArray())
            .filter((r) => r.userId === userId)
            .slice(0, 5)
            .map(async (r) => {
              const story = await db.stories.get(r.storyId)
              return {
                id: r.id,
                storyTitle: story?.title ?? 'Cerita',
                stars: r.stars,
                text: r.text,
              }
            }),
        )
      : []

    return {
      user: row,
      followerCount: follows.filter((f) => f.followeeId === userId).length,
      followingCount: follows.filter((f) => f.followerId === userId).length,
      storiesRead: progressRows.filter((r) => r.finishedChapterIds.length > 0).length,
      tabs,
      activity,
      books,
      reviews,
      visibility: {
        readingActivity: privacy.readingActivity,
        library: privacy.library,
        reviews: privacy.reviews,
        // Aturan platform, bukan preferensi — dijepit di tipenya juga.
        wallet: false,
      },
    }
  },

  /** Rekap tujuh hari · FR-PROF-02. Diturunkan dari tanggal selesai per bab. */
  async getWeeklyRecap(): Promise<WeeklyRecap> {
    const userId = currentUserId()
    const rows = await db.progress.where('userId').equals(userId).toArray()

    const batas = (n: number) => todayLocalISO(new Date(Date.now() - n * DAY))
    const mingguIni = batas(7)
    const mingguLalu = batas(14)

    let chapters = 0
    let minutes = 0
    let sebelumnya = 0
    const cerita = new Set<string>()

    for (const row of rows) {
      for (const [chapterId, tanggal] of Object.entries(row.finishedAt ?? {})) {
        if (tanggal >= mingguIni) {
          chapters += 1
          cerita.add(row.storyId)
          minutes += (await db.chapters.get(chapterId))?.readMinutes ?? 0
        } else if (tanggal >= mingguLalu) {
          sebelumnya += 1
        }
      }
    }

    // Nol lawan nol adalah nol, bukan 100% — pola `pct()` yang sama dengan
    // analitik penghasilan (`architecture.md` §1.30).
    const changePct =
      sebelumnya === 0
        ? chapters === 0
          ? 0
          : 100
        : Math.round(((chapters - sebelumnya) / sebelumnya) * 100)

    return { chapters, minutes, stories: cerita.size, changePct }
  },

  async listDeviceSessions(): Promise<DeviceSession[]> {
    return (await db.deviceSessions.toArray()).sort(
      (a, b) => Date.parse(b.lastActiveAt) - Date.parse(a.lastActiveAt),
    )
  },

  /**
   * Mencabut sesi · FR-SET-03 · FR-AUTH-12.
   *
   * **Sesi saat ini tidak bisa dicabut dari sini** — untuk itu ada Keluar, dan
   * tombol yang mengeluarkan pengguna dari daftar perangkat adalah tombol yang
   * ditekan tanpa sengaja.
   */
  async revokeDeviceSession(sessionId: string | 'all-others'): Promise<void> {
    const rows = await db.deviceSessions.toArray()
    if (sessionId === 'all-others') {
      await db.deviceSessions.bulkDelete(rows.filter((s) => !s.current).map((s) => s.id))
      return
    }
    const target = rows.find((s) => s.id === sessionId)
    if (!target) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Sesi ini tidak ada.')
    if (target.current) {
      throw new ApiError(
        INTERNAL_CODES.CONFLICT,
        'Sesi yang sedang kamu pakai tidak bisa dicabut dari sini. Pakai Keluar.',
      )
    }
    await db.deviceSessions.delete(sessionId)
  },

  /**
   * Skor keamanan · FR-SET-02.
   *
   * **Dihitung dari faktor nyata**, bukan angka contoh: 2FA dan verifikasi
   * pencairan dari `authorProfiles`, sesi dari tabelnya sendiri. Saran ikut
   * lahir dari keadaan yang sama, jadi tidak mungkin ada saran yang menyarankan
   * sesuatu yang sudah menyala.
   */
  async getSecurityOverview(): Promise<SecurityOverview> {
    const userId = currentUserId()
    const author = await db.authorProfiles.get(userId)
    const sessions = await db.deviceSessions.toArray()

    const basi = sessions.filter(
      (s) => !s.current && Date.now() - Date.parse(s.lastActiveAt) > STALE_SESSION_DAYS * DAY,
    )

    const facts: SecurityFacts = {
      password: true,
      twoFactor: author?.twoFactor ?? false,
      loginAlerts: true,
      recovery: author?.payoutVerified ?? false,
      sessions: basi.length === 0,
    }

    const score = securityScore(facts)
    const tips: SecurityTip[] = []

    if (!facts.twoFactor) {
      tips.push({
        id: 'twoFactor',
        title: 'Nyalakan verifikasi dua langkah',
        body: 'Satu langkah tambahan saat masuk dari perangkat baru.',
        points: pointsFor('twoFactor'),
        actionLabel: 'Nyalakan',
        actionLink: null,
      })
    }
    if (basi.length > 0) {
      tips.push({
        id: 'sessions',
        title: `${basi.length} sesi tidak aktif lebih dari ${STALE_SESSION_DAYS} hari`,
        body: 'Cabut yang sudah tidak kamu pakai.',
        points: pointsFor('sessions'),
        actionLabel: 'Tinjau sesi',
        actionLink: null,
      })
    }
    if (!facts.recovery) {
      tips.push({
        id: 'recovery',
        title: 'Kontak pemulihan belum terverifikasi',
        body: 'Tanpa itu, akun yang terkunci sulit dikembalikan.',
        points: pointsFor('recovery'),
        actionLabel: 'Verifikasi',
        actionLink: null,
      })
    }

    return {
      score,
      level: securityLevel(score),
      factors: SECURITY_FACTORS.map((f) => ({
        id: f.id,
        label: f.label,
        weight: f.weight,
        met: facts[f.id],
      })),
      tips,
      sessions: sessions.sort((a, b) => Date.parse(b.lastActiveAt) - Date.parse(a.lastActiveAt)),
    }
  },

  /**
   * Hapus riwayat membaca · FR-SET-05.
   *
   * **Perpustakaan tidak ikut**, dan itu bedanya dari prototipe: rak adalah
   * pilihan pembaca, riwayat adalah jejaknya. Menghapus jejak tidak boleh
   * mengosongkan pilihan.
   */
  async clearReadingHistory(): Promise<void> {
    const userId = currentUserId()
    await db.progress.where('userId').equals(userId).delete()
  },

  async getDeletionCheck(): Promise<DeletionCheck> {
    const userId = currentUserId()
    const blockers: string[] = []

    const penarikan = (await db.withdrawals.toArray()).filter(
      (w) => w.userId === userId && (w.status === 'submitted' || w.status === 'review'),
    )
    if (penarikan.length > 0) {
      blockers.push(
        `${penarikan.length} pengajuan pencairan masih diproses. Tunggu sampai selesai atau batalkan dulu.`,
      )
    }

    const cetak = (await db.printOrders.toArray()).filter(
      (o) => o.userId === userId && o.status !== 'received' && o.status !== 'cancelled',
    )
    if (cetak.length > 0) {
      blockers.push(`${cetak.length} pesanan cetak masih berjalan.`)
    }

    const user = await userOf(userId)
    return {
      allowed: blockers.length === 0,
      blockers,
      consequences: [
        'Saldo koin hangus dan tidak bisa dikembalikan.',
        'Karya yang sudah terbit hilang dari aplikasi, beserta pembacanya.',
        'Penghasilan yang belum dicairkan tidak bisa dicairkan lagi.',
        'Ulasan dan komentarmu ikut terhapus.',
      ],
      graceDays: DELETION_GRACE_DAYS,
      confirmPhrase: user.username,
    }
  },

  /**
   * Ekspor data · FR-SET-05.
   *
   * Diproses **asinkron** — berkasnya belum siap saat permintaannya dijawab,
   * dan pemberitahuan menyusul. Menjanjikan unduhan seketika untuk data yang
   * harus dikumpulkan dari delapan tabel adalah janji yang akan diingkari.
   */
  async requestDataExport(categories: ExportCategory[]): Promise<DataExport> {
    if (categories.length === 0) {
      throw new ApiError(INTERNAL_CODES.VALIDATION, 'Pilih minimal satu kategori.')
    }
    const now = Date.now()
    return {
      id: `exp-${now.toString(36)}`,
      categories,
      status: 'processing',
      requestedAt: new Date(now).toISOString(),
      // Tautan berlaku terbatas · FR-SET-05.
      expiresAt: new Date(now + 7 * DAY).toISOString(),
    }
  },

  async requestAccountDeletion(): Promise<{ purgeAt: string }> {
    const check = await profileHandlers.getDeletionCheck()
    if (!check.allowed) {
      throw new ApiError(INTERNAL_CODES.CONFLICT, check.blockers.join(' '))
    }
    return {
      purgeAt: new Date(Date.now() + DELETION_GRACE_DAYS * DAY).toISOString(),
    }
  },
}

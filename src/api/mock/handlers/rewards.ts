import { todayLocalISO } from '@/lib/date'
import {
  CHECKIN_CYCLE,
  CHECKIN_LADDER,
  REFERRAL_REWARD_COINS,
  stepFor,
  streakStateOf,
  VOUCHER_EXPIRING_DAYS,
} from '@/lib/rewards'
import type { NovelovaApi } from '../../client'
import type {
  CheckInDay,
  Mission,
  Referral,
  Reward,
  RewardHistoryEntry,
  RewardState,
  Voucher,
  VoucherTarget,
} from '../../contracts'
import { ApiError, INTERNAL_CODES } from '../../errors'
import { db } from '../db'
import { currentUserId } from './session'

/**
 * Pusat hadiah · FR-RWD-01..07.
 *
 * **Yang tersimpan hanya yang tidak bisa dihitung ulang** (`RewardState`):
 * streak terakhir, tanggal klaim terakhir, dan penanda klaim misi. Sisanya —
 * kalender tujuh hari, progres misi, ringkasan tiga angka — diturunkan setiap
 * kali dibaca.
 *
 * Itu bukan kerapian; itu yang membuat aturan streak benar **tanpa kerja
 * terjadwal tengah malam**. Streak yang basi tidak perlu dibersihkan, ia cukup
 * tidak dihitung saat dibaca berikutnya (`lib/rewards.ts`).
 */

/** Awal bulan berjalan, waktu lokal — batas "periode berjalan" FR-RWD-01. */
function startOfMonth(): number {
  const at = new Date()
  at.setDate(1)
  at.setHours(0, 0, 0, 0)
  return at.getTime()
}

async function stateOf(userId: string): Promise<RewardState> {
  const stored = await db.rewards.get(userId)
  if (stored) return stored
  return { userId, checkInStreak: 0, lastCheckIn: null, missions: [], referralCode: '' }
}

/**
 * Progres nyata tiap jenis misi · FR-RWD-07.
 *
 * Ketiganya dibaca dari **aktivitas yang sudah tercatat di tempat lain** — bab
 * selesai, ulasan terkirim, iklan ditonton — bukan dari angka yang disimpan di
 * baris misinya. Misi yang menyimpan progresnya sendiri akan tetap 100% pada
 * hari berikutnya, dan itulah persis cacat prototipe yang FR-RWD-07 tutup.
 */
async function progressOf(userId: string, today: string): Promise<Record<string, number>> {
  const progressRows = await db.progress.where('userId').equals(userId).toArray()
  const babHariIni = progressRows.reduce(
    (sum, row) => sum + Object.values(row.finishedAt ?? {}).filter((d) => d === today).length,
    0,
  )

  const ulasanHariIni = (await db.reviews.toArray()).filter(
    (r) => r.userId === userId && todayLocalISO(new Date(r.editedAt ?? r.createdAt)) === today,
  ).length

  const kuota = await db.adQuotas.where('[userId+date]').equals([userId, today]).first()

  return { read: babHariIni, review: ulasanHariIni, ad: kuota?.used ?? 0 }
}

/** Ke mana tombol "Lanjut" membawa — bab yang benar-benar sedang dibaca. */
async function lanjutBacaLink(userId: string): Promise<string | null> {
  const rows = await db.progress.where('userId').equals(userId).toArray()
  const terbaru = rows
    .filter((r) => r.lastChapterId !== null)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0]
  if (!terbaru?.lastChapterId) return null
  return `/cerita/${terbaru.storyId}/bab/${terbaru.lastChapterId}`
}

/**
 * Apakah syarat buka voucher sudah terpenuhi · FR-RWD-06.
 *
 * Hanya dua bentuk syarat yang benar-benar dipakai data contoh, dan keduanya
 * dijawab di sini — bukan di layar: layar yang menebak sendiri akan
 * menghidupkan tombol yang servernya tolak.
 */
async function terkunci(userId: string, voucher: Voucher, streak: number): Promise<boolean> {
  if (voucher.unlockCond === null) return false

  const syarat = voucher.unlockCond.toLowerCase()
  if (syarat.includes('streak') || syarat.includes('hari ke-7')) return streak < CHECKIN_CYCLE

  const cocok = syarat.match(/(\d+)\s*bab/)
  if (cocok?.[1] && voucher.storyIds[0]) {
    const target = Number.parseInt(cocok[1], 10)
    const row = await db.progress
      .where('[userId+storyId]')
      .equals([userId, voucher.storyIds[0]])
      .first()
    return (row?.finishedChapterIds.length ?? 0) < target
  }
  return true
}

/** Voucher milik pengguna yang masih hidup — belum kedaluwarsa, masih ada jatah. */
async function voucherAktif(userId: string, streak: number): Promise<Voucher[]> {
  const now = Date.now()
  const semua = await db.vouchers.toArray()
  const milik = semua
    .filter((v) => v.ownerId === userId)
    .filter((v) => v.usedCount < v.maxUses)
    .filter((v) => Date.parse(v.expiresAt) > now)
    .sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt))

  return Promise.all(milik.map(async (v) => ({ ...v, locked: await terkunci(userId, v, streak) })))
}

/** Menambah koin **dan** menulis barisnya di buku besar — satu transaksi. */
async function kreditHadiah(
  userId: string,
  coins: number,
  title: string,
  refType: 'checkin' | 'mission',
  refId: string,
): Promise<void> {
  const wallet = await db.wallets.get(userId)
  const now = new Date().toISOString()
  await db.transaction('rw', db.wallets, db.transactions, async () => {
    await db.wallets.put({
      userId,
      balance: (wallet?.balance ?? 0) + coins,
      bonus: wallet?.bonus ?? 0,
      updatedAt: now,
    })
    await db.transactions.add({
      id: `tx-reward-${refType}-${refId}-${Date.now().toString(36)}`,
      userId,
      kind: 'reward',
      amount: coins,
      title,
      refType,
      refId,
      method: 'hadiah',
      status: 'success',
      createdAt: now,
    })
  })
}

export const rewardHandlers: Pick<
  NovelovaApi,
  | 'getRewards'
  | 'claimCheckIn'
  | 'claimMission'
  | 'getReferral'
  | 'listVouchers'
  | 'listVoucherTargets'
  | 'listRewardHistory'
> = {
  async getRewards(): Promise<Reward> {
    const userId = currentUserId()
    const state = await stateOf(userId)
    const today = todayLocalISO()

    const streak = streakStateOf(state.lastCheckIn, state.checkInStreak, today)
    const nyata = await progressOf(userId, today)
    const lanjut = await lanjutBacaLink(userId)

    const missions: Mission[] = state.missions.map((m) => ({
      ...m,
      progress: Math.min(nyata[m.kind] ?? 0, m.target),
      // Klaim kemarin tidak menghalangi klaim hari ini, dan klaim hari ini tidak
      // bisa diulang — keduanya dari tanggal yang sama.
      claimedAt: m.claimedAt && todayLocalISO(new Date(m.claimedAt)) === today ? m.claimedAt : null,
      actionLink: m.kind === 'read' ? (lanjut ?? m.actionLink) : m.actionLink,
    }))

    const checkIn: CheckInDay[] = CHECKIN_LADDER.map((step) => ({
      day: step.day,
      coins: step.coins,
      voucherTitle: step.voucherTitle,
      claimed: step.day <= streak.streak,
      claimable: step.day === streak.nextDay && !streak.claimedToday,
    }))

    const aktif = await voucherAktif(userId, streak.streak)
    const ambang = Date.now() + VOUCHER_EXPIRING_DAYS * 86_400_000

    const sejakAwalBulan = startOfMonth()
    const coinsThisPeriod = (await db.transactions.where('userId').equals(userId).toArray())
      .filter((tx) => tx.kind === 'reward' && tx.status === 'success')
      .filter((tx) => Date.parse(tx.createdAt) >= sejakAwalBulan)
      .reduce((sum, tx) => sum + Math.max(0, tx.amount), 0)

    return {
      ...state,
      checkInStreak: streak.streak,
      missions,
      checkIn,
      claimedToday: streak.claimedToday,
      coinsThisPeriod,
      voucherCount: aktif.length,
      expiringSoon: aktif.filter((v) => Date.parse(v.expiresAt) <= ambang).length,
    }
  },

  /**
   * Klaim check-in · FR-RWD-02 · FR-RWD-07.
   *
   * **Ditolak server**, bukan hanya dicegah tombol nonaktif: prototipe bisa
   * diklaim ulang cukup dengan menyegarkan halaman, dan tombol yang mati di
   * layar tidak menghentikan permintaan yang dikirim langsung.
   */
  async claimCheckIn(): Promise<Reward> {
    const userId = currentUserId()
    const state = await stateOf(userId)
    const today = todayLocalISO()
    const streak = streakStateOf(state.lastCheckIn, state.checkInStreak, today)

    if (streak.claimedToday) {
      throw new ApiError(
        INTERNAL_CODES.CONFLICT,
        'Check-in hari ini sudah kamu klaim. Kembali lagi besok.',
      )
    }

    const step = stepFor(streak.nextDay)

    if (step.coins > 0) {
      await kreditHadiah(userId, step.coins, `Check-in hari ke-${step.day}`, 'checkin', `${today}`)
    }

    // Hari ketujuh membayar **voucher**, bukan koin — dan vouchernya lahir di
    // sini, bukan menunggu ada di seed.
    if (step.voucherTitle !== null) {
      await db.vouchers.put({
        id: `v-streak-${userId}-${today}`,
        code: `STREAK7-${today.replaceAll('-', '')}`,
        ownerId: userId,
        title: step.voucherTitle,
        scope: 'firstN',
        storyIds: [],
        chapterIds: [],
        value: 'free',
        percentOff: null,
        firstN: 5,
        unlockCond: null,
        maxUses: 1,
        usedCount: 0,
        locked: false,
        expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      })
    }

    await db.rewards.put({ ...state, checkInStreak: streak.nextDay, lastCheckIn: today })
    return rewardHandlers.getRewards()
  },

  /**
   * Klaim misi · FR-RWD-03 · FR-RWD-07.
   *
   * Progresnya **dihitung ulang di sini juga**, bukan dipercaya dari layar:
   * misi yang belum selesai tetap ditolak walau tombolnya berhasil ditekan.
   */
  async claimMission(missionId: string): Promise<Reward> {
    const userId = currentUserId()
    const state = await stateOf(userId)
    const today = todayLocalISO()

    const mission = state.missions.find((m) => m.id === missionId)
    if (!mission) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Misi ini tidak ada.')

    if (mission.claimedAt && todayLocalISO(new Date(mission.claimedAt)) === today) {
      throw new ApiError(INTERNAL_CODES.CONFLICT, 'Misi ini sudah kamu klaim hari ini.')
    }

    const nyata = await progressOf(userId, today)
    if ((nyata[mission.kind] ?? 0) < mission.target) {
      throw new ApiError(INTERNAL_CODES.CONFLICT, 'Misi ini belum selesai.')
    }

    await kreditHadiah(userId, mission.rewardCoins, mission.title, 'mission', mission.id)
    await db.rewards.put({
      ...state,
      missions: state.missions.map((m) =>
        m.id === missionId ? { ...m, claimedAt: new Date().toISOString() } : m,
      ),
    })
    return rewardHandlers.getRewards()
  },

  /**
   * Program referral · FR-RWD-04 · FR-RWD-07.
   *
   * Hadiah **hanya dihitung untuk teman yang sudah membaca bab pertamanya**.
   * Yang baru mendaftar tetap ditampilkan — dengan keadaannya — karena syarat
   * yang tidak terlihat terbaca sebagai penolakan sewenang-wenang.
   */
  async getReferral(): Promise<Referral> {
    const userId = currentUserId()
    const state = await stateOf(userId)
    const invites = await db.referralInvites.where('userId').equals(userId).toArray()

    const sah = invites.filter((i) => i.readFirstChapter)
    return {
      code: state.referralCode,
      rewardCoins: REFERRAL_REWARD_COINS,
      condition: 'Setelah temanmu mendaftar dan menyelesaikan bab pertamanya.',
      invites: invites.sort((a, b) => Date.parse(b.joinedAt) - Date.parse(a.joinedAt)),
      earnedCoins: sah.reduce((sum, i) => sum + i.rewardedCoins, 0),
      pendingCount: invites.length - sah.length,
    }
  },

  /** Voucher aktif beserta keadaan terkuncinya · FR-RWD-06. */
  async listVouchers(): Promise<Voucher[]> {
    const userId = currentUserId()
    const state = await stateOf(userId)
    const streak = streakStateOf(state.lastCheckIn, state.checkInStreak, todayLocalISO())
    return voucherAktif(userId, streak.streak)
  },

  /**
   * Cerita tempat sebuah voucher berlaku · FR-RWD-06.
   *
   * Ini yang membuat tombol "Gunakan" berhenti jadi `#`: yang dibuka bukan
   * daftar seluruh katalog, melainkan **cerita yang voucher ini benar-benar
   * bisa dipakai padanya**, beserta berapa bab yang akan terbuka.
   */
  async listVoucherTargets(voucherId: string): Promise<VoucherTarget[]> {
    const userId = currentUserId()
    const voucher = await db.vouchers.get(voucherId)
    if (!voucher) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Voucher tidak ditemukan.')

    // Voucher tanpa daftar cerita berlaku lintas cerita — yang ditawarkan
    // adalah rak pembaca, bukan seluruh katalog: voucher yang menawarkan cerita
    // yang belum pernah dibuka bukan pintasan, itu iklan.
    const storyIds =
      voucher.storyIds.length > 0
        ? voucher.storyIds
        : (await db.libraryEntries.where('userId').equals(userId).toArray())
            .filter((e) => !e.removed)
            .map((e) => e.storyId)

    const owned = new Set(
      (await db.ownerships.where('userId').equals(userId).toArray()).map((o) => o.chapterId),
    )

    const targets: VoucherTarget[] = []
    for (const storyId of storyIds) {
      const story = await db.stories.get(storyId)
      if (!story) continue

      const chapters = (await db.chapters.where('storyId').equals(storyId).toArray())
        .filter((c) => c.state === 'published')
        .sort((a, b) => a.number - b.number)

      const cakupan = chapters
        .filter((c) => (voucher.chapterIds.length > 0 ? voucher.chapterIds.includes(c.id) : true))
        .slice(0, voucher.firstN ?? chapters.length)
        .filter((c) => c.access === 'paid' && !owned.has(c.id))

      if (cakupan.length === 0) continue
      targets.push({
        storyId,
        title: story.title,
        coverUrl: story.coverUrl,
        unlockCount: cakupan.length,
      })
    }
    return targets
  },

  /**
   * Riwayat klaim · FR-RWD-05.
   *
   * **Diturunkan dari buku besar**, bukan tabel kedua — supaya riwayat klaim dan
   * dompet tidak pernah bisa berbeda.
   */
  async listRewardHistory(): Promise<RewardHistoryEntry[]> {
    const userId = currentUserId()
    return (await db.transactions.where('userId').equals(userId).toArray())
      .filter((tx) => tx.kind === 'reward' && tx.status === 'success')
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 20)
      .map((tx) => ({ id: tx.id, title: tx.title, coins: tx.amount, at: tx.createdAt }))
  },
}

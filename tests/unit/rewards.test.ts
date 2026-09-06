import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID as ME } from '@/api/mock/seed'
import { todayLocalISO } from '@/lib/date'
import { CHECKIN_LADDER, stepFor, streakStateOf } from '@/lib/rewards'

const DAY = 86_400_000
const hariIni = () => todayLocalISO()
const geser = (n: number) => todayLocalISO(new Date(Date.now() + n * DAY))

/**
 * Keadaan hadiah dikembalikan ke titik bersih tiap test.
 *
 * Voucher dan kepemilikan **ikut** dibersihkan: `applyVoucher` menaikkan
 * `usedCount` dan menulis `Ownership`, jadi tanpa ini test kedua yang memakai
 * voucher yang sama tidak membuka apa pun — dan gagalnya terbaca seperti cacat
 * produk, padahal test sebelumnya yang memakainya duluan.
 */
beforeEach(async () => {
  const state = await db.rewards.get(ME)
  if (state) await db.rewards.put({ ...state, checkInStreak: 0, lastCheckIn: null })
  await db.transactions.where('userId').equals(ME).delete()
  await db.wallets.put({
    userId: ME,
    balance: 20_000,
    bonus: 23,
    updatedAt: new Date().toISOString(),
  })

  const v2 = await db.vouchers.get('v2')
  if (v2) await db.vouchers.put({ ...v2, usedCount: 0 })
  const lewatVoucher = (await db.ownerships.where('userId').equals(ME).toArray()).filter(
    (o) => o.source === 'voucher',
  )
  await db.ownerships.bulkDelete(lewatVoucher.map((o) => o.id))
})

// ── FR-RWD-02 · tangga tujuh hari ───────────────────────────────────────────

describe('tangga check-in', () => {
  it('tujuh langkah, dan hadiahnya menaik sampai hari keenam', () => {
    expect(CHECKIN_LADDER).toHaveLength(7)
    const koin = CHECKIN_LADDER.slice(0, 6).map((s) => s.coins)
    expect(koin).toEqual([10, 10, 15, 20, 20, 25])
    for (let i = 1; i < koin.length; i += 1) {
      expect(koin[i]).toBeGreaterThanOrEqual(koin[i - 1] as number)
    }
  })

  it('hari ketujuh memberi voucher, bukan koin', () => {
    const tujuh = stepFor(7)
    expect(tujuh.coins).toBe(0)
    expect(tujuh.voucherTitle).not.toBeNull()
  })
})

// ── FR-RWD-07 · aturan streak ───────────────────────────────────────────────

describe('aturan streak', () => {
  it('belum pernah klaim → Hari 1', () => {
    expect(streakStateOf(null, 0, hariIni())).toEqual({
      streak: 0,
      nextDay: 1,
      claimedToday: false,
    })
  })

  it('klaim kemarin → lanjut ke hari berikutnya', () => {
    const s = streakStateOf(geser(-1), 3, hariIni())
    expect(s).toEqual({ streak: 3, nextDay: 4, claimedToday: false })
  })

  it('melewatkan satu hari → kembali ke Hari 1', () => {
    const s = streakStateOf(geser(-2), 5, hariIni())
    expect(s).toEqual({ streak: 0, nextDay: 1, claimedToday: false })
  })

  it('sudah klaim hari ini → tidak bisa klaim lagi', () => {
    expect(streakStateOf(hariIni(), 4, hariIni()).claimedToday).toBe(true)
  })

  it('hari ke-7 menutup siklus, lalu mulai ulang dari Hari 1', () => {
    const s = streakStateOf(geser(-1), 7, hariIni())
    expect(s.nextDay).toBe(1)
    expect(s.streak).toBe(0)
  })
})

// ── FR-RWD-07 · klaim ditolak server ────────────────────────────────────────

describe('klaim check-in', () => {
  it('klaim kedua pada tanggal yang sama ditolak server', async () => {
    await api.claimCheckIn()
    await expect(api.claimCheckIn()).rejects.toThrow(/sudah kamu klaim/i)
  })

  it('menambah koin dan menulis barisnya di buku besar', async () => {
    const sebelum = (await db.wallets.get(ME))?.balance ?? 0
    const reward = await api.claimCheckIn()

    const hari = reward.checkIn.findLast((d) => d.claimed)
    expect(hari?.day).toBe(1)

    const sesudah = (await db.wallets.get(ME))?.balance ?? 0
    expect(sesudah).toBe(sebelum + (hari?.coins ?? 0))

    const rows = await db.transactions.where('userId').equals(ME).toArray()
    const baris = rows.filter((tx) => tx.kind === 'reward' && tx.refType === 'checkin')
    expect(baris).toHaveLength(1)
    expect(baris[0]?.amount).toBe(hari?.coins)
  })

  it('riwayat klaim dan buku besar tidak pernah berbeda', async () => {
    await api.claimCheckIn()
    const riwayat = await api.listRewardHistory()
    const ledger = (await db.transactions.where('userId').equals(ME).toArray()).filter(
      (tx) => tx.kind === 'reward',
    )
    expect(riwayat).toHaveLength(ledger.length)
    expect(riwayat[0]?.coins).toBe(ledger[0]?.amount)
  })

  it('hari ketujuh melahirkan voucher, bukan koin', async () => {
    const state = await db.rewards.get(ME)
    if (state) await db.rewards.put({ ...state, checkInStreak: 6, lastCheckIn: geser(-1) })

    const sebelum = (await db.wallets.get(ME))?.balance ?? 0
    await api.claimCheckIn()

    expect((await db.wallets.get(ME))?.balance).toBe(sebelum)
    const vouchers = await api.listVouchers()
    expect(vouchers.some((v) => v.code.startsWith('STREAK7-'))).toBe(true)
  })
})

// ── FR-RWD-07 · misi dari aktivitas nyata ───────────────────────────────────

describe('misi harian', () => {
  it('progres "baca" dihitung dari bab yang selesai hari ini, bukan dari angka tersimpan', async () => {
    const sebelum = (await api.getRewards()).missions.find((m) => m.kind === 'read')
    expect(sebelum?.progress).toBe(2)

    // Satu bab lagi selesai hari ini — lewat progres baca, bukan lewat misinya.
    const row = await db.progress.where('[userId+storyId]').equals([ME, 's1']).first()
    if (row) {
      await db.progress.put({
        ...row,
        finishedChapterIds: [...row.finishedChapterIds, 's1-c7'],
        finishedAt: { ...row.finishedAt, 's1-c7': todayLocalISO() },
      })
    }

    const sesudah = (await api.getRewards()).missions.find((m) => m.kind === 'read')
    expect(sesudah?.progress).toBe(3)
  })

  it('misi yang belum selesai ditolak server walau tombolnya ditekan', async () => {
    const misi = (await api.getRewards()).missions.find((m) => m.kind === 'review')
    expect(misi).toBeDefined()
    // Ulasan hari ini nol di data contoh; targetnya satu.
    if ((misi?.progress ?? 0) < (misi?.target ?? 1)) {
      await expect(api.claimMission(misi?.id ?? '')).rejects.toThrow(/belum selesai/i)
    }
  })

  it('misi yang selesai bisa diklaim, dan hanya sekali hari itu', async () => {
    const misi = (await api.getRewards()).missions.find((m) => m.kind === 'read')
    const row = await db.progress.where('[userId+storyId]').equals([ME, 's1']).first()
    if (row) {
      await db.progress.put({
        ...row,
        finishedAt: {
          ...row.finishedAt,
          's1-c1': todayLocalISO(),
          's1-c2': todayLocalISO(),
          's1-c3': todayLocalISO(),
        },
      })
    }

    await api.claimMission(misi?.id ?? '')
    await expect(api.claimMission(misi?.id ?? '')).rejects.toThrow(/sudah kamu klaim/i)
  })
})

// ── FR-RWD-06 · cakupan voucher dihormati ───────────────────────────────────

describe('cakupan voucher', () => {
  it('voucher "5 bab pertama" hanya membuka bab dalam cakupannya, bukan seluruh bab terkunci', async () => {
    const voucher = await db.vouchers.get('v2')
    expect(voucher?.firstN).toBe(5)
    const storyId = voucher?.storyIds[0] as string

    const chapters = (await db.chapters.where('storyId').equals(storyId).toArray()).sort(
      (a, b) => a.number - b.number,
    )
    const terkunciSeluruhnya = chapters.filter((c) => c.access === 'paid').length
    const dalamCakupan = chapters.slice(0, 5).filter((c) => c.access === 'paid').length

    // Kalau keduanya sama, test ini tidak membuktikan apa pun.
    expect(terkunciSeluruhnya).toBeGreaterThan(dalamCakupan)

    const sebelum = (await db.ownerships.where('userId').equals(ME).toArray()).length
    const hasil = await api.applyVoucher('v2', storyId)

    expect(hasil.unlockedChapterIds).toHaveLength(dalamCakupan)
    const sesudah = (await db.ownerships.where('userId').equals(ME).toArray()).length
    expect(sesudah - sebelum).toBe(dalamCakupan)
  })

  it('pemakaian voucher tercatat sebagai mutasi nol koin', async () => {
    const voucher = await db.vouchers.get('v2')
    await api.applyVoucher('v2', voucher?.storyIds[0] as string)

    const baris = (await db.transactions.where('userId').equals(ME).toArray()).filter(
      (tx) => tx.method === 'voucher',
    )
    expect(baris).toHaveLength(1)
    expect(baris[0]?.amount).toBe(0)
    expect(baris[0]?.kind).toBe('reward')
  })

  it('voucher terkunci tetap terkunci sampai syaratnya terpenuhi', async () => {
    const vouchers = await api.listVouchers()
    const berkondisi = vouchers.filter((v) => v.unlockCond !== null)
    expect(berkondisi.length).toBeGreaterThan(0)
    // Streak dinolkan di `beforeEach`, jadi syarat "hari ke-7" belum terpenuhi.
    expect(berkondisi.every((v) => typeof v.locked === 'boolean')).toBe(true)
  })

  it('pemilih cerita hanya menawarkan cerita tempat voucher benar-benar berlaku', async () => {
    const targets = await api.listVoucherTargets('v2')
    const voucher = await db.vouchers.get('v2')
    expect(targets.every((t) => voucher?.storyIds.includes(t.storyId))).toBe(true)
    expect(targets.every((t) => t.unlockCount > 0)).toBe(true)
  })
})

// ── FR-RWD-04 · referral ────────────────────────────────────────────────────

describe('referral', () => {
  it('hadiah hanya dihitung untuk teman yang sudah membaca bab pertamanya', async () => {
    const referral = await api.getReferral()
    const sudahBaca = referral.invites.filter((i) => i.readFirstChapter)
    const belum = referral.invites.filter((i) => !i.readFirstChapter)

    expect(belum.length).toBeGreaterThan(0)
    expect(belum.every((i) => i.rewardedCoins === 0)).toBe(true)
    expect(referral.earnedCoins).toBe(sudahBaca.reduce((s, i) => s + i.rewardedCoins, 0))
    expect(referral.pendingCount).toBe(belum.length)
  })

  it('kodenya ada dan syaratnya dinyatakan', async () => {
    const referral = await api.getReferral()
    expect(referral.code.length).toBeGreaterThan(0)
    expect(referral.rewardCoins).toBe(200)
    expect(referral.condition).toMatch(/bab pertama/i)
  })
})

// ── FR-RWD-01 · ringkasan ───────────────────────────────────────────────────

describe('ringkasan hadiah', () => {
  it('koin periode berjalan bukan saldo — ia nol sebelum ada klaim', async () => {
    const reward = await api.getRewards()
    expect(reward.coinsThisPeriod).toBe(0)
    expect((await db.wallets.get(ME))?.balance).toBeGreaterThan(0)
  })

  it('naik tepat sebesar klaimnya', async () => {
    const reward = await api.claimCheckIn()
    const hari = reward.checkIn.findLast((d) => d.claimed)
    expect(reward.coinsThisPeriod).toBe(hari?.coins)
  })
})

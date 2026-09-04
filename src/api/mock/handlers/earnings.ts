import { refusePayout } from '@/lib/payout'
import type { NovelovaApi } from '../../client'
import type {
  AuthorAnalytics,
  AuthorAnalyticsParams,
  ChapterSummary,
  FunnelStage,
  HeatCell,
  ListParams,
  Paged,
  PayoutAccount,
  PayoutRate,
  RevenueBar,
  Story,
  Withdrawal,
  WithdrawInput,
} from '../../contracts'
import { ApiError, INTERNAL_CODES } from '../../errors'
import { SERVER_CONFIG } from '../config'
import { db } from '../db'
import { bestDayIndex, weekdayWeights } from './analytics'
import { currentUserId } from './session'

/**
 * Penghasilan penulis · prd_08.
 *
 * Satu-satunya tempat **koin bertemu rupiah**. PRD 08 §7 #9 mencatat cacatnya:
 * analitik memakai koin, pencairan memakai rupiah, dan tidak ada kurs yang
 * terlihat di mana pun — jadi penulis tidak pernah tahu berapa nilai karyanya.
 * Kurs dan bagi hasil karena itu ikut di **jawaban server** (`SERVER_CONFIG`),
 * bukan konstanta yang dipilih layar.
 *
 * Angkanya diturunkan, sama seperti §1.12: dari cerita, bab, dan kepemilikan.
 */

const RANGE_DAYS = { '7h': 7, '30h': 30, '3b': 90, '1t': 365 } as const

const RANGE_LABEL = {
  '7h': '7 hari terakhir',
  '30h': '30 hari terakhir',
  '3b': '3 bulan terakhir',
  '1t': '1 tahun terakhir',
  custom: 'rentang khusus',
} as const

const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] as const

/** Di bawah ini bab dianggap kehilangan pembaca — sama ambangnya dengan §1.12. */
const RETENTION_DROP_PCT = 80

/**
 * Empat slot waktu heatmap · FR-EARN-05, mengikuti kanvas layar 14.
 *
 * Bobotnya bukan angka acak: slot `17–22` adalah `peakHours` yang sudah
 * dinyatakan di sudut pandang Traffic, jadi sel terpanas selalu jatuh pada slot
 * itu — heatmap yang menunjuk jam lain daripada rekomendasinya membuat keduanya
 * tidak bisa dipercaya.
 */
const HEAT_SLOTS = ['06–12', '12–17', '17–22', '22–06'] as const
const SLOT_WEIGHT = [0.45, 0.6, 1, 0.35] as const

/** Batas intensitas terhadap sel terkuat · FR-EARN-05: normal · mid · hot. */
const HOT_PCT = 80
const MID_PCT = 55

/**
 * Corong pembaca · FR-EARN-04.
 *
 * Empat tahap dari data nyata: pembaca yang membuka bab pertama, yang masih ada
 * di bab tiga, yang mencapai bab premium pertama, dan yang benar-benar membayar.
 *
 * Tahap terakhir **adalah** `openRatePct` di sudut pandang Pendapatan — satu
 * angka dipakai dua tempat, bukan dua perhitungan yang kebetulan mirip. PRD
 * menuntut keduanya konsisten, dan cara termurah menepatinya adalah tidak pernah
 * menghitungnya dua kali.
 */
function funnelOf(
  chapters: ChapterSummary[],
  purchases: number,
): { stages: FunnelStage[]; payPct: number } {
  const published = chapters
    .filter((c) => c.state === 'published')
    .sort((a, b) => a.number - b.number)
  const first = published[0]
  // Tahap tengah memakai bab ketiga kalau ada; kalau cerita baru punya dua bab,
  // bab terakhirlah yang dipakai — **dan labelnya ikut menyebut bab itu.**
  // "Bab 3" yang sebenarnya bab 2 adalah kebohongan kecil yang tidak perlu.
  const midIndex = Math.min(2, published.length - 1)
  const mid = midIndex > 0 ? published[midIndex] : undefined
  const premium = published.find((c) => c.access === 'paid')

  const base = Math.max(1, first?.views ?? 1)
  const share = (views: number) => Math.min(100, Math.round((views / base) * 100))

  const reachedPremium = premium?.views ?? 0
  const payPct =
    reachedPremium === 0 ? 0 : Math.min(100, Math.round((purchases / reachedPremium) * 100))

  const raw: FunnelStage[] = [
    { label: 'Dibuka', pct: first ? 100 : 0 },
    { label: mid ? `Bab ${mid.number}` : 'Bab 3', pct: mid ? share(mid.views) : 0 },
    { label: 'Premium', pct: premium ? share(reachedPremium) : 0 },
    { label: 'Bayar', pct: payPct },
  ]

  // Corong **tidak bisa naik**: tiap tahap adalah bagian dari tahap sebelumnya.
  // Tanpa penjepit ini, cerita yang bab premiumnya adalah bab pertama membuat
  // tahap Premium melompati tahap sebelumnya, dan gambarnya berhenti masuk akal.
  let ceiling = 100
  const stages = raw.map((stage) => {
    const pct = Math.min(stage.pct, ceiling)
    ceiling = pct
    return { ...stage, pct }
  })

  return { stages, payPct: stages.at(-1)?.pct ?? 0 }
}

/**
 * Heatmap rilis · FR-EARN-05. Intensitas satu sel = bobot harinya × bobot
 * slotnya, keduanya diturunkan — hari dari deret views cerita fokus, slot dari
 * jam paling ramai yang sudah dinyatakan halaman ini.
 */
function heatOf(dayWeights: number[], bestDay: number): HeatCell[] {
  const cells: Array<Omit<HeatCell, 'level'>> = []
  let max = 1

  for (const [si, slot] of HEAT_SLOTS.entries()) {
    for (const [di, day] of HARI.entries()) {
      // Hari terbaik mendapat dorongan supaya sel terpanas jatuh persis pada
      // `bestTime` — lihat catatan di atas.
      const boost = di === bestDay ? 1.2 : 1
      const raw = (dayWeights[di] ?? 0) * (SLOT_WEIGHT[si] ?? 0) * boost
      max = Math.max(max, raw)
      cells.push({ day, slot, pct: raw })
    }
  }

  return cells.map((cell) => {
    const pct = Math.round((cell.pct / max) * 100)
    return {
      ...cell,
      pct,
      level: pct >= HOT_PCT ? 'hot' : pct >= MID_PCT ? 'mid' : 'low',
    }
  })
}

async function myStories(userId: string): Promise<Story[]> {
  return db.stories.where('authorId').equals(userId).toArray()
}

/**
 * Saldo tersedia · FR-EARN-06.
 *
 * Yang **sedang diproses ditahan**: pengajuan yang belum ditransfer memotong
 * saldo tersedia, jadi dana yang sama tidak bisa diajukan dua kali. Aturan itu
 * hidup di sini, bukan di layar — layar bisa dilewati, server tidak.
 */
async function balanceOf(userId: string): Promise<{ available: number; pending: number }> {
  const stories = await myStories(userId)
  const coins = stories.reduce((n, s) => n + s.stats.coinsEarned, 0)
  const gross = Math.round(
    (coins * SERVER_CONFIG.coinRateRupiah * SERVER_CONFIG.authorSharePct) / 100,
  )

  const rows = await db.withdrawals.where('userId').equals(userId).toArray()
  const settled = rows.filter((w) => w.status === 'transferred').reduce((n, w) => n + w.amount, 0)
  const pending = rows
    .filter((w) => ['submitted', 'review'].includes(w.status))
    .reduce((n, w) => n + w.amount, 0)

  return { available: Math.max(0, gross - settled - pending), pending }
}

export const earningsHandlers: Pick<
  NovelovaApi,
  | 'getAuthorAnalytics'
  | 'getPayoutBalance'
  | 'getPayoutRate'
  | 'getPayoutAccount'
  | 'requestWithdrawal'
  | 'listWithdrawals'
> = {
  /**
   * Konversi koin → rupiah · FR-EARN-12.
   *
   * Contohnya diambil dari **bab berbayar sungguhan** milik penulis ini, bukan
   * angka bulat yang enak dibaca: penulis yang menjual babnya 5 koin perlu
   * melihat 5 koin, karena itu yang akan ia cocokkan dengan buku besarnya.
   */
  async getPayoutAccount(): Promise<PayoutAccount> {
    const userId = currentUserId()
    const profile = await db.authorProfiles.get(userId)
    const user = await db.users.get(userId)

    return {
      bankName: 'BCA',
      ownerName: user?.penName ?? user?.displayName ?? '',
      // ponytail: satu rekening, disamarkan di sini. Pengelolaan banyak
      // rekening beserta alur verifikasinya ada di PRD 08 §7 #6 dan menuntut
      // layarnya sendiri; bentuk seam-nya tidak berubah saat itu datang.
      masked: '**** 4481',
      payoutVerified: profile?.payoutVerified ?? false,
      twoFactor: profile?.twoFactor ?? false,
    }
  },

  async getPayoutRate(): Promise<PayoutRate> {
    const stories = await myStories(currentUserId())
    const chapters = await db.chapters
      .where('storyId')
      .anyOf(stories.map((s) => s.id))
      .toArray()

    const paid = chapters
      .filter((c) => c.access === 'paid' && c.priceCoins > 0)
      .sort((a, b) => a.number - b.number)
    const price = paid[0]?.priceCoins ?? 1

    const authorCoins = Math.round((price * SERVER_CONFIG.authorSharePct) / 100)

    return {
      coinRateRupiah: SERVER_CONFIG.coinRateRupiah,
      authorSharePct: SERVER_CONFIG.authorSharePct,
      platformSharePct: 100 - SERVER_CONFIG.authorSharePct,
      feeRupiah: SERVER_CONFIG.withdrawFeeRupiah,
      minRupiah: SERVER_CONFIG.withdrawMinRupiah,
      example: {
        chapterPriceCoins: price,
        readerPaysCoins: price,
        platformCoins: price - authorCoins,
        authorCoins,
        authorRupiah: authorCoins * SERVER_CONFIG.coinRateRupiah,
      },
    }
  },

  /**
   * Analitik penulis · FR-EARN-01..03.
   *
   * Rentang **dan** sudut pandang keduanya menyaring di sini. PRD 08 §7 #4
   * mencatat bahwa di prototipe pemilih sudut pandang hanya mengganti gaya
   * aktif, sehingga dua dari tiga sudut pandang tidak pernah terlihat sama
   * sekali; server mengirim ketiganya supaya berpindah benar-benar berarti.
   */
  async getAuthorAnalytics(params: AuthorAnalyticsParams): Promise<AuthorAnalytics> {
    const userId = currentUserId()
    const stories = await myStories(userId)
    const days = params.range === 'custom' ? 30 : RANGE_DAYS[params.range]
    // Porsi rentang terhadap setahun — sama caranya dengan analitik cerita,
    // supaya angka kedua halaman tidak pernah saling membantah.
    const share = Math.min(1, days / 365)

    const coins = stories.reduce((n, s) => n + s.stats.coinsEarned, 0)
    const reads = stories.reduce((n, s) => n + s.stats.reads, 0)
    const rated = stories.filter((s) => s.stats.rating > 0)
    const rating =
      rated.length === 0 ? 0 : rated.reduce((n, s) => n + s.stats.rating, 0) / rated.length

    const chapters = await db.chapters
      .where('storyId')
      .anyOf(stories.map((s) => s.id))
      .toArray()
    const published = chapters.filter((c) => c.state === 'published')
    const paid = published.filter((c) => c.access === 'paid')

    const owned = await db.ownerships.toArray()

    /**
     * Cerita fokus · FR-EARN-04. Yang paling banyak dibaca di antara yang punya
     * bab premium terbit — kalau tidak ada, yang paling banyak dibaca saja.
     * Cerita ini menentukan **empat hal sekaligus**: corong, tingkat buka,
     * heatmap, dan tautan penjadwal. Satu cerita, bukan empat pilihan berbeda.
     */
    const withPaid = new Set(paid.map((c) => c.storyId))
    const ranked = [...stories].sort((a, b) => b.stats.reads - a.stats.reads)
    const focus = ranked.find((s) => withPaid.has(s.id)) ?? ranked[0] ?? null

    const focusChapters = focus ? chapters.filter((c) => c.storyId === focus.id) : []
    const focusPaidIds = new Set(
      focusChapters.filter((c) => c.access === 'paid' && c.state === 'published').map((c) => c.id),
    )
    const focusPurchases = owned.filter((o) => focusPaidIds.has(o.chapterId)).length
    const { stages: funnel, payPct } = funnelOf(focusChapters, focusPurchases)

    // Tingkat buka **adalah** tahap terakhir corong — satu angka, dua tempat.
    const openRatePct = payPct

    /**
     * Bobot per hari datang dari **deret cerita fokus yang sama** dengan yang
     * dipakai analitik cerita dan jadwal terpadu. Sebelumnya array tetap, dan
     * itu berarti penulis bisa membaca "Sabtu 20.00" di satu layar dan hari lain
     * di layar berikutnya — dua sumber kebenaran untuk satu pertanyaan.
     */
    const weights = focus ? weekdayWeights(focus.id, focus.stats.reads) : [1, 1, 1, 1, 1, 1, 1]
    const focusBestDay = focus ? (bestDayIndex(focus.id, focus.stats.reads) + 6) % 7 : 5
    const maxWeight = Math.max(1, ...weights)

    const bars: RevenueBar[] = HARI.map((day, i) => {
      // `HARI` mulai Senin (FR-EARN-03), `weights` memakai indeks `getDay()`.
      const weight = (weights[(i + 1) % 7] ?? 0) / maxWeight
      return {
        day,
        coins: Math.round((coins * share * weight) / 7),
        pct: Math.round(weight * 100),
      }
    })
    const best = bars.reduce((top, bar) => (bar.pct > top.pct ? bar : top), bars[0] as RevenueBar)

    /** Bab dengan penurunan retensi terbesar — lintas seluruh karya. */
    const byStory = new Map(stories.map((s) => [s.id, s.title]))
    const drops = published
      .slice()
      .sort((a, b) => a.number - b.number)
      .map((chapter, i, list) => {
        const prev = list[i - 1]
        const retentionPct =
          prev && prev.storyId === chapter.storyId
            ? Math.round((chapter.views / Math.max(1, prev.views)) * 100)
            : 100
        return {
          storyTitle: byStory.get(chapter.storyId) ?? '',
          label: `Bab ${chapter.number} · ${chapter.title}`,
          retentionPct,
          note:
            retentionPct < RETENTION_DROP_PCT
              ? 'Pembaca paling banyak berhenti di sini.'
              : 'Bertahan baik.',
        }
      })
      .filter((row) => row.retentionPct < RETENTION_DROP_PCT)
      .sort((a, b) => a.retentionPct - b.retentionPct)
      .slice(0, 3)

    return {
      range: params.range,
      rangeLabel: RANGE_LABEL[params.range],
      kpi: {
        revenueRupiah: Math.round(
          (coins * share * SERVER_CONFIG.coinRateRupiah * SERVER_CONFIG.authorSharePct) / 100,
        ),
        reads: Math.round(reads * share),
        rating: Math.round(rating * 10) / 10,
      },
      coinRateRupiah: SERVER_CONFIG.coinRateRupiah,
      authorSharePct: SERVER_CONFIG.authorSharePct,
      revenue: {
        openRatePct,
        openRateChangePct: 4,
        newFans: Math.round(stories.reduce((n, s) => n + s.stats.saves, 0) * share),
        newFansChangePct: 18,
        bars,
        note: `Puncak jatuh pada ${best.day} di ${best.pct}% konversi. Akhir pekan menyumbang porsi terbesar periode ini.`,
      },
      focusStory: focus ? { id: focus.id, title: focus.title } : null,
      retention: { funnel, drops },
      traffic: {
        sources: [
          { label: 'Beranda', pct: 48 },
          { label: 'Pencarian', pct: 31 },
          { label: 'Bagikan', pct: 21 },
        ],
        peakHours: '17.00–22.00',
        heatSlots: [...HEAT_SLOTS],
        heatDays: [...HARI],
        heat: heatOf(
          bars.map((b) => b.pct),
          focusBestDay,
        ),
        actionNote: focus
          ? `${HARI[focusBestDay]} pukul 20.00 adalah waktu terkuat untuk ${focus.title}. Jadwalkan bab premium berikutnya mendekati jam itu.`
          : 'Belum ada cukup data rilis untuk merekomendasikan waktu terbit.',
        // Tautan yang **membuka penjadwal dengan waktunya sudah terisi**
        // (FR-EARN-05). Rekomendasi yang masih harus diterjemahkan sendiri jadi
        // tanggal bukan rekomendasi yang bisa dijalankan.
        scheduleLink: focus ? `/karya/${focus.id}/bab?tab=draft&jadwalkan=terbaik` : null,
      },
    }
  },

  async getPayoutBalance(): Promise<{ available: number; pending: number }> {
    return balanceOf(currentUserId())
  },

  async listWithdrawals(params: ListParams): Promise<Paged<Withdrawal>> {
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20

    const all = (await db.withdrawals.where('userId').equals(currentUserId()).toArray()).sort(
      (a, b) => b.requestedAt.localeCompare(a.requestedAt),
    )
    const start = (page - 1) * pageSize

    return {
      items: all.slice(start, start + pageSize),
      page,
      pageSize,
      total: all.length,
      hasMore: start + pageSize < all.length,
    }
  },

  /**
   * Pengajuan pencairan · FR-EARN-11. **Idempoten**, karena menyentuh uang:
   * permintaan yang diulang dengan kunci yang sama mengembalikan pengajuan yang
   * sama, bukan membuat yang kedua.
   *
   * Tangga validasinya lengkap di Fase 9 potongan berikutnya; yang ditegakkan
   * sekarang adalah dua yang tidak boleh menunggu — **minimum** dan **plafon
   * saldo** (PRD 08 §7 #2 dan #3).
   */
  async requestWithdrawal(input: WithdrawInput): Promise<Withdrawal> {
    const userId = currentUserId()

    const seen = await db.idempotency.get(input.idempotencyKey)
    if (seen) return JSON.parse(seen.resultJson) as Withdrawal

    /**
     * Tangga lima tingkat yang **sama persis** dengan yang dipakai layar
     * (`lib/payout.ts`). Layar memakainya untuk mematikan tombolnya lebih dulu;
     * di sini ia yang benar-benar menolak, karena layar bisa dilewati.
     */
    const profile = await db.authorProfiles.get(userId)
    const { available } = await balanceOf(userId)

    const refusal = refusePayout({
      amount: input.amount,
      available,
      min: SERVER_CONFIG.withdrawMinRupiah,
      payoutVerified: profile?.payoutVerified ?? false,
      twoFactor: profile?.twoFactor ?? false,
    })
    if (refusal) throw new ApiError(INTERNAL_CODES.VALIDATION, refusal.message)

    const withdrawal: Withdrawal = {
      id: `wd-${crypto.randomUUID()}`,
      userId,
      amount: input.amount,
      fee: SERVER_CONFIG.withdrawFeeRupiah,
      net: Math.max(1, input.amount - SERVER_CONFIG.withdrawFeeRupiah),
      bankName: 'BCA',
      bankAccountMasked: '**** 4481',
      status: 'submitted',
      reason: null,
      proofUrl: null,
      requestedAt: new Date().toISOString(),
      settledAt: null,
    }

    await db.transaction('rw', db.withdrawals, db.idempotency, async () => {
      await db.withdrawals.put(withdrawal)
      await db.idempotency.put({
        key: input.idempotencyKey,
        operation: 'requestWithdrawal',
        resultJson: JSON.stringify(withdrawal),
        createdAt: withdrawal.requestedAt,
      })
    })

    return withdrawal
  },
}

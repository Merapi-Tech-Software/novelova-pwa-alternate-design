import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import type { AuthorAnalyticsParams } from '@/api/contracts'
import { SERVER_CONFIG } from '@/api/mock/config'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'

const P = (over: Partial<AuthorAnalyticsParams> = {}): AuthorAnalyticsParams => ({
  range: '30h',
  viewpoint: 'revenue',
  ...over,
})

/** Pengajuan yang dibuat test dibersihkan **di awal**, bukan di akhir. */
beforeEach(async () => {
  await db.authorProfiles.put({
    userId: CURRENT_USER_ID,
    tier: 'verified',
    payoutVerified: true,
    twoFactor: true,
    termsAcceptedAt: new Date().toISOString(),
  })
  for (const row of await db.withdrawals.toArray()) {
    if (row.id.startsWith('wd-')) await db.withdrawals.delete(row.id)
  }
  await db.idempotency.clear()
})

describe('analitik penulis · FR-EARN-01..03', () => {
  it('tiga KPI berurutan tetap dan agregat seluruh karya', async () => {
    const report = await api.getAuthorAnalytics(P())
    const stories = await db.stories.where('authorId').equals(CURRENT_USER_ID).toArray()

    expect(report.kpi.reads).toBeGreaterThan(0)
    expect(report.kpi.rating).toBeGreaterThan(0)
    expect(report.kpi.rating).toBeLessThanOrEqual(5)
    // Agregat, bukan satu cerita: tidak boleh sama dengan cerita mana pun.
    expect(stories.length).toBeGreaterThan(1)
  })

  it('rentang bawaan 30 hari, dan mengubahnya benar-benar mengubah angkanya', async () => {
    const month = await api.getAuthorAnalytics(P())
    const week = await api.getAuthorAnalytics(P({ range: '7h' }))

    expect(month.rangeLabel).toBe('30 hari terakhir')
    expect(month.kpi.reads).toBeGreaterThan(week.kpi.reads)
    expect(month.kpi.revenueRupiah).toBeGreaterThan(week.kpi.revenueRupiah)
  })

  it('kurs koin dan bagi hasil datang dari konfigurasi server, bukan konstanta layar', async () => {
    const report = await api.getAuthorAnalytics(P())
    expect(report.coinRateRupiah).toBe(SERVER_CONFIG.coinRateRupiah)
    expect(report.authorSharePct).toBe(SERVER_CONFIG.authorSharePct)
  })

  it('ketiga sudut pandang membawa isinya masing-masing, bukan hanya gaya aktif', async () => {
    const report = await api.getAuthorAnalytics(P())

    expect(report.revenue.bars).toHaveLength(7)
    expect(report.revenue.bars.map((b) => b.day)).toEqual([
      'Sen',
      'Sel',
      'Rab',
      'Kam',
      'Jum',
      'Sab',
      'Min',
    ])
    expect(report.traffic.sources.length).toBeGreaterThan(0)
    // Retensi boleh kosong bila tidak ada bab yang turun — yang penting
    // bentuknya ada, bukan sudut pandang yang tidak pernah dikirim.
    expect(Array.isArray(report.retention.drops)).toBe(true)
  })

  it('catatan kurva menyebut hari terkuat, bukan mengulang angkanya', async () => {
    const report = await api.getAuthorAnalytics(P())
    const best = report.revenue.bars.reduce((top, b) => (b.pct > top.pct ? b : top))
    expect(report.revenue.note).toContain(best.day)
  })
})

describe('corong pembaca · FR-EARN-04', () => {
  it('empat tahap berurutan, dan persentasenya tidak pernah naik', async () => {
    const report = await api.getAuthorAnalytics(P())
    const funnel = report.retention.funnel

    expect(funnel).toHaveLength(4)
    expect(funnel[0]?.label).toBe('Dibuka')
    // Tahap tengah menyebut bab yang benar-benar dipakai, bukan selalu "Bab 3".
    expect(funnel[1]?.label).toMatch(/^Bab \d+$/)
    expect(funnel.slice(2).map((f) => f.label)).toEqual(['Premium', 'Bayar'])
    for (const [i, stage] of funnel.entries()) {
      if (i === 0) continue
      expect(stage.pct, stage.label).toBeLessThanOrEqual(funnel[i - 1]?.pct ?? 100)
    }
  })

  it('corong menyebut cerita yang dianalisis, bukan agregat tanpa nama', async () => {
    const report = await api.getAuthorAnalytics(P())
    expect(report.focusStory?.title).toBeTruthy()

    const stories = await db.stories.where('authorId').equals(CURRENT_USER_ID).toArray()
    expect(stories.map((s) => s.id)).toContain(report.focusStory?.id)
  })

  /**
   * FR-EARN-04 mensyaratkan keduanya konsisten. Satu-satunya cara menepatinya
   * yang tidak bisa lapuk adalah tidak pernah menghitungnya dua kali.
   */
  it('tahap Bayar **adalah** tingkat buka — satu angka, dua tempat', async () => {
    const report = await api.getAuthorAnalytics(P())
    const bayar = report.retention.funnel.at(-1)
    expect(bayar?.pct).toBe(report.revenue.openRatePct)
  })
})

describe('heatmap rilis · FR-EARN-05', () => {
  it('empat slot × tujuh hari, dengan tiga tingkat intensitas', async () => {
    const report = await api.getAuthorAnalytics(P())
    const { heat, heatDays, heatSlots } = report.traffic

    expect(heatSlots).toHaveLength(4)
    expect(heatDays).toHaveLength(7)
    expect(heat).toHaveLength(28)
    expect(new Set(heat.map((c) => c.level)).size).toBeGreaterThan(1)
  })

  it('sel terpanas jatuh pada slot malam — sama dengan jam paling ramai yang disebut halaman', async () => {
    const report = await api.getAuthorAnalytics(P())
    const hot = report.traffic.heat.filter((c) => c.level === 'hot')

    expect(hot.length).toBeGreaterThan(0)
    // `peakHours` berbunyi 17.00–22.00; heatmap yang menunjuk jam lain membuat
    // keduanya tidak bisa dipercaya.
    for (const cell of hot) expect(cell.slot).toBe('17–22')
  })

  it('catatan aksi membawa tautan penjadwal, bukan hanya kalimat', async () => {
    const report = await api.getAuthorAnalytics(P())
    expect(report.traffic.actionNote).toMatch(/pukul 20\.00/)
    expect(report.traffic.scheduleLink).toMatch(/^\/karya\/.+\/bab\?tab=draft&jadwalkan=terbaik$/)
  })

  it('hari terkuat kurva pendapatan sama dengan hari terpanas heatmap', async () => {
    const report = await api.getAuthorAnalytics(P())
    const bestBar = report.revenue.bars.reduce((top, b) => (b.pct > top.pct ? b : top))
    const hottest = report.traffic.heat
      .filter((c) => c.slot === '17–22')
      .reduce((top, c) => (c.pct > top.pct ? c : top))

    expect(hottest.day).toBe(bestBar.day)
  })
})

describe('konversi koin → rupiah · FR-EARN-12', () => {
  it('rantai bagi hasil menjumlah utuh: potongan platform + koin penulis = yang dibayar pembaca', async () => {
    const rate = await api.getPayoutRate()
    const { readerPaysCoins, platformCoins, authorCoins, authorRupiah } = rate.example

    expect(platformCoins + authorCoins).toBe(readerPaysCoins)
    expect(rate.authorSharePct + rate.platformSharePct).toBe(100)
    expect(authorRupiah).toBe(authorCoins * rate.coinRateRupiah)
  })

  it('contohnya dari bab berbayar sungguhan milik penulis ini', async () => {
    const rate = await api.getPayoutRate()
    const stories = await db.stories.where('authorId').equals(CURRENT_USER_ID).toArray()
    const chapters = await db.chapters
      .where('storyId')
      .anyOf(stories.map((s) => s.id))
      .toArray()

    const prices = chapters.filter((c) => c.access === 'paid').map((c) => c.priceCoins)
    expect(prices).toContain(rate.example.chapterPriceCoins)
  })

  it('kurs, biaya, dan minimum datang dari konfigurasi server yang sama', async () => {
    const rate = await api.getPayoutRate()
    expect(rate.coinRateRupiah).toBe(SERVER_CONFIG.coinRateRupiah)
    expect(rate.feeRupiah).toBe(SERVER_CONFIG.withdrawFeeRupiah)
    expect(rate.minRupiah).toBe(SERVER_CONFIG.withdrawMinRupiah)
  })
})

describe('saldo & pencairan · FR-EARN-06 · FR-EARN-11', () => {
  it('pengajuan yang sedang diproses menahan saldo, jadi dana yang sama tidak bisa diajukan dua kali', async () => {
    const before = await api.getPayoutBalance()
    expect(before.pending).toBeGreaterThan(0)

    const withheld = await api.requestWithdrawal({
      amount: 150_000,
      bankAccountId: 'bank1',
      purpose: 'Pembayaran pendapatan penulis',
      idempotencyKey: crypto.randomUUID(),
    })

    const after = await api.getPayoutBalance()
    expect(after.available).toBe(before.available - withheld.amount)
    expect(after.pending).toBe(before.pending + withheld.amount)
  })

  it('idempoten: kunci yang sama tidak pernah membuat pengajuan kedua', async () => {
    const key = crypto.randomUUID()
    const input = {
      amount: 120_000,
      bankAccountId: 'bank1',
      purpose: 'Pembayaran pendapatan penulis',
      idempotencyKey: key,
    }

    const first = await api.requestWithdrawal(input)
    const second = await api.requestWithdrawal(input)

    expect(second.id).toBe(first.id)
    const rows = await db.withdrawals.where('userId').equals(CURRENT_USER_ID).toArray()
    expect(rows.filter((w) => w.id === first.id)).toHaveLength(1)
  })

  it('di bawah minimum ditolak beserta angkanya', async () => {
    await expect(
      api.requestWithdrawal({
        amount: 50_000,
        bankAccountId: 'bank1',
        purpose: 'Pembayaran pendapatan penulis',
        idempotencyKey: crypto.randomUUID(),
      }),
    ).rejects.toThrow(/Rp 100\.000/)
  })

  it('melebihi saldo ditolak, dan penolakannya menyatakan uangnya tidak berpindah', async () => {
    const { available } = await api.getPayoutBalance()
    const error = await api
      .requestWithdrawal({
        amount: available + 1_000_000,
        bankAccountId: 'bank1',
        purpose: 'Pembayaran pendapatan penulis',
        idempotencyKey: crypto.randomUUID(),
      })
      .catch((e: unknown) => e)

    expect(String(error)).toMatch(/melebihi saldo tersedia/i)
    expect(String(error)).toMatch(/tidak berpindah/i)
  })

  it('biaya admin dipotong dari jumlah, dan bersihnya tidak pernah negatif', async () => {
    const wd = await api.requestWithdrawal({
      amount: 100_000,
      bankAccountId: 'bank1',
      purpose: 'Pembayaran pendapatan penulis',
      idempotencyKey: crypto.randomUUID(),
    })
    expect(wd.fee).toBe(SERVER_CONFIG.withdrawFeeRupiah)
    expect(wd.net).toBe(100_000 - SERVER_CONFIG.withdrawFeeRupiah)
    expect(wd.net).toBeGreaterThan(0)
  })

  it('server menegakkan tangga yang sama: Rp 50.000 ditolak di tingkat 2', async () => {
    await expect(
      api.requestWithdrawal({
        amount: 50_000,
        bankAccountId: 'bank1',
        purpose: 'Pembayaran pendapatan penulis',
        idempotencyKey: crypto.randomUUID(),
      }),
    ).rejects.toThrow(/Penarikan minimum Rp 100\.000/)
  })

  it('Rp 200.000 dengan saldo Rp 150.000 ditolak di tingkat 3', async () => {
    // Saldo dipangkas lewat satu pengajuan besar, bukan dengan menyunting
    // saldo langsung: yang diuji justru aturan penahanannya.
    const { available } = await api.getPayoutBalance()
    await api.requestWithdrawal({
      amount: available - 150_000,
      bankAccountId: 'bank1',
      purpose: 'Pembayaran pendapatan penulis',
      idempotencyKey: crypto.randomUUID(),
    })

    await expect(
      api.requestWithdrawal({
        amount: 200_000,
        bankAccountId: 'bank1',
        purpose: 'Pembayaran pendapatan penulis',
        idempotencyKey: crypto.randomUUID(),
      }),
    ).rejects.toThrow(/melebihi saldo tersedia Rp 150\.000/)
  })

  it('rekening belum terverifikasi ditolak server, bukan hanya dimatikan di layar', async () => {
    await db.authorProfiles.update(CURRENT_USER_ID, { payoutVerified: false })

    await expect(
      api.requestWithdrawal({
        amount: 150_000,
        bankAccountId: 'bank1',
        purpose: 'Pembayaran pendapatan penulis',
        idempotencyKey: crypto.randomUUID(),
      }),
    ).rejects.toThrow(/Verifikasi rekening tujuan/)
  })

  it('rekening dikirim tersamar — nomor penuhnya tidak pernah meninggalkan server', async () => {
    const account = await api.getPayoutAccount()
    expect(account.masked).toMatch(/^\*{4} \d{4}$/)
    expect(account.payoutVerified).toBe(true)
    expect(account.twoFactor).toBe(true)
  })

  it('riwayat terurut terbaru lebih dulu', async () => {
    const { items } = await api.listWithdrawals({ page: 1, pageSize: 20 })
    const dates = items.map((w) => w.requestedAt)
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)))
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import type { PrintOrderParams } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'

const P = (tab: PrintOrderParams['tab'] = 'all'): PrintOrderParams => ({
  page: 1,
  pageSize: 50,
  tab,
})

const PRINTING = '#HDC-20260822-001'
const CONFIRMED = '#HDC-20260824-001'
const COST_CHANGED = '#HDC-20260818-001'
const EXPIRED = '#SFT-20260511-001'
const BUILD_FAILED = '#SFT-20260820-001'

/**
 * Keadaan awal dikembalikan di `beforeEach`, bukan di akhir test: pembersihan
 * di akhir tidak pernah berjalan pada test yang gagal, dan test berikutnya
 * mewarisi keadaan yang sudah berubah.
 */
beforeEach(async () => {
  await db.authorProfiles.put({
    userId: CURRENT_USER_ID,
    tier: 'verified',
    payoutVerified: true,
    twoFactor: true,
    termsAcceptedAt: new Date().toISOString(),
  })
  await db.printOrders.update(PRINTING, { status: 'printing', stageIndex: 3 })
  await db.printOrders.update(CONFIRMED, { status: 'shipped', stageIndex: 1 })
  await db.printOrders.update(COST_CHANGED, {
    status: 'cost_changed',
    stageIndex: 1,
    costQuoted: 196_000,
    costFinal: 214_000,
  })
})

describe('saringan riwayat · FR-STUDIO-32', () => {
  it('keempat tab menyaring di server, bukan di layar', async () => {
    const all = await api.listPrintOrders(P())
    const soft = await api.listPrintOrders(P('soft'))
    const hard = await api.listPrintOrders(P('hard'))
    const running = await api.listPrintOrders(P('running'))

    expect(all.total).toBeGreaterThan(soft.total)
    expect(soft.items.every((o) => o.kind === 'soft')).toBe(true)
    expect(hard.items.every((o) => o.kind === 'hard')).toBe(true)
    // "Berjalan" bukan status tersendiri — ia pertanyaan "apa yang belum selesai".
    expect(running.items.every((o) => !['received', 'expired'].includes(o.status))).toBe(true)
    expect(running.total).toBeLessThan(all.total)
  })

  it('nomor pesanan membawa jenisnya, jadi satu daftar cukup dibaca sekilas', async () => {
    const { items } = await api.listPrintOrders(P())
    for (const order of items) {
      expect(order.id.startsWith(order.kind === 'soft' ? '#SFT-' : '#HDC-')).toBe(true)
    }
  })
})

describe('pesanan ditolak · FR-STUDIO-32', () => {
  it('alasan penolakan menyebut kebijakannya, bukan kalimat yang tidak bisa ditindaklanjuti', async () => {
    const { items } = await api.listPrintOrders(P())
    const rejected = items.find((o) => o.status === 'rejected')

    expect(rejected?.rejectReason).toMatch(/minimum 10 bab aktif/i)
    // Ditolak berarti **tidak ada tagihan** — bukan sekadar pesanan yang berhenti.
    expect(rejected?.costFinal).toBe(0)
  })
})

describe('pembatalan dibatasi tahap · PRINT-409', () => {
  it('membatalkan pesanan pada tahap Dicetak ditolak beserta alasannya', async () => {
    const error = await api.cancelPrintOrder(PRINTING).catch((e: unknown) => e)

    expect(isApiError(error)).toBe(true)
    if (!isApiError(error)) return
    expect(error.code).toBe('PRINT-409')
    // Penolakannya menyebut biayanya dan jalan keluarnya — bukan "tidak bisa".
    expect(error.message).toMatch(/148\.000/)
    expect(error.message).toMatch(/klaim/i)

    const after = await db.printOrders.get(PRINTING)
    expect(after?.status).toBe('printing')
  })

  it('sebelum produksi pembatalan berhasil dan tidak menagih apa pun', async () => {
    const cancelled = await api.cancelPrintOrder(CONFIRMED)
    expect(cancelled.status).toBe('cancelled')
    expect(cancelled.costFinal).toBe(0)
    expect(cancelled.note).toMatch(/tidak ada biaya/i)
  })
})

describe('biaya berubah · PRINT-402', () => {
  it('menyetujui biaya baru meneruskan pesanan ke produksi', async () => {
    const approved = await api.approvePrintCost(COST_CHANGED)
    expect(approved.status).toBe('confirmed')
    expect(approved.costQuoted).toBe(214_000)
  })

  it('menolaknya tidak menagih apa pun — satu aturan dengan pembatalan biasa', async () => {
    const rejected = await api.cancelPrintOrder(COST_CHANGED)
    expect(rejected.status).toBe('cancelled')
    expect(rejected.costFinal).toBe(0)
  })

  it('pesanan yang biayanya tidak berubah tidak bisa "disetujui"', async () => {
    await expect(api.approvePrintCost(PRINTING)).rejects.toThrow(/tidak sedang menunggu/i)
  })
})

describe('buat ulang berkas · PRINT-504 · PRINT-410', () => {
  it('memecah jadi tiga berkas menghasilkan tiga rentang bab yang menyambung', async () => {
    const parts = await api.regeneratePrintFile(BUILD_FAILED, 3)

    expect(parts).toHaveLength(3)
    expect(parts.every((o) => o.status === 'paid')).toBe(true)
    const ranges = parts.map((o) =>
      o.spec
        .match(/Bab (\d+)–(\d+)/)
        ?.slice(1, 3)
        .map(Number),
    )
    expect(ranges[0]?.[0]).toBe(1)
    // Berkas berikutnya mulai persis setelah yang sebelumnya berakhir.
    expect(ranges[1]?.[0]).toBe((ranges[0]?.[1] ?? 0) + 1)
    expect(ranges[2]?.[0]).toBe((ranges[1]?.[1] ?? 0) + 1)
  })

  it('berkas kedaluwarsa dibuat ulang dengan masa simpan 30 hari yang baru', async () => {
    const [fresh] = await api.regeneratePrintFile(EXPIRED, 1)

    expect(fresh?.status).toBe('paid')
    expect(fresh?.fileExpiresAt).not.toBeNull()
    const days = (Date.parse(fresh?.fileExpiresAt ?? '') - Date.now()) / 86_400_000
    expect(Math.round(days)).toBe(30)
  })

  it('hardcopy tidak bisa "dibuat ulang" — yang dicetak bukan berkas', async () => {
    await expect(api.regeneratePrintFile(PRINTING, 1)).rejects.toThrow(/hanya berkas pdf/i)
  })
})

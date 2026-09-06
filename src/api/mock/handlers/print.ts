import { todayLocalISO } from '@/lib/date'
import type { NovelovaApi } from '../../client'
import type { Paged, PrintOrder, PrintOrderParams } from '../../contracts'
import { ApiError, INTERNAL_CODES, VISIBLE_CODES } from '../../errors'
import { db } from '../db'
import { emitNotification } from './notifications'
import { currentUserId } from './session'

/**
 * Riwayat & lini masa pesanan cetak · FR-STUDIO-32.
 *
 * Lini masanya **enam tahap PRD**, bukan empat langkah kanvas (arch §1.5).
 * Indeks tahap 3 adalah "Dicetak" — dan di situlah satu-satunya aturan yang
 * benar-benar menyangkut uang penulis: sesudah tahap itu pesanan tidak bisa
 * dibatalkan.
 */

/** Indeks `PRINT_STAGES` saat pesanan masuk produksi — batas pembatalan. */
const STAGE_PRINTING = 3

/** Masa simpan berkas softcopy · FR-STUDIO-05 & FR-STUDIO-32. */
const FILE_DAYS = 30

async function orderOfAuthor(orderId: string): Promise<PrintOrder> {
  const order = await db.printOrders.get(orderId)
  if (!order || order.userId !== currentUserId()) {
    throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Pesanan cetak ini tidak ditemukan.')
  }
  return order
}

/** Masih bergerak: belum sampai ujung, dan bukan pesanan yang sudah gugur. */
function running(order: PrintOrder): boolean {
  return !['received', 'rejected', 'cancelled', 'expired', 'build_failed'].includes(order.status)
}

export const printHandlers: Pick<
  NovelovaApi,
  'listPrintOrders' | 'cancelPrintOrder' | 'approvePrintCost' | 'regeneratePrintFile'
> = {
  async listPrintOrders(params: PrintOrderParams): Promise<Paged<PrintOrder>> {
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20

    const all = (await db.printOrders.where('userId').equals(currentUserId()).toArray())
      .filter((o) => {
        if (params.tab === 'soft') return o.kind === 'soft'
        if (params.tab === 'hard') return o.kind === 'hard'
        if (params.tab === 'running') return running(o)
        return true
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

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
   * Batalkan · `PRINT-409`.
   *
   * Menolaknya **menyebut biayanya dan jalan keluarnya** — tombol mati tanpa
   * penjelasan mengajari penulis bahwa aplikasinya rusak. Pesanan berbiaya
   * berubah (`PRINT-402`) lolos aturan ini dengan sendirinya: tahapnya masih di
   * bawah produksi, jadi menolak biaya baru = membatalkan, tanpa tagihan.
   */
  async cancelPrintOrder(orderId: string): Promise<PrintOrder> {
    const order = await orderOfAuthor(orderId)

    if (order.stageIndex !== null && order.stageIndex >= STAGE_PRINTING) {
      const cost = order.costFinal ?? order.costQuoted ?? 0
      throw new ApiError(
        VISIBLE_CODES.PRINT_IN_PRODUCTION,
        `Pesanan sudah masuk antrean cetak dan tidak bisa dibatalkan. Biaya Rp ${cost.toLocaleString('id-ID')} sudah terkonfirmasi. Kalau hasil cetaknya cacat, ajukan klaim lewat dukungan.`,
      )
    }

    const next: PrintOrder = {
      ...order,
      status: 'cancelled',
      stageIndex: null,
      costFinal: 0,
      note: 'Kamu membatalkan pesanan ini sebelum produksi. Tidak ada biaya yang ditagihkan.',
    }
    await db.printOrders.put(next)
    return next
  },

  /** Setujui biaya baru · `PRINT-402`. Produksi berjalan lagi dari tahap yang sama. */
  async approvePrintCost(orderId: string): Promise<PrintOrder> {
    const order = await orderOfAuthor(orderId)
    if (order.status !== 'cost_changed') {
      throw new ApiError(
        INTERNAL_CODES.CONFLICT,
        'Biaya pesanan ini tidak sedang menunggu persetujuan.',
      )
    }

    const next: PrintOrder = {
      ...order,
      status: 'confirmed',
      costQuoted: order.costFinal ?? order.costQuoted,
      note: 'Biaya baru disetujui. Pesanan diteruskan ke produksi.',
    }
    await db.printOrders.put(next)

    // Pemicu FR-NOTIF-02: status pesanan cetak berubah. `groupKey` per pesanan,
    // supaya rangkaian perubahan status satu pesanan dalam sehari jadi satu
    // baris — dan barisnya menunjuk status terakhir, bukan yang pertama.
    await emitNotification(currentUserId(), {
      kind: 'cetak-status',
      title: `Pesanan cetak ${order.storyTitle} dikonfirmasi`,
      body: 'Biaya disetujui dan pesanan diteruskan ke produksi.',
      deepLink: '/karya/cetak',
      groupKey: `print-${order.id}`,
    })

    return next
  },

  /**
   * Buat ulang berkas · `PRINT-504` / `PRINT-410`. `[LUAR]`
   *
   * Membuat ulang **gratis dan tidak memotong kuota apa pun** — berkas yang
   * kedaluwarsa bukan kesalahan penulis. Memecah naskah adalah jalan keluar
   * `PRINT-504`, bukan sekadar mencoba lagi hal yang sama sampai gagal lagi.
   */
  async regeneratePrintFile(orderId: string, parts: number): Promise<PrintOrder[]> {
    const order = await orderOfAuthor(orderId)
    if (order.kind !== 'soft') {
      throw new ApiError(INTERNAL_CODES.CONFLICT, 'Hanya berkas PDF yang bisa dibuat ulang.')
    }

    const story = await db.stories.get(order.storyId)
    const total = Math.max(1, story?.stats.chapterCount ?? 1)
    const slice = Math.ceil(total / Math.max(1, parts))
    const day = todayLocalISO().replaceAll('-', '')
    const seq = (await db.printOrders.where('userId').equals(order.userId).count()) + 1
    const now = new Date()

    const created: PrintOrder[] = []
    for (let i = 0; i < Math.max(1, parts); i += 1) {
      const from = i * slice + 1
      const to = Math.min(total, (i + 1) * slice)
      if (from > to) break

      created.push({
        ...order,
        id: `#SFT-${day}-${String(seq + i).padStart(3, '0')}`,
        spec: `Bab ${from}–${to} · A4 · sampul + daftar isi`,
        status: 'paid',
        stageIndex: null,
        rejectReason: null,
        fileName: `${order.storyTitle} - Bab ${from}-${to}.pdf`,
        fileSize: '2,1 MB',
        fileExpiresAt: new Date(now.getTime() + FILE_DAYS * 24 * 3_600_000).toISOString(),
        note: parts > 1 ? `Dipecah agar tidak melewati batas waktu pemrosesan.` : null,
        createdAt: now.toISOString(),
      })
    }

    await db.printOrders.bulkPut(created)
    return created
  },
}

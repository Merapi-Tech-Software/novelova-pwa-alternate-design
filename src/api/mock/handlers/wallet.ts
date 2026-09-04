import { bonusFor, COIN_PACKAGES, MIN_CUSTOM_COINS, priceFor } from '@/lib/coin'
import { todayLocalISO } from '@/lib/date'
import { payments } from '@/payments'
import type { NovelovaApi } from '../../client'
import type {
  Paged,
  PayMethod,
  TopupInput,
  TopupOrder,
  Transaction,
  TransactionDetail,
  TxListParams,
  Wallet,
} from '../../contracts'
import { ApiError, INTERNAL_CODES, VISIBLE_CODES } from '../../errors'
import { db } from '../db'
import { currentUserId } from './session'

/**
 * Dompet · FR-WALLET-01..19.
 *
 * Empat hal yang membuat berkas ini bukan sekadar "tambah saldo":
 *
 * 1. **Satu sumber saldo** (FR-WALLET-17). Tidak ada halaman yang menyimpan
 *    angkanya sendiri; prototipe punya empat saldo berbeda untuk satu dompet
 *    justru karena tiap halaman menghitung ulang.
 * 2. **Harga dihitung di sini, bukan dikirim klien.** `TopupInput` hanya membawa
 *    jumlah koin dan metode. Klien yang boleh menyebut harganya sendiri adalah
 *    klien yang boleh membeli 2.000 koin seharga seribu rupiah.
 * 3. **Koin hanya bertambah di dua tempat**, keduanya di berkas ini dan keduanya
 *    transaksional: pelunasan yang dikonfirmasi, dan rekonsiliasi otomatis.
 * 4. **Tiga jalan gagal yang berbeda**, karena akibatnya bagi pengguna berbeda:
 *    ditolak bank (`PAY-402`, uang jelas tidak berpindah), belum dipastikan
 *    (`PAY-504`, uang **mungkin** sudah berpindah), dan kedaluwarsa (`PAY-410`).
 */

const PENDING_TX_PREFIX = 'tx-topup-'

/** Batas menunggu jawaban penyedia. Lewat ini, statusnya tidak diketahui. */
const PROVIDER_TIMEOUT_MS = 90_000

/** Jeda rekonsiliasi otomatis untuk pesanan yang statusnya tidak diketahui. */
const RECONCILE_DELAY_MS = 10 * 60_000

/** Penanda pembatalan pengguna, dibedakan dari kedaluwarsa karena waktu habis. */
const CANCELLED = 'CANCELLED'

async function walletOf(userId: string): Promise<Wallet> {
  const existing = await db.wallets.get(userId)
  return existing ?? { userId, balance: 0, bonus: 0, updatedAt: new Date().toISOString() }
}

/** Nomor kuitansi `INV-NVL-YYYYMMDD-NNNN` — urut per hari. */
function receiptNumber(at: string, sequence: number): string {
  const day = todayLocalISO(new Date(at)).replaceAll('-', '')
  return `INV-NVL-${day}-${String(sequence).padStart(4, '0')}`
}

function payFailure(code: string, message: string, order: TopupOrder): ApiError {
  return new ApiError(code as never, message, { detail: `${code} · ${order.method}` })
}

/**
 * Mengkreditkan pesanan yang lunas · FR-WALLET-10.
 *
 * Satu-satunya jalan koin bertambah, dan **idempoten lewat status pesanan**:
 * pesanan yang sudah `paid` tidak pernah masuk ke sini dua kali, jadi
 * rekonsiliasi otomatis dan tombol "Cek status" tidak bisa saling menggandakan.
 */
async function settlePaid(order: TopupOrder): Promise<TopupOrder> {
  const wallet = await walletOf(order.userId)
  const now = new Date().toISOString()
  const paid: TopupOrder = { ...order, status: 'paid', failureCode: null, reconcileAt: null }

  await db.transaction('rw', db.wallets, db.transactions, db.topupOrders, async () => {
    const fresh = await db.topupOrders.get(order.id)
    if (fresh?.status === 'paid') return

    await db.wallets.put({
      userId: order.userId,
      // Bonus promo masuk ke saldo yang bisa dipakai — FR-WALLET-10
      // menampilkannya sebagai satu angka. `wallet.bonus` tetap utuh: ia
      // mencatat koin hadiah yang punya masa berlaku sendiri (Fase 12).
      balance: wallet.balance + order.coins + order.bonus,
      bonus: wallet.bonus,
      updatedAt: now,
    })
    await db.transactions.update(`${PENDING_TX_PREFIX}${order.id}`, { status: 'success' })
    await db.topupOrders.put(paid)
  })

  return paid
}

/**
 * Rekonsiliasi otomatis · `[DESAIN]`.
 *
 * Pesanan yang statusnya tidak diketahui **selesai sendiri sepuluh menit
 * kemudian**, tanpa pengguna menekan apa pun — itulah yang membuat "jangan bayar
 * dua kali" jadi saran yang bisa diikuti dan bukan jalan buntu.
 *
 * Dipanggil di awal setiap pembacaan dompet. Server sungguhan memakai kerja
 * terjadwal; di sini pembacaan berikutnyalah pemicunya.
 */
async function reconcilePending(userId: string): Promise<void> {
  const due = (await db.topupOrders.where('userId').equals(userId).toArray()).filter(
    (o) => o.status === 'pending_reconciliation' && o.reconcileAt !== null,
  )

  for (const order of due) {
    if (Date.parse(order.reconcileAt as string) > Date.now()) continue

    const paid = await settlePaid(order)
    await db.notifications.put({
      id: `notif-topup-${order.id}`,
      userId,
      type: 'dompet',
      title: 'Isi koin berhasil dipastikan',
      body: `${paid.coins + paid.bonus} koin sudah masuk ke saldomu.`,
      deepLink: `/koin/transaksi/${PENDING_TX_PREFIX}${order.id}`,
      groupKey: null,
      groupCount: 1,
      readAt: null,
      createdAt: new Date().toISOString(),
    })
  }
}

/** Pesanan yang sudah lewat batas waktunya ditandai kedaluwarsa saat dibaca. */
async function settleExpiry(order: TopupOrder): Promise<TopupOrder> {
  if (order.status !== 'pending') return order
  if (Date.parse(order.expiresAt) > Date.now()) return order

  const expired: TopupOrder = { ...order, status: 'expired' }
  await db.topupOrders.put(expired)
  return expired
}

/** Menandai pesanan menunggu rekonsiliasi, dan menjadwalkannya. */
async function markForReconcile(order: TopupOrder): Promise<TopupOrder> {
  const marked: TopupOrder = {
    ...order,
    status: 'pending_reconciliation',
    failureCode: VISIBLE_CODES.PAY_UNCONFIRMED,
    reconcileAt: new Date(Date.now() + RECONCILE_DELAY_MS).toISOString(),
  }
  await db.topupOrders.put(marked)
  return marked
}

async function orderOrThrow(orderId: string): Promise<TopupOrder> {
  const order = await db.topupOrders.get(orderId)
  if (!order || order.userId !== currentUserId()) {
    throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Pesanan isi koin ini tidak ada.')
  }
  return order
}

/** Jawaban penyedia, dibatasi 90 detik. Lewat itu statusnya tidak diketahui. */
async function askProvider(chargeId: string): Promise<'paid' | 'failed' | 'expired' | 'pending'> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      payments.getStatus(chargeId),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Penyedia tidak menjawab.')), PROVIDER_TIMEOUT_MS)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

export const walletHandlers: Pick<
  NovelovaApi,
  | 'getWallet'
  | 'listPayMethods'
  | 'createTopupOrder'
  | 'getTopupOrder'
  | 'confirmTopupOrder'
  | 'cancelTopupOrder'
  | 'listTransactions'
  | 'getTransaction'
> = {
  async getWallet(): Promise<Wallet> {
    const userId = currentUserId()
    await reconcilePending(userId)
    return walletOf(userId)
  },

  async listPayMethods(): Promise<PayMethod[]> {
    return db.payMethods.toArray()
  },

  /**
   * Membuat pesanan · FR-WALLET-04/05.
   *
   * Idempoten: kunci yang sama mengembalikan pesanan yang sama, tanpa tagihan
   * kedua dan tanpa baris ledger kedua. Dan **ditolak selama masih ada pesanan
   * yang menunggu rekonsiliasi** — di situlah "jangan bayar dua kali" ditegakkan
   * server, bukan sekadar disarankan di layar.
   */
  async createTopupOrder(input: TopupInput): Promise<TopupOrder> {
    const userId = currentUserId()
    await reconcilePending(userId)

    const seen = await db.idempotency.get(input.idempotencyKey)
    if (seen) return JSON.parse(seen.resultJson) as TopupOrder

    const unresolved = (await db.topupOrders.where('userId').equals(userId).toArray()).find(
      (o) => o.status === 'pending_reconciliation',
    )
    if (unresolved) {
      throw payFailure(
        VISIBLE_CODES.PAY_UNCONFIRMED,
        'Masih ada pembayaran yang sedang dipastikan. Tunggu sampai selesai supaya kamu tidak membayar dua kali.',
        unresolved,
      )
    }

    const isPackage = COIN_PACKAGES.some((p) => p.coins === input.coins)
    if (!isPackage && input.coins < MIN_CUSTOM_COINS) {
      throw new ApiError(
        INTERNAL_CODES.VALIDATION,
        `Pembelian kustom minimal ${MIN_CUSTOM_COINS} koin.`,
      )
    }

    const method = await db.payMethods.get(input.methodId)
    if (!method) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Metode pembayaran ini tidak ada.')

    const now = new Date().toISOString()
    const orderId = `ord-${input.idempotencyKey}`
    const bonus = bonusFor(input.coins)
    const priceRupiah = priceFor(input.coins)

    const charge = await payments.createCharge({
      orderId,
      amountRupiah: priceRupiah,
      type: method.type,
      methodName: method.name,
      bank: method.bank,
      expiryMinutes: method.expiryMinutes,
    })

    const order: TopupOrder = {
      id: orderId,
      userId,
      coins: input.coins,
      bonus,
      priceRupiah,
      method: method.name,
      methodType: method.type,
      status: 'pending',
      payload: charge.payload,
      bank: method.bank,
      expiresAt: charge.expiresAt,
      reconcileAt: null,
      failureCode: null,
      idempotencyKey: input.idempotencyKey,
      returnCtx: input.returnCtx,
      createdAt: now,
    }

    await db.transaction('rw', db.topupOrders, db.transactions, db.idempotency, async () => {
      await db.topupOrders.add(order)
      // Baris ledger lahir bersama pesanannya, berstatus `pending` — supaya
      // pembayaran yang sedang berjalan terlihat di riwayat, bukan menghilang
      // sampai lunas. Statusnya yang berubah nanti, bukan barisnya yang baru.
      await db.transactions.add({
        id: `${PENDING_TX_PREFIX}${orderId}`,
        userId,
        kind: 'topup',
        amount: input.coins + bonus,
        title: bonus > 0 ? `Isi ${input.coins} koin + ${bonus} bonus` : `Isi ${input.coins} koin`,
        refType: 'topup',
        refId: orderId,
        method: method.name,
        status: 'pending',
        createdAt: now,
      })
      await db.idempotency.add({
        key: input.idempotencyKey,
        operation: 'createTopupOrder',
        resultJson: JSON.stringify(order),
        createdAt: now,
      })
    })

    return order
  },

  async getTopupOrder(orderId: string): Promise<TopupOrder> {
    await reconcilePending(currentUserId())
    return settleExpiry(await orderOrThrow(orderId))
  },

  /**
   * Menyelesaikan pesanan · FR-WALLET-06/08/10/11.
   *
   * **Resolve berarti koin masuk; selain itu selalu melempar** — satu aturan,
   * jadi layar pemanggilnya tidak perlu menebak arti nilai kembali.
   *
   * Urutan pemeriksaannya penting. Pesanan yang sudah lunas dikembalikan lebih
   * dulu (menekan tombol dua kali bukan dua kali bayar). Pesanan yang
   * **dibatalkan** ditolak keras. Pesanan yang **kedaluwarsa karena waktu habis**
   * tidak ditolak begitu saja: transfer VA bisa mendarat setelah jendelanya
   * tutup, jadi "Saya sudah transfer" memindahkannya ke rekonsiliasi — tidak
   * pernah langsung mencetak koin.
   */
  async confirmTopupOrder(orderId: string): Promise<TopupOrder> {
    const userId = currentUserId()
    await reconcilePending(userId)
    const order = await settleExpiry(await orderOrThrow(orderId))

    if (order.status === 'paid') return order

    if (order.status === 'pending_reconciliation') {
      throw payFailure(
        VISIBLE_CODES.PAY_UNCONFIRMED,
        'Pembayaranmu sedang dipastikan ke penyedia. Jangan bayar dua kali — koinnya masuk sendiri begitu terkonfirmasi.',
        order,
      )
    }

    if (order.status === 'declined') {
      throw payFailure(
        VISIBLE_CODES.PAY_DECLINED,
        'Bank menolak pembayaran ini. Tidak ada dana yang terpotong dan saldomu tidak berubah.',
        order,
      )
    }

    if (order.status === 'expired') {
      if (order.failureCode === CANCELLED) {
        throw payFailure(
          VISIBLE_CODES.PAY_EXPIRED,
          'Pesanan ini sudah dibatalkan. Buat pesanan baru untuk melanjutkan.',
          order,
        )
      }
      const marked = await markForReconcile(order)
      throw payFailure(
        VISIBLE_CODES.PAY_UNCONFIRMED,
        'Batas waktunya sudah lewat, jadi kami memastikan dulu ke bank. Jangan transfer lagi — kalau danamu diterima, koinnya masuk sendiri.',
        marked,
      )
    }

    let status: Awaited<ReturnType<typeof askProvider>>
    try {
      status = await askProvider(`chg-${order.id}`)
    } catch {
      // Penyedia tidak menjawab: uangnya **mungkin** sudah berpindah, dan itu
      // keadaan yang sama sekali berbeda dari "ditolak".
      const marked = await markForReconcile(order)
      throw payFailure(
        VISIBLE_CODES.PAY_UNCONFIRMED,
        'Penyedia belum menjawab, jadi status pembayaranmu belum bisa dipastikan. Jangan bayar dua kali — kami periksa dan koinnya masuk sendiri bila dananya diterima.',
        marked,
      )
    }

    if (status === 'failed') {
      const declined: TopupOrder = {
        ...order,
        status: 'declined',
        failureCode: VISIBLE_CODES.PAY_DECLINED,
      }
      await db.transaction('rw', db.topupOrders, db.transactions, async () => {
        await db.topupOrders.put(declined)
        await db.transactions.update(`${PENDING_TX_PREFIX}${order.id}`, { status: 'failed' })
      })
      throw payFailure(
        VISIBLE_CODES.PAY_DECLINED,
        'Bank menolak pembayaran ini. Tidak ada dana yang terpotong dan saldomu tidak berubah.',
        declined,
      )
    }

    if (status !== 'paid') {
      const expired: TopupOrder = { ...order, status: 'expired' }
      await db.topupOrders.put(expired)
      throw payFailure(
        VISIBLE_CODES.PAY_EXPIRED,
        'Batas waktu pembayaran pesanan ini sudah lewat. Tidak ada dana yang terpotong.',
        expired,
      )
    }

    return settlePaid(order)
  },

  /**
   * Membatalkan pesanan · FR-WALLET-12.
   *
   * Ditandai `expired` beserta penanda pembatalan, bukan dihapus: penandanya
   * yang membuat "Saya sudah transfer" sesudah membatalkan ditolak, sementara
   * pesanan yang kedaluwarsa sendiri tetap boleh direkonsiliasi.
   */
  async cancelTopupOrder(orderId: string): Promise<TopupOrder> {
    const order = await orderOrThrow(orderId)
    if (order.status !== 'pending') return order

    await payments.cancel(`chg-${order.id}`)
    const cancelled: TopupOrder = { ...order, status: 'expired', failureCode: CANCELLED }

    await db.transaction('rw', db.transactions, db.topupOrders, async () => {
      await db.transactions.delete(`${PENDING_TX_PREFIX}${order.id}`)
      await db.topupOrders.put(cancelled)
    })

    return cancelled
  },

  /**
   * Riwayat · FR-WALLET-15.
   *
   * Disaring dan dipotong **di seam, bukan di DOM**. Prototipe mengumpulkan
   * barisnya sekali saat halaman dimuat lalu menyembunyikan sebagian dengan CSS,
   * sehingga baris yang lahir setelah itu tidak pernah ikut tersaring
   * (PRD 09 §7 #7).
   */
  async listTransactions(params: TxListParams): Promise<Paged<Transaction>> {
    const userId = currentUserId()
    await reconcilePending(userId)

    const all = (await db.transactions.where('userId').equals(userId).toArray())
      .filter((tx) => (params.kind ? tx.kind === params.kind : true))
      .filter((tx) => (params.status ? tx.status === params.status : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const start = (params.page - 1) * params.pageSize
    const items = all.slice(start, start + params.pageSize)

    return {
      items,
      page: params.page,
      pageSize: params.pageSize,
      total: all.length,
      hasMore: start + items.length < all.length,
    }
  },

  /**
   * Satu transaksi beserta saldo di sekitarnya · FR-WALLET-14/19.
   *
   * `balanceAfter` **dihitung mundur dari saldo sekarang**, bukan disimpan per
   * baris: saldo tersimpan yang menyimpang dari jumlah ledgernya adalah cacat
   * yang tidak bisa diperbaiki tanpa tahu mana yang benar.
   *
   * Baris yang **belum berhasil tidak menggeser saldo** — `pending`, `failed`,
   * dan `reversed` punya saldo sebelum dan sesudah yang sama persis
   * (FR-WALLET-14).
   */
  async getTransaction(txId: string): Promise<TransactionDetail> {
    const userId = currentUserId()
    await reconcilePending(userId)

    const tx = await db.transactions.get(txId)
    if (!tx || tx.userId !== userId) {
      throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Transaksi ini tidak ada.')
    }

    const all = (await db.transactions.where('userId').equals(userId).toArray()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )
    const index = all.findIndex((row) => row.id === tx.id)
    const newer = all.slice(0, index).filter((row) => row.status === 'success')
    const wallet = await walletOf(userId)
    const balanceAfter = Math.max(
      0,
      newer.reduce((sum, row) => sum - row.amount, wallet.balance),
    )
    const balanceBefore =
      tx.status === 'success' ? Math.max(0, balanceAfter - tx.amount) : balanceAfter

    const day = todayLocalISO(new Date(tx.createdAt))
    const sameDay = all
      .filter((row) => row.kind === 'topup' && todayLocalISO(new Date(row.createdAt)) === day)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    const { label, link } = await describeRef(tx)
    const linkedOrder =
      tx.refType === 'topup' && tx.refId ? await db.topupOrders.get(tx.refId) : undefined

    return {
      ...tx,
      balanceAfter,
      balanceBefore,
      priceRupiah: linkedOrder?.priceRupiah ?? null,
      bonusCoins: linkedOrder ? linkedOrder.bonus : null,
      receiptNumber:
        tx.kind === 'topup'
          ? receiptNumber(tx.createdAt, sameDay.findIndex((row) => row.id === tx.id) + 1)
          : null,
      relatedOrderId: tx.refType === 'topup' ? tx.refId : null,
      refLabel: label,
      refLink: link,
      note: tx.method ? `Dibayar lewat ${tx.method}.` : null,
    }
  },
}

/**
 * Apa yang dibeli, bukan id-nya · FR-WALLET-19.
 *
 * Baris pengeluaran menyebut cerita dan babnya serta menautkan ke sana; baris
 * hadiah menautkan ke pusat hadiah. Baris yang tidak menuju ke mana pun
 * mengembalikan `null` — tautan buntu lebih buruk daripada tidak ada tautan.
 */
async function describeRef(
  tx: Transaction,
): Promise<{ label: string | null; link: string | null }> {
  if (tx.kind === 'reward') return { label: null, link: '/hadiah' }
  if (!tx.refId) return { label: null, link: null }

  if (tx.refType === 'chapter') {
    const chapter = await db.chapters.get(tx.refId)
    if (!chapter) return { label: null, link: null }
    const story = await db.stories.get(chapter.storyId)
    return {
      label: `${story?.title ?? 'Cerita'} · Bab ${chapter.number}`,
      link: `/cerita/${chapter.storyId}/bab/${chapter.id}`,
    }
  }

  if (tx.refType === 'bundle' || tx.refType === 'story') {
    const chapter = await db.chapters.get(tx.refId)
    const storyId = chapter?.storyId ?? tx.refId
    const story = await db.stories.get(storyId)
    return { label: story?.title ?? null, link: story ? `/cerita/${story.id}` : null }
  }

  return { label: null, link: null }
}

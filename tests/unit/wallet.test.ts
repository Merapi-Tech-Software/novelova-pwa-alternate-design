import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { PROMO } from '@/lib/coin'
import { setMockPaymentOutcome } from '@/payments/mock'

/** Dompet dikembalikan ke keadaan awal tiap test — termasuk pesanan dan ledger. */
beforeEach(async () => {
  await db.wallets.put({
    userId: CURRENT_USER_ID,
    balance: 15_300,
    bonus: 420,
    updatedAt: new Date().toISOString(),
  })
  await db.topupOrders.clear()
  await db.idempotency.clear()
  await db.transactions.where('userId').equals(CURRENT_USER_ID).delete()
  await db.ownerships.where('userId').equals(CURRENT_USER_ID).delete()
  await db.notifications.clear()
})

const order = (coins: number, key: string, methodId = 'gopay') =>
  api.createTopupOrder({ coins, methodId, returnCtx: null, idempotencyKey: key })

describe('pesanan isi koin · FR-WALLET-04/05', () => {
  it('dua panggilan dengan kunci sama menghasilkan satu pesanan dan satu baris ledger', async () => {
    const first = await order(250, 'kunci-topup-1')
    const second = await order(250, 'kunci-topup-1')

    expect(second.id).toBe(first.id)
    expect(await db.topupOrders.count()).toBe(1)
    expect(await db.transactions.where('userId').equals(CURRENT_USER_ID).count()).toBe(1)
  })

  it('harga dan masa berlaku ditentukan server, bukan klien', async () => {
    const viaEwallet = await order(250, 'kunci-topup-2', 'dana')
    const viaVa = await order(250, 'kunci-topup-3', 'va-bca')

    expect(viaEwallet.priceRupiah).toBe(30_000)
    expect(viaVa.bank).toBe('Bank BCA')
    // 15 menit vs 24 jam — batasnya milik metode, bukan angka tetap.
    expect(Date.parse(viaVa.expiresAt) - Date.parse(viaEwallet.expiresAt)).toBeGreaterThan(
      23 * 3_600_000,
    )
  })

  it('kustom di bawah 100 koin ditolak, paket 50 koin diterima', async () => {
    await expect(order(77, 'kunci-topup-4')).rejects.toMatchObject({ code: 'VALIDATION' })
    await expect(order(50, 'kunci-topup-5')).resolves.toMatchObject({ coins: 50 })
  })
})

describe('bonus promo · FR-WALLET-01', () => {
  it('hanya berlaku pada 500 koin persis — 501 tidak dapat apa-apa', async () => {
    expect((await order(PROMO.coins, 'kunci-promo-1')).bonus).toBe(PROMO.bonus)
    expect((await order(PROMO.coins + 1, 'kunci-promo-2')).bonus).toBe(0)
    expect((await order(PROMO.coins - 1, 'kunci-promo-3')).bonus).toBe(0)
  })
})

describe('pelunasan · FR-WALLET-10', () => {
  it('koin masuk sekali walau tombol ditekan dua kali', async () => {
    const created = await order(PROMO.coins, 'kunci-bayar-1')

    const paid = await api.confirmTopupOrder(created.id)
    const again = await api.confirmTopupOrder(created.id)

    expect(paid.status).toBe('paid')
    expect(again.status).toBe('paid')
    expect((await api.getWallet()).balance).toBe(15_300 + 550)
  })

  it('baris ledger berubah status, bukan bertambah', async () => {
    const created = await order(100, 'kunci-bayar-2')
    await api.confirmTopupOrder(created.id)

    const rows = await db.transactions.where('userId').equals(CURRENT_USER_ID).toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ kind: 'topup', status: 'success', amount: 100 })
  })

  it('pesanan kedaluwarsa tidak mencetak koin — ia masuk rekonsiliasi', async () => {
    const created = await order(100, 'kunci-bayar-3')
    await db.topupOrders.update(created.id, {
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
    })

    // Transfer VA bisa mendarat setelah jendelanya tutup, jadi "Saya sudah
    // transfer" memindahkannya ke rekonsiliasi — bukan langsung menambah saldo.
    await expect(api.confirmTopupOrder(created.id)).rejects.toMatchObject({ code: 'PAY-504' })
    expect((await api.getWallet()).balance).toBe(15_300)
    expect((await db.topupOrders.get(created.id))?.status).toBe('pending_reconciliation')
  })

  it('pesanan yang dibatalkan tidak bisa dilunasi belakangan', async () => {
    const created = await order(100, 'kunci-bayar-4')
    await api.cancelTopupOrder(created.id)

    await expect(api.confirmTopupOrder(created.id)).rejects.toMatchObject({ code: 'PAY-410' })
    expect((await api.getWallet()).balance).toBe(15_300)
    expect(await db.transactions.where('userId').equals(CURRENT_USER_ID).count()).toBe(0)
  })
})

describe('satu sumber saldo · FR-WALLET-17', () => {
  it('beli bab lalu isi koin: getWallet dan buku besar tidak pernah berselisih', async () => {
    await api.unlockChapter({
      chapterId: 's1-c8',
      source: 'coin',
      idempotencyKey: 'kunci-satu-saldo-beli',
    })
    const created = await order(PROMO.coins, 'kunci-satu-saldo-isi')
    await api.confirmTopupOrder(created.id)

    const wallet = await api.getWallet()
    const ledger = (await db.transactions.where('userId').equals(CURRENT_USER_ID).toArray())
      .filter((tx) => tx.status === 'success')
      .reduce((sum, tx) => sum + tx.amount, 15_300)

    expect(wallet.balance).toBe(ledger)

    // Dan `getTransaction` membaca saldo yang sama, bukan angkanya sendiri.
    const newest = (await api.listTransactions({ page: 1, pageSize: 1 })).items[0]
    expect((await api.getTransaction(newest?.id ?? '')).balanceAfter).toBe(wallet.balance)
  })
})

describe('tiga jalan gagal · PAY-402 · PAY-504 · PAY-410', () => {
  afterEach(() => setMockPaymentOutcome('paid'))

  it('ditolak bank: pesanan mati, ledger gagal, saldo tidak berubah', async () => {
    const created = await order(250, 'kunci-gagal-1')
    setMockPaymentOutcome('declined')

    await expect(api.confirmTopupOrder(created.id)).rejects.toMatchObject({ code: 'PAY-402' })

    expect((await db.topupOrders.get(created.id))?.status).toBe('declined')
    expect((await db.transactions.get(`tx-topup-${created.id}`))?.status).toBe('failed')
    expect((await api.getWallet()).balance).toBe(15_300)
  })

  it('pesanan yang ditolak tidak bisa dicoba lagi lewat pesanan yang sama', async () => {
    const created = await order(250, 'kunci-gagal-2')
    setMockPaymentOutcome('declined')
    await expect(api.confirmTopupOrder(created.id)).rejects.toThrow()

    // Kembali normal pun pesanannya tetap mati — yang benar adalah pesanan baru.
    setMockPaymentOutcome('paid')
    await expect(api.confirmTopupOrder(created.id)).rejects.toMatchObject({ code: 'PAY-402' })
    expect((await api.getWallet()).balance).toBe(15_300)
  })

  it('penyedia tidak menjawab: pesanan menunggu rekonsiliasi, saldo utuh', async () => {
    const created = await order(250, 'kunci-gagal-3')
    setMockPaymentOutcome('unconfirmed')

    await expect(api.confirmTopupOrder(created.id)).rejects.toMatchObject({ code: 'PAY-504' })

    const stored = await db.topupOrders.get(created.id)
    expect(stored?.status).toBe('pending_reconciliation')
    expect(stored?.reconcileAt).not.toBeNull()
    expect((await api.getWallet()).balance).toBe(15_300)
  })
})

describe('rekonsiliasi otomatis · pending_reconciliation', () => {
  afterEach(() => setMockPaymentOutcome('paid'))

  async function stuckOrder(key: string) {
    const created = await order(500, key)
    setMockPaymentOutcome('unconfirmed')
    await expect(api.confirmTopupOrder(created.id)).rejects.toThrow()
    setMockPaymentOutcome('paid')
    return created
  }

  it('menolak pembayaran ulang selama statusnya belum pasti', async () => {
    const created = await stuckOrder('kunci-rekon-1')

    // Pesanan itu sendiri, dan pesanan baru mana pun: keduanya ditolak.
    await expect(api.confirmTopupOrder(created.id)).rejects.toMatchObject({ code: 'PAY-504' })
    await expect(order(250, 'kunci-rekon-1b')).rejects.toMatchObject({ code: 'PAY-504' })
    expect((await api.getWallet()).balance).toBe(15_300)
  })

  it('setelah tenggatnya lewat, koin masuk satu kali tanpa aksi pengguna', async () => {
    const created = await stuckOrder('kunci-rekon-2')
    await db.topupOrders.update(created.id, {
      reconcileAt: new Date(Date.now() - 1_000).toISOString(),
    })

    // Membaca dompet saja sudah cukup — tidak ada tombol yang ditekan.
    expect((await api.getWallet()).balance).toBe(15_300 + 550)
    expect((await api.getWallet()).balance).toBe(15_300 + 550)

    const rows = await db.transactions.where('userId').equals(CURRENT_USER_ID).toArray()
    expect(rows.filter((tx) => tx.status === 'success')).toHaveLength(1)
    expect(await db.notifications.get(`notif-topup-${created.id}`)).toMatchObject({
      type: 'dompet',
      deepLink: `/koin/transaksi/tx-topup-${created.id}`,
    })
  })
})

describe('detail transaksi · FR-WALLET-14/19', () => {
  it('baris yang belum berhasil tidak menggeser saldo', async () => {
    const created = await order(250, 'kunci-detail-1')
    const detail = await api.getTransaction(`tx-topup-${created.id}`)

    expect(detail.status).toBe('pending')
    expect(detail.balanceBefore).toBe(detail.balanceAfter)
    expect(detail.receiptNumber).toMatch(/^INV-NVL-\d{8}-\d{4}$/)
  })

  it('baris pengeluaran menyebut cerita dan babnya, dan menautkan ke sana', async () => {
    await api.unlockChapter({
      chapterId: 's1-c8',
      source: 'coin',
      idempotencyKey: 'kunci-detail-2',
    })
    const detail = await api.getTransaction('tx-kunci-detail-2')

    expect(detail.refLabel).toMatch(/· Bab 8$/)
    expect(detail.refLink).toBe('/cerita/s1/bab/s1-c8')
    expect(detail.balanceBefore - detail.balanceAfter).toBe(2_000)
  })

  it('id yang tidak ada ditolak, bukan dijawab dengan transaksi lain', async () => {
    await expect(api.getTransaction('tx-tidak-ada')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})

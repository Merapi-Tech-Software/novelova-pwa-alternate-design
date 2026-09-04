import { z } from 'zod'
import {
  IdempotentSchema,
  IdSchema,
  IsoDateTimeSchema,
  ListParamsSchema,
  LocalDateSchema,
} from './common'

/** prd_09 · FR-WALLET-* */

/**
 * **Satu-satunya sumber saldo.** Prototipe punya empat angka saldo berbeda untuk
 * satu dompet karena tiap halaman menyimpannya sendiri (FR-WALLET-17).
 */
export const WalletSchema = z.object({
  userId: IdSchema,
  balance: z.number().int().nonnegative(),
  /** Koin bonus punya masa berlaku sendiri — karena itu dipisah dari `balance`. */
  bonus: z.number().int().nonnegative(),
  updatedAt: IsoDateTimeSchema,
})
export type Wallet = z.infer<typeof WalletSchema>

export const TxKindSchema = z.enum(['topup', 'spend', 'reward', 'refund', 'pending'])
export const TxStatusSchema = z.enum(['success', 'pending', 'failed', 'reversed'])
export type TxStatus = z.infer<typeof TxStatusSchema>

export const TransactionSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  kind: TxKindSchema,
  /** Positif menambah saldo, negatif mengurangi. Refund adalah baris balik. */
  amount: z.number().int(),
  title: z.string(),
  refType: z.enum(['chapter', 'bundle', 'story', 'topup', 'mission', 'checkin', 'withdrawal']),
  refId: IdSchema.nullable(),
  method: z.string().nullable(),
  status: TxStatusSchema,
  createdAt: IsoDateTimeSchema,
})
export type Transaction = z.infer<typeof TransactionSchema>

/** FR-WALLET-19 — tiap transaksi punya halamannya sendiri, bukan sekadar baris. */
export const TransactionDetailSchema = TransactionSchema.extend({
  balanceAfter: z.number().int().nonnegative(),
  /** Saldo tepat sebelum baris ini — pasangan wajib `balanceAfter`. */
  balanceBefore: z.number().int().nonnegative(),
  receiptNumber: z.string().nullable(),
  relatedOrderId: IdSchema.nullable(),
  /** Rupiah yang dibayar — hanya ada pada baris isi koin. */
  priceRupiah: z.number().int().nonnegative().nullable(),
  /** Bonus promo pesanannya; `0` berarti tidak ada, `null` berarti bukan isi koin. */
  bonusCoins: z.number().int().nonnegative().nullable(),
  /** *"Cinta di Balik Kontrak · Bab 47"* — apa yang dibeli, bukan id-nya. */
  refLabel: z.string().nullable(),
  /** Tujuan baris ini: bab yang dibuka, pusat hadiah, atau tidak ke mana-mana. */
  refLink: z.string().nullable(),
  note: z.string().nullable(),
})
export type TransactionDetail = z.infer<typeof TransactionDetailSchema>

export const PayMethodTypeSchema = z.enum(['ewallet', 'qris', 'va'])

export const PayMethodSchema = z.object({
  id: IdSchema,
  name: z.string(),
  type: PayMethodTypeSchema,
  /** Menit sampai kedaluwarsa — 15 e-wallet · 30 QRIS · 1440 VA. */
  expiryMinutes: z.number().int().positive(),
  bank: z.string().nullable(),
})
export type PayMethod = z.infer<typeof PayMethodSchema>

export const CoinPackageSchema = z.object({
  id: IdSchema,
  coins: z.number().int().positive(),
  priceRupiah: z.number().int().positive(),
  bonusCoins: z.number().int().nonnegative(),
  note: z.string(),
})
export type CoinPackage = z.infer<typeof CoinPackageSchema>

/**
 * Status pesanan isi koin.
 *
 * `pending_reconciliation` bukan sekadar "gagal" (arch §1.4, layar 34): penyedia
 * tidak menjawab, jadi uangnya **mungkin** sudah berpindah. Selama status ini
 * tombol bayar dikunci — membayar dua kali merugikan lebih besar daripada
 * menunggu sepuluh menit.
 */
export const TopupStatusSchema = z.enum([
  'pending',
  'paid',
  'expired',
  'declined',
  'pending_reconciliation',
])
export type TopupStatus = z.infer<typeof TopupStatusSchema>

/** Ke mana pengguna dikembalikan setelah bayar (FR-WALLET-18, FR-READ-17). */
export const ReturnContextSchema = z.object({
  route: z.string(),
  chapterId: IdSchema.nullable(),
  needCoins: z.number().int().nonnegative().nullable(),
})

export const TopupOrderSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  coins: z.number().int().positive(),
  bonus: z.number().int().nonnegative(),
  priceRupiah: z.number().int().positive(),
  method: z.string(),
  methodType: PayMethodTypeSchema,
  status: TopupStatusSchema,
  /**
   * Jawaban penyedia, berbeda per tipe: `ewallet` → deeplink · `qris` → string
   * QR · `va` → nomor virtual account.
   */
  payload: z.string().nullable(),
  /** Label bank untuk layar VA (`"Bank BCA"`); `null` untuk metode lain. */
  bank: z.string().nullable(),
  expiresAt: IsoDateTimeSchema,
  /** Kapan rekonsiliasi otomatis dijadwalkan, saat `pending_reconciliation`. */
  reconcileAt: IsoDateTimeSchema.nullable(),
  failureCode: z.string().nullable(),
  idempotencyKey: IdSchema,
  returnCtx: ReturnContextSchema.nullable(),
  createdAt: IsoDateTimeSchema,
})
export type TopupOrder = z.infer<typeof TopupOrderSchema>

export const TopupInputSchema = IdempotentSchema.extend({
  coins: z.number().int().min(1),
  methodId: IdSchema,
  returnCtx: ReturnContextSchema.nullable().default(null),
})
export type TopupInput = z.infer<typeof TopupInputSchema>

/**
 * Riwayat transaksi disaring **di seam, bukan di DOM** — baris di-query ulang
 * tiap saringan berganti (FR-WALLET-15, memperbaiki PRD 09 §7 #7).
 */
export const TxListParamsSchema = ListParamsSchema.extend({
  kind: TxKindSchema.optional(),
  /**
   * Saringan "Menunggu" memilih **status**, bukan jenis: isi ulang yang belum
   * lunas tetap berjenis `topup`, dan menyembunyikannya dari saringan isi ulang
   * akan membuat pesanan yang sedang berjalan lenyap dari riwayat.
   */
  status: TxStatusSchema.optional(),
})
export type TxListParams = z.infer<typeof TxListParamsSchema>

/** Kuota iklan dihitung **per tanggal lokal**, bukan per sesi. FR-READ-08/18. */
export const AdQuotaSchema = z.object({
  userId: IdSchema,
  date: LocalDateSchema,
  used: z.number().int().nonnegative(),
  max: z.number().int().positive(),
})
export type AdQuota = z.infer<typeof AdQuotaSchema>

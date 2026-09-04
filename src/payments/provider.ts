/**
 * Antarmuka penyedia pembayaran · architecture.md §11.1.
 *
 * **Tidak menyebut Dexie, TanStack, atau React.** Lapisan ini ada supaya
 * mengganti Midtrans dengan penyedia lain berarti menulis satu berkas baru,
 * bukan menyisir seluruh alur isi koin.
 *
 * Yang **nyata** sejak v1: tiga langkah pemilihan, aturan promo, timer
 * kedaluwarsa per metode, penulisan ledger, dan kunci idempotency. Yang palsu
 * hanya jawaban penyedianya.
 */

export type ChargeType = 'ewallet' | 'qris' | 'va'

/** `pending` → belum dibayar · `paid` → dana diterima · sisanya jalan buntu. */
export type ChargeStatus = 'pending' | 'paid' | 'expired' | 'failed'

/**
 * Permintaan tagihan.
 *
 * Sengaja **bukan** `TopupOrder`: penyedia pembayaran tidak perlu tahu soal
 * koin, bonus, atau konteks kembali — dan arah impor tidak boleh naik ke
 * `api/contracts`.
 */
export interface ChargeRequest {
  orderId: string
  amountRupiah: number
  type: ChargeType
  /** Nama metode seperti yang dilihat pengguna: `"GoPay"`, `"BCA Virtual Account"`. */
  methodName: string
  /** Hanya untuk `va`. */
  bank: string | null
  expiryMinutes: number
}

export interface Charge {
  id: string
  type: ChargeType
  /**
   * Isinya berbeda per tipe: `ewallet` → deeplink · `qris` → string QR ·
   * `va` → nomor virtual account.
   */
  payload: string
  expiresAt: string
}

export interface PaymentProvider {
  createCharge(request: ChargeRequest): Promise<Charge>
  getStatus(chargeId: string): Promise<ChargeStatus>
  cancel(chargeId: string): Promise<void>
}

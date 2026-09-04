import type { Charge, ChargeRequest, ChargeStatus, PaymentProvider } from './provider'

/**
 * Penyedia sungguhan · v2.
 *
 * Sengaja **melempar, bukan mengembalikan nilai kosong**: penyedia pembayaran
 * yang diam-diam mengembalikan `pending` untuk semua orang jauh lebih berbahaya
 * daripada yang gagal keras saat dipasang setengah jalan.
 */
function belumAda(fn: string): never {
  throw new Error(`payments/midtrans: ${fn} belum diimplementasikan (v2).`)
}

export const midtransPaymentProvider: PaymentProvider = {
  createCharge(_request: ChargeRequest): Promise<Charge> {
    return belumAda('createCharge')
  },
  getStatus(_chargeId: string): Promise<ChargeStatus> {
    return belumAda('getStatus')
  },
  cancel(_chargeId: string): Promise<void> {
    return belumAda('cancel')
  },
}

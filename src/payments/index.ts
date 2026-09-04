import { mockPaymentProvider } from './mock'
import type { PaymentProvider } from './provider'

export type { Charge, ChargeRequest, ChargeStatus, PaymentProvider } from './provider'

/**
 * Penyedia yang dipakai runtime.
 *
 * Satu baris, bukan factory: hanya ada dua kemungkinan dan penggantinya belum
 * lahir. Saat `midtrans.ts` siap, baris ini yang berubah — bukan pemanggilnya.
 */
export const payments: PaymentProvider = mockPaymentProvider

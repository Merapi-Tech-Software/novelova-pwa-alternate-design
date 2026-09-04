import type { Charge, ChargeRequest, ChargeStatus, PaymentProvider } from './provider'

/**
 * Penyedia tiruan v1.
 *
 * **Yang dipalsukan hanya jawaban penyedia.** Nomor VA, string QR, dan deeplink
 * dibuat di sini; masa berlakunya sungguhan dan dihitung dari `expiryMinutes`
 * metode, bukan dari angka tetap.
 *
 * `getStatus` mengembalikan `paid` untuk tagihan yang belum kedaluwarsa —
 * karena satu-satunya pemanggilnya adalah tombol "Cek status" / "Saya sudah
 * transfer", yaitu pengguna yang menyatakan sudah membayar. Tagihan lewat batas
 * waktu tetap `expired`: itulah pengaman yang membuat "Saya sudah transfer"
 * setelah 24 jam tidak bisa mencetak koin.
 */

const charges = new Map<string, Charge>()

/**
 * Jawaban yang akan diberikan penyedia tiruan berikutnya.
 *
 * Ketiga jalan gagal pembayaran hanya terjadi berbulan-bulan sekali di dunia
 * nyata, jadi tanpa sakelar ini tidak satu pun layarnya pernah sempat diperiksa.
 * Disetel dari `/dev/kitchen-sink`; nilai bawaannya selalu `paid`.
 */
export type MockOutcome = 'paid' | 'declined' | 'unconfirmed'
let outcome: MockOutcome = 'paid'

export function setMockPaymentOutcome(next: MockOutcome): void {
  outcome = next
}

export function getMockPaymentOutcome(): MockOutcome {
  return outcome
}

/** `8801 7742 0938 21` — dikelompokkan empat digit seperti di kanvas. */
function vaNumber(orderId: string): string {
  let hash = 0
  for (const ch of orderId) hash = (hash * 31 + ch.charCodeAt(0)) % 100_000_000
  const digits = `8801${String(hash).padStart(8, '0')}${orderId.length % 10}`
  return (digits.match(/.{1,4}/g) ?? [digits]).join(' ')
}

function payloadFor(request: ChargeRequest): string {
  if (request.type === 'va') return vaNumber(request.orderId)
  if (request.type === 'qris') return `00020101021226${request.orderId}5802ID5910NOVELOVA6304`
  return `${request.methodName.toLowerCase()}://pay?order=${request.orderId}`
}

export const mockPaymentProvider: PaymentProvider = {
  async createCharge(request: ChargeRequest): Promise<Charge> {
    const charge: Charge = {
      id: `chg-${request.orderId}`,
      type: request.type,
      payload: payloadFor(request),
      expiresAt: new Date(Date.now() + request.expiryMinutes * 60_000).toISOString(),
    }
    // ponytail: peta di memori — hilang saat reload, dan itu cukup. Kebenaran
    // pesanan ada di tabel `topupOrders`; kalau `getStatus` perlu bertahan
    // lintas muat, pindahkan peta ini ke Dexie.
    charges.set(charge.id, charge)
    return charge
  },

  async getStatus(chargeId: string): Promise<ChargeStatus> {
    const charge = charges.get(chargeId)
    if (!charge) return 'pending'
    if (Date.parse(charge.expiresAt) <= Date.now()) return 'expired'

    // `unconfirmed` **melempar**, tidak mengembalikan nilai: penyedia yang tidak
    // menjawab adalah kegagalan yang berbeda dari penyedia yang menjawab
    // “belum” — dan hanya yang pertama berarti uangnya mungkin sudah berpindah.
    if (outcome === 'unconfirmed') throw new Error('Penyedia tidak menjawab.')
    return outcome === 'declined' ? 'failed' : 'paid'
  },

  async cancel(chargeId: string): Promise<void> {
    charges.delete(chargeId)
  },
}

import { describe, expect, it } from 'vitest'
import { netAfterFee, parseAmountInput, refusePayout } from '@/lib/payout'

describe('pembersihan masukan jumlah · FR-EARN-08', () => {
  it('membuang seluruh karakter non-digit, jadi format apa pun terbaca sama', () => {
    expect(parseAmountInput('5000000')).toBe(5_000_000)
    expect(parseAmountInput('1.000.000')).toBe(1_000_000)
    expect(parseAmountInput('Rp 1 000 000')).toBe(1_000_000)
  })

  it('huruf dianggap 0 tanpa error — bukan NaN yang menjalar ke ringkasan', () => {
    expect(parseAmountInput('abc')).toBe(0)
    expect(parseAmountInput('')).toBe(0)
    expect(Number.isNaN(parseAmountInput('halo'))).toBe(false)
  })
})

describe('perhitungan otomatis · FR-EARN-08', () => {
  it('bersih = diminta − biaya admin', () => {
    expect(netAfterFee(5_000_000)).toBe(4_995_000)
    expect(netAfterFee(1_000_000)).toBe(995_000)
  })

  /** Angka merah di ringkasan pencairan terbaca seperti utang. */
  it('3000 di bawah biaya admin menghasilkan bersih Rp 0, bukan negatif', () => {
    expect(netAfterFee(3_000)).toBe(0)
    expect(netAfterFee(0)).toBe(0)
  })
})

describe('tangga validasi lima tingkat · FR-EARN-11', () => {
  const ok = {
    amount: 200_000,
    available: 1_000_000,
    min: 100_000,
    payoutVerified: true,
    twoFactor: true,
  }

  it('pengajuan yang memenuhi kelimanya tidak ditolak', () => {
    expect(refusePayout(ok)).toBeNull()
  })

  it('berhenti pada kesalahan pertama, bukan mengumpulkan kelimanya', () => {
    // Jumlah nol **dan** rekening belum terverifikasi **dan** 2FA mati:
    // yang dilaporkan hanya tingkat 1.
    const refusal = refusePayout({
      ...ok,
      amount: 0,
      payoutVerified: false,
      twoFactor: false,
    })
    expect(refusal?.level).toBe(1)
    expect(refusal?.message).toMatch(/Masukkan jumlah/)
  })

  it('Rp 50.000 ditolak di tingkat 2 beserta batasnya', () => {
    const refusal = refusePayout({ ...ok, amount: 50_000 })
    expect(refusal?.level).toBe(2)
    expect(refusal?.message).toMatch(/Rp 100\.000/)
  })

  it('Rp 200.000 dengan saldo Rp 150.000 ditolak di tingkat 3', () => {
    const refusal = refusePayout({ ...ok, amount: 200_000, available: 150_000 })
    expect(refusal?.level).toBe(3)
    expect(refusal?.message).toMatch(/melebihi saldo tersedia Rp 150\.000/)
    // Menyentuh uang → wajib menyatakan uangnya aman (arch §1.4).
    expect(refusal?.message).toMatch(/tidak berpindah/)
  })

  it('rekening belum terverifikasi ditahan di tingkat 4, dengan jalan memperbaikinya', () => {
    const refusal = refusePayout({ ...ok, payoutVerified: false })
    expect(refusal?.level).toBe(4)
    expect(refusal?.link).toBeTruthy()
  })

  it('2 langkah mati ditahan di tingkat 5, dengan tautan ke halaman keamanan', () => {
    const refusal = refusePayout({ ...ok, twoFactor: false })
    expect(refusal?.level).toBe(5)
    expect(refusal?.link).toBe('/pengaturan/keamanan')
  })

  it('syarat akun diperiksa **setelah** jumlah — tidak menyuruh ke layar lain sia-sia', () => {
    // Jumlah masih di bawah minimum: penulis belum perlu tahu soal 2FA.
    const refusal = refusePayout({ ...ok, amount: 1_000, twoFactor: false })
    expect(refusal?.level).toBe(2)
  })
})

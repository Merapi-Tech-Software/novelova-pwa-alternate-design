/**
 * Perhitungan pencairan · FR-EARN-08 & FR-EARN-11.
 *
 * Fungsi murni, tanpa React dan tanpa `api` — karena aturannya ditegakkan **dua
 * kali**: di layar supaya tombolnya nonaktif sebelum ditekan, dan di server
 * supaya layar yang dilewati tetap ditolak. Menaruhnya di sini membuat kedua
 * sisi memakai kalimat yang sama persis.
 */

/** Batas dan biaya bawaan. Yang **ditampilkan** selalu datang dari server. */
export const WITHDRAW_MIN = 100_000
export const WITHDRAW_FEE = 5_000

/**
 * Membersihkan masukan jumlah · FR-EARN-08.
 *
 * Seluruh karakter non-digit dibuang, jadi penulis boleh mengetik `1.000.000`,
 * `1 000 000`, atau `Rp 1.000.000` — ketiganya terbaca sama. Masukan kosong atau
 * yang tidak mengandung digit sama sekali bernilai **0**, bukan `NaN`: angka
 * yang bocor sebagai `NaN` akan menjalar ke seluruh ringkasan biaya.
 */
export function parseAmountInput(raw: string): number {
  const digits = raw.replace(/\D/g, '')
  if (digits === '') return 0
  const value = Number.parseInt(digits, 10)
  return Number.isFinite(value) ? value : 0
}

/**
 * Diterima bersih · FR-EARN-08. **Dijepit minimum nol**: jumlah di bawah biaya
 * admin tidak boleh tampil negatif, karena angka merah di ringkasan pencairan
 * terbaca seperti utang.
 */
export function netAfterFee(amount: number, fee: number = WITHDRAW_FEE): number {
  return Math.max(0, amount - fee)
}

export interface PayoutGuard {
  amount: number
  available: number
  min: number
  payoutVerified: boolean
  twoFactor: boolean
}

export interface PayoutRefusal {
  message: string
  /** Tautan ke tempat syaratnya bisa dipenuhi — hanya untuk yang bisa diurus. */
  link?: string
  /** Urutan tangga, 1–5. Dipakai test supaya kegagalan menyebut tingkatnya. */
  level: 1 | 2 | 3 | 4 | 5
}

/**
 * Tangga validasi lima tingkat · FR-EARN-11.
 *
 * **Berhenti pada kesalahan pertama**, pola yang sama dengan formulir cerita
 * (FR-STUDIO-16): menampilkan lima keluhan sekaligus membuat penulis memperbaiki
 * lima hal padahal satu pun belum tentu benar.
 *
 * Urutannya bukan selera: yang paling murah diperiksa lebih dulu, dan syarat
 * akun (rekening, 2FA) terakhir karena memperbaikinya menuntut pergi ke layar
 * lain — tidak sopan menyuruh penulis ke sana kalau jumlahnya toh belum valid.
 */
/**
 * `Rp 100.000` dengan spasi **biasa**, bukan `formatRupiah`.
 *
 * `Intl` menyisipkan non-breaking space antara `Rp` dan angkanya (CLAUDE.md §8),
 * dan pesan ini dibandingkan sebagai string di test serta digabung ke kalimat
 * server — spasi yang terlihat sama tetapi berbeda kode adalah sumber kegagalan
 * yang mustahil dibaca.
 */
function rupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`
}

export function refusePayout(input: PayoutGuard): PayoutRefusal | null {
  if (input.amount <= 0) return { level: 1, message: 'Masukkan jumlah penarikan.' }

  if (input.amount < input.min) {
    return {
      level: 2,
      message: `Penarikan minimum ${rupiah(input.min)}.`,
    }
  }

  if (input.amount > input.available) {
    return {
      level: 3,
      message: `Jumlah melebihi saldo tersedia ${rupiah(input.available)}. Uangmu tidak berpindah.`,
    }
  }

  if (!input.payoutVerified) {
    return {
      level: 4,
      message: 'Verifikasi rekening tujuan terlebih dahulu.',
      link: '/profil/ubah',
    }
  }

  if (!input.twoFactor) {
    return {
      level: 5,
      message: 'Aktifkan verifikasi 2 langkah untuk mencairkan dana.',
      link: '/pengaturan/keamanan',
    }
  }

  return null
}

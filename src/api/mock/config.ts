/**
 * Konfigurasi server tiruan · PRD 08 §7 #7 & #15.
 *
 * Bagi hasil dan kurs koin **milik server**, bukan konstanta di kode klien.
 * `lib/coin.ts` menyimpan nilai bawaan yang sama untuk perhitungan sisi
 * pembaca, tetapi angka yang **ditampilkan sebagai kebijakan** — 80/20 pada
 * panel harga bab, kurs pada layar pencairan — harus datang dari sini, supaya
 * mengubah kebijakan tidak menuntut rilis baru.
 *
 * Satu tempat, bukan satu per handler: `AUTHOR_SHARE_PCT` sempat hidup di
 * `handlers/chapters.ts` sendirian, dan handler penghasilan yang menyalinnya
 * akan berselisih diam-diam pada perubahan berikutnya.
 */
export const SERVER_CONFIG = {
  /** Porsi penulis dari setiap koin yang dibelanjakan pembaca. */
  authorSharePct: 80,
  /** Rupiah per koin saat penghasilan dicairkan. */
  coinRateRupiah: 130,
  /** Biaya admin per pengajuan pencairan. */
  withdrawFeeRupiah: 5_000,
  /** Batas minimum satu pengajuan. */
  withdrawMinRupiah: 100_000,
} as const

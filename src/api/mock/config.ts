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
  /**
   * Berapa bab yang harus terbuka **otomatis** sebelum tawaran bundel muncul
   * (FR-READ-19, §1.21).
   *
   * Di sini, bukan di `lib/coin.ts`: ia tuas kebijakan pemasaran, dan §1.13
   * sudah menetapkan angka kebijakan harus bisa berubah tanpa rilis baru.
   */
  bundleOfferAfter: 10,
  /**
   * Cara cerita 18+ diperlakukan bagi akun yang **belum** terverifikasi dewasa
   * · A1. Keputusan pengguna: **keduanya dibangun, backend yang memilih.**
   *
   * - `gated`  — kartu & halaman detail tetap tampil berlencana 18+; yang
   *   ditahan **isi bab**-nya. Pembaca tahu ceritanya ada dan kenapa terkunci.
   * - `hidden` — tidak dikirim sama sekali: tidak di beranda, pencarian, maupun
   *   tautan langsung (`NOT_FOUND`). Paling ketat; tautan dari teman jadi buntu.
   *
   * Nilai bawaan `gated`. Di server tiruan bisa ditukar dari `/dev/kitchen-sink`
   * (`kv` `policy:adultMode`) supaya keduanya bisa dilihat tanpa rilis.
   */
  adultContentMode: 'gated' as 'gated' | 'hidden',
} as const

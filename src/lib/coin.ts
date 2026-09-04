/**
 * Konstanta ekonomi koin dan format angkanya.
 *
 * Terkunci di sini dan **tidak boleh diduplikasi** (architecture.md §6.3).
 * Prototipe punya empat saldo berbeda untuk satu dompet karena angkanya ditulis
 * ulang di tiap halaman; itu yang dicegah berkas ini.
 */

/** Rupiah per koin. FR-WALLET-03. */
export const COIN_RATE = 130

/** Nominal terkecil untuk isi koin kustom. FR-WALLET-03. */
export const MIN_CUSTOM_COINS = 100

/** Harga buka satu bab. */
export const PRICE_SINGLE = 1_500
/** Bundel 10 bab — hemat ±5%. */
export const PRICE_BUNDLE_10 = 12_000
/** Akses penuh cerita — hemat ±10%. */
export const PRICE_FULL = 36_900

/** Batas buka bab lewat iklan per hari. FR-READ-08/18. */
export const AD_QUOTA_MAX = 3

/** Paket promo di layar isi koin. */
export const PROMO = { coins: 500, bonus: 50 } as const

/**
 * Enam paket siap pilih · FR-WALLET-02.
 *
 * Harga per koin **menurun seiring besarnya paket** — itu insentifnya, dan
 * `note` menyebut angkanya supaya pembaca tidak perlu membagi sendiri. Harganya
 * tidak dihitung dengan `calcPrice`: paket besar sengaja lebih murah daripada
 * kurs dasar.
 */
export const COIN_PACKAGES = [
  { id: 'pkg-50', coins: 50, priceRupiah: 7_000, note: 'Rp 140/koin' },
  { id: 'pkg-100', coins: 100, priceRupiah: 13_000, note: 'Rp 130/koin' },
  { id: 'pkg-250', coins: 250, priceRupiah: 30_000, note: 'Rp 120/koin' },
  { id: 'pkg-500', coins: 500, priceRupiah: 55_000, note: '+50 koin bonus' },
  { id: 'pkg-1000', coins: 1_000, priceRupiah: 99_000, note: 'Rp 99/koin' },
  { id: 'pkg-2000', coins: 2_000, priceRupiah: 185_000, note: 'Rp 92,5/koin' },
] as const

/**
 * Bonus promo — **hanya bila jumlahnya persis `PROMO.coins`** (FR-WALLET-01).
 *
 * 500 lewat kolom kustom tetap dapat bonus; 501 tidak. Batas yang tampak
 * sewenang-wenang ini adalah aturan promonya, bukan pembulatan.
 */
export function bonusFor(coins: number): number {
  return coins === PROMO.coins ? PROMO.bonus : 0
}

/**
 * Paket terkecil yang menutup kekurangan koin · FR-WALLET-18.
 *
 * Dipakai saat pembaca datang dari gerbang bab: paket itu yang disorot, tetapi
 * yang lain **tetap dapat dipilih** — menyorot bukan mengunci.
 */
export function smallestPackageFor(needCoins: number): (typeof COIN_PACKAGES)[number] | null {
  return COIN_PACKAGES.find((p) => p.coins + bonusFor(p.coins) >= needCoins) ?? null
}

/** Harga paket bila `coins` cocok dengan salah satu paket; selain itu kurs dasar. */
export function priceFor(coins: number): number {
  return COIN_PACKAGES.find((p) => p.coins === coins)?.priceRupiah ?? calcPrice(coins)
}

/** Masa berlaku pesanan isi koin per metode, dalam menit. FR-WALLET-18. */
export const EXPIRY_MIN = { ewallet: 15, qris: 30, va: 1_440 } as const

/**
 * Bagi hasil penulis, 80/20 — **nilai bawaan seed saja.**
 * FR-EARN-12 mensyaratkan angka sebenarnya datang dari konfigurasi server,
 * karena bisa berubah tanpa rilis aplikasi. Jangan pakai untuk menghitung
 * penghasilan yang ditampilkan.
 */
export const AUTHOR_SHARE = 0.8

/** Ambang dan biaya pencairan penulis. prd_08. */
export const WITHDRAW_MIN = 100_000
export const WITHDRAW_FEE = 5_000

/** Nilai awal pengaturan pembaca. FR-READ-03/04/09. */
export const READER_DEFAULTS = { fontSize: 18, darkTheme: false, autoUnlock: false } as const

/**
 * Harga rupiah untuk sejumlah koin, dibulatkan ke kelipatan 100 terdekat.
 * FR-WALLET-03 — pembulatan terjadi pada hasil akhir, bukan pada kurs.
 *
 * @example calcPrice(150) // 19500
 */
export function calcPrice(coins: number): number {
  return Math.round((coins * COIN_RATE) / 100) * 100
}

/**
 * Angka ringkas gaya Indonesia untuk koin, jumlah baca, dan statistik.
 * FR-READ-05.
 *
 * Dipotong, bukan dibulatkan ke atas — angka yang menyangkut uang tidak boleh
 * terlihat lebih besar daripada yang sebenarnya, dan pemotongan sekaligus
 * mencegah `999.999` menjadi `"1000rb"`.
 *
 * @example
 * formatCompactCoin(800)      // "800"
 * formatCompactCoin(12_000)   // "12rb"   — bukan "12.0rb"
 * formatCompactCoin(15_300)   // "15.3rb"
 * formatCompactCoin(1_500_000) // "1.5jt"
 */
export function formatCompactCoin(value: number): string {
  const sign = value < 0 ? '-' : ''
  const n = Math.abs(value)

  if (n < 1_000) return `${sign}${Math.round(n)}`
  if (n < 1_000_000) return `${sign}${trimOneDecimal(n / 1_000)}rb`
  return `${sign}${trimOneDecimal(n / 1_000_000)}jt`
}

/** 12.04 → "12" · 15.36 → "15.3" — satu desimal, dipotong, `.0` dibuang. */
function trimOneDecimal(n: number): string {
  const truncated = Math.floor(n * 10) / 10
  return Number.isInteger(truncated) ? String(truncated) : truncated.toFixed(1)
}

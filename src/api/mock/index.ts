import type { NovelovaApi } from '../client'
import { buka, bungkus, bungkusGagal } from '../envelope'
import { withNotImplemented } from '../errors'
import { ageHandlers } from './handlers/age'
import { analyticsHandlers } from './handlers/analytics'
import {
  chapterAccessHandlers,
  chapterDraftHandlers,
  chapterStudioHandlers,
} from './handlers/chapters'
import { earningsHandlers } from './handlers/earnings'
import { homeHandlers } from './handlers/home'
import { libraryHandlers } from './handlers/library'
import { moderationHandlers } from './handlers/moderation'
import { notificationHandlers } from './handlers/notifications'
import { offlineHandlers } from './handlers/offline'
import { onboardingHandlers } from './handlers/onboarding'
import { printHandlers } from './handlers/print'
import { profileHandlers } from './handlers/profile'
import { rewardHandlers } from './handlers/rewards'
import { reviewHandlers, scheduleHandlers } from './handlers/schedule'
import { searchHandlers } from './handlers/search'
import { ensureSeedSession, sessionHandlers } from './handlers/session'
import { socialHandlers } from './handlers/social'
import { storyHandlers } from './handlers/story'
import { studioHandlers } from './handlers/studio'
import { unlockHandlers } from './handlers/unlock'
import { walletHandlers } from './handlers/wallet'
import { seedIfNeeded } from './seed'

/**
 * Implementasi server tiruan.
 *
 * Handler ditulis per fase (`todo.md` Fase 2 dan seterusnya) dan didaftarkan di
 * sini. Yang belum ada melempar `NOT_IMPLEMENTED` dengan nama fungsinya — jauh
 * lebih jelas daripada `undefined is not a function`, dan tidak menuntut puluhan
 * metode kosong hanya supaya berkas ini lolos typecheck.
 *
 * Aturan bisnisnya **sungguhan**: saldo dikurangi secara transaksional, ledger
 * dicatat, kuota iklan dicek per tanggal. Yang palsu hanya *sumber* datanya
 * (Dexie, bukan server) dan *konfirmasi pembayaran* (timer, bukan webhook).
 */

await seedIfNeeded()
await ensureSeedSession()

const handlers: Partial<NovelovaApi> = {
  // Fase 2 → sesi · Fase 3 → discovery · Fase 5 → cerita & bab · Fase 6 → dompet.
  ...sessionHandlers,
  ...onboardingHandlers,
  ...homeHandlers,
  ...searchHandlers,
  ...storyHandlers,
  ...unlockHandlers,
  ...libraryHandlers,
  ...walletHandlers,
  ...studioHandlers,
  ...chapterStudioHandlers,
  ...chapterDraftHandlers,
  ...chapterAccessHandlers,
  ...scheduleHandlers,
  ...reviewHandlers,
  // Fase 8g → analitik cerita & riwayat cetak.
  ...analyticsHandlers,
  ...printHandlers,
  // Fase 9 → penghasilan penulis.
  ...earningsHandlers,
  // Fase 10 → rating & ulasan.
  ...socialHandlers,
  ...moderationHandlers,
  // Fase 11 → notifikasi.
  ...notificationHandlers,
  // Fase 12 → pusat hadiah & voucher.
  ...rewardHandlers,
  // Fase 13 → profil, koneksi, privasi, keamanan.
  ...profileHandlers,
  // Fase 14 → baca offline.
  ...offlineHandlers,
  // Langkah 83 → verifikasi usia & konten dewasa (A1).
  ...ageHandlers,
}

/**
 * Menjalankan setiap handler **melewati amplop** · `backend-contract.md` §2.2.
 *
 * Satu titik untuk ke-130 metode, bukan 130 suntingan — sejalan dengan
 * `withNotImplemented` di sebelahnya.
 *
 * **Kenapa mock ikut dibungkus, padahal amplop itu urusan backend.** Kalau cuma
 * `api/http/` yang membukanya, peta `(metode, status)` di `errorMap.ts` baru
 * terbukti saat backend sungguhan hidup — dan yang menemukan salahnya jadi
 * pengguna, bukan test. Dibungkus di sini, 678 test unit dan 124 e2e yang sudah
 * ada ikut menguji amplopnya: tiap metode, tiap kode error, tiap layar sudah
 * tercakup di sana. Harganya satu `safeParse` per panggilan; yang dibeli adalah
 * bukti, bukan janji.
 *
 * Nilainya **tidak** dibolak-balik lewat JSON. Skema amplop sudah menuntut
 * `data` berupa objek atau array yang bukan `null`, dan itu pemeriksaan
 * kesetiaan-kabel yang paling banyak menangkap; kesetiaan JSON penuh (`Date`,
 * `undefined`) adalah urusan tersendiri.
 */
function lewatAmplop(asli: Partial<NovelovaApi>): Partial<NovelovaApi> {
  const dibungkus: Record<string, unknown> = {}

  for (const [nama, fn] of Object.entries(asli)) {
    if (typeof fn !== 'function') continue
    const jalankan = fn as (...args: unknown[]) => unknown

    dibungkus[nama] = async (...args: unknown[]): Promise<unknown> => {
      let amplop: ReturnType<typeof bungkus>
      try {
        // `this` tetap objek handler **yang belum dibungkus**, dan itu bukan
        // kelalaian. Dua handler memanggil saudaranya lewat `this`
        // (`submitReview` → `rateStory`, `report` → `hasReported`); di backend
        // sungguhan panggilan itu terjadi **di dalam server**, tidak lewat
        // kabel. Membungkusnya juga berarti satu permintaan pengguna
        // menghasilkan dua `request_id`, dan yang kedua tidak pernah ada.
        amplop = bungkus(nama, await jalankan.apply(asli, args))
      } catch (gagal) {
        amplop = bungkusGagal(gagal)
      }
      return buka(amplop, nama)
    }
  }

  return dibungkus as Partial<NovelovaApi>
}

export const api = withNotImplemented<NovelovaApi>(lewatAmplop(handlers), 'mock')

/**
 * Jumlah parameter posisi tiap handler, dibaca sebelum dibungkus.
 *
 * Ada untuk satu penjaga di `tests/unit/envelope.test.ts`: metode berparameter
 * dua yang lupa didaftarkan di tabel `ARGUMEN` (`api/http/`) akan **membuang
 * argumen keduanya diam-diam** saat bicara dengan backend sungguhan, dan
 * tidak ada satu pun test mock yang bisa melihatnya — mock memanggil
 * fungsinya langsung, bukan lewat JSON.
 *
 * Dibaca di sini karena pembungkusnya `(...args) => …`, yang arity-nya nol.
 */
export const ARITAS: Readonly<Record<string, number>> = Object.fromEntries(
  Object.entries(handlers)
    .filter(([, fn]) => typeof fn === 'function')
    .map(([nama, fn]) => [nama, (fn as (...args: unknown[]) => unknown).length]),
)

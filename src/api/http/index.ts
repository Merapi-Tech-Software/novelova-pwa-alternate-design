import { APP_VERSION } from '@/stores/app'
import { getAccessToken } from '@/stores/session'
import type { NovelovaApi } from '../client'
import { buka } from '../envelope'
import { ApiError, INTERNAL_CODES } from '../errors'

/**
 * Implementasi HTTP — **terjemahan mekanis** seam ke `POST /rpc/<nama>`
 * (`backend-contract.md` §2).
 *
 * Tidak ada satu pun **badan** metode yang ditulis tangan di sini: ke-130-nya
 * dibangkitkan dari satu daftar nama (`METODE` di bawah) yang kelengkapannya
 * dijaga `tsc`. Yang tersisa cuma dua tabel, dan keduanya memang tidak bisa
 * diturunkan dari tipe saat runtime:
 *
 * - **`ARGUMEN`** — nama parameter posisi (§2.1). JavaScript tidak menyimpan
 *   nama argumen, jadi `getChapter(a, b)` tidak bisa menebak sendiri bahwa
 *   keduanya `storyId` dan `chapterId`.
 * - **`METODE`** — daftar nama itu sendiri; tipe menghilang saat dikompilasi.
 *
 * **Belum pernah dijalankan terhadap backend sungguhan** — belum ada backend-nya
 * (`todo-incoming-features.md` B). Yang sudah terbukti: pembungkusan argumen,
 * pemulihan kode error, dan alur `401 → refresh → ulang`, lewat
 * `tests/unit/http-rpc.test.ts` dengan `fetch` palsu.
 */

const BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''

/** Batas satu permintaan. Lewat ini dianggap `TIMEOUT`, bukan `NETWORK`. */
const BATAS_MS = 20_000

/**
 * Nama tiap argumen posisi — **disalin dari tabel §6 kontrak**, bukan disusun
 * ulang di sini, lalu diperiksa: ke-69-nya cocok jumlahnya dengan tanda tangan
 * di `client.ts`, nol selisih.
 *
 * §2.1 semula menetapkan aturan yang lebih sederhana — argumen tunggal
 * non-objek dibungkus `{ arg }` — supaya terjemahannya mekanis tanpa keputusan
 * per metode. Aturan itu **tidak pernah bisa berlaku penuh**: JavaScript tidak
 * menyimpan nama argumen saat runtime, jadi metode berparameter dua tetap
 * menuntut tabel. Karena tabelnya wajib ada, `{ storyId: "s1" }` lebih baik
 * daripada `{ arg: "s1" }`: itulah yang sudah tertulis di §6, dan itu pula yang
 * terbaca di log backend.
 *
 * Kuncinya `keyof NovelovaApi`, jadi nama metode yang salah ketik atau sudah
 * dihapus gagal di `tsc`, bukan jadi permintaan yang ditolak backend.
 */
const ARGUMEN: Readonly<Partial<Record<keyof NovelovaApi, readonly string[]>>> = {
  applyVoucher: ['voucherId', 'storyId'],
  approvePrintCost: ['orderId'],
  blockUser: ['userId', 'on'],
  cancelPrintOrder: ['orderId'],
  cancelScheduleEntry: ['entryId'],
  cancelTopupOrder: ['orderId'],
  confirmTopupOrder: ['orderId'],
  createStory: ['form'],
  deleteChapter: ['chapterId'],
  deleteRating: ['storyId'],
  deleteReview: ['storyId'],
  deleteStory: ['storyId'],
  dismissBundleOffer: ['storyId'],
  getAuthorAnalytics: ['params'],
  getBundleOffer: ['storyId', 'chapterId'],
  getChapter: ['storyId', 'chapterId'],
  getChapterAccess: ['chapterId'],
  getChapterBoard: ['storyId'],
  getChapterDraft: ['chapterId'],
  getChapters: ['storyId', 'params'],
  getChaptersForAuthor: ['storyId', 'params'],
  getHomeFeed: ['tab'],
  getLibrary: ['params'],
  getMyRating: ['storyId'],
  getMyStories: ['params'],
  getProgress: ['storyId'],
  getPublicProfile: ['userId'],
  getSection: ['id', 'params'],
  getStory: ['storyId'],
  getStoryAnalytics: ['storyId', 'params'],
  getTopupOrder: ['orderId'],
  getTransaction: ['txId'],
  getUnlockOptions: ['chapterId'],
  hasReported: ['targetType', 'targetId'],
  hideStory: ['storyId'],
  listActivity: ['userId', 'respectPrivacy'],
  listComments: ['chapterId', 'params'],
  listConnections: ['kind', 'params'],
  listLibrary: ['params'],
  listNotifications: ['params'],
  listPrintOrders: ['params'],
  listReviews: ['storyId', 'params'],
  listTransactions: ['params'],
  listVoucherTargets: ['voucherId'],
  listWithdrawals: ['params'],
  publishChapter: ['chapterId'],
  rateStory: ['storyId', 'stars'],
  react: ['target', 'on'],
  regeneratePrintFile: ['orderId', 'parts'],
  removeChapterOffline: ['chapterId'],
  removeFromLibrary: ['storyId'],
  replyToReview: ['reviewId', 'text'],
  requestReset: ['identity'],
  saveChapterOffline: ['chapterId'],
  search: ['q', 'params'],
  setAutoUnlock: ['storyId', 'on'],
  setLocaleSettings: ['settings'],
  setNotificationPrefs: ['prefs'],
  setPrivacySettings: ['settings'],
  submitForReview: ['target'],
  toggleFollow: ['storyId'],
  toggleFollowUser: ['userId'],
  toggleLibrary: ['storyId'],
  toggleNotify: ['storyId'],
  touchOfflineChapter: ['chapterId'],
  undoRemove: ['storyId'],
  unscheduleChapter: ['chapterId'],
  updateStory: ['storyId', 'form'],
  withdrawFromReview: ['target'],
}

function objekBiasa(nilai: unknown): nilai is Record<string, unknown> {
  return typeof nilai === 'object' && nilai !== null && !Array.isArray(nilai)
}

/**
 * Argumen seam → badan JSON · §2.1.
 *
 * Aturannya **mekanis**, dan itu disengaja: begitu ada satu metode yang
 * namanya diterjemahkan khusus, folder ini berhenti jadi terjemahan dan mulai
 * jadi lapisan yang bisa salah sendiri.
 */
export function badanDari(metode: string, args: readonly unknown[]): Record<string, unknown> {
  if (args.length === 0) return {}

  const nama = ARGUMEN[metode as keyof NovelovaApi]
  if (nama) {
    const badan: Record<string, unknown> = {}
    nama.forEach((kunci, i) => {
      if (i < args.length) badan[kunci] = args[i]
    })
    return badan
  }

  // Tersisa dua bentuk, keduanya persis seperti §6 menuliskannya: masukan
  // berbentuk objek (`LoginInput`, `UnlockInput`, …) dikirim apa adanya, dan
  // argumen tunggal non-objek dibungkus `arg` (`markRead`, `finishOnboarding`,
  // `revokeDeviceSession`, `getSuggestions`, `setShowAdultContent`, …).
  const satu = args[0]
  return objekBiasa(satu) ? satu : { arg: satu }
}

function gagalJaringan(sebab: unknown): ApiError {
  const nama = sebab instanceof Error ? sebab.name : ''

  if (nama === 'TimeoutError' || nama === 'AbortError') {
    return new ApiError(
      INTERNAL_CODES.TIMEOUT,
      'Server terlalu lama menjawab. Yang kamu kerjakan tidak hilang — coba lagi sebentar lagi.',
      { cause: sebab },
    )
  }

  // `navigator.onLine` hanya bisa dipercaya saat ia berkata **tidak**: peramban
  // tahu pasti kalau kabelnya lepas, tetapi "online" belum tentu berarti
  // internetnya jalan.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return new ApiError(
      INTERNAL_CODES.OFFLINE,
      'Perangkat ini sedang tidak terhubung. Yang kamu kerjakan tidak hilang.',
      { cause: sebab },
    )
  }

  return new ApiError(
    INTERNAL_CODES.NETWORK,
    'Permintaannya tidak sampai ke server. Coba lagi sebentar lagi.',
    { cause: sebab },
  )
}

async function rpc(metode: string, args: readonly unknown[], bolehUlang = true): Promise<unknown> {
  const token = getAccessToken()

  let jawaban: Response
  try {
    jawaban = await fetch(`${BASE}/rpc/${metode}`, {
      method: 'POST',
      // Refresh token hidup di cookie `HttpOnly` (§2.3); tanpa ini ia tidak
      // pernah ikut, dan `refresh` selalu gagal.
      credentials: 'include',
      signal: AbortSignal.timeout(BATAS_MS),
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'id',
        'X-Client-Version': APP_VERSION,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(badanDari(metode, args)),
    })
  } catch (sebab) {
    throw gagalJaringan(sebab)
  }

  let mentah: unknown
  try {
    mentah = await jawaban.json()
  } catch (sebab) {
    throw new ApiError(
      INTERNAL_CODES.CONTRACT,
      'Jawaban server tidak sesuai kontrak. Coba lagi sebentar lagi.',
      { retryable: false, detail: `${metode}: bukan JSON`, cause: sebab },
    )
  }

  /*
   * Sekali refresh, tidak pernah dua kali · §7.1.
   *
   * Dua `refresh` beruntun adalah lingkaran: yang kedua gagal karena alasan
   * yang sama dengan yang pertama, dan pengguna menunggu dua kali lebih lama
   * untuk lembar masuk ulang yang sama. `refresh` sendiri **tidak pernah**
   * memicu jalur ini — ia yang jadi jalurnya.
   */
  if (jawaban.status === 401 && bolehUlang && metode !== 'refresh') {
    try {
      await rpc('refresh', [], false)
      return await rpc(metode, args, false)
    } catch {
      // Refresh-nya sendiri gagal: biarkan `401` yang asli yang bicara, supaya
      // yang sampai ke `SessionProvider` tetap `AUTH-401`.
    }
  }

  // §9 no. 24 diperiksa dari **dua sisi**: `buka()` menjaga `success` melawan
  // `code` di dalam badan, dan di sini `code` dijaga melawan status HTTP yang
  // sebenarnya. Proxy yang menulis ulang statusnya tertangkap di sini.
  if (objekBiasa(mentah) && mentah.code !== jawaban.status) {
    throw new ApiError(
      INTERNAL_CODES.CONTRACT,
      'Jawaban server tidak sesuai kontrak. Coba lagi sebentar lagi.',
      {
        retryable: false,
        detail: `${metode}: code=${String(mentah.code)} tetapi HTTP ${jawaban.status}`,
      },
    )
  }

  return buka(mentah, metode)
}

/**
 * Ke-130 nama metode seam · §6.
 *
 * Sengaja **bukan** `Proxy`, walau `Proxy` akan meniadakan daftar ini. Dua
 * alasan, dan keduanya sudah menggigit sekali saat dicoba:
 *
 * 1. `initApi()` mengisi seam dengan `Object.assign(api, impl.api)`, dan
 *    `Object.assign` menyalin **properti milik sendiri**. `Proxy` di atas
 *    target kosong tidak punya satu pun, jadi seam-nya tetap kosong dan setiap
 *    panggilan gagal sebagai "bukan fungsi".
 * 2. `Proxy` menjawab **setiap** nama properti, termasuk `then` — jadi ia
 *    tampak seperti Promise. `await` atasnya memanggil `then()`, yang berubah
 *    jadi `POST /rpc/then` dan menggantung selamanya.
 *
 * `Record<keyof NovelovaApi, true>` menuntut ke-130 nama hadir: metode baru di
 * seam yang belum ada di sini gagal di `tsc --noEmit`, bukan gagal di tangan
 * pengguna sebagai `NOT_IMPLEMENTED`.
 */
const METODE: Record<keyof NovelovaApi, true> = {
  login: true,
  register: true,
  requestReset: true,
  refresh: true,
  logout: true,
  listDeviceSessions: true,
  revokeDeviceSession: true,
  getReaderPrefs: true,
  finishOnboarding: true,
  getStarterPicks: true,
  getHomeFeed: true,
  getSection: true,
  search: true,
  getSuggestions: true,
  getTrendingQueries: true,
  getStory: true,
  getChapters: true,
  getChapter: true,
  getUnlockOptions: true,
  unlockChapter: true,
  redeemVoucher: true,
  applyVoucher: true,
  saveProgress: true,
  getProgress: true,
  listLibrary: true,
  toggleLibrary: true,
  listProgress: true,
  hideStory: true,
  getReaderStats: true,
  setAutoUnlock: true,
  getBundleOffer: true,
  dismissBundleOffer: true,
  toggleFollow: true,
  getLibrary: true,
  getLibrarySummary: true,
  toggleNotify: true,
  removeFromLibrary: true,
  undoRemove: true,
  getWallet: true,
  listPayMethods: true,
  createTopupOrder: true,
  getTopupOrder: true,
  confirmTopupOrder: true,
  cancelTopupOrder: true,
  listTransactions: true,
  getTransaction: true,
  getAdQuota: true,
  rateStory: true,
  getMyRating: true,
  deleteRating: true,
  submitReview: true,
  deleteReview: true,
  listReviews: true,
  listComments: true,
  postComment: true,
  replyToReview: true,
  react: true,
  report: true,
  hasReported: true,
  blockUser: true,
  listBlocks: true,
  listActivity: true,
  listNotifications: true,
  getUnreadCount: true,
  markRead: true,
  getNotificationPrefs: true,
  setNotificationPrefs: true,
  getAuthorProfile: true,
  registerAuthor: true,
  getMyStories: true,
  getStudioSummary: true,
  createStory: true,
  updateStory: true,
  deleteStory: true,
  scheduleStory: true,
  createPrintOrder: true,
  getChaptersForAuthor: true,
  getChapterBoard: true,
  publishChapter: true,
  scheduleChapter: true,
  unscheduleChapter: true,
  deleteChapter: true,
  getChapterDraft: true,
  saveChapterDraft: true,
  getChapterAccess: true,
  setChapterAccess: true,
  getStoryAnalytics: true,
  listPrintOrders: true,
  cancelPrintOrder: true,
  approvePrintCost: true,
  regeneratePrintFile: true,
  listSchedule: true,
  cancelScheduleEntry: true,
  listReviewQueue: true,
  submitForReview: true,
  withdrawFromReview: true,
  getAuthorAnalytics: true,
  getPayoutBalance: true,
  requestWithdrawal: true,
  listWithdrawals: true,
  getPayoutRate: true,
  getPayoutAccount: true,
  getRewards: true,
  claimCheckIn: true,
  claimMission: true,
  getReferral: true,
  listVouchers: true,
  listVoucherTargets: true,
  listRewardHistory: true,
  listConnections: true,
  toggleFollowUser: true,
  getPrivacySettings: true,
  setPrivacySettings: true,
  getLocaleSettings: true,
  setLocaleSettings: true,
  requestDataExport: true,
  requestAccountDeletion: true,
  updateProfile: true,
  getPublicProfile: true,
  getWeeklyRecap: true,
  getSecurityOverview: true,
  clearReadingHistory: true,
  getDeletionCheck: true,
  listOfflineChapters: true,
  saveChapterOffline: true,
  removeChapterOffline: true,
  touchOfflineChapter: true,
  getAgeVerification: true,
  submitAgeVerification: true,
  setShowAdultContent: true,
}

export const api: NovelovaApi = Object.fromEntries(
  Object.keys(METODE).map((nama) => [nama, (...args: unknown[]) => rpc(nama, args)]),
) as unknown as NovelovaApi

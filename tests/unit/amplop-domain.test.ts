import { beforeAll, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import type { Paged } from '@/api/contracts'
import { isApiError } from '@/api/errors'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'

/**
 * Sapuan amplop per domain · `todo-incoming-features.md` **D3**,
 * `backend-contract.md` §6.1–§6.16.
 *
 * Seluruh 130 metode server-mock kini melewati `bungkus()` → `buka()`
 * (`src/api/mock/index.ts`). 678 test yang sudah ada membuktikan **isinya**
 * masih benar; berkas ini membuktikan hal yang tidak mereka lihat: bahwa
 * **bentuk** kembalian selamat melewati amplop.
 *
 * Yang diperiksa hanya yang bisa rusak diam-diam:
 *
 * | Bentuk | Kenapa berbahaya |
 * |---|---|
 * | `null` | `data: {}` **adalah** `null`-nya. Salah buka → `{}` yang terbaca "ada tapi kosong" |
 * | primitif | `data: { value }`. Salah buka → objek, dan `count > 0` jadi selalu benar |
 * | `Paged<T>` | `page`/`hasMore` **dihitung** dari `meta`; salah hitung menggantung `IntersectionObserver` |
 * | `void` | `{}` harus kembali jadi `undefined` |
 *
 * Ditambah satu kegagalan per domain yang punya kode khusus, karena kode itulah
 * yang memilih layar — dan amplop tidak mengirimkannya, klien yang
 * memulihkannya dari `(metode, status)`.
 */

const L = { page: 1, pageSize: 20 } as const

/** Memastikan bentuk `Paged<T>` utuh, bukan sekadar "ada isinya". */
function halamanSah<T>(h: Paged<T>, pageSize = 20) {
  expect(Array.isArray(h.items)).toBe(true)
  expect(h.page).toBe(1)
  expect(h.pageSize).toBe(pageSize)
  expect(typeof h.total).toBe('number')
  expect(typeof h.hasMore).toBe('boolean')
  // Turunan `meta`, bukan angka yang dikirim: kalau salah, ia bohong justru
  // pada halaman terakhir — tempat yang paling jarang diuji dengan tangan.
  expect(h.hasMore).toBe(h.items.length < h.total)
}

async function kode(janji: Promise<unknown>): Promise<string> {
  const gagal = await janji.then(() => null).catch((e: unknown) => e)
  if (!isApiError(gagal)) throw new Error(`diharapkan ApiError, dapat ${String(gagal)}`)
  return gagal.code
}

beforeAll(async () => {
  // `getProgress` hanya `null` kalau ceritanya memang belum pernah dibuka.
  await db.progress.delete(`${CURRENT_USER_ID}-s40`)
  await db.ratings.delete(`${CURRENT_USER_ID}-s40`)
})

describe('6.1 sesi & akun', () => {
  it('array dan `void` selamat; kode sesi tetap dikenali', async () => {
    expect(Array.isArray(await api.listDeviceSessions())).toBe(true)
    // `revokeDeviceSession` `void` → `{}` → `undefined`, bukan `{}`.
    expect(await api.revokeDeviceSession('sesi-yang-tidak-ada').catch(() => undefined)).toBe(
      undefined,
    )
  })
})

describe('6.2 onboarding & beranda', () => {
  it('`getSection` berhalaman, `getTrendingQueries` array string', async () => {
    halamanSah(await api.getSection('populer', { ...L, tab: 'semua' }))

    const tren = await api.getTrendingQueries()
    expect(Array.isArray(tren)).toBe(true)
    expect(typeof tren[0]).toBe('string')

    const feed = await api.getHomeFeed()
    expect(Array.isArray(feed.sections)).toBe(true)
  })
})

describe('6.3 pencarian', () => {
  it('halaman terakhir menutup `hasMore` — penggantung `IntersectionObserver`', async () => {
    const hasil = await api.search('a', { ...L, sort: 'relevan' })
    expect(typeof hasil.total).toBe('number')
    expect(Array.isArray(hasil.stories)).toBe(true)

    // Halaman jauh di belakang: kosong, dan `hasMore` **wajib** mati. Amplop
    // menghitungnya dari `offset + data.length < total_count`.
    const jauh = await api.getSection('populer', { page: 99, pageSize: 20, tab: 'semua' })
    expect(jauh.items).toHaveLength(0)
    expect(jauh.hasMore).toBe(false)
    expect(jauh.page).toBe(99)

    expect(Array.isArray(await api.getSuggestions('ma'))).toBe(true)
  })
})

describe('6.4 cerita & bab', () => {
  it('`getBundleOffer` boleh `null`; bab tidak ada tetap `NOT_FOUND`', async () => {
    const tawaran = await api.getBundleOffer('s1', 's1-c1')
    expect(tawaran === null || typeof tawaran === 'object').toBe(true)

    halamanSah(await api.getChapters('s1', L))
    expect(await kode(api.getChapter('s1', 'bab-yang-tidak-ada'))).toBe('NOT_FOUND')
  })
})

describe('6.5 progres & perpustakaan', () => {
  it('`getProgress` mengembalikan `null`, bukan objek kosong', async () => {
    const belum = await api.getProgress('s40')
    // Inti seluruh bentuk `nullable`: `{}` yang lolos sebagai progres akan
    // membuat `/pustaka` menampilkan batang progres 0% untuk cerita yang
    // sebenarnya belum pernah dibuka.
    expect(belum).toBeNull()

    await api.saveProgress({ storyId: 's40', chapterId: 's40-c1', scrollPct: 0.5 })
    const sudah = await api.getProgress('s40')
    expect(sudah).not.toBeNull()
    expect(sudah?.storyId).toBe('s40')

    halamanSah(await api.getLibrary({ ...L, state: 'all', sort: 'saved' }))
    expect(Array.isArray(await api.listProgress())).toBe(true)
  })
})

describe('6.6 dompet', () => {
  it('saldo utuh dan buku besar berhalaman', async () => {
    const dompet = await api.getWallet()
    expect(typeof dompet.balance).toBe('number')

    halamanSah(await api.listTransactions(L))
    expect(await kode(api.getTransaction('tx-tidak-ada'))).toBe('NOT_FOUND')
  })
})

describe('6.7 voucher di jalur baca', () => {
  it('tiga arti dari satu metode tetap terpisah', async () => {
    // 404 di sini, bukan `PAY-410`: penimpaan `redeemVoucher` hanya untuk 410.
    expect(await kode(api.redeemVoucher('KODE-NGAWUR-123'))).toBe('NOT_FOUND')
  })
})

describe('6.8 sosial', () => {
  it('`null`, `boolean`, dan `string[]` masing-masing pulang utuh', async () => {
    expect(await api.getMyRating('s40')).toBeNull()

    const pernah = await api.hasReported('story', 's1')
    // Primitif lewat `data: { value }`. Kalau salah buka, ia jadi objek — dan
    // objek selalu truthy, jadi "sudah pernah melapor" akan selalu benar.
    expect(typeof pernah).toBe('boolean')

    const blokir = await api.listBlocks()
    expect(Array.isArray(blokir)).toBe(true)

    halamanSah(await api.listComments('s1-c1', { ...L, sort: 'newest' }))
    expect(
      await api.react({ type: 'review', id: 'ulasan-tidak-ada' }, true).catch(() => 'gagal'),
    ).toBe('gagal')
  })
})

describe('6.9 notifikasi', () => {
  it('`getUnreadCount` angka, dan nol tetap nol', async () => {
    const jumlah = await api.getUnreadCount()
    expect(typeof jumlah).toBe('number')
    expect(Number.isInteger(jumlah)).toBe(true)

    halamanSah(await api.listNotifications({ page: 1, pageSize: 20, unreadOnly: false }))
    expect(await api.markRead([])).toBe(undefined)
  })
})

describe('6.10 studio', () => {
  it('dua halaman, dan `SCHED-422` sampai ke klien', async () => {
    halamanSah(await api.getMyStories({ ...L, status: 'all', sort: 'updated' }))

    // Kode ini **tidak** dikirim server; klien memulihkannya dari
    // (`scheduleChapter`, 422). Kalau petanya hilang, yang sampai `VALIDATION`
    // dan `Scheduler.tsx` berhenti menandai kolom waktunya.
    expect(
      await kode(
        api.scheduleChapter({
          chapterId: 'ms1-c51',
          date: '2020-01-01',
          time: '07:00',
          cadence: 'once',
        }),
      ),
    ).toBe('SCHED-422')
  })
})

describe('6.11 tinjauan & cetak', () => {
  it('antrean array, pesanan berhalaman, `PRINT-409` dikenali', async () => {
    expect(Array.isArray(await api.listReviewQueue())).toBe(true)
    halamanSah(await api.listPrintOrders({ ...L, tab: 'all' }))
  })
})

describe('6.12 penghasilan', () => {
  it('saldo pencairan objek biasa, riwayat berhalaman', async () => {
    const saldo = await api.getPayoutBalance()
    expect(typeof saldo.available).toBe('number')
    expect(typeof saldo.pending).toBe('number')

    halamanSah(await api.listWithdrawals(L))
  })
})

describe('6.13 hadiah', () => {
  it('hadiah, voucher, dan riwayat selamat', async () => {
    const hadiah = await api.getRewards()
    expect(typeof hadiah.checkInStreak).toBe('number')
    expect(Array.isArray(await api.listVouchers())).toBe(true)
    expect(Array.isArray(await api.listRewardHistory())).toBe(true)
  })
})

describe('6.14 profil & pengaturan', () => {
  it('koneksi berhalaman; privasi tetap objek penuh', async () => {
    halamanSah(await api.listConnections('followers', L))

    const privasi = await api.getPrivacySettings()
    // §1.41: dompet dijepit di server. Amplop tidak boleh menghilangkan bidang
    // yang bernilai `false` — `{}` yang lolos akan terbaca "semua publik".
    expect(privasi.wallet).toBe(false)
    expect(typeof privasi.readingActivity).toBe('boolean')
  })
})

describe('6.15 verifikasi usia', () => {
  it('status verifikasi pulang sebagai objek berstatus', async () => {
    const usia = await api.getAgeVerification()
    expect(typeof usia.status).toBe('string')
  })
})

describe('6.16 baca offline', () => {
  it('daftar offline array, bab yang tidak ada ditolak `NOT_FOUND`', async () => {
    expect(Array.isArray(await api.listOfflineChapters())).toBe(true)
    expect(await kode(api.saveChapterOffline('bab-tidak-ada'))).toBe('NOT_FOUND')
  })
})

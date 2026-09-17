import { describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { type Bentuk, bentukDari, buka, bungkus, bungkusGagal } from '@/api/envelope'
import { KODE_DI_DATA, KODE_KLIEN, kodeDari, PENIMPAAN, statusDari } from '@/api/errorMap'
import { ApiError, INTERNAL_CODES, VISIBLE_CODES } from '@/api/errors'
import { ARITAS } from '@/api/mock'

/**
 * Amplop respons · `todo-incoming-features.md` **D5**, `backend-contract.md`
 * §2.2 dan §7.
 *
 * Tiga penjaga, dan ketiganya menjawab pertanyaan berbeda:
 *
 * 1. **Bentuk** — `bungkus()` lalu `buka()` mengembalikan nilai yang sama.
 * 2. **Kode** — setiap `ErrorCode` punya jalan pulang; kode baru tanpa peta
 *    gagal di sini, bukan di produksi.
 * 3. **Metode** — setiap metode seam punya bentuk dan, bila berparameter
 *    posisi, punya nama argumen.
 */

const REQ = /^[0-9a-f-]{36}$/i

function bolakBalik(metode: string, nilai: unknown): unknown {
  return buka(bungkus(metode, nilai), metode)
}

function gagalBolakBalik(metode: string, err: ApiError): ApiError {
  try {
    buka(bungkusGagal(err), metode)
  } catch (e) {
    if (e instanceof ApiError) return e
  }
  throw new Error('diharapkan ApiError')
}

describe('§2.2 · lima bentuk kembalian pulang utuh', () => {
  it('objek biasa dan array tidak berubah', () => {
    expect(bolakBalik('getWallet', { balance: 20_000, bonus: 23 })).toEqual({
      balance: 20_000,
      bonus: 23,
    })
    expect(bolakBalik('listBlocks', ['u1', 'u2'])).toEqual(['u1', 'u2'])
    expect(bolakBalik('listBlocks', [])).toEqual([])
  })

  it('`void` jadi `undefined`, bukan `{}`', () => {
    expect(bolakBalik('logout', undefined)).toBe(undefined)
    // Amplopnya sendiri tetap membawa `data: {}` — "tidak pernah null" (§2.2).
    expect(bungkus('logout', undefined).data).toEqual({})
  })

  it('`null` tetap `null`, dan objek berisi tetap berisi', () => {
    expect(bolakBalik('getProgress', null)).toBeNull()
    expect(bolakBalik('getProgress', { storyId: 's1' })).toEqual({ storyId: 's1' })
    // Sumber kekeliruan yang paling mudah: `{}` di kawat berarti `null`, dan
    // bukan "progres yang kebetulan kosong".
    expect(bungkus('getProgress', null).data).toEqual({})
  })

  it('primitif lewat `data.value`', () => {
    expect(bolakBalik('hasReported', true)).toBe(true)
    expect(bolakBalik('hasReported', false)).toBe(false)
    expect(bolakBalik('getUnreadCount', 0)).toBe(0)
    expect(bungkus('getUnreadCount', 7).data).toEqual({ value: 7 })
  })

  it('`Paged<T>`: halaman pertama, terakhir, dan kosong', () => {
    const awal = { items: [1, 2], page: 1, pageSize: 2, total: 5, hasMore: true }
    expect(bolakBalik('listWithdrawals', awal)).toEqual(awal)

    // Halaman terakhir: `hasMore` **wajib** mati, kalau tidak
    // `IntersectionObserver` memuat selamanya (CLAUDE.md §8).
    const akhir = { items: [5], page: 3, pageSize: 2, total: 5, hasMore: false }
    expect(bolakBalik('listWithdrawals', akhir)).toEqual(akhir)

    const kosong = { items: [], page: 1, pageSize: 20, total: 0, hasMore: false }
    expect(bolakBalik('listWithdrawals', kosong)).toEqual(kosong)
  })

  it('`meta` koleksi memakai offset, bukan nomor halaman', () => {
    const meta = bungkus('listWithdrawals', {
      items: [1, 2],
      page: 3,
      pageSize: 2,
      total: 5,
      hasMore: false,
    }).meta
    expect(meta).toEqual({ total_count: 5, limit: 2, offset: 4 })
  })

  it('`request_id` selalu ada, sukses maupun gagal', () => {
    expect(bungkus('getWallet', {}).request_id).toMatch(REQ)
    expect(bungkusGagal(new ApiError(INTERNAL_CODES.NOT_FOUND, 'x')).request_id).toMatch(REQ)
  })
})

describe('§7 · kegagalan: status pulang jadi kode, fakta pulang jadi bidang', () => {
  it('404 biasa jadi `NOT_FOUND` dan membawa `request_id`', () => {
    const e = gagalBolakBalik('getStory', new ApiError(INTERNAL_CODES.NOT_FOUND, 'tidak ada'))
    expect(e.code).toBe('NOT_FOUND')
    expect(e.message).toBe('tidak ada')
    expect(e.requestId).toMatch(REQ)
  })

  it('`login` 429 jadi `AUTH-429` beserta `retryAt`', () => {
    const e = gagalBolakBalik(
      'login',
      new ApiError(VISIBLE_CODES.AUTH_RATE_LIMITED, 'ditahan', {
        retryAt: '2026-09-17T08:15:00.000Z',
      }),
    )
    expect(e.code).toBe('AUTH-429')
    expect(e.retryAt).toBe('2026-09-17T08:15:00.000Z')
  })

  it('`getChapter` 410 jadi `CONTENT-410` beserta tanggal penarikannya', () => {
    const e = gagalBolakBalik(
      'getChapter',
      new ApiError(VISIBLE_CODES.CONTENT_WITHDRAWN, 'ditarik', {
        withdrawnAt: '2026-09-01T00:00:00.000Z',
      }),
    )
    expect(e.code).toBe('CONTENT-410')
    expect(e.withdrawnAt).toBe('2026-09-01T00:00:00.000Z')
  })

  it('`unlockChapter` 402 membawa kekurangan koinnya sebagai angka', () => {
    const e = gagalBolakBalik(
      'unlockChapter',
      new ApiError(INTERNAL_CODES.INSUFFICIENT_COINS, 'kurang', { shortBy: 1200 }),
    )
    expect(e.code).toBe('INSUFFICIENT_COINS')
    // Angka, bukan string: gerbangnya memilih paket koin terkecil dari sini.
    expect(e.shortBy).toBe(1200)
  })

  it('status yang sama berarti beda hal di metode berbeda', () => {
    expect(kodeDari('unlockChapter', 402)).toBe('INSUFFICIENT_COINS')
    expect(kodeDari('confirmTopupOrder', 402)).toBe('PAY-402')
    expect(kodeDari('claimCheckIn', 409)).toBe('CONFLICT')
    expect(kodeDari('saveChapterDraft', 409)).toBe('DRAFT-409')
    expect(kodeDari('redeemVoucher', 404)).toBe('NOT_FOUND')
    expect(kodeDari('redeemVoucher', 410)).toBe('PAY-410')
  })
})

describe('§9 no. 24 · amplop yang membantah dirinya sendiri ditolak', () => {
  const dasar = { message: '', data: {}, meta: {}, request_id: 'r' }

  it('`success: false` di atas 200 jadi `CONTRACT`', () => {
    expect(() => buka({ ...dasar, success: false, code: 200 }, 'getWallet')).toThrow(
      expect.objectContaining({ code: 'CONTRACT' }),
    )
  })

  it('`success: true` di atas 404 jadi `CONTRACT`', () => {
    expect(() => buka({ ...dasar, success: true, code: 404 }, 'getWallet')).toThrow(
      expect.objectContaining({ code: 'CONTRACT' }),
    )
  })

  it('`data: null` melanggar skema dan jadi `CONTRACT`', () => {
    expect(() => buka({ ...dasar, success: true, code: 200, data: null }, 'getWallet')).toThrow(
      expect.objectContaining({ code: 'CONTRACT' }),
    )
  })

  it('bukan amplop sama sekali jadi `CONTRACT`, bukan `TypeError`', () => {
    expect(() => buka({ balance: 10 }, 'getWallet')).toThrow(
      expect.objectContaining({ code: 'CONTRACT' }),
    )
    expect(() => buka(null, 'getWallet')).toThrow(expect.objectContaining({ code: 'CONTRACT' }))
  })
})

describe('sapuan · setiap kode punya jalan pulang', () => {
  const semua = [...Object.values(VISIBLE_CODES), ...Object.values(INTERNAL_CODES)]

  /** Metode pemilik tiap kode, diambil dari tabel penimpaan itu sendiri. */
  const pemilik = new Map<string, string>()
  for (const [metode, per] of Object.entries(PENIMPAAN)) {
    for (const kode of Object.values(per)) pemilik.set(kode, metode)
  }

  it('27 kode, dan tidak satu pun tanpa klasifikasi', () => {
    expect(semua).toHaveLength(27)
    expect(new Set(semua).size).toBe(27)
  })

  it.each(semua)('%s bisa pulang', (kode) => {
    if (KODE_KLIEN.has(kode) || KODE_DI_DATA.has(kode)) {
      // Kode yang tidak pernah menyeberang tidak boleh punya status: memberinya
      // satu berarti suatu hari ia dilempar, dan layar yang membacanya dari
      // data berhenti bekerja (§7.3).
      expect(statusDari(kode)).toBeNull()
      return
    }

    const status = statusDari(kode)
    expect(status).not.toBeNull()
    // Bolak-balik lewat metode pemiliknya. Tanpa pemilik, bawaan §7.1 berlaku.
    expect(kodeDari(pemilik.get(kode) ?? 'metodeTanpaPenimpaan', status as number)).toBe(kode)
  })

  it('kode tampil `XXX-nnn` selalu dijawab HTTP `nnn` · §9 no. 26', () => {
    for (const kode of Object.values(VISIBLE_CODES)) {
      if (KODE_DI_DATA.has(kode)) continue
      expect(statusDari(kode)).toBe(Number(kode.slice(-3)))
    }
  })
})

describe('sapuan · setiap metode seam punya bentuk dan argumen', () => {
  // Dibaca **di dalam** test, bukan di badan `describe`: seam baru terisi
  // setelah `initApi()` di `tests/setup.ts`, dan badan `describe` berjalan
  // lebih dulu — di sana `api` masih objek kosong.
  const daftar = () => Object.keys(api).sort()

  it('130 metode, seluruhnya terklasifikasi', () => {
    const metode = daftar()
    expect(metode).toHaveLength(130)
    const sah: Bentuk[] = ['polos', 'kosong', 'halaman', 'nullable', 'nilai']
    for (const nama of metode) expect(sah).toContain(bentukDari(nama))
  })

  it('jumlah tiap bentuk persis seperti kontrak §6', () => {
    const metode = daftar()
    const hitung = (b: Bentuk) => metode.filter((m) => bentukDari(m) === b).length
    expect(hitung('kosong')).toBe(20)
    expect(hitung('halaman')).toBe(12)
    expect(hitung('nullable')).toBe(3)
    expect(hitung('nilai')).toBe(2)
    expect(hitung('polos')).toBe(93)
  })

  it('metode berparameter posisi punya nama argumennya di `api/http`', async () => {
    const { badanDari } = await import('@/api/http')

    for (const [nama, aritas] of Object.entries(ARITAS)) {
      if (aritas < 2) continue

      // Dua argumen boneka; kalau tabelnya kosong, yang kedua hilang tanpa
      // suara dan backend menerima permintaan yang kurang satu bidang.
      const badan = badanDari(nama, ['a', 'b'])
      expect(Object.keys(badan), `${nama} belum ada di tabel ARGUMEN`).toHaveLength(2)
      expect(Object.values(badan)).toEqual(['a', 'b'])
    }
  })
})

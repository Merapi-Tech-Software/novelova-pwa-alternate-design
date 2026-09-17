import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isApiError } from '@/api/errors'
import { badanDari } from '@/api/http'

/**
 * Sisi HTTP seam · `todo-incoming-features.md` **D4**, `backend-contract.md` §2.
 *
 * Backend-nya belum ada, jadi yang diuji di sini adalah **terjemahannya**:
 * argumen seam → badan JSON, amplop → nilai seam, status → `ErrorCode`, dan
 * alur `401 → refresh → ulang`. `fetch` dipalsukan; tidak ada jaringan yang
 * disentuh.
 *
 * Ini yang membuat `api/http/` bukan lagi janji: sampai Langkah 88 ia berkas
 * stub yang melempar `NOT_IMPLEMENTED` untuk semua 130 metode, dan tidak ada
 * satu pun test yang menyentuhnya.
 */

/** Path tanpa `VITE_API_BASE_URL`, supaya test tidak bergantung pada `.env`. */
function jalur(url: string): string {
  return url.slice(url.indexOf('/rpc/'))
}

interface Panggilan {
  url: string
  badan: Record<string, unknown>
  header: Record<string, string>
}

const panggilan: Panggilan[] = []
let balasan: Array<{ status: number; badan: unknown }> = []

function amplop(data: unknown, over: Record<string, unknown> = {}) {
  return { success: true, code: 200, message: '', data, meta: {}, request_id: 'req-1', ...over }
}

function gagal(code: number, message: string, data: unknown = {}) {
  return { success: false, code, message, data, meta: {}, request_id: 'req-gagal' }
}

beforeEach(() => {
  panggilan.length = 0
  balasan = []
  vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
    panggilan.push({
      url,
      badan: JSON.parse(String(init.body)) as Record<string, unknown>,
      header: init.headers as Record<string, string>,
    })
    const next = balasan.shift()
    if (!next) throw new Error(`tidak ada balasan tersisa untuk ${url}`)
    return Promise.resolve({
      status: next.status,
      json: () => Promise.resolve(next.badan),
    } as Response)
  })
})

afterEach(() => vi.unstubAllGlobals())

/** Diimpor malas supaya `fetch` palsu sudah terpasang saat modulnya dibaca. */
async function seam() {
  return (await import('@/api/http')).api
}

describe('§2.1 · argumen seam → badan JSON', () => {
  it('tanpa argumen mengirim objek kosong', () => {
    expect(badanDari('getWallet', [])).toEqual({})
  })

  it('argumen posisi diberi nama dari tabelnya', () => {
    expect(badanDari('getChapter', ['s1', 's1-c5'])).toEqual({ storyId: 's1', chapterId: 's1-c5' })
    expect(badanDari('listConnections', ['followers', { page: 1 }])).toEqual({
      kind: 'followers',
      params: { page: 1 },
    })
  })

  it('objek tunggal dikirim apa adanya', () => {
    expect(badanDari('login', [{ identity: 'a', password: 'b' }])).toEqual({
      identity: 'a',
      password: 'b',
    })
  })

  it('non-objek tunggal dibungkus `arg` — termasuk array', () => {
    expect(badanDari('markRead', [['n1', 'n2']])).toEqual({ arg: ['n1', 'n2'] })
    expect(badanDari('markRead', ['all'])).toEqual({ arg: 'all' })
    expect(badanDari('setShowAdultContent', [true])).toEqual({ arg: true })
  })
})

describe('§2.2 · membuka amplop', () => {
  it('objek biasa pulang utuh, dan headernya lengkap', async () => {
    balasan = [{ status: 200, badan: amplop({ balance: 20_000, bonus: 23 }) }]
    const dompet = await (await seam()).getWallet()

    expect(dompet).toMatchObject({ balance: 20_000 })
    expect(jalur(panggilan[0]?.url ?? '')).toBe('/rpc/getWallet')
    expect(panggilan[0]?.header['Accept-Language']).toBe('id')
    expect(panggilan[0]?.header['X-Client-Version']).toBeTruthy()
  })

  it('koleksi dirakit ulang jadi `Paged<T>` dari `meta`', async () => {
    balasan = [
      {
        status: 200,
        badan: amplop([{ id: 'a' }, { id: 'b' }], {
          meta: { total_count: 42, limit: 20, offset: 20 },
        }),
      },
    ]
    const halaman = await (await seam()).listWithdrawals({ page: 2, pageSize: 20 })

    expect(halaman.page).toBe(2)
    expect(halaman.pageSize).toBe(20)
    expect(halaman.total).toBe(42)
    expect(halaman.hasMore).toBe(true)
  })
})

describe('§7 · status → kode yang dipakai aplikasi', () => {
  it('404 jadi `NOT_FOUND`', async () => {
    balasan = [{ status: 404, badan: gagal(404, 'Cerita ini tidak ada.') }]
    const e = await (await seam()).getStory('x').catch((x: unknown) => x)

    expect(isApiError(e) && e.code).toBe('NOT_FOUND')
    expect(isApiError(e) && e.requestId).toBe('req-gagal')
  })

  it('410 dari `getChapter` jadi `CONTENT-410` beserta tanggalnya', async () => {
    balasan = [
      {
        status: 410,
        badan: gagal(410, 'Bab ini ditarik penulisnya.', {
          withdrawn_at: '2026-09-01T00:00:00.000Z',
        }),
      },
    ]
    const e = await (await seam()).getChapter('s1', 's1-c9').catch((x: unknown) => x)

    // Kode ini tidak dikirim server — dipulihkan dari (`getChapter`, 410).
    expect(isApiError(e) && e.code).toBe('CONTENT-410')
    expect(isApiError(e) && e.withdrawnAt).toBe('2026-09-01T00:00:00.000Z')
  })

  it('`code` yang berbeda dari status HTTP ditolak sebagai `CONTRACT`', async () => {
    balasan = [{ status: 500, badan: gagal(404, 'bohong') }]
    const e = await (await seam()).getStory('x').catch((x: unknown) => x)

    expect(isApiError(e) && e.code).toBe('CONTRACT')
  })

  it('`fetch` yang gagal jadi `NETWORK`, bukan kegagalan produk', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')))
    const e = await (await seam()).getWallet().catch((x: unknown) => x)

    expect(isApiError(e) && e.code).toBe('NETWORK')
    expect(isApiError(e) && e.retryable).toBe(true)
  })
})

describe('§7.1 · 401 memicu satu refresh, tidak pernah dua', () => {
  it('refresh berhasil → permintaan aslinya diulang sekali', async () => {
    balasan = [
      { status: 401, badan: gagal(401, 'Sesi berakhir.') },
      { status: 200, badan: amplop({ accessToken: 'baru' }) },
      { status: 200, badan: amplop({ balance: 10 }) },
    ]
    const dompet = await (await seam()).getWallet()

    expect(dompet).toMatchObject({ balance: 10 })
    expect(panggilan.map((p) => jalur(p.url))).toEqual([
      '/rpc/getWallet',
      '/rpc/refresh',
      '/rpc/getWallet',
    ])
  })

  it('refresh ikut gagal → `AUTH-401`, dan tidak ada permintaan keempat', async () => {
    balasan = [
      { status: 401, badan: gagal(401, 'Sesi berakhir.') },
      { status: 401, badan: gagal(401, 'Sesi berakhir.') },
    ]
    const e = await (await seam()).getWallet().catch((x: unknown) => x)

    // Lembar masuk ulang dipicu oleh `AUTH-401`; kalau yang sampai kode lain,
    // pengguna terjebak di layar gagal tanpa jalan keluar.
    expect(isApiError(e) && e.code).toBe('AUTH-401')
    expect(panggilan).toHaveLength(2)
  })
})

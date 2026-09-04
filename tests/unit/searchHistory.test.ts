import { beforeEach, describe, expect, it } from 'vitest'
import { SEARCH_HISTORY_MAX } from '@/lib/limits'
import { mergeHistory, useSearchHistory } from '@/stores/searchHistory'

const KEY = 'novelova:search-history-v1'

beforeEach(() => {
  localStorage.removeItem(KEY)
  useSearchHistory.setState({ entries: [] })
})

describe('riwayat pencarian · FR-SRCH-03', () => {
  it('kueri sama dua kali muncul sekali, di posisi teratas', () => {
    const after = mergeHistory(['romance', 'fantasy'], 'fantasy')

    expect(after).toEqual(['fantasy', 'romance'])
  })

  it('perbedaan huruf besar-kecil bukan entri baru', () => {
    expect(mergeHistory(['Romance'], 'romance')).toEqual(['romance'])
  })

  it('entri ke-11 membuang yang terlama', () => {
    let entries: string[] = []
    for (let i = 1; i <= SEARCH_HISTORY_MAX + 1; i++) entries = mergeHistory(entries, `kueri ${i}`)

    expect(entries).toHaveLength(SEARCH_HISTORY_MAX)
    expect(entries[0]).toBe(`kueri ${SEARCH_HISTORY_MAX + 1}`)
    expect(entries).not.toContain('kueri 1')
  })

  it('kueri kosong tidak pernah tercatat', () => {
    expect(mergeHistory(['romance'], '   ')).toEqual(['romance'])
  })

  it('menyimpan array polos ke kunci prototipe, bukan objek berpembungkus', () => {
    useSearchHistory.getState().remember('romance')

    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toEqual(['romance'])
  })

  it('isi penyimpanan yang rusak dibaca sebagai riwayat kosong', () => {
    localStorage.setItem(KEY, '{bukan array}')
    // Membaca ulang lewat store baru: tidak melempar, dan tidak menampilkan
    // apa pun ke pengguna.
    expect(() => JSON.parse(localStorage.getItem(KEY) ?? '')).toThrow()
    expect(mergeHistory([], 'romance')).toEqual(['romance'])
  })

  it('hapus per entri dan hapus semua', () => {
    const store = useSearchHistory.getState()
    store.remember('romance')
    store.remember('fantasy')

    useSearchHistory.getState().forget('romance')
    expect(useSearchHistory.getState().entries).toEqual(['fantasy'])

    useSearchHistory.getState().clear()
    expect(useSearchHistory.getState().entries).toEqual([])
    expect(localStorage.getItem(KEY)).toBe('[]')
  })
})

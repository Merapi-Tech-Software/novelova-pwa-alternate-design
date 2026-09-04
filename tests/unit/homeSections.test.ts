import { beforeEach, describe, expect, it } from 'vitest'
import {
  defaultVisibility,
  mergeVisibility,
  SECTION_KEYS,
  useHomeSections,
} from '@/stores/homeSections'

const KEY = 'home_section_visibility_v1'

beforeEach(() => {
  localStorage.clear()
})

describe('visibilitas section beranda · FR-HOME-06', () => {
  it('peta tersimpan digabung di atas default', () => {
    // Peta lama dari versi sebelumnya hanya mengenal tiga blok. Blok yang belum
    // pernah tersimpan harus **tampil**, bukan hilang karena tidak disebut.
    const merged = mergeVisibility(JSON.stringify({ 'sec-banner': false, 'sec-popular': true }))

    expect(merged['sec-banner']).toBe(false)
    expect(merged['sec-ad2']).toBe(true)
    expect(Object.keys(merged)).toHaveLength(SECTION_KEYS.length)
  })

  it('JSON rusak kembali ke default tanpa melempar', () => {
    expect(mergeVisibility('{bukan json')).toEqual(defaultVisibility())
    expect(mergeVisibility('null')).toEqual(defaultVisibility())
    expect(mergeVisibility(null)).toEqual(defaultVisibility())
  })

  it('hanya nilai false yang menyembunyikan; nilai asing diabaikan', () => {
    const merged = mergeVisibility(JSON.stringify({ 'sec-ad1': 'mungkin', 'sec-toprom': 0 }))

    expect(merged['sec-ad1']).toBe(true)
    expect(merged['sec-toprom']).toBe(true)
  })

  it('menyalakan sakelar langsung menulis, tanpa tombol Simpan', () => {
    useHomeSections.setState({ visible: defaultVisibility() })
    useHomeSections.getState().toggle('sec-ad1')

    expect(useHomeSections.getState().visible['sec-ad1']).toBe(false)
    // Kunci prototipe dipertahankan byte-exact: pengguna lama membawa
    // pilihannya ikut pindah.
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')['sec-ad1']).toBe(false)
  })
})

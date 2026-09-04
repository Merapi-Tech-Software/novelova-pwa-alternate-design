import { beforeEach, describe, expect, it } from 'vitest'
import { READER_FONT_MAX, READER_FONT_MIN } from '@/lib/limits'
import {
  applyReaderSettings,
  clampFontSize,
  mergeSettings,
  useReaderSettings,
} from '@/stores/readerSettings'

const KEY = 'novelova-reader-settings-v1'

beforeEach(() => {
  localStorage.removeItem(KEY)
})

describe('pengaturan baca · FR-READ-03 · FR-READ-04', () => {
  it('ukuran huruf dijepit di kedua ujungnya, bukan ditolak', () => {
    expect(clampFontSize(9)).toBe(READER_FONT_MIN)
    expect(clampFontSize(99)).toBe(READER_FONT_MAX)
    expect(clampFontSize(19)).toBe(19)
  })

  it('nilai tersimpan digabung di atas default', () => {
    const merged = mergeSettings(JSON.stringify({ darkTheme: true }))

    expect(merged.darkTheme).toBe(true)
    // Kunci yang belum pernah tersimpan tetap punya nilai.
    expect(merged.fontSize).toBeGreaterThanOrEqual(READER_FONT_MIN)
    expect(merged.autoUnlock).toBe(false)
  })

  it('ukuran huruf di luar rentang dari penyimpanan ikut dijepit', () => {
    expect(mergeSettings(JSON.stringify({ fontSize: 48 })).fontSize).toBe(READER_FONT_MAX)
  })

  it('JSON rusak kembali ke default tanpa melempar', () => {
    expect(mergeSettings('{bukan json')).toMatchObject({ darkTheme: false })
    expect(mergeSettings(null).fontSize).toBe(mergeSettings('null').fontSize)
  })

  it('menempel ke elemen akar, jadi berlaku sebelum React merender', () => {
    applyReaderSettings({ fontSize: 21, darkTheme: true, autoUnlock: false })

    expect(document.documentElement.style.getPropertyValue('--reader-font-size')).toBe('21px')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('menyimpan objek datar ke kunci prototipe, bukan objek berpembungkus', () => {
    useReaderSettings.getState().setFontSize(20)

    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toMatchObject({ fontSize: 20 })
  })
})

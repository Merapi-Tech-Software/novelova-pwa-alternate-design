import { describe, expect, it } from 'vitest'
import { isOutdated } from '@/lib/version'

describe('versi aplikasi · APP-426', () => {
  it('membandingkan per angka, bukan sebagai teks', () => {
    // Perbandingan string mengatakan '2.10.0' < '2.9.0'. Itulah bug yang
    // membuat pengguna versi terbaru justru disuruh memperbarui.
    expect(isOutdated('2.10.0', '2.9.0')).toBe(false)
    expect(isOutdated('2.9.0', '2.10.0')).toBe(true)
  })

  it('versi sama persis bukan versi kedaluwarsa', () => {
    expect(isOutdated('0.1.0', '0.1.0')).toBe(false)
  })

  it('panjang berbeda diperlakukan sebagai nol di belakang', () => {
    expect(isOutdated('2.4', '2.4.0')).toBe(false)
    expect(isOutdated('2.4', '2.4.1')).toBe(true)
  })

  it('tanpa versi minimum, tidak ada yang dinyatakan kedaluwarsa', () => {
    expect(isOutdated('0.1.0', undefined)).toBe(false)
  })
})

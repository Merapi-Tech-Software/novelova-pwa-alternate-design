import { describe, expect, it } from 'vitest'
import { COIN_RATE, calcPrice, formatCompactCoin, MIN_CUSTOM_COINS } from '@/lib/coin'

describe('formatCompactCoin', () => {
  it('memakai bentuk ringkas Indonesia sesuai FR-READ-05', () => {
    expect(formatCompactCoin(800)).toBe('800')
    expect(formatCompactCoin(12_000)).toBe('12rb')
    expect(formatCompactCoin(15_300)).toBe('15,3rb')
    expect(formatCompactCoin(1_500_000)).toBe('1,5jt')
  })

  it('memakai koma sebagai pemisah desimal, bukan titik', () => {
    // Di Indonesia titik adalah pemisah **ribuan**: `15.3rb` terbaca sebagai
    // lima belas ribu tiga ratus ribu. Mockup `7a` dan `7i` mencetak `15,3rb`.
    expect(formatCompactCoin(15_300)).not.toContain('.')
    expect(formatCompactCoin(1_500_000)).not.toContain('.')
  })

  it('tidak menuliskan desimal nol', () => {
    // Bug yang gampang muncul dari toFixed(1) tanpa pemangkasan.
    expect(formatCompactCoin(12_000)).not.toBe('12,0rb')
    expect(formatCompactCoin(2_000_000)).toBe('2jt')
  })

  it('memotong, bukan membulatkan ke atas', () => {
    // Angka yang menyangkut uang tidak boleh terlihat lebih besar dari aslinya.
    expect(formatCompactCoin(15_390)).toBe('15,3rb')
    expect(formatCompactCoin(999_999)).toBe('999,9rb')
  })

  it('menangani nol, angka kecil, dan saldo negatif di ledger', () => {
    expect(formatCompactCoin(0)).toBe('0')
    expect(formatCompactCoin(999)).toBe('999')
    expect(formatCompactCoin(1_000)).toBe('1rb')
    expect(formatCompactCoin(-1_500)).toBe('-1,5rb')
  })
})

describe('calcPrice', () => {
  it('membulatkan ke kelipatan 100 terdekat pada hasil akhir (FR-WALLET-03)', () => {
    expect(calcPrice(150)).toBe(19_500)
  })

  it('membulatkan hasil, bukan kursnya', () => {
    // 130 * 130 = 16.900 → tetap 16.900; 101 * 130 = 13.130 → 13.100.
    expect(calcPrice(130)).toBe(16_900)
    expect(calcPrice(101)).toBe(13_100)
    expect(calcPrice(MIN_CUSTOM_COINS)).toBe(13_000)
  })

  it('selalu menghasilkan kelipatan 100', () => {
    for (let coins = MIN_CUSTOM_COINS; coins <= 5_000; coins += 37) {
      expect(calcPrice(coins) % 100).toBe(0)
    }
  })

  it('memakai kurs yang terkunci di satu tempat', () => {
    expect(COIN_RATE).toBe(130)
  })
})

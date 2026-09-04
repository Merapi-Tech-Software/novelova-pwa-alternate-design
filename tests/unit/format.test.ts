import { describe, expect, it } from 'vitest'
import {
  formatCountdown,
  formatDayGroup,
  formatNumber,
  formatRelative,
  formatRupiah,
} from '@/lib/format'

const NOW = new Date(2026, 7, 26, 21, 44) // 26 Agu 2026, 21.44 lokal
const minutesAgo = (n: number) => new Date(NOW.getTime() - n * 60_000)

describe('angka & uang', () => {
  it('memakai pemisah ribuan Indonesia', () => {
    expect(formatNumber(985_234)).toBe('985.234')
  })

  it('menempelkan "Rp" ke angkanya dengan spasi tanpa-putus', () => {
    // Intl memakai U+00A0, bukan spasi biasa — sengaja, supaya "Rp" tidak pernah
    // tertinggal sendirian di ujung baris. Perbandingan string mana pun terhadap
    // hasil formatRupiah harus memakai U+00A0, bukan ' '.
    expect(formatRupiah(148_000)).toBe('Rp\u00a0148.000')
    expect(formatRupiah(1_500)).toBe('Rp\u00a01.500')
    expect(formatRupiah(148_000)).not.toBe('Rp 148.000')
  })
})

describe('formatRelative', () => {
  it('memakai copy PRD, bukan bentuk ICU "yang lalu"', () => {
    expect(formatRelative(minutesAgo(12), NOW)).toBe('12 menit lalu')
    expect(formatRelative(minutesAgo(12), NOW)).not.toContain('yang lalu')
  })

  it('menyebut "baru saja" untuk yang benar-benar baru', () => {
    expect(formatRelative(new Date(NOW.getTime() - 5_000), NOW)).toBe('baru saja')
  })

  it('naik satuan pada ambangnya', () => {
    expect(formatRelative(minutesAgo(59), NOW)).toBe('59 menit lalu')
    expect(formatRelative(minutesAgo(60), NOW)).toBe('1 jam lalu')
    expect(formatRelative(minutesAgo(21 * 60 + 44), NOW)).toBe('21 jam lalu')
  })

  it('memakai batas hari kalender, bukan 24 jam', () => {
    const tengahMalam = new Date(2026, 7, 27, 0, 10)
    const sebelumnya = new Date(2026, 7, 26, 23, 50) // 20 menit sebelumnya

    expect(formatRelative(sebelumnya, tengahMalam)).toBe('Kemarin')
  })

  it('turun ke hari, minggu, bulan, tahun', () => {
    expect(formatRelative(new Date(2026, 7, 23, 10, 0), NOW)).toBe('3 hari lalu')
    expect(formatRelative(new Date(2026, 7, 12, 10, 0), NOW)).toBe('2 minggu lalu')
    expect(formatRelative(new Date(2025, 10, 26, 10, 0), NOW)).toBe('9 bulan lalu')
    expect(formatRelative(new Date(2024, 7, 26, 10, 0), NOW)).toBe('2 tahun lalu')
  })

  it('tidak menghasilkan waktu negatif untuk jam perangkat yang meleset', () => {
    expect(formatRelative(new Date(NOW.getTime() + 60_000), NOW)).toBe('baru saja')
  })
})

describe('formatDayGroup', () => {
  it('memberi kepala kelompok FR-NOTIF-01', () => {
    expect(formatDayGroup(minutesAgo(30), NOW)).toBe('Hari ini')
    expect(formatDayGroup(new Date(2026, 7, 25, 9, 0), NOW)).toBe('Kemarin')
    expect(formatDayGroup(new Date(2026, 7, 20, 9, 0), NOW)).toBe('20 Agu 2026')
  })
})

describe('formatCountdown', () => {
  it('membuang jam saat tidak diperlukan', () => {
    expect(formatCountdown(14 * 60_000 + 59_000)).toBe('14:59')
  })

  it('menampilkan jam untuk kedaluwarsa VA 24 jam', () => {
    expect(formatCountdown(23 * 3_600_000 + 59 * 60_000 + 12_000)).toBe('23:59:12')
  })

  it('berhenti di nol, tidak jadi negatif', () => {
    expect(formatCountdown(-5_000)).toBe('00:00')
  })
})

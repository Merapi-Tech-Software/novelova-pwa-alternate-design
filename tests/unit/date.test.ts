import { describe, expect, it, vi } from 'vitest'
import { isSameLocalDay, localDaysBetween, todayLocalISO } from '@/lib/date'

/**
 * Zona waktu dipalsukan per-Date, bukan lewat `process.env.TZ`, supaya satu
 * berkas test bisa memeriksa UTC+7 dan UTC−5 sekaligus tanpa menjalankan ulang
 * runner-nya.
 */
function at(iso: string, offsetMinutes: number): Date {
  const d = new Date(iso)
  vi.spyOn(d, 'getTimezoneOffset').mockReturnValue(offsetMinutes)
  return d
}

const WIB = -420 // UTC+7
const EST = 300 // UTC−5

describe('todayLocalISO', () => {
  it('memakai tanggal lokal, bukan tanggal UTC (kasus bug tanggal kemarin)', () => {
    // 26 Agu 23.30 UTC = 27 Agu 06.30 WIB. Pemakai di Jakarta sudah hari baru.
    const malam = at('2026-08-26T23:30:00Z', WIB)

    expect(todayLocalISO(malam)).toBe('2026-08-27')
    // Inilah yang salah sebelumnya — klaim check-in harian jadi ditolak.
    expect(malam.toISOString().slice(0, 10)).toBe('2026-08-26')
  })

  it('benar juga di zona waktu barat UTC', () => {
    // 27 Agu 02.00 UTC = 26 Agu 21.00 EST.
    expect(todayLocalISO(at('2026-08-27T02:00:00Z', EST))).toBe('2026-08-26')
  })

  it('tepat di tengah malam lokal', () => {
    // 26 Agu 17.00 UTC = 27 Agu 00.00 WIB.
    expect(todayLocalISO(at('2026-08-26T17:00:00Z', WIB))).toBe('2026-08-27')
    // Satu menit sebelumnya masih tanggal 26.
    expect(todayLocalISO(at('2026-08-26T16:59:00Z', WIB))).toBe('2026-08-26')
  })
})

describe('localDaysBetween', () => {
  it('menghitung hari kalender, bukan selisih 24 jam', () => {
    const malam = new Date(2026, 7, 26, 23, 0)
    const dinihari = new Date(2026, 7, 27, 1, 0)

    // Hanya berjarak 2 jam, tapi beda hari — dan itu yang dilihat pengguna.
    expect(localDaysBetween(malam, dinihari)).toBe(1)
    expect(isSameLocalDay(malam, dinihari)).toBe(false)
  })

  it('nol untuk waktu di hari yang sama', () => {
    expect(localDaysBetween(new Date(2026, 7, 26, 1, 0), new Date(2026, 7, 26, 23, 0))).toBe(0)
  })
})

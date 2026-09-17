import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MuatRute } from '@/components/patterns/MuatRute'
import { MUAT_RUTE_TUNDA_MS } from '@/lib/limits'

/**
 * `MuatRute` · Fase 14b-c. Yang dijaga cuma satu aturan: **tidak ada apa pun
 * sebelum ambangnya**, ada sesudahnya. Modul yang tiba lebih cepat dari
 * `MUAT_RUTE_TUNDA_MS` tidak boleh meninggalkan kedipan.
 */

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('MuatRute', () => {
  it('diam selama ambang, lalu muncul dengan nama untuk pembaca layar', () => {
    render(<MuatRute />)

    expect(screen.queryByRole('status')).toBeNull()

    act(() => vi.advanceTimersByTime(MUAT_RUTE_TUNDA_MS - 1))
    expect(screen.queryByRole('status')).toBeNull()

    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Memuat…')).toBeInTheDocument()
  })

  it('tujuh halaman dan satu punggung — siluet yang sama dengan layar pembuka', () => {
    render(<MuatRute />)
    act(() => vi.advanceTimersByTime(MUAT_RUTE_TUNDA_MS))

    const jalur = screen.getByRole('status').querySelectorAll('path')
    expect(jalur).toHaveLength(8)
    // Warna lewat `currentColor` + token, bukan hex: berkas ini ikut dipindai
    // `check-tokens.mjs`, dan logo yang disalin mentah akan menjatuhkannya.
    expect(jalur[0]?.getAttribute('fill')).toBe('currentColor')
  })

  it('dilepas sebelum ambang → tidak ada pembaruan state yang tersesat', () => {
    const { unmount } = render(<MuatRute />)
    act(() => vi.advanceTimersByTime(MUAT_RUTE_TUNDA_MS / 2))
    unmount()

    // Timer yang tidak dibersihkan akan mencoba `setState` pada komponen yang
    // sudah tidak ada. Tidak ada peringatan React = timer memang dibersihkan.
    const peringatan = vi.spyOn(console, 'error').mockImplementation(() => {})
    act(() => vi.advanceTimersByTime(MUAT_RUTE_TUNDA_MS))
    expect(peringatan).not.toHaveBeenCalled()
    peringatan.mockRestore()
  })
})

import { describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { firstError } from '@/features/auth/pages/RegisterPage'
import { RESET_LINK_MIN } from '@/lib/limits'
import { passwordScore } from '@/lib/password'

const VALID = { name: 'Anna', email: 'anna@contoh.com', password: 'Rahasia1!', agree: true }

describe('validasi daftar · FR-AUTH-05/07', () => {
  it('berhenti pada kesalahan pertama, mengikuti urutan kolom', () => {
    expect(firstError({ ...VALID, name: '  ', email: 'bukan-email' })).toBe('Isi nama tampilan.')
    expect(firstError({ ...VALID, email: 'anna@contoh' })).toBe('Format email tidak valid.')
    expect(firstError({ ...VALID, password: 'pendek' })).toBe('Kata sandi minimal 8 karakter.')
  })

  it('persetujuan diperiksa paling akhir', () => {
    // Kolom yang belum sah lebih dulu, baru persetujuan — pengguna tidak diminta
    // menyetujui ketentuan untuk formulir yang ternyata belum bisa dikirim.
    expect(firstError({ ...VALID, password: 'pendek', agree: false })).toBe(
      'Kata sandi minimal 8 karakter.',
    )
    expect(firstError({ ...VALID, agree: false })).toBe('Setujui ketentuan untuk melanjutkan.')
  })

  it('seluruh kolom sah tidak menghasilkan pesan', () => {
    expect(firstError(VALID)).toBeNull()
  })
})

describe('meter kekuatan kata sandi · FR-AUTH-06', () => {
  it('empat kriteria independen, satu poin masing-masing', () => {
    expect(passwordScore('')).toBe(0)
    expect(passwordScore('abcdefgh')).toBe(1)
    expect(passwordScore('Abcdefgh')).toBe(2)
    expect(passwordScore('Abcdefg1')).toBe(3)
    expect(passwordScore('Abcdef1!')).toBe(4)
  })

  it('kata sandi pendek tetap bisa mengumpulkan poin selain panjang', () => {
    // Meter informasional: ia menjelaskan, bukan memblokir. Yang memblokir
    // submit hanya panjang minimum.
    expect(passwordScore('Ab1!')).toBe(3)
  })
})

describe('handler mock pendaftaran & pemulihan', () => {
  it('akun baru langsung punya sesi, dompet, dan onboarding yang belum jalan', async () => {
    const email = `baru-${Date.now()}@contoh.com`
    const session = await api.register({
      displayName: 'Pembaca Baru',
      email,
      password: 'Rahasia1!',
      acceptedTerms: true,
    })

    expect(session.user.displayName).toBe('Pembaca Baru')
    expect(await db.wallets.get(session.user.id)).toMatchObject({ balance: 0 })
    expect(await api.getReaderPrefs()).toMatchObject({ onboardedAt: null })
  })

  it('email yang sudah terdaftar ditolak dengan jalan keluar', async () => {
    await expect(
      api.register({
        displayName: 'Kembar',
        email: 'annamaharani@contoh.com',
        password: 'Rahasia1!',
        acceptedTerms: true,
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('permintaan reset tidak pernah menolak, termasuk saat kosong', async () => {
    await expect(api.requestReset('anna@contoh.com')).resolves.toMatchObject({
      sentTo: 'anna@contoh.com',
      expiresInMinutes: RESET_LINK_MIN,
    })
    // Kolom kosong memakai frasa pengganti — dan tetap tidak membocorkan
    // apakah akunnya ada.
    await expect(api.requestReset('   ')).resolves.toMatchObject({ sentTo: 'kontak akunmu' })
  })
})

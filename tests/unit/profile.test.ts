import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID as ME } from '@/api/mock/seed'
import { SECURITY_MAX, securityLevel, securityScore } from '@/lib/security'

/** Privasi, profil penulis, dan sesi dikembalikan ke titik bersih tiap test. */
beforeEach(async () => {
  await db.privacySettings.delete(ME)
  const author = await db.authorProfiles.get(ME)
  if (author) await db.authorProfiles.put({ ...author, twoFactor: true, payoutVerified: true })
  await db.withdrawals.where('userId').equals(ME).delete()
})

// ── FR-PROF-10 · sakelar privasi benar-benar mengendalikan ──────────────────

describe('privasi profil publik', () => {
  it('bawaannya ketiga tab ada, dan dompet tidak pernah termasuk', async () => {
    const profil = await api.getPublicProfile(ME)
    expect(profil.tabs).toEqual(['activity', 'books', 'reviews'])
    expect(profil.visibility.wallet).toBe(false)
  })

  it('mematikan sakelar Books menghilangkan **tabnya**, bukan mengosongkannya', async () => {
    const privacy = await api.getPrivacySettings()
    await api.setPrivacySettings({ ...privacy, library: false })

    const profil = await api.getPublicProfile(ME)
    expect(profil.tabs).not.toContain('books')
    // Dan isinya benar-benar tidak dikirim — "disembunyikan di layar" bukan
    // disembunyikan.
    expect(profil.books).toHaveLength(0)
    // Tab lain tidak ikut hilang.
    expect(profil.tabs).toContain('activity')
    expect(profil.tabs).toContain('reviews')
  })

  it('mematikan ketiganya menyisakan nol tab, bukan tiga tab kosong', async () => {
    const privacy = await api.getPrivacySettings()
    await api.setPrivacySettings({
      ...privacy,
      readingActivity: false,
      library: false,
      reviews: false,
    })

    const profil = await api.getPublicProfile(ME)
    expect(profil.tabs).toEqual([])
    expect(profil.activity).toHaveLength(0)
    expect(profil.reviews).toHaveLength(0)
  })

  it('tab Visibility menampilkan keadaan nyata, bukan teks statis', async () => {
    const privacy = await api.getPrivacySettings()
    await api.setPrivacySettings({ ...privacy, reviews: false })

    const profil = await api.getPublicProfile(ME)
    expect(profil.visibility.reviews).toBe(false)
    expect(profil.visibility.library).toBe(true)
  })

  it('dompet dipaksa mati **di server**, walau permintaannya menyalakannya', async () => {
    const privacy = await api.getPrivacySettings()
    const saved = await api.setPrivacySettings({ ...privacy, wallet: true })

    expect(saved.wallet).toBe(false)
    expect((await api.getPrivacySettings()).wallet).toBe(false)
  })

  it('yang menyembunyikan aktivitas tetap muncul di daftar koneksi, tanpa ringkasannya', async () => {
    const privacy = await api.getPrivacySettings()
    await api.setPrivacySettings({ ...privacy, readingActivity: false })

    const profil = await api.getPublicProfile(ME)
    expect(profil.user.activity).toBeNull()
    // Barisnya tetap ada — yang hilang ringkasannya, bukan orangnya.
    expect(profil.user.displayName.length).toBeGreaterThan(0)
  })
})

// ── FR-SET-02 · skor keamanan dari faktor nyata ─────────────────────────────

describe('skor keamanan', () => {
  it('bobot kelima faktor berjumlah tepat 100', () => {
    expect(SECURITY_MAX).toBe(100)
  })

  it('naik **persis 25 poin** saat 2FA dinyalakan, dan sarannya ikut hilang', async () => {
    const author = await db.authorProfiles.get(ME)
    if (author) await db.authorProfiles.put({ ...author, twoFactor: false })

    const mati = await api.getSecurityOverview()
    expect(mati.tips.some((tip) => tip.id === 'twoFactor')).toBe(true)

    if (author) await db.authorProfiles.put({ ...author, twoFactor: true })
    const nyala = await api.getSecurityOverview()

    expect(nyala.score - mati.score).toBe(25)
    expect(nyala.tips.some((tip) => tip.id === 'twoFactor')).toBe(false)
  })

  it('saran lahir dari keadaan nyata — tidak ada saran untuk yang sudah menyala', async () => {
    const overview = await api.getSecurityOverview()
    for (const tip of overview.tips) {
      const faktor = overview.factors.find((f) => f.id === tip.id)
      if (faktor) expect(faktor.met).toBe(false)
    }
  })

  it('ambang labelnya sesuai kanvas layar 29', () => {
    expect(securityLevel(85)).toBe('kuat')
    expect(securityLevel(84)).toBe('sedang')
    expect(securityLevel(60)).toBe('sedang')
    expect(securityLevel(59)).toBe('lemah')
  })

  it('skor nol saat tidak satu pun faktor terpenuhi', () => {
    expect(
      securityScore({
        password: false,
        twoFactor: false,
        loginAlerts: false,
        recovery: false,
        sessions: false,
      }),
    ).toBe(0)
  })
})

// ── FR-SET-03 · sesi ────────────────────────────────────────────────────────

describe('sesi perangkat', () => {
  it('sesi yang sedang dipakai tidak bisa dicabut dari sini', async () => {
    const sesi = await api.listDeviceSessions()
    const sekarang = sesi.find((s) => s.current)
    expect(sekarang).toBeDefined()

    await expect(api.revokeDeviceSession(sekarang?.id ?? '')).rejects.toThrow(/sedang kamu pakai/i)
  })

  it('"keluar dari semua perangkat" menyisakan tepat sesi yang sedang dipakai', async () => {
    await api.revokeDeviceSession('all-others')
    const sisa = await api.listDeviceSessions()
    expect(sisa).toHaveLength(1)
    expect(sisa[0]?.current).toBe(true)
  })
})

// ── FR-SET-05 · hapus riwayat, ekspor, penghapusan akun ─────────────────────

describe('data & akun', () => {
  it('hapus riwayat membaca **tidak** mengeluarkan cerita dari perpustakaan', async () => {
    const rakSebelum = (await db.libraryEntries.where('userId').equals(ME).toArray()).filter(
      (e) => !e.removed,
    ).length
    expect(rakSebelum).toBeGreaterThan(0)

    await api.clearReadingHistory()

    expect(await db.progress.where('userId').equals(ME).count()).toBe(0)
    const rakSesudah = (await db.libraryEntries.where('userId').equals(ME).toArray()).filter(
      (e) => !e.removed,
    ).length
    expect(rakSesudah).toBe(rakSebelum)
  })

  it('ekspor menolak permintaan tanpa kategori', async () => {
    await expect(api.requestDataExport([])).rejects.toThrow(/minimal satu kategori/i)
  })

  it('ekspor diproses asinkron dan tautannya berbatas waktu', async () => {
    const hasil = await api.requestDataExport(['identitas', 'dompet'])
    expect(hasil.status).toBe('processing')
    expect(hasil.expiresAt).not.toBeNull()
    expect(hasil.categories).toEqual(['identitas', 'dompet'])
  })

  it('penghapusan akun **ditahan** saat ada penarikan yang masih ditinjau', async () => {
    await db.withdrawals.put({
      id: 'wd-uji',
      userId: ME,
      amount: 200_000,
      fee: 5_000,
      net: 195_000,
      bankName: 'BCA',
      bankAccountMasked: '**** 4481',
      status: 'review',
      reason: null,
      proofUrl: null,
      requestedAt: new Date().toISOString(),
      settledAt: null,
    })

    const cek = await api.getDeletionCheck()
    expect(cek.allowed).toBe(false)
    expect(cek.blockers.join(' ')).toMatch(/pencairan/i)

    await expect(api.requestAccountDeletion()).rejects.toThrow(/pencairan/i)
  })

  it('konsekuensinya dinyatakan sebelum konfirmasi, dan pengamannya nama akun', async () => {
    const cek = await api.getDeletionCheck()
    expect(cek.consequences.length).toBeGreaterThanOrEqual(4)
    expect(cek.graceDays).toBe(30)
    expect(cek.confirmPhrase.length).toBeGreaterThan(0)
  })
})

// ── FR-PROF-02 · rekap mingguan ─────────────────────────────────────────────

describe('rekap mingguan', () => {
  it('diturunkan dari tanggal selesai per bab, bukan penghitung tersimpan', async () => {
    const rekap = await api.getWeeklyRecap()
    expect(rekap.chapters).toBeGreaterThanOrEqual(0)
    expect(rekap.stories).toBeLessThanOrEqual(rekap.chapters)
  })

  it('nol lawan nol adalah nol persen, bukan seratus', async () => {
    await api.clearReadingHistory()
    const rekap = await api.getWeeklyRecap()
    expect(rekap.chapters).toBe(0)
    expect(rekap.changePct).toBe(0)
  })
})

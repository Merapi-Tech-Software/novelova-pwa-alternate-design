import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'

const base = { priceCoins: 3, previewPct: 20, privateReason: null, privateUntil: null }

async function verified(tier: 'verified' | 'registered' = 'verified') {
  await db.authorProfiles.put({
    userId: CURRENT_USER_ID,
    tier,
    payoutVerified: tier === 'verified',
    twoFactor: tier === 'verified',
    termsAcceptedAt: new Date().toISOString(),
  })
}

beforeEach(async () => {
  await verified()
  await db.chapters.update('ms1-c47', {
    access: 'paid',
    priceCoins: 1_800,
    previewPct: 20,
    state: 'published',
    accessChangedAt: null,
    privateReason: null,
    privateUntil: null,
  })
  await db.ownerships.where('chapterId').startsWith('ms1-').delete()
})

describe('konteks bab · FR-STUDIO-36', () => {
  it('memuat identitas dan nilai dari bab itu, bukan nilai tetap', async () => {
    const info = await api.getChapterAccess('ms1-c47')

    expect(info.number).toBe(47)
    expect(info.title).toBe('Tawaran di Lantai Tiga Puluh')
    expect(info.access).toBe('paid')
    expect(info.wordCount).toBeGreaterThan(0)
  })

  it('jumlah pembeli datang dari kepemilikan nyata, dan iklan tidak dihitung', async () => {
    await db.ownerships.bulkPut([
      {
        id: 'own-a',
        userId: 'u9',
        chapterId: 'ms1-c47',
        source: 'coin',
        acquiredAt: new Date().toISOString(),
      },
      {
        id: 'own-b',
        userId: 'u8',
        chapterId: 'ms1-c47',
        source: 'ad',
        acquiredAt: new Date().toISOString(),
      },
    ])

    expect((await api.getChapterAccess('ms1-c47')).buyers).toBe(1)
  })

  it('bagi hasil datang dari server, bukan konstanta klien', async () => {
    expect((await api.getChapterAccess('ms1-c47')).authorSharePct).toBe(80)
  })
})

describe('empat aturan ditegakkan server · FR-STUDIO-23..26 · FR-STUDIO-36', () => {
  it('bab pertama tidak bisa diprivatkan', async () => {
    // Bab contoh penulis bernomor 43–51, jadi bab nomor satu dibuat di sini
    // pada cerita miliknya yang lain.
    const sample = await db.chapters.get('ms1-c47')
    if (!sample) throw new Error('bab acuan tidak ada')
    await db.chapters.put({ ...sample, id: 'ms2-c1', storyId: 'ms2', number: 1 })

    const first = await api.getChapterAccess('ms2-c1')
    expect(first.canBePrivate).toBe(false)

    await expect(
      api.setChapterAccess({ ...base, chapterId: 'ms2-c1', access: 'private' }),
    ).rejects.toMatchObject({ code: 'CONFLICT' })

    await db.chapters.delete('ms2-c1')
  })

  it('bab berbayar menuntut penulis terverifikasi', async () => {
    await verified('registered')

    await expect(
      api.setChapterAccess({ ...base, chapterId: 'ms1-c47', access: 'paid' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('harga dijepit 1–50 di server, bukan hanya di layar', async () => {
    expect(
      (
        await api.setChapterAccess({
          ...base,
          chapterId: 'ms1-c47',
          access: 'paid',
          priceCoins: 999,
        })
      ).priceCoins,
    ).toBe(50)
    expect(
      (await api.setChapterAccess({ ...base, chapterId: 'ms1-c47', access: 'paid', priceCoins: 0 }))
        .priceCoins,
    ).toBe(1)
  })

  it('bab yang baru digratiskan ditahan tujuh hari sebelum kembali berbayar', async () => {
    await api.setChapterAccess({ ...base, chapterId: 'ms1-c47', access: 'free' })
    const info = await api.getChapterAccess('ms1-c47')
    expect(info.freeLockDaysLeft).toBe(7)

    await expect(
      api.setChapterAccess({ ...base, chapterId: 'ms1-c47', access: 'paid' }),
    ).rejects.toMatchObject({ code: 'CONFLICT' })

    // Lewat masa tahannya, ia bebas lagi.
    await db.chapters.update('ms1-c47', {
      accessChangedAt: new Date(Date.now() - 8 * 86_400_000).toISOString(),
    })
    expect((await api.getChapterAccess('ms1-c47')).freeLockDaysLeft).toBe(0)
    await expect(
      api.setChapterAccess({ ...base, chapterId: 'ms1-c47', access: 'paid' }),
    ).resolves.toMatchObject({ access: 'paid' })
  })

  it('mengubah harga saja tidak memperpanjang masa tahan', async () => {
    await api.setChapterAccess({ ...base, chapterId: 'ms1-c47', access: 'free' })
    await db.chapters.update('ms1-c47', {
      accessChangedAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    })

    await api.setChapterAccess({ ...base, chapterId: 'ms1-c47', access: 'free', previewPct: 40 })

    // Masih satu hari tersisa — bukan tujuh lagi.
    expect((await api.getChapterAccess('ms1-c47')).freeLockDaysLeft).toBe(1)
  })
})

describe('privat menyembunyikan bab · FR-STUDIO-26', () => {
  it('menyimpan alasan dan tanggal kembali, lalu mengembalikannya saat tidak privat lagi', async () => {
    const hidden = await api.setChapterAccess({
      ...base,
      chapterId: 'ms1-c47',
      access: 'private',
      privateReason: 'revisi',
      privateUntil: '2026-12-01',
    })

    expect(hidden.access).toBe('private')
    expect(hidden.privateReason).toBe('revisi')
    expect((await db.chapters.get('ms1-c47'))?.state).toBe('private')

    const shown = await api.setChapterAccess({ ...base, chapterId: 'ms1-c47', access: 'free' })
    expect(shown.privateReason).toBeNull()
    expect((await db.chapters.get('ms1-c47'))?.state).toBe('published')
  })
})

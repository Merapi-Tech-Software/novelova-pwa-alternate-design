import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/api/mock/db'
import { CURRENT_USER_ID } from '@/api/mock/seed'
import { GENRE_TABS } from '@/i18n/content'
import { ONBOARDING_GENRES_MAX } from '@/lib/limits'

/** Akun contoh sudah pernah onboarding; test ini mengulangnya dari nol. */
beforeEach(async () => {
  await db.readerPrefs.put({
    userId: CURRENT_USER_ID,
    genres: [],
    hiddenStoryIds: [],
    onboardedAt: null,
  })
})

describe('onboarding · FR-AUTH-11', () => {
  it('melewati sama dengan menyelesaikan — keduanya menandainya selesai', async () => {
    const prefs = await api.finishOnboarding([])

    expect(prefs.genres).toEqual([])
    expect(prefs.onboardedAt).not.toBeNull()
    expect(await api.getReaderPrefs()).toMatchObject({ onboardedAt: prefs.onboardedAt })
  })

  it('kelebihan genre dipotong di server, bukan hanya dicegah di layar', async () => {
    const prefs = await api.finishOnboarding([...GENRE_TABS])

    expect(GENRE_TABS.length).toBeGreaterThan(ONBOARDING_GENRES_MAX)
    expect(prefs.genres).toHaveLength(ONBOARDING_GENRES_MAX)
  })

  it('rekomendasi mengutamakan genre terpilih tanpa mengunci katalog', async () => {
    const picks = await api.getStarterPicks(['Mystery'])

    expect(picks).toHaveLength(3)
    expect(picks[0]?.genres).toContain('Mystery')
  })

  it('tanpa genre pun tetap ada tiga rekomendasi', async () => {
    // Pengguna yang melewati langkah pertama tidak boleh mendapat layar kosong.
    expect(await api.getStarterPicks([])).toHaveLength(3)
  })

  it('simpan ke perpustakaan berbalik, dan barisnya tidak pernah dihapus', async () => {
    const [story] = await api.getStarterPicks(['Romance'])
    if (!story) throw new Error('seed tidak punya cerita')

    const first = await api.toggleLibrary(story.id)
    const second = await api.toggleLibrary(story.id)

    expect(second.removed).toBe(!first.removed)
    // Riwayat "pernah disimpan" ikut menentukan rekomendasi, jadi barisnya
    // ditandai, bukan dibuang.
    expect(await db.libraryEntries.where('storyId').equals(story.id).count()).toBeGreaterThan(0)
  })

  it('bahasa & wilayah dari onboarding mendarat di pengaturan yang sama', async () => {
    const current = await api.getLocaleSettings()
    await api.setLocaleSettings({ ...current, timezone: 'Asia/Makassar' })

    expect(await api.getLocaleSettings()).toMatchObject({ timezone: 'Asia/Makassar' })
  })
})

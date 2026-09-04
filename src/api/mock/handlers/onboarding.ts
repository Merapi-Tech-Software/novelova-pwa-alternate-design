import { todayLocalISO } from '@/lib/date'
import { ONBOARDING_GENRES_MAX } from '@/lib/limits'
import type { NovelovaApi } from '../../client'
import type {
  LibraryEntry,
  ListParams,
  LocaleSettings,
  Paged,
  ReaderPrefs,
  ReadingProgress,
  Story,
} from '../../contracts'
import { db } from '../db'
import { currentUserId } from './session'

/**
 * Onboarding pembaca baru · FR-AUTH-11.
 *
 * Genre yang dipilih **mengurutkan**, tidak menyaring: seluruh katalog tetap
 * terbuka, dan itu satu-satunya alasan meminta preferensi di awal bisa
 * dibenarkan sama sekali. Yang menyaring adalah tab genre beranda, dan itu
 * pilihan sadar pengguna pada saat itu juga.
 */

async function prefsOf(userId: string): Promise<ReaderPrefs> {
  const stored = await db.readerPrefs.get(userId)
  return stored ?? { userId, genres: [], hiddenStoryIds: [], onboardedAt: null }
}

/**
 * Bahasa & wilayah dari onboarding langkah 2 disimpan ke tempat yang sama
 * dengan halaman pengaturan (FR-SET-04), bukan ke penyimpanan terpisah — kalau
 * tidak, mengubahnya di pengaturan tidak akan pernah cocok dengan yang dipilih
 * di awal.
 */
function defaultLocale(userId: string): LocaleSettings {
  return {
    userId,
    uiLang: 'Bahasa Indonesia',
    translationPriority: 'Asli + terjemahan Indonesia',
    contentRegion: 'Indonesia',
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
  }
}

export const onboardingHandlers: Pick<
  NovelovaApi,
  | 'getReaderPrefs'
  | 'finishOnboarding'
  | 'getStarterPicks'
  | 'getLocaleSettings'
  | 'setLocaleSettings'
  | 'toggleLibrary'
  | 'listLibrary'
  | 'listProgress'
  | 'hideStory'
> = {
  /**
   * Isi perpustakaan · FR-DETAIL-13. Ditulis lebih awal karena tombol "+ Simpan"
   * di halaman lihat-semua perlu tahu cerita mana yang **sudah** tersimpan —
   * tombol yang menawarkan menyimpan sesuatu yang sudah ada di rak adalah
   * tombol yang berbohong. Layar perpustakaannya sendiri ada di Fase 7.
   */
  async listLibrary(params: ListParams): Promise<Paged<Story>> {
    const userId = currentUserId()
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20

    const entries = (await db.libraryEntries.where('userId').equals(userId).toArray())
      .filter((e) => !e.removed)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))

    const stories = await db.stories.bulkGet(entries.map((e) => e.storyId))
    const items = stories.filter((s): s is Story => s !== undefined)
    const start = (page - 1) * pageSize

    return {
      items: items.slice(start, start + pageSize),
      page,
      pageSize,
      total: items.length,
      hasMore: start + pageSize < items.length,
    }
  },

  /** Satu permintaan untuk seluruh progres — bukan satu per kartu. */
  async listProgress(): Promise<ReadingProgress[]> {
    return db.progress.where('userId').equals(currentUserId()).toArray()
  },

  /**
   * Sembunyikan cerita · FR-HOME-14.
   *
   * Disimpan di server, bukan di perangkat: yang sudah ditolak sekali tidak
   * boleh muncul lagi hanya karena pengguna berganti ponsel. Tidak bisa
   * dibatalkan dari layar mana pun untuk sekarang — batasan yang disengaja,
   * dan tempatnya nanti di pengaturan.
   */
  async hideStory(storyId: string): Promise<void> {
    const prefs = await prefsOf(currentUserId())
    if (prefs.hiddenStoryIds.includes(storyId)) return
    await db.readerPrefs.put({
      ...prefs,
      hiddenStoryIds: [...prefs.hiddenStoryIds, storyId],
    })
  },

  /**
   * Simpan / lepas dari perpustakaan · FR-DETAIL-13.
   *
   * Ditulis di sini karena onboarding langkah 3 memerlukannya — perpustakaan
   * yang kosong pada hari pertama adalah persis masalah yang onboarding ini
   * coba cegah. Layar perpustakaannya sendiri baru dibangun di Fase 7.
   *
   * Baris tidak dihapus, hanya ditandai `removed`: riwayat "pernah disimpan"
   * ikut menentukan rekomendasi, dan menghapusnya membuang informasi itu.
   */
  async toggleLibrary(storyId: string): Promise<LibraryEntry> {
    const userId = currentUserId()
    const existing = await db.libraryEntries
      .where('[userId+storyId]')
      .equals([userId, storyId])
      .first()

    if (existing) {
      const saved = existing.removed
      const next = {
        ...existing,
        removed: !existing.removed,
        savedAt: todayLocalISO(),
        // Menyimpan menyalakan follow; melepas simpanan **tidak** mematikannya
        // (FR-DETAIL-13). Keduanya aksi terpisah yang kebetulan satu baris.
        notify: saved ? true : existing.notify,
      }
      await db.libraryEntries.put(next)
      return next
    }

    const entry = { userId, storyId, savedAt: todayLocalISO(), notify: true, removed: false }
    await db.libraryEntries.add({ ...entry, id: `lib-${userId}-${storyId}` })
    return entry
  },

  async getLocaleSettings(): Promise<LocaleSettings> {
    const userId = currentUserId()
    return (await db.localeSettings.get(userId)) ?? defaultLocale(userId)
  },

  async setLocaleSettings(settings: LocaleSettings): Promise<LocaleSettings> {
    const next = { ...settings, userId: currentUserId() }
    await db.localeSettings.put(next)
    return next
  },

  async getReaderPrefs(): Promise<ReaderPrefs> {
    return prefsOf(currentUserId())
  },

  /**
   * Menyelesaikan dan melewati sama-sama mendarat di sini — keduanya menandai
   * onboarding selesai (FR-AUTH-11). Yang dilewati hanya mengirim daftar kosong.
   */
  async finishOnboarding(genres: string[]): Promise<ReaderPrefs> {
    const current = await prefsOf(currentUserId())
    const prefs: ReaderPrefs = {
      ...current,
      userId: currentUserId(),
      // Kelebihan dipotong di server juga, bukan hanya dicegah di layar.
      genres: genres.slice(0, ONBOARDING_GENRES_MAX),
      onboardedAt: new Date().toISOString(),
    }
    await db.readerPrefs.put(prefs)
    return prefs
  },

  /**
   * Tiga cerita pembuka. Cerita dengan genre terpilih naik ke atas; sisanya
   * tetap ikut sebagai pengisi, sehingga langkah ini **tidak pernah kosong** —
   * termasuk saat pengguna melewati pemilihan genre.
   */
  async getStarterPicks(genres: string[]): Promise<Story[]> {
    const stories = await db.stories.where('review').equals('published').toArray()
    const wanted = new Set(genres)

    return stories
      .filter((s) => s.visibility === 'public')
      .sort((a, b) => {
        const byGenre =
          Number(b.genres.some((g) => wanted.has(g))) - Number(a.genres.some((g) => wanted.has(g)))
        return byGenre !== 0 ? byGenre : b.stats.reads - a.stats.reads
      })
      .slice(0, 3)
  },
}

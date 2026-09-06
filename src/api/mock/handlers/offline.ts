import { OFFLINE_MAX } from '@/lib/offline'
import type { NovelovaApi } from '../../client'
import type { OfflineChapter } from '../../contracts'
import { ApiError, INTERNAL_CODES } from '../../errors'
import { db } from '../db'
import { currentUserId } from './session'

/**
 * Baca offline · architecture.md §10.3 · FR-CORE-03.
 *
 * **Batas 50 bab, LRU.** Batasnya ditegakkan **di sini**, bukan di layar:
 * penyimpanan perangkat adalah sumber daya bersama seluruh aplikasi, dan layar
 * yang lupa memeriksanya akan mengisinya sampai peramban sendiri yang membuang —
 * dan yang dibuang peramban tidak bisa kita pilih.
 *
 * Yang dilepas adalah bab yang **paling lama tidak dibuka**, bukan yang paling
 * lama disimpan: bab rujukan yang disimpan setahun lalu dan dibuka tiap minggu
 * lebih berharga daripada bab yang disimpan kemarin lalu dilupakan.
 */

async function milik(userId: string): Promise<Array<OfflineChapter & { id: string }>> {
  return db.offlineChapters.where('userId').equals(userId).toArray()
}

export const offlineHandlers: Pick<
  NovelovaApi,
  'listOfflineChapters' | 'saveChapterOffline' | 'removeChapterOffline' | 'touchOfflineChapter'
> = {
  async listOfflineChapters(): Promise<OfflineChapter[]> {
    const rows = await milik(currentUserId())
    return rows.sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt))
  },

  /**
   * Menandai satu bab untuk dibaca offline.
   *
   * **Hanya bab yang dimiliki** — menyimpan bab terkunci berarti menyalin isi
   * berbayar ke perangkat sebelum dibayar, dan itu bukan cacat yang bisa
   * ditambal di layar.
   */
  async saveChapterOffline(chapterId: string): Promise<OfflineChapter[]> {
    const userId = currentUserId()

    const chapter = await db.chapters.get(chapterId)
    if (!chapter) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Bab ini tidak ada.')

    if (chapter.access === 'paid') {
      const punya = await db.ownerships
        .where('[userId+chapterId]')
        .equals([userId, chapterId])
        .first()
      if (!punya) {
        throw new ApiError(
          INTERNAL_CODES.FORBIDDEN,
          'Bab ini belum kamu miliki, jadi belum bisa disimpan offline.',
        )
      }
    }

    const story = await db.stories.get(chapter.storyId)
    const now = new Date().toISOString()

    await db.offlineChapters.put({
      id: `${userId}-${chapterId}`,
      userId,
      chapterId,
      storyId: chapter.storyId,
      storyTitle: story?.title ?? 'Cerita',
      chapterLabel: `Bab ${chapter.number} · ${chapter.title}`,
      savedAt: now,
      lastOpenedAt: now,
    })

    // LRU dijalankan **sesudah** menyimpan, bukan sebelum: yang baru saja
    // diminta pengguna tidak boleh jadi korban batas yang dilanggarnya sendiri.
    const rows = await milik(userId)
    if (rows.length > OFFLINE_MAX) {
      const buang = rows
        .sort((a, b) => Date.parse(a.lastOpenedAt) - Date.parse(b.lastOpenedAt))
        .slice(0, rows.length - OFFLINE_MAX)
      await db.offlineChapters.bulkDelete(buang.map((r) => r.id))
    }

    return offlineHandlers.listOfflineChapters()
  },

  async removeChapterOffline(chapterId: string): Promise<OfflineChapter[]> {
    await db.offlineChapters.delete(`${currentUserId()}-${chapterId}`)
    return offlineHandlers.listOfflineChapters()
  },

  /**
   * Menandai bab baru saja dibuka — yang menggerakkan LRU.
   *
   * Diam saja bila babnya tidak tersimpan offline: membuka bab yang tidak
   * ditandai bukan kesalahan, dan melemparkan error di jalur baca biasa akan
   * membuat setiap pembacaan bergantung pada fitur yang opsional.
   */
  async touchOfflineChapter(chapterId: string): Promise<void> {
    const id = `${currentUserId()}-${chapterId}`
    const row = await db.offlineChapters.get(id)
    if (!row) return
    await db.offlineChapters.put({ ...row, lastOpenedAt: new Date().toISOString() })
  },
}

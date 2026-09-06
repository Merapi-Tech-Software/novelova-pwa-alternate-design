import type { NovelovaApi } from '../../client'
import type { ActivityEntry, ReportInput } from '../../contracts'
import { ApiError, INTERNAL_CODES } from '../../errors'
import { db } from '../db'
import { currentUserId } from './session'

/**
 * Laporan, blokir, misi & feed aktivitas · FR-SOCIAL-07 & FR-SOCIAL-08.
 *
 * Dua aturan yang paling mudah dilanggar diam-diam ada di sini:
 *
 * - **Konten dilaporkan tetap tampil** sampai melewati ambang. Menyembunyikan
 *   sejak laporan pertama menjadikan tombol laporkan senjata: satu orang bisa
 *   membungkam siapa pun.
 * - **Blokir menyembunyikan dari pemblokir saja.** Ia bukan penghapusan, dan
 *   tidak memengaruhi apa yang dilihat orang lain.
 */

/**
 * Jumlah laporan sebelum konten disembunyikan sambil menunggu tinjauan.
 *
 * ponytail: angka tetap. Ambang sungguhan seharusnya ikut reputasi pelapor dan
 * umur akun; itu menuntut data yang belum ada di sini. Naikkan jadi konfigurasi
 * server saat moderasi punya kebijakannya sendiri.
 */
const REPORT_THRESHOLD = 3

/** Misi ulasan · FR-SOCIAL-08. Diselesaikan **sekali per hari**, bukan per cerita. */

export const moderationHandlers: Pick<
  NovelovaApi,
  'report' | 'hasReported' | 'blockUser' | 'listBlocks' | 'listActivity'
> = {
  async hasReported(targetType: ReportInput['targetType'], targetId: string): Promise<boolean> {
    const userId = currentUserId()
    const rows = await db.reports.where('targetId').equals(targetId).toArray()
    return rows.some((r) => r.reporterId === userId && r.targetType === targetType)
  },

  /**
   * Laporkan · FR-SOCIAL-07.
   *
   * Melaporkan dua kali ditolak **dengan menyebut bahwa laporannya sudah
   * masuk** — bukan diterima diam-diam, yang membuat pelapor mengira laporan
   * pertamanya hilang.
   */
  async report(input: ReportInput): Promise<void> {
    const userId = currentUserId()

    if (await this.hasReported(input.targetType, input.targetId)) {
      throw new ApiError(
        INTERNAL_CODES.CONFLICT,
        'Laporanmu untuk ini sudah masuk dan sedang menunggu tinjauan.',
      )
    }

    await db.reports.put({
      id: `rp-${crypto.randomUUID()}`,
      reporterId: userId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      note: input.note,
      status: 'open',
      createdAt: new Date().toISOString(),
    })

    // Ambang tercapai → sembunyikan **sambil menunggu tinjauan**, bukan hapus.
    const total = (await db.reports.where('targetId').equals(input.targetId).toArray()).length
    if (total >= REPORT_THRESHOLD && input.targetType === 'comment') {
      const comment = await db.comments.get(input.targetId)
      if (comment) await db.comments.put({ ...comment, underReview: true })
    }
  },

  /**
   * Feed aktivitas · FR-SOCIAL-08.
   *
   * **Diturunkan dari ulasan**, bukan tabel event: entri "Menulis ulasan 5
   * bintang" adalah tampilan lain dari ulasan yang sama, dan tabel event akan
   * basi begitu ulasannya disunting atau dihapus.
   *
   * `respectPrivacy` benar saat feed dibaca orang lain. Sakelar "Ulasan dan
   * reaksi" yang mati menyembunyikannya **di sini saja** — ulasannya tetap
   * tampil di halaman ulasan cerita, karena itu konten publik ceritanya. Dua hal
   * berbeda (FR-PROF-10).
   */
  async listActivity(userId: string, respectPrivacy: boolean): Promise<ActivityEntry[]> {
    if (respectPrivacy) {
      const privacy = await db.privacySettings.get(userId)
      if (privacy && !privacy.reviews) return []
    }

    const rows = (await db.reviews.toArray()).filter((r) => r.userId === userId)
    const stories = await db.stories.bulkGet(rows.map((r) => r.storyId))

    return rows
      .map((review, i) => ({
        id: review.id,
        kind: 'review' as const,
        storyId: review.storyId,
        storyTitle: stories[i]?.title ?? '',
        stars: review.stars,
        text: review.text,
        createdAt: review.editedAt ?? review.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async listBlocks(): Promise<string[]> {
    const userId = currentUserId()
    const rows = await db.blocks.toArray()
    return rows.filter((b) => b.userId === userId).map((b) => b.blockedUserId)
  },

  async blockUser(target: string, on: boolean): Promise<void> {
    const userId = currentUserId()
    if (target === userId) {
      throw new ApiError(INTERNAL_CODES.CONFLICT, 'Tidak bisa memblokir diri sendiri.')
    }

    const key = `${userId}-${target}`
    if (on) {
      await db.blocks.put({
        id: key,
        userId,
        blockedUserId: target,
        createdAt: new Date().toISOString(),
      })
    } else {
      await db.blocks.delete(key)
    }
  },
}

import { SCHEDULE_CLASH_MIN } from '@/lib/limits'
import type { NovelovaApi } from '../../client'
import type { ReviewQueueItem, ReviewTarget, ScheduleEntry, Story } from '../../contracts'
import { ApiError, INTERNAL_CODES } from '../../errors'
import { db } from '../db'
import { bestDayLabel } from './analytics'
import { emitNotification } from './notifications'
import { currentUserId } from './session'

/**
 * Jadwal terpadu & antrean tinjauan · FR-STUDIO-37 · FR-STUDIO-38.
 *
 * Dua daftar yang keduanya **diturunkan, bukan disimpan**:
 *
 * - **Bentrok dan celah** adalah hubungan antar entri, bukan sifat satu entri.
 *   Menyimpannya berarti setiap penggeseran jadwal harus ingat memperbarui
 *   tetangganya — dan yang lupa satu kali akan menampilkan peringatan bentrok
 *   untuk slot yang sudah lama kosong.
 * - **Antrean tinjauan** dihitung dari keempat sumbernya. Tabel antrean
 *   tersendiri berarti dua tempat menyimpan keadaan tinjauan yang sama, dan
 *   cepat atau lambat keduanya berselisih.
 */

async function myStories(userId: string): Promise<Story[]> {
  return db.stories.where('authorId').equals(userId).toArray()
}

/**
 * Peringatan bentrok · FR-STUDIO-37.
 *
 * Dua penerbitan **cerita yang sama** berjarak kurang dari satu jam. Antar
 * cerita berbeda bukan bentrok — penulis memang boleh merilis dua judul pada
 * jam yang sama.
 */
function clashing(entry: ScheduleEntry, all: ScheduleEntry[]): boolean {
  if (!entry.publishAtUtc) return false
  const at = Date.parse(entry.publishAtUtc)

  return all.some(
    (other) =>
      other.id !== entry.id &&
      other.storyId === entry.storyId &&
      other.publishAtUtc !== null &&
      Math.abs(Date.parse(other.publishAtUtc) - at) < SCHEDULE_CLASH_MIN * 60_000,
  )
}

/**
 * Peringatan celah · FR-STUDIO-37 · `SCHED-000`.
 *
 * **Peringatan, bukan kegagalan.** Cerita yang sengaja rehat tidak perlu
 * diperbaiki; yang perlu diberi tahu adalah penulis yang biasanya rutin lalu
 * kehabisan jadwal tanpa sadar.
 */
async function gapsFor(userId: string, scheduled: ScheduleEntry[]): Promise<ScheduleEntry[]> {
  const stories = await myStories(userId)
  const withSchedule = new Set(scheduled.map((e) => e.storyId))
  const gaps: ScheduleEntry[] = []

  for (const story of stories) {
    if (withSchedule.has(story.id)) continue
    if (story.status === 'completed' || story.review !== 'published') continue

    const drafts = (await db.chapters.where('storyId').equals(story.id).toArray()).filter(
      (c) => c.state === 'draft',
    ).length

    gaps.push({
      id: `gap-${story.id}`,
      storyId: story.id,
      storyTitle: story.title,
      chapterId: null,
      chapterLabel: null,
      publishAtUtc: null,
      authorTz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cadence: 'Tidak ada jadwal berikutnya',
      kind: 'gap',
      // Celah membawa **rekomendasinya sendiri** (FR-STUDIO-37): memberi tahu
      // ada lubang tanpa menyebut kapan sebaiknya diisi hanya memindahkan
      // pekerjaan berpikirnya ke penulis.
      note: `${
        drafts > 0
          ? `${drafts} draf menunggu dijadwalkan.`
          : 'Belum ada bab berikutnya yang dijadwalkan.'
      } Waktu terbaik menurut analitikmu: ${bestDayLabel(story.id, story.stats.reads)}.`,
    })
  }

  return gaps
}

export const scheduleHandlers: Pick<NovelovaApi, 'listSchedule' | 'cancelScheduleEntry'> = {
  async listSchedule(): Promise<ScheduleEntry[]> {
    const userId = currentUserId()
    const mine = new Set((await myStories(userId)).map((s) => s.id))

    const scheduled = (await db.scheduleEntries.toArray())
      .filter((e) => mine.has(e.storyId) && e.publishAtUtc !== null)
      .sort((a, b) => (a.publishAtUtc ?? '').localeCompare(b.publishAtUtc ?? ''))
      // `kind` dihitung ulang tiap pembacaan, jadi menggeser satu entri langsung
      // memperbaiki peringatan tetangganya tanpa ada yang perlu ingat.
      .map((entry) => ({ ...entry, kind: 'ok' as const }))

    const withClash = scheduled.map((entry) => ({
      ...entry,
      kind: clashing(entry, scheduled) ? ('clash' as const) : ('ok' as const),
      note: clashing(entry, scheduled) ? 'Bentrok dengan penerbitan lain di cerita ini.' : null,
    }))

    return [...withClash, ...(await gapsFor(userId, scheduled))]
  },

  /**
   * Membatalkan satu entri · FR-STUDIO-37.
   *
   * Diminta PRD, tidak digambar kanvas. Babnya kembali menjadi draf — jadwal
   * yang dibatalkan tidak boleh menghilangkan naskahnya.
   */
  async cancelScheduleEntry(entryId: string): Promise<void> {
    const entry = await db.scheduleEntries.get(entryId)
    if (!entry) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Entri jadwal ini tidak ada.')

    const story = await db.stories.get(entry.storyId)
    if (!story || story.authorId !== currentUserId()) {
      throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Entri jadwal ini bukan milikmu.')
    }

    await db.transaction('rw', db.scheduleEntries, db.chapters, async () => {
      if (entry.chapterId) {
        const chapter = await db.chapters.get(entry.chapterId)
        if (chapter) {
          await db.chapters.put({ ...chapter, state: 'draft', publishAt: null })
        }
      }
      await db.scheduleEntries.delete(entryId)
    })
  },
}

/** Label baris antrean per sumber — bab menyebut nomornya, cerita judulnya. */
function reviewLink(kind: ReviewQueueItem['kind'], storyId: string, refId: string): string {
  if (kind === 'chapter') return `/karya/${storyId}/bab/${refId}/ubah`
  if (kind === 'print') return '/karya/cetak'
  // Laporan tidak punya layar tindak lanjut sendiri: penulis diarahkan ke
  // ceritanya, tempat ia bisa melihat konteksnya.
  if (kind === 'report') return `/karya/${storyId}/ubah`
  return `/karya/${refId}/ubah`
}

export const reviewHandlers: Pick<
  NovelovaApi,
  'listReviewQueue' | 'submitForReview' | 'withdrawFromReview'
> = {
  /**
   * Satu antrean, empat sumber · FR-STUDIO-38.
   *
   * Laporan pembaca (Fase 10) belum punya sumbernya, jadi ia belum menyumbang
   * baris — bukan dipalsukan supaya daftarnya terlihat lengkap.
   */
  async listReviewQueue(): Promise<ReviewQueueItem[]> {
    const userId = currentUserId()
    const stories = await myStories(userId)
    const items: ReviewQueueItem[] = []

    for (const story of stories) {
      if (story.review === 'in_review' || story.review === 'rejected') {
        items.push({
          id: `rev-story-${story.id}`,
          kind: 'story',
          refId: story.id,
          label: story.title,
          context: null,
          status: story.review,
          reason: story.rejectReason,
          link: reviewLink('story', story.id, story.id),
          submittedAt: `${story.updatedAt}T00:00:00.000Z`,
          decidedAt: story.review === 'rejected' ? `${story.updatedAt}T00:00:00.000Z` : null,
        })
      }

      const chapters = (await db.chapters.where('storyId').equals(story.id).toArray()).filter(
        (c) => c.review === 'in_review' || c.review === 'rejected',
      )
      for (const chapter of chapters) {
        items.push({
          id: `rev-chapter-${chapter.id}`,
          kind: 'chapter',
          refId: chapter.id,
          label: `Bab ${chapter.number} · ${chapter.title}`,
          context: story.title,
          status: chapter.review,
          reason: null,
          link: reviewLink('chapter', story.id, chapter.id),
          submittedAt: chapter.editedAt,
          decidedAt: chapter.review === 'rejected' ? chapter.editedAt : null,
        })
      }
    }

    // Pesanan cetak yang menunggu konfirmasi admin memakai antrean yang sama,
    // sehingga penulis melihat satu jenis status tinjauan di seluruh studio.
    const orders = (await db.printOrders.where('userId').equals(userId).toArray()).filter(
      (o) => o.status === 'submitted',
    )
    for (const order of orders) {
      items.push({
        id: `rev-print-${order.id}`,
        kind: 'print',
        refId: order.id,
        label: order.id,
        context: order.storyTitle,
        status: 'in_review',
        reason: null,
        link: reviewLink('print', order.storyId, order.id),
        submittedAt: order.createdAt,
        decidedAt: null,
      })
    }

    /**
     * Sumber keempat: **laporan pembaca** · FR-SOCIAL-07.
     *
     * Hanya laporan atas cerita atau bab milik penulis ini — laporan atas
     * komentar orang lain bukan urusannya. Sumbernya sudah disiapkan sejak
     * Fase 8f; Fase 10 yang mengisinya.
     */
    const mineIds = new Set(stories.map((s) => s.id))
    const myChapterIds = new Set(
      (
        await db.chapters
          .where('storyId')
          .anyOf([...mineIds])
          .toArray()
      ).map((c) => c.id),
    )
    const myCommentIds = new Set(
      (await db.comments.toArray()).filter((c) => myChapterIds.has(c.chapterId)).map((c) => c.id),
    )

    for (const report of await db.reports.toArray()) {
      if (report.status !== 'open') continue
      const mine =
        (report.targetType === 'story' && mineIds.has(report.targetId)) ||
        (report.targetType === 'comment' && myCommentIds.has(report.targetId))
      if (!mine) continue

      items.push({
        id: `report-${report.id}`,
        kind: 'report',
        refId: report.targetId,
        label: `Laporan: ${report.reason}`,
        context: report.note === '' ? null : report.note,
        status: 'in_review',
        reason: null,
        link: reviewLink('report', report.targetId, report.targetId),
        submittedAt: report.createdAt,
        decidedAt: null,
      })
    }

    return items.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  },

  /**
   * Mengirim untuk ditinjau · FR-STUDIO-38.
   *
   * Naskahnya **tidak terbit** di sini — ia menunggu keputusan. Itu inti
   * requirement-nya: cerita dan bab dalam tinjauan tidak tampil ke pembaca.
   */
  async submitForReview(target: ReviewTarget): Promise<ReviewQueueItem> {
    const userId = currentUserId()

    if (target.kind === 'story') {
      const story = await db.stories.get(target.refId)
      if (!story || story.authorId !== userId) {
        throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Cerita ini bukan milikmu.')
      }
      await db.stories.put({ ...story, review: 'in_review', rejectReason: null })
    } else {
      const chapter = await db.chapters.get(target.refId)
      if (!chapter) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Bab ini tidak ada.')
      const story = await db.stories.get(chapter.storyId)
      if (!story || story.authorId !== userId) {
        throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Bab ini bukan milikmu.')
      }
      await db.chapters.put({ ...chapter, review: 'in_review' })
    }

    const queue = await reviewHandlers.listReviewQueue()
    const found = queue.find((item) => item.refId === target.refId)
    if (!found) throw new ApiError(INTERNAL_CODES.UNKNOWN, 'Pengiriman tidak tercatat.')
    return found
  },

  /**
   * Membatalkan pengiriman · FR-STUDIO-38.
   *
   * Kembali ke **draf**, bukan hilang. Penulis yang menarik kembali kiriman
   * biasanya sedang memperbaikinya, bukan membuangnya.
   */
  async withdrawFromReview(target: ReviewTarget): Promise<void> {
    const userId = currentUserId()

    if (target.kind === 'story') {
      const story = await db.stories.get(target.refId)
      if (!story || story.authorId !== userId) {
        throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Cerita ini bukan milikmu.')
      }
      await db.stories.put({ ...story, review: 'draft', rejectReason: null })
      return
    }

    const chapter = await db.chapters.get(target.refId)
    if (!chapter) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Bab ini tidak ada.')
    const story = await db.stories.get(chapter.storyId)
    if (!story || story.authorId !== userId) {
      throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Bab ini bukan milikmu.')
    }
    await db.chapters.put({ ...chapter, review: 'draft' })
  },
}

/**
 * Keputusan admin — **dev saja**, bukan bagian `NovelovaApi`.
 *
 * Penulis tidak boleh menyetujui karyanya sendiri, jadi ini tidak pernah jadi
 * metode seam. Tetapi tanpa cara menjalankannya, antrean tinjauan adalah layar
 * yang tidak pernah bisa kosong — dan alur "kirim → tinjau → tayang" tidak
 * pernah bisa diuji ujung ke ujung. Tombolnya ada di `/dev/kitchen-sink`.
 */
export async function resolveReviewAsAdmin(
  target: ReviewTarget,
  decision: 'approve' | 'reject',
  reason = 'Bab memuat kutipan panjang tanpa sumber. Sunting bagian itu lalu kirim ulang.',
): Promise<void> {
  if (target.kind === 'story') {
    const story = await db.stories.get(target.refId)
    if (!story) return
    await db.stories.put({
      ...story,
      review: decision === 'approve' ? 'published' : 'rejected',
      rejectReason: decision === 'approve' ? null : reason,
    })
    await beritahuPenulis(story.id, decision, story.title, decision === 'approve' ? null : reason)
    return
  }

  const chapter = await db.chapters.get(target.refId)
  if (!chapter) return
  await db.chapters.put({
    ...chapter,
    review: decision === 'approve' ? 'published' : 'rejected',
    state: decision === 'approve' ? 'published' : chapter.state,
    publishAt: decision === 'approve' ? new Date().toISOString() : chapter.publishAt,
  })

  await beritahuPenulis(
    chapter.storyId,
    decision,
    `Bab ${chapter.number} · ${chapter.title}`,
    decision === 'approve' ? null : reason,
  )
}

/**
 * Memberi tahu penulis saat status tinjauan berubah · FR-STUDIO-38.
 *
 * Jalurnya baru ada sejak Fase 11, dan tanpa pemicu ini keputusan tinjauan
 * adalah satu-satunya kabar penting di aplikasi yang **tidak pernah sampai**
 * kecuali penulisnya kebetulan membuka antreannya sendiri.
 *
 * **Penolakan membawa alasannya ke dalam notifikasi.** Notifikasi yang cuma
 * berkata "ditolak" memaksa penulis membuka halaman lain untuk tahu apa yang
 * harus diperbaiki — dan alasannya sudah ada di tangan saat baris ini ditulis.
 */
async function beritahuPenulis(
  storyId: string,
  decision: 'approve' | 'reject',
  label: string,
  reason: string | null,
): Promise<void> {
  const story = await db.stories.get(storyId)
  if (!story) return

  await emitNotification(story.authorId, {
    kind: 'cetak-status',
    title: decision === 'approve' ? `${label} disetujui dan tayang` : `${label} perlu diperbaiki`,
    body: reason ?? story.title,
    deepLink: `/karya/${storyId}/bab`,
    groupKey: `review-${storyId}`,
  })
}

/** Menyetujui seluruh antrean sekaligus — pintasan `/dev/kitchen-sink`. */
export async function approveAllPendingAsAdmin(): Promise<void> {
  const queue = await reviewHandlers.listReviewQueue()
  for (const item of queue) {
    if (item.status !== 'in_review') continue
    if (item.kind === 'story' || item.kind === 'chapter') {
      await resolveReviewAsAdmin({ kind: item.kind, refId: item.refId }, 'approve')
    }
  }
}

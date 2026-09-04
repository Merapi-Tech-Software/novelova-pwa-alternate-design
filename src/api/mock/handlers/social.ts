import {
  COMMENT_MAX_CHARS,
  REVIEW_MAX_CHARS,
  REVIEW_MIN_CHARS,
  REVIEW_TAGS_MAX,
} from '@/lib/limits'
import type { NovelovaApi } from '../../client'
import type {
  Comment,
  CommentInput,
  CommentParams,
  Paged,
  Rating,
  ReactTarget,
  Review,
  ReviewInput,
  ReviewPage,
  ReviewParams,
} from '../../contracts'
import { ApiError, INTERNAL_CODES } from '../../errors'
import { db } from '../db'
import { currentUserId } from './session'

/**
 * Rating & ulasan · FR-SOCIAL-01..04.
 *
 * Modul ini ada karena rating **dikonsumsi di enam tempat tetapi tidak
 * diproduksi di satu tempat pun** — kartu cerita, statbar, detail, pencarian,
 * analitik, dan misi hadiah semuanya membaca angka yang tidak pernah bisa
 * ditulis siapa pun.
 *
 * Aturan yang paling mudah dilanggar diam-diam: **rating dan ulasan adalah dua
 * hal berbeda.** Memberi bintang tanpa menulis apa pun sah, dan menghapus
 * ulasan tidak menghapus ratingnya. Keduanya karena itu disimpan di tabel
 * terpisah, bukan satu baris dengan `text` kosong.
 */

/** Rata-rata cerita **selalu dihitung ulang** dari ratingnya, tidak pernah disimpan sendiri. */
async function recomputeAverage(storyId: string): Promise<void> {
  const rows = await db.ratings.where('storyId').equals(storyId).toArray()
  const story = await db.stories.get(storyId)
  if (!story) return

  const average = rows.length === 0 ? 0 : rows.reduce((n, r) => n + r.stars, 0) / rows.length
  await db.stories.put({
    ...story,
    stats: { ...story.stats, rating: Math.round(average * 10) / 10 },
  })
}

/**
 * Kelayakan menilai · FR-SOCIAL-01: **sudah membaca minimal satu bab.**
 *
 * Diperiksa dari progres baca, bukan dari kepemilikan bab: membeli bab tanpa
 * membukanya bukan membaca, dan bab gratis tidak pernah menghasilkan baris
 * kepemilikan sama sekali.
 */
async function requireHasRead(userId: string, storyId: string): Promise<void> {
  const progress = await db.progress.where('[userId+storyId]').equals([userId, storyId]).first()
  if (progress) return

  throw new ApiError(
    INTERNAL_CODES.CONFLICT,
    'Baca dulu minimal satu bab sebelum menilai cerita ini.',
  )
}

/**
 * Bab terbuka? · FR-SOCIAL-05.
 *
 * Bab gratis selalu terbuka; sisanya menuntut baris kepemilikan. Dipakai untuk
 * **membaca dan menulis komentar sekaligus** — komentar bab penuh berisi isi
 * babnya, jadi membukanya untuk yang belum membeli sama dengan membocorkan
 * cerita lewat pintu samping.
 */
async function requireChapterOpen(userId: string, chapterId: string) {
  const chapter = await db.chapters.get(chapterId)
  if (!chapter) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Bab tidak ditemukan.')

  // Dicari lewat **indeks `[userId+chapterId]`**, bukan menebak bentuk id
  // primernya: baris seed bernama `own1`, `own2`, sementara yang dibuat runtime
  // memakai pola lain. Menebak id primer diam-diam membuat setiap bab terbaca
  // sebagai terkunci.
  const owned =
    chapter.access === 'free' ||
    Boolean(await db.ownerships.where('[userId+chapterId]').equals([userId, chapterId]).first())
  if (!owned) {
    throw new ApiError(
      INTERNAL_CODES.FORBIDDEN,
      'Buka babnya dulu untuk membaca dan menulis komentar. Komentar di sini memuat isi bab.',
    )
  }
  return chapter
}

/**
 * Suka komentar · FR-SOCIAL-05.
 *
 * Berbeda dari "membantu" pada ulasan: komentar sendiri **boleh** disukai —
 * batasan itu ada di ulasan karena penghitungnya menentukan urutan "paling
 * membantu", sementara suka komentar hanya tanda setuju.
 */
async function reactToComment(commentId: string, on: boolean): Promise<void> {
  const userId = currentUserId()
  const comment = await db.comments.get(commentId)
  if (!comment) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Komentar tidak ditemukan.')

  const key = `${userId}-comment-${commentId}`
  const seen = await db.reactions.get(key)
  if (on === Boolean(seen)) return

  await db.transaction('rw', db.reactions, db.comments, async () => {
    if (on) {
      await db.reactions.put({ id: key, userId, targetType: 'comment', targetId: commentId })
    } else {
      await db.reactions.delete(key)
    }
    await db.comments.put({
      ...comment,
      likeCount: Math.max(0, comment.likeCount + (on ? 1 : -1)),
    })
  })
}

const rowId = (userId: string, storyId: string) => `${userId}-${storyId}`

export const socialHandlers: Pick<
  NovelovaApi,
  | 'rateStory'
  | 'getMyRating'
  | 'deleteRating'
  | 'submitReview'
  | 'deleteReview'
  | 'listReviews'
  | 'listComments'
  | 'postComment'
  | 'replyToReview'
  | 'react'
> = {
  async getMyRating(storyId: string): Promise<Rating | null> {
    return (await db.ratings.get(rowId(currentUserId(), storyId))) ?? null
  },

  async rateStory(storyId: string, stars: 1 | 2 | 3 | 4 | 5): Promise<Rating> {
    const userId = currentUserId()
    await requireHasRead(userId, storyId)

    const rating: Rating = { userId, storyId, stars, updatedAt: new Date().toISOString() }
    await db.ratings.put({ ...rating, id: rowId(userId, storyId) })

    // Ulasan yang sudah ada ikut memakai bintang baru — satu bintang per
    // pasangan, bukan dua angka yang bisa berselisih.
    const review = await db.reviews.where('[storyId+userId]').equals([storyId, userId]).first()
    if (review) await db.reviews.put({ ...review, stars })

    await recomputeAverage(storyId)
    return rating
  },

  /**
   * Menghapus rating ikut menghapus ulasannya · FR-SOCIAL-02: ulasan wajib
   * disertai rating, jadi ulasan tanpa bintang tidak boleh tertinggal.
   * Arahnya **tidak simetris** — itu disengaja.
   */
  async deleteRating(storyId: string): Promise<void> {
    const userId = currentUserId()
    const review = await db.reviews.where('[storyId+userId]').equals([storyId, userId]).first()

    await db.transaction('rw', db.ratings, db.reviews, async () => {
      await db.ratings.delete(rowId(userId, storyId))
      if (review) await db.reviews.delete(review.id)
    })
    await recomputeAverage(storyId)
  },

  /**
   * Tulis atau sunting ulasan · FR-SOCIAL-02.
   *
   * **Satu ulasan per pasangan (pengguna, cerita).** Menulis lagi bukan membuat
   * yang kedua melainkan menyunting yang lama, dan hasilnya diberi penanda
   * `editedAt` — pembaca berhak tahu teks yang ia baca sudah berubah.
   */
  async submitReview(input: ReviewInput): Promise<Review> {
    const userId = currentUserId()
    await requireHasRead(userId, input.storyId)

    const text = input.text.trim()
    if (text.length < REVIEW_MIN_CHARS || text.length > REVIEW_MAX_CHARS) {
      throw new ApiError(
        INTERNAL_CODES.VALIDATION,
        `Ulasan ${REVIEW_MIN_CHARS}–${REVIEW_MAX_CHARS} karakter. Sekarang ${text.length}.`,
      )
    }
    if (input.tags.length > REVIEW_TAGS_MAX) {
      throw new ApiError(INTERNAL_CODES.VALIDATION, `Maksimal ${REVIEW_TAGS_MAX} tag.`)
    }

    // Bintangnya disimpan lewat jalur rating supaya rata-rata cerita ikut
    // dihitung ulang — ulasan tidak pernah jadi sumber angka yang kedua.
    await this.rateStory(input.storyId, input.stars as 1 | 2 | 3 | 4 | 5)

    const user = await db.users.get(userId)
    const existing = await db.reviews
      .where('[storyId+userId]')
      .equals([input.storyId, userId])
      .first()
    const now = new Date().toISOString()

    const review: Review = existing
      ? {
          ...existing,
          stars: input.stars,
          text,
          tags: input.tags,
          spoiler: input.spoiler,
          editedAt: now,
        }
      : {
          id: `rv-${crypto.randomUUID()}`,
          userId,
          userName: user?.displayName ?? '',
          storyId: input.storyId,
          stars: input.stars,
          text,
          tags: input.tags,
          spoiler: input.spoiler,
          helpfulCount: 0,
          markedHelpful: false,
          editedAt: null,
          createdAt: now,
          reply: null,
        }

    await db.reviews.put(review)
    return review
  },

  /**
   * Utas komentar · FR-SOCIAL-05.
   *
   * Balasan **selalu satu tingkat**: hanya komentar tanpa induk yang dipaginasi,
   * dan balasannya menempel di bawahnya. Utas yang bercabang dalam mustahil
   * dibaca di layar 390px, dan itu alasan aturannya ada.
   */
  async listComments(chapterId: string, params: CommentParams): Promise<Paged<Comment>> {
    const userId = currentUserId()
    await requireChapterOpen(userId, chapterId)

    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20

    // Pengguna yang diblokir hilang **dari tampilan pemblokir saja**
    // (FR-SOCIAL-07) — komentarnya tidak dihapus dan orang lain tetap melihatnya.
    const blocked = new Set(
      (await db.blocks.toArray()).filter((b) => b.userId === userId).map((b) => b.blockedUserId),
    )
    const all = (await db.comments.where('chapterId').equals(chapterId).toArray()).filter(
      (c) => !blocked.has(c.userId),
    )
    const reacted = await db.reactions.toArray()
    const likedIds = new Set(
      reacted
        .filter((r) => r.userId === userId && r.targetType === 'comment')
        .map((r) => r.targetId),
    )
    const withFlags = all.map((c) => ({ ...c, liked: likedIds.has(c.id) }))

    // `id` jadi pemecah seri: dua komentar yang lahir pada milidetik yang sama
    // punya `createdAt` identik, dan tanpa pemecah urutannya berubah-ubah antar
    // pembacaan — daftar yang menyusun ulang dirinya sendiri terlihat seperti
    // komentar yang hilang.
    const order = (rows: typeof withFlags) =>
      [...rows].sort((a, b) => {
        if (params.sort === 'liked' && a.likeCount !== b.likeCount) {
          return b.likeCount - a.likeCount
        }
        const byTime =
          params.sort === 'oldest'
            ? a.createdAt.localeCompare(b.createdAt)
            : b.createdAt.localeCompare(a.createdAt)
        return byTime !== 0 ? byTime : a.id.localeCompare(b.id)
      })

    const roots = order(withFlags.filter((c) => c.parentId === null))
    const start = (page - 1) * pageSize
    const shown = roots.slice(start, start + pageSize)

    return {
      items: shown.map((root) => ({
        ...root,
        // Balasan selalu terurut terlama → terbaru: percakapan dibaca dari
        // atas ke bawah apa pun urutan utas induknya.
        replies: withFlags
          .filter((c) => c.parentId === root.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)),
      })),
      page,
      pageSize,
      total: roots.length,
      hasMore: start + pageSize < roots.length,
    }
  },

  /**
   * Menulis komentar atau balasan · FR-SOCIAL-05.
   *
   * Membalas sebuah **balasan** tetap mendarat di utas yang sama: `parentId`
   * dinaikkan ke induk teratas di sini, bukan dicegah di layar. Layar yang lupa
   * aturannya akan membuat pohon dalam yang tidak bisa dirender komponennya.
   */
  async postComment(input: CommentInput): Promise<Comment> {
    const userId = currentUserId()
    const chapter = await requireChapterOpen(userId, input.chapterId)

    const text = input.text.trim()
    if (text === '' || text.length > COMMENT_MAX_CHARS) {
      throw new ApiError(
        INTERNAL_CODES.VALIDATION,
        `Komentar maksimal ${COMMENT_MAX_CHARS} karakter. Sekarang ${text.length}.`,
      )
    }

    let parentId = input.parentId
    if (parentId) {
      const parent = await db.comments.get(parentId)
      if (!parent) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Komentar induk tidak ditemukan.')
      parentId = parent.parentId ?? parent.id
    }

    const story = await db.stories.get(chapter.storyId)
    const user = await db.users.get(userId)

    const comment: Comment = {
      id: `cm-${crypto.randomUUID()}`,
      chapterId: input.chapterId,
      userId,
      userName: user?.displayName ?? '',
      isAuthor: story?.authorId === userId,
      parentId,
      text,
      spoiler: input.spoiler,
      likeCount: 0,
      liked: false,
      underReview: false,
      createdAt: new Date().toISOString(),
    }

    await db.comments.put(comment)
    return comment
  },

  /**
   * Halaman ulasan · FR-SOCIAL-03.
   *
   * Sebaran bintang dihitung dari **seluruh rating**, bukan dari ulasan yang
   * lolos saringan — grafik sebaran yang ikut menyusut saat disaring berhenti
   * menggambarkan ceritanya.
   *
   * Ulasan sendiri **selalu di atas** dan tidak pernah ikut tersaring: penulis
   * ulasan harus selalu bisa menemukan miliknya untuk disunting.
   */
  async listReviews(storyId: string, params: ReviewParams): Promise<ReviewPage> {
    const userId = currentUserId()
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20

    const story = await db.stories.get(storyId)
    const blocked = new Set(
      (await db.blocks.toArray()).filter((b) => b.userId === userId).map((b) => b.blockedUserId),
    )
    const all = (await db.reviews.where('storyId').equals(storyId).toArray()).filter(
      (r) => !blocked.has(r.userId),
    )
    const ratings = await db.ratings.where('storyId').equals(storyId).toArray()
    // `reactions` hanya berindeks `[userId+targetType+targetId]`, tidak ada
    // indeks tunggal `userId` — `where('userId')` melempar `DataError` yang
    // pesannya tidak menyebut kolomnya sama sekali.
    const reacted = await db.reactions.toArray()
    const helpfulIds = new Set(
      reacted
        .filter((r) => r.userId === userId && r.targetType === 'review')
        .map((r) => r.targetId),
    )

    const histogram: [number, number, number, number, number] = [0, 0, 0, 0, 0]
    for (const rating of ratings) {
      const index = rating.stars - 1
      histogram[index] = (histogram[index] ?? 0) + 1
    }

    const withFlags = all.map((review) => ({
      ...review,
      markedHelpful: helpfulIds.has(review.id),
    }))
    const mine = withFlags.find((r) => r.userId === userId) ?? null

    const counts = new Map<string, number>()
    for (const review of withFlags) {
      for (const tag of review.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }

    const filtered = withFlags
      .filter((r) => r.userId !== userId)
      .filter((r) => (params.stars === null ? true : r.stars === params.stars))
      .filter((r) => (params.withText ? r.text.trim() !== '' : true))
      .filter((r) => (params.tag === null ? true : r.tags.includes(params.tag)))
      .sort((a, b) => {
        switch (params.sort) {
          case 'newest':
            return b.createdAt.localeCompare(a.createdAt)
          case 'highest':
            return b.stars - a.stars
          case 'lowest':
            return a.stars - b.stars
          default:
            return b.helpfulCount - a.helpfulCount
        }
      })

    const start = (page - 1) * pageSize
    return {
      items: filtered.slice(start, start + pageSize),
      page,
      pageSize,
      total: filtered.length,
      hasMore: start + pageSize < filtered.length,
      breakdown: {
        average:
          ratings.length === 0
            ? 0
            : Math.round((ratings.reduce((n, r) => n + r.stars, 0) / ratings.length) * 10) / 10,
        total: ratings.length,
        histogram,
      },
      myReview: mine,
      canReply: story?.authorId === userId,
      topTags: [...counts.entries()]
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
    }
  },

  /** Menghapus ulasan **tidak** menghapus ratingnya · FR-SOCIAL-02. */
  async deleteReview(storyId: string): Promise<void> {
    const userId = currentUserId()
    const review = await db.reviews.where('[storyId+userId]').equals([storyId, userId]).first()
    if (review) await db.reviews.delete(review.id)
  },

  /**
   * Tanggapan penulis · FR-SOCIAL-04. Hanya pemilik cerita, dan satu per
   * ulasan — menanggapi lagi menyunting yang lama.
   */
  async replyToReview(reviewId: string, text: string): Promise<Review> {
    const userId = currentUserId()
    const review = await db.reviews.get(reviewId)
    if (!review) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Ulasan tidak ditemukan.')

    const story = await db.stories.get(review.storyId)
    if (!story || story.authorId !== userId) {
      throw new ApiError(INTERNAL_CODES.FORBIDDEN, 'Hanya penulis cerita yang bisa menanggapi.')
    }

    const user = await db.users.get(userId)
    const next: Review = {
      ...review,
      reply: {
        reviewId,
        authorId: userId,
        authorName: user?.penName ?? user?.displayName ?? '',
        text: text.trim(),
        updatedAt: new Date().toISOString(),
      },
    }
    await db.reviews.put(next)
    return next
  },

  /**
   * "Membantu" · FR-SOCIAL-04. Satu kali per pengguna, dapat dibatalkan, dan
   * **tidak bisa untuk ulasan sendiri** — penghitung yang bisa dinaikkan
   * pemiliknya berhenti mengukur apa pun.
   */
  async react(target: ReactTarget, on: boolean): Promise<void> {
    if (target.type === 'comment') return reactToComment(target.id, on)
    if (target.type !== 'review') return

    const userId = currentUserId()
    const review = await db.reviews.get(target.id)
    if (!review) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Ulasan tidak ditemukan.')
    if (review.userId === userId) {
      throw new ApiError(INTERNAL_CODES.CONFLICT, 'Ulasan sendiri tidak bisa ditandai membantu.')
    }

    const key = `${userId}-review-${target.id}`
    const seen = await db.reactions.get(key)
    if (on === Boolean(seen)) return

    await db.transaction('rw', db.reactions, db.reviews, async () => {
      if (on) {
        await db.reactions.put({ id: key, userId, targetType: 'review', targetId: target.id })
      } else {
        await db.reactions.delete(key)
      }
      await db.reviews.put({
        ...review,
        helpfulCount: Math.max(0, review.helpfulCount + (on ? 1 : -1)),
      })
    })
  },
}

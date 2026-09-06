import { todayLocalISO } from '@/lib/date'
import type { NovelovaApi } from '../../client'
import type {
  AuthorProfile,
  AuthorSignupInput,
  Paged,
  PrintOrder,
  PrintOrderInput,
  ScheduleStoryInput,
  Story,
  StoryForm,
  StudioParams,
  StudioStatus,
  StudioStory,
  StudioSummary,
} from '../../contracts'
import { ApiError, INTERNAL_CODES } from '../../errors'
import { db } from '../db'
import { emitNotification } from './notifications'
import { currentUserId } from './session'

/**
 * Author Studio · FR-STUDIO-01..06 · FR-STUDIO-33 · FR-STUDIO-38.
 *
 * Tiga hal yang menentukan bentuk berkas ini:
 *
 * 1. **Status studio diturunkan, tidak disimpan.** Satu keadaan yang ditulis di
 *    dua tempat cepat atau lambat berselisih dengan dirinya sendiri; di sini
 *    `review × status × visibility × jadwal` yang menjawab.
 * 2. **Tiga tingkat penulis ditegakkan di server** (FR-STUDIO-33). Guard rute
 *    hanya memilih layar; yang menolak membuat cerita tanpa pendaftaran adalah
 *    handler ini.
 * 3. **Menulis tidak pernah diblokir verifikasi.** Yang dituntut terverifikasi
 *    hanyalah yang menyentuh uang — bab berbayar dan pencairan.
 */

const RANK: Record<AuthorProfile['tier'], number> = { none: 0, registered: 1, verified: 2 }

async function profileOf(userId: string): Promise<AuthorProfile> {
  return (
    (await db.authorProfiles.get(userId)) ?? {
      userId,
      tier: 'none',
      payoutVerified: false,
      twoFactor: false,
      termsAcceptedAt: null,
    }
  )
}

/** Menolak lebih awal daripada layar — guard rute bisa dilewati, ini tidak. */
async function requireTier(min: AuthorProfile['tier']): Promise<AuthorProfile> {
  const profile = await profileOf(currentUserId())
  if (RANK[profile.tier] < RANK[min]) {
    throw new ApiError(
      INTERNAL_CODES.FORBIDDEN,
      min === 'verified'
        ? 'Langkah ini menuntut penulis terverifikasi. Selesaikan verifikasi identitas dan 2FA lebih dulu.'
        : 'Daftar sebagai penulis dulu sebelum membuat cerita.',
    )
  }
  return profile
}

/**
 * Jadwal terbit sebuah cerita — entri jadwal tanpa `chapterId`.
 *
 * Jadwal bab punya barisnya sendiri (Fase 8b); membedakannya di sini menjaga
 * "menjadwalkan cerita utuh, bukan bab tertentu" (FR-STUDIO-04) tetap benar.
 */
async function storySchedule(storyId: string): Promise<string | null> {
  const entries = await db.scheduleEntries.where('storyId').equals(storyId).toArray()
  const storyLevel = entries.filter((e) => e.chapterId === null && e.publishAtUtc !== null)
  return (
    storyLevel.sort((a, b) => (a.publishAtUtc ?? '').localeCompare(b.publishAtUtc ?? ''))[0]
      ?.publishAtUtc ?? null
  )
}

/**
 * Tujuh status · FR-STUDIO-02 + FR-STUDIO-38.
 *
 * Urutannya bukan selera: tinjauan mendahului segalanya (cerita `in_review`
 * belum tentu draf), jadwal mendahului terbit, dan `archived` dibaca dari
 * visibilitas `private` pada cerita yang **pernah** terbit — draf privat tetap
 * draf, bukan arsip.
 */
function studioStatusOf(story: Story, scheduledAt: string | null): StudioStatus {
  if (story.review === 'in_review') return 'in_review'
  if (story.review === 'rejected') return 'rejected'
  if (story.review === 'draft') return scheduledAt ? 'scheduled' : 'draft'
  if (scheduledAt && Date.parse(scheduledAt) > Date.now()) return 'scheduled'
  if (story.visibility === 'private') return 'archived'
  return story.status === 'completed' ? 'completed' : 'published'
}

async function buildStudioStory(story: Story): Promise<StudioStory> {
  const scheduledAt = await storySchedule(story.id)
  const published = (await db.chapters.where('storyId').equals(story.id).toArray()).filter(
    (c) => c.state === 'published',
  ).length

  return {
    story,
    studioStatus: studioStatusOf(story, scheduledAt),
    scheduledAt,
    rejectReason: story.rejectReason,
    publishedChapters: published,
  }
}

async function shelfOf(userId: string): Promise<StudioStory[]> {
  const stories = await db.stories.where('authorId').equals(userId).toArray()
  const items: StudioStory[] = []
  for (const story of stories) items.push(await buildStudioStory(story))
  return items
}

/** Pencarian **hanya pada judul** — bukan tag, bukan genre (FR-STUDIO-03). */
function matchesTitle(item: StudioStory, q: string): boolean {
  return q === '' || item.story.title.toLowerCase().includes(q)
}

const SORTERS: Record<StudioParams['sort'], (a: StudioStory, b: StudioStory) => number> = {
  updated: (a, b) => b.story.updatedAt.localeCompare(a.story.updatedAt),
  popular: (a, b) => b.story.stats.reads - a.story.stats.reads,
  az: (a, b) => a.story.title.localeCompare(b.story.title, 'id'),
}

export const studioHandlers: Pick<
  NovelovaApi,
  | 'getAuthorProfile'
  | 'registerAuthor'
  | 'getMyStories'
  | 'getStudioSummary'
  | 'createStory'
  | 'updateStory'
  | 'deleteStory'
  | 'scheduleStory'
  | 'createPrintOrder'
> = {
  async getAuthorProfile(): Promise<AuthorProfile> {
    // Pembaca yang belum pernah mendaftar bukan kegagalan — ia tingkat `none`,
    // dan layarnya menjawab dengan ajakan mendaftar, bukan halaman kosong.
    return profileOf(currentUserId())
  },

  /**
   * Mendaftar sebagai penulis · FR-STUDIO-33.
   *
   * **Menyetujui ketentuan sudah cukup untuk menulis.** Identitas pencairan dan
   * 2FA menaikkan tingkat ke `verified`, tetapi tidak menahan pendaftaran —
   * meminta keduanya di depan berarti menolak penulis yang belum tentu akan
   * pernah menerima uang.
   */
  async registerAuthor(input: AuthorSignupInput): Promise<AuthorProfile> {
    const userId = currentUserId()
    const existing = await profileOf(userId)
    const verified = input.payoutVerified && input.twoFactor

    const next: AuthorProfile = {
      userId,
      tier: verified ? 'verified' : 'registered',
      payoutVerified: input.payoutVerified,
      twoFactor: input.twoFactor,
      termsAcceptedAt: existing.termsAcceptedAt ?? new Date().toISOString(),
    }
    await db.authorProfiles.put(next)
    return next
  },

  async getMyStories(params: StudioParams): Promise<Paged<StudioStory>> {
    const shelf = await shelfOf(currentUserId())
    const q = (params.q ?? '').trim().toLowerCase()

    // Cari dan saring status bersifat AND (FR-STUDIO-03).
    const filtered = shelf
      .filter((item) => (params.status === 'all' ? true : item.studioStatus === params.status))
      .filter((item) => matchesTitle(item, q))
      .sort(SORTERS[params.sort])

    const start = (params.page - 1) * params.pageSize
    const items = filtered.slice(start, start + params.pageSize)

    return {
      items,
      page: params.page,
      pageSize: params.pageSize,
      total: filtered.length,
      hasMore: start + items.length < filtered.length,
    }
  },

  /** Agregat seluruh karya, bukan halaman yang sedang tampil (FR-STUDIO-01). */
  async getStudioSummary(): Promise<StudioSummary> {
    const shelf = await shelfOf(currentUserId())

    return {
      stories: shelf.length,
      views: shelf.reduce((sum, i) => sum + i.story.stats.reads, 0),
      subs: shelf.reduce((sum, i) => sum + i.story.stats.saves, 0),
      coins: shelf.reduce((sum, i) => sum + i.story.stats.coinsEarned, 0),
    }
  },

  async createStory(form: StoryForm): Promise<Story> {
    const userId = currentUserId()
    await requireTier('registered')

    const now = todayLocalISO()
    const story: Story = {
      id: `ms-${crypto.randomUUID()}`,
      title: form.title,
      synopsis: form.synopsis,
      coverUrl: form.coverUrl,
      bannerUrl: null,
      authorId: userId,
      penName: form.penName,
      genres: [form.genre, ...form.extraGenres],
      tags: form.tags,
      audience: form.audience,
      language: form.language,
      status: 'ongoing',
      kind: 'fiksi',
      // Cerita baru selalu lahir sebagai draf: yang terbit adalah yang sudah
      // lolos tinjauan, dan itu keputusan terpisah (FR-STUDIO-38).
      review: 'draft',
      rejectReason: null,
      visibility: form.visibility,
      monetizeType: form.monetizeType,
      fullAccessCoins: form.fullAccessCoins,
      badge: null,
      updatedAt: now,
      commentsEnabled: form.commentsEnabled,
      moderateComments: form.moderateComments,
      allowTranslation: form.allowTranslation,
      allowFanfiction: form.allowFanfiction,
      contentLabels: form.contentLabels,
      dedication: form.dedication,
      authorNote: form.authorNote,
      stats: {
        reads: 0,
        saves: 0,
        rating: 0,
        ratingCount: 0,
        chapterCount: 0,
        weeklyReads: 0,
        commentCount: 0,
        readers: 0,
        coinsEarned: 0,
        unlockCount: 0,
      },
    }

    await db.stories.add(story)
    return story
  },

  async updateStory(storyId: string, form: StoryForm): Promise<Story> {
    const userId = currentUserId()
    const story = await db.stories.get(storyId)
    if (!story || story.authorId !== userId) {
      throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Cerita ini bukan milikmu.')
    }

    const next: Story = {
      ...story,
      title: form.title,
      synopsis: form.synopsis,
      coverUrl: form.coverUrl,
      penName: form.penName,
      genres: [form.genre, ...form.extraGenres],
      tags: form.tags,
      audience: form.audience,
      language: form.language,
      visibility: form.visibility,
      monetizeType: form.monetizeType,
      fullAccessCoins: form.fullAccessCoins,
      // Status penerbitan hanya berubah lewat mode sunting (FR-STUDIO-18).
      status: form.status,
      commentsEnabled: form.commentsEnabled,
      moderateComments: form.moderateComments,
      allowTranslation: form.allowTranslation,
      allowFanfiction: form.allowFanfiction,
      contentLabels: form.contentLabels,
      dedication: form.dedication,
      authorNote: form.authorNote,
      updatedAt: todayLocalISO(),
    }
    await db.stories.put(next)
    return next
  },

  /**
   * Hapus cerita · FR-STUDIO-06.
   *
   * Cerita **terbit dan berbayar** ditolak di sini: pembaca yang sudah membayar
   * bab-babnya tidak boleh kehilangan apa yang dimilikinya karena satu ketukan
   * di studio. Jalannya lewat pengembalian dana, dan itu belum ada — jadi
   * ditolak dengan alasan, bukan dikerjakan setengah.
   */
  async deleteStory(storyId: string): Promise<void> {
    const userId = currentUserId()
    const story = await db.stories.get(storyId)
    if (!story || story.authorId !== userId) {
      throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Cerita ini bukan milikmu.')
    }

    const paidAndLive = story.review === 'published' && story.monetizeType !== 'free'
    if (paidAndLive) {
      const sold = await db.chapters
        .where('storyId')
        .equals(storyId)
        .toArray()
        .then(async (chapters) => {
          const ids = new Set(chapters.map((c) => c.id))
          const owned = await db.ownerships.toArray()
          return owned.filter((o) => ids.has(o.chapterId) && o.source !== 'ad').length
        })

      if (sold > 0) {
        throw new ApiError(
          INTERNAL_CODES.CONFLICT,
          `Cerita ini punya ${sold} bab yang sudah dibeli pembaca. Menghapusnya menuntut pengembalian koin lebih dulu.`,
          { detail: String(sold) },
        )
      }
    }

    await db.transaction('rw', db.stories, db.chapters, db.scheduleEntries, async () => {
      await db.chapters.where('storyId').equals(storyId).delete()
      await db.scheduleEntries.where('storyId').equals(storyId).delete()
      await db.stories.delete(storyId)
    })
  },

  /**
   * Menjadwalkan terbit · FR-STUDIO-04.
   *
   * Waktunya disimpan **UTC beserta zona waktu penulis** (FR-STUDIO-37): jam
   * 19.00 yang penulisnya maksud di Jakarta harus tetap 19.00 Jakarta ketika
   * dibaca dari perangkat mana pun.
   */
  async scheduleStory(input: ScheduleStoryInput): Promise<StudioStory> {
    const userId = currentUserId()
    const story = await db.stories.get(input.storyId)
    if (!story || story.authorId !== userId) {
      throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Cerita ini bukan milikmu.')
    }

    const at = new Date(`${input.date}T${input.time}`)
    if (Number.isNaN(at.getTime())) {
      throw new ApiError(INTERNAL_CODES.VALIDATION, 'Tanggal atau jam terbit tidak sah.')
    }
    if (at.getTime() < Date.now() - 60_000) {
      throw new ApiError(
        INTERNAL_CODES.VALIDATION,
        'Waktu terbit sudah lewat. Pilih tanggal hari ini atau sesudahnya.',
      )
    }

    // Pemicu FR-NOTIF-02: penjadwal cerita.
    await emitNotification(userId, {
      kind: 'cerita-terjadwal',
      title: `${story.title} terjadwal terbit`,
      body: 'Cerita berpindah dari draf ke terjadwal',
      deepLink: '/karya',
      groupKey: `sched-story-${story.id}`,
    })

    await db.scheduleEntries.put({
      id: `sch-story-${story.id}`,
      storyId: story.id,
      storyTitle: story.title,
      chapterId: null,
      chapterLabel: null,
      publishAtUtc: at.toISOString(),
      authorTz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cadence: input.cadence,
      kind: 'ok',
      note: null,
    })

    return buildStudioStory(story)
  },

  /**
   * Pesanan cetak · FR-STUDIO-05.
   *
   * Nomornya membawa jenisnya (`#SFT-` / `#HDC-`), jadi satu daftar riwayat
   * cukup dibaca sekilas. Alamat pengiriman **wajib untuk hardcopy** dan
   * diperiksa di sini — layar boleh lupa, server tidak.
   */
  async createPrintOrder(input: PrintOrderInput): Promise<PrintOrder> {
    const userId = currentUserId()
    const story = await db.stories.get(input.storyId)
    if (!story || story.authorId !== userId) {
      throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Cerita ini bukan milikmu.')
    }
    if (input.kind === 'hard' && input.shipping === null) {
      throw new ApiError(INTERNAL_CODES.VALIDATION, 'Alamat pengiriman wajib untuk pesanan cetak.')
    }

    const day = todayLocalISO().replaceAll('-', '')
    const seq = (await db.printOrders.where('userId').equals(userId).count()) + 1
    const prefix = input.kind === 'soft' ? 'SFT' : 'HDC'
    const now = new Date()

    const order: PrintOrder = {
      id: `#${prefix}-${day}-${String(seq).padStart(3, '0')}`,
      userId,
      storyId: story.id,
      storyTitle: story.title,
      kind: input.kind,
      spec: input.spec,
      status: input.kind === 'soft' ? 'paid' : 'submitted',
      // Softcopy tidak punya lini masa enam tahap — ia jadi atau tidak.
      stageIndex: input.kind === 'soft' ? null : 0,
      costQuoted: input.kind === 'soft' ? 0 : 285_000 * input.copies,
      costFinal: null,
      rejectReason: null,
      trackingNumber: null,
      etaNote: input.kind === 'soft' ? null : '7–10 hari kerja',
      fileName:
        input.kind === 'soft' ? `${story.title} - Bab 1-${story.stats.chapterCount}.pdf` : null,
      fileSize: input.kind === 'soft' ? '4.2 MB' : null,
      fileExpiresAt:
        input.kind === 'soft' ? new Date(now.getTime() + 30 * 24 * 3_600_000).toISOString() : null,
      note: input.shipping?.note ?? null,
      createdAt: now.toISOString(),
    }

    await db.printOrders.add(order)
    return order
  },
}

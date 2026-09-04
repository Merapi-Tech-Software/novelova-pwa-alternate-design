import { CHAPTER_TARGET_WORDS } from '@/lib/limits'
import type { NovelovaApi } from '../../client'
import type {
  AuthorChapter,
  AuthorChapterParams,
  AuthorChapterStatus,
  ChapterAccessInfo,
  ChapterAccessInput,
  ChapterBoard,
  ChapterDraft,
  ChapterDraftInput,
  ChapterNotice,
  ChapterSummary,
  Paged,
  ScheduleChapterInput,
} from '../../contracts'
import { ApiError, INTERNAL_CODES, VISIBLE_CODES } from '../../errors'
import { SERVER_CONFIG } from '../config'
import { db } from '../db'
import { currentUserId } from './session'

/**
 * Kelola bab · FR-STUDIO-07..11 · FR-STUDIO-38.
 *
 * Sama seperti daftar karya: **statusnya diturunkan, bukan disimpan.** Bab punya
 * `state` (draf · terjadwal · terbit · privat) dan `review` (draf · dalam
 * tinjauan · ditolak · terbit) yang hidup berdampingan; menggabungkannya jadi
 * satu kolom baru berarti tiga tempat yang harus ingat memperbaruinya.
 *
 * Pemberitahuan tindak lanjut juga **dihitung dari keadaan bab**, bukan daftar
 * yang ditulis tangan. Pemberitahuan yang tidak lahir dari data akan tetap
 * berbunyi lama setelah penyebabnya hilang.
 */

/** Sehari sebelum terbit sudah pantas disebut "besok". */
const SOON_MS = 24 * 3_600_000
/** Draf yang tidak disentuh selama ini pantas diingatkan (FR-STUDIO-07). */
const STALE_DAYS = 5
/** Ambang pemberitahuan pencapaian views. */
const MILESTONE_VIEWS = 10_000

async function storyOfAuthor(storyId: string) {
  const story = await db.stories.get(storyId)
  if (!story || story.authorId !== currentUserId()) {
    throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Cerita ini bukan milikmu.')
  }
  return story
}

async function chapterOfAuthor(chapterId: string): Promise<ChapterSummary> {
  const chapter = await db.chapters.get(chapterId)
  if (!chapter) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Bab ini tidak ada.')
  await storyOfAuthor(chapter.storyId)
  return chapter
}

/**
 * Enam status · FR-STUDIO-08 + FR-STUDIO-38.
 *
 * Tinjauan mendahului keadaan terbit: bab yang sedang ditinjau tersimpan sebagai
 * `draft` di kolom `state`, tetapi yang perlu dilihat penulisnya adalah bahwa ia
 * sedang menunggu keputusan — bukan bahwa ia draf.
 */
function statusOf(chapter: ChapterSummary): AuthorChapterStatus {
  if (chapter.review === 'in_review') return 'in_review'
  if (chapter.review === 'rejected') return 'rejected'
  return chapter.state
}

function toAuthorChapter(chapter: ChapterSummary): AuthorChapter {
  return {
    ...chapter,
    authorStatus: statusOf(chapter),
    // Draf 620 kata dari target 1.500 ≈ 41%. Perkiraan, dan disebut perkiraan:
    // yang tahu sebuah bab "selesai" hanya penulisnya.
    progressPct: Math.min(100, Math.round((chapter.wordCount / CHAPTER_TARGET_WORDS) * 100)),
  }
}

const SORTERS: Record<AuthorChapterParams['sort'], (a: AuthorChapter, b: AuthorChapter) => number> =
  {
    number: (a, b) => b.number - a.number,
    edited: (a, b) => b.editedAt.localeCompare(a.editedAt),
    views: (a, b) => b.views - a.views,
    rating: (a, b) => b.rating - a.rating,
  }

async function chaptersOf(storyId: string): Promise<AuthorChapter[]> {
  const rows = await db.chapters.where('storyId').equals(storyId).toArray()
  return rows.map(toAuthorChapter)
}

/**
 * Empat jenis pemberitahuan · FR-STUDIO-07.
 *
 * Semuanya lahir dari keadaan bab, dan **setiap satu punya tujuan** — daftar
 * yang menyoroti masalah tanpa memberi jalan ke sana hanya memindahkan
 * pekerjaan mencari ke penulisnya.
 */
function noticesFor(storyId: string, chapters: AuthorChapter[]): ChapterNotice[] {
  const now = Date.now()
  const notices: ChapterNotice[] = []

  const soon = chapters
    .filter((c) => c.authorStatus === 'scheduled' && c.publishAt !== null)
    .filter((c) => {
      const at = Date.parse(c.publishAt as string)
      return at > now && at - now <= SOON_MS
    })
    .sort((a, b) => (a.publishAt ?? '').localeCompare(b.publishAt ?? ''))[0]
  if (soon) {
    notices.push({
      id: `notice-soon-${soon.id}`,
      kind: 'publishing-soon',
      text: `Bab ${soon.number} "${soon.title}" terbit dalam 24 jam.`,
      actionLabel: 'Lihat babnya',
      href: `/karya/${storyId}/bab#bab-${soon.number}`,
    })
  }

  const stale = chapters
    .filter((c) => c.authorStatus === 'draft')
    .filter((c) => now - Date.parse(c.editedAt) >= STALE_DAYS * 86_400_000)
    .sort((a, b) => a.editedAt.localeCompare(b.editedAt))[0]
  if (stale) {
    const days = Math.floor((now - Date.parse(stale.editedAt)) / 86_400_000)
    notices.push({
      id: `notice-stale-${stale.id}`,
      kind: 'stale-draft',
      text: `Draf "${stale.title}" belum disentuh ${days} hari.`,
      actionLabel: 'Lanjut tulis',
      href: `/karya/${storyId}/bab/${stale.id}/ubah`,
    })
  }

  const hidden = chapters.find((c) => c.authorStatus === 'private')
  if (hidden) {
    notices.push({
      id: `notice-hidden-${hidden.id}`,
      kind: 'hidden',
      text: `Bab ${hidden.number} sedang privat dan tidak tampil ke pembaca.`,
      actionLabel: 'Atur akses',
      href: `/karya/${storyId}/bab/${hidden.id}/akses`,
    })
  }

  const milestone = chapters
    .filter((c) => c.views >= MILESTONE_VIEWS)
    .sort((a, b) => b.views - a.views)[0]
  if (milestone) {
    notices.push({
      id: `notice-milestone-${milestone.id}`,
      kind: 'milestone',
      text: `Bab ${milestone.number} menembus ${Math.floor(milestone.views / 1_000)} ribu pembacaan.`,
      actionLabel: 'Lihat statistik',
      href: `/karya/${storyId}/analitik`,
    })
  }

  return notices
}

export const chapterStudioHandlers: Pick<
  NovelovaApi,
  | 'getChaptersForAuthor'
  | 'getChapterBoard'
  | 'publishChapter'
  | 'scheduleChapter'
  | 'unscheduleChapter'
  | 'deleteChapter'
> = {
  async getChaptersForAuthor(
    storyId: string,
    params: AuthorChapterParams,
  ): Promise<Paged<AuthorChapter>> {
    await storyOfAuthor(storyId)
    const q = (params.q ?? '').trim().toLowerCase()

    // Cari hanya judul, dan saring status: keduanya AND (FR-STUDIO-09).
    const filtered = (await chaptersOf(storyId))
      .filter((c) => (params.status === 'all' ? true : c.authorStatus === params.status))
      .filter((c) => q === '' || c.title.toLowerCase().includes(q))
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

  /** Penghitung **agregat** — tidak ikut saringan, sama seperti ringkasan studio. */
  async getChapterBoard(storyId: string): Promise<ChapterBoard> {
    await storyOfAuthor(storyId)
    const chapters = await chaptersOf(storyId)

    return {
      draft: chapters.filter((c) => c.authorStatus === 'draft').length,
      scheduled: chapters.filter((c) => c.authorStatus === 'scheduled').length,
      published: chapters.filter((c) => c.authorStatus === 'published').length,
      notices: noticesFor(storyId, chapters),
    }
  },

  /**
   * Terbitkan · FR-STUDIO-08 · FR-STUDIO-38.
   *
   * Satu metode untuk dua tombol yang tampak berbeda — **Terbitkan** pada draf
   * dan **Tampilkan** pada bab privat — tetapi jalannya tidak sama, dan
   * perbedaannya penting:
   *
   * - **Naskah baru masuk tinjauan lebih dulu.** FR-STUDIO-38 menyatakannya
   *   langsung: yang dikirim untuk terbit berstatus "Dalam tinjauan" dan tidak
   *   tampil ke pembaca sampai diputuskan.
   * - **Bab yang sudah pernah lolos tinjauan terbit langsung.** Menampilkan
   *   kembali bab privat bukan konten baru; mengirimnya ulang ke antrean hanya
   *   menahan sesuatu yang sudah pernah diperiksa.
   */
  async publishChapter(chapterId: string): Promise<AuthorChapter> {
    const chapter = await chapterOfAuthor(chapterId)

    if (chapter.review === 'rejected') {
      throw new ApiError(
        INTERNAL_CODES.CONFLICT,
        'Bab ini ditolak tinjauan. Perbaiki dulu isinya, lalu kirim ulang untuk ditinjau.',
      )
    }

    const reviewed = chapter.review === 'published'
    const next: ChapterSummary = reviewed
      ? {
          ...chapter,
          state: 'published',
          access: chapter.access === 'private' ? 'free' : chapter.access,
          publishAt: chapter.publishAt ?? new Date().toISOString(),
        }
      : { ...chapter, review: 'in_review', state: 'draft', publishAt: null }

    await db.chapters.put(next)
    await db.scheduleEntries.delete(`sch-chapter-${chapterId}`)
    return toAuthorChapter(next)
  },

  /**
   * Jadwalkan **satu bab** · FR-STUDIO-11.
   *
   * Sengaja bukan `scheduleStory` dengan `chapterId` opsional: keduanya menulis
   * baris jadwal yang berbeda, dan menyatukannya membuat "menjadwalkan cerita
   * utuh" dan "menjadwalkan bab" bisa saling menimpa tanpa ada yang sadar.
   */
  async scheduleChapter(input: ScheduleChapterInput): Promise<AuthorChapter> {
    const chapter = await chapterOfAuthor(input.chapterId)
    const story = await storyOfAuthor(chapter.storyId)

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

    const next: ChapterSummary = {
      ...chapter,
      state: 'scheduled',
      publishAt: at.toISOString(),
      publishTz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }

    await db.transaction('rw', db.chapters, db.scheduleEntries, async () => {
      await db.chapters.put(next)
      await db.scheduleEntries.put({
        id: `sch-chapter-${chapter.id}`,
        storyId: story.id,
        storyTitle: story.title,
        chapterId: chapter.id,
        chapterLabel: `Bab ${chapter.number} · ${chapter.title}`,
        publishAtUtc: at.toISOString(),
        authorTz: next.publishTz ?? 'Asia/Jakarta',
        cadence: input.cadence,
        kind: 'ok',
        note: null,
      })
    })

    return toAuthorChapter(next)
  },

  /** Batalkan jadwal — babnya kembali menjadi draf, bukan hilang. */
  async unscheduleChapter(chapterId: string): Promise<AuthorChapter> {
    const chapter = await chapterOfAuthor(chapterId)
    const next: ChapterSummary = { ...chapter, state: 'draft', publishAt: null }

    await db.transaction('rw', db.chapters, db.scheduleEntries, async () => {
      await db.chapters.put(next)
      await db.scheduleEntries.delete(`sch-chapter-${chapterId}`)
    })

    return toAuthorChapter(next)
  },

  /**
   * Hapus bab · FR-STUDIO-10.
   *
   * Bab **terbit yang sudah dibeli** ditolak, dengan angka pembelinya. Kebijakan
   * produknya jelas — menghapusnya menuntut pengembalian koin lebih dulu — dan
   * jalan itu belum ada, jadi ditolak dengan alasan ketimbang dikerjakan
   * setengah.
   */
  async deleteChapter(chapterId: string): Promise<void> {
    const chapter = await chapterOfAuthor(chapterId)

    const buyers = (await db.ownerships.where('chapterId').equals(chapterId).toArray()).filter(
      (o) => o.source !== 'ad',
    ).length

    if (chapter.state === 'published' && buyers > 0) {
      throw new ApiError(
        INTERNAL_CODES.CONFLICT,
        `Bab ini sudah dibeli ${buyers} pembaca. Menghapusnya menuntut pengembalian koin lebih dulu.`,
        { detail: String(buyers) },
      )
    }

    await db.transaction('rw', db.chapters, db.chapterContents, db.scheduleEntries, async () => {
      await db.chapterContents.where('chapterId').equals(chapterId).delete()
      await db.scheduleEntries.delete(`sch-chapter-${chapterId}`)
      await db.chapters.delete(chapterId)
    })
  },
}

/**
 * Sakelar kegagalan autosave — **dev saja**.
 *
 * `DRAFT-409` hanya muncul setelah empat kegagalan berturut-turut, dan itu
 * praktis mustahil dipicu dengan tangan di server tiruan yang selalu berhasil.
 * Tanpa sakelar ini, sisipan beserta tiga jalan keluarnya tidak akan pernah
 * sempat diperiksa — alasan yang sama dengan sakelar hasil pembayaran.
 */
let draftSaveFails = false

export function setMockDraftSaveFails(next: boolean): void {
  draftSaveFails = next
}

/** Paragraf dipisah baris kosong — itu yang diketik penulis, dan itu yang disimpan. */
function toParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p !== '')
}

function fromParagraphs(body: string[]): string {
  return body.join('\n\n')
}

async function draftOf(chapter: ChapterSummary): Promise<ChapterDraft> {
  const story = await db.stories.get(chapter.storyId)
  const contents = await db.chapterContents.where('chapterId').equals(chapter.id).toArray()
  const pick = (lang: 'id' | 'en') => {
    const found = contents.find((c) => c.lang === lang)
    return {
      title: found?.title ?? (lang === 'id' ? chapter.title : ''),
      body: fromParagraphs(found?.body ?? []),
      authorNote: found?.authorNote ?? '',
    }
  }

  return {
    chapterId: chapter.id,
    storyId: chapter.storyId,
    storyTitle: story?.title ?? '',
    number: chapter.number,
    id: pick('id'),
    en: pick('en'),
    updatedAt: chapter.editedAt,
  }
}

export const chapterDraftHandlers: Pick<NovelovaApi, 'getChapterDraft' | 'saveChapterDraft'> = {
  async getChapterDraft(chapterId: string): Promise<ChapterDraft> {
    return draftOf(await chapterOfAuthor(chapterId))
  },

  /**
   * Autosave lapis server · FR-STUDIO-34.
   *
   * Menulis **kedua bahasa sekaligus** dalam satu transaksi: naskah yang
   * separuh tersimpan lalu dipulihkan sebagai naskah utuh lebih berbahaya
   * daripada naskah yang tidak tersimpan sama sekali.
   */
  async saveChapterDraft(input: ChapterDraftInput): Promise<ChapterDraft> {
    const story = await storyOfAuthor(input.storyId)
    if (draftSaveFails) {
      throw new ApiError(VISIBLE_CODES.DRAFT_SAVE_FAILED, 'Naskah belum tersimpan ke server.', {
        detail: VISIBLE_CODES.DRAFT_SAVE_FAILED,
      })
    }

    const now = new Date().toISOString()
    let chapter = input.chapterId ? await chapterOfAuthor(input.chapterId) : undefined

    if (!chapter) {
      // Bab baru lahir di penyimpanan pertama, bukan saat editor dibuka —
      // membuat baris kosong lebih dulu berarti daftar bab penuh bab hantu
      // dari editor yang dibuka lalu ditinggalkan.
      const siblings = await db.chapters.where('storyId').equals(story.id).toArray()
      const number = siblings.reduce((max, c) => Math.max(max, c.number), 0) + 1
      chapter = {
        id: `${story.id}-c${number}`,
        storyId: story.id,
        number,
        title: input.id.title,
        access: 'free',
        priceCoins: 0,
        readMinutes: 0,
        state: 'draft',
        review: 'draft',
        publishAt: null,
        publishTz: null,
        wordCount: 0,
        editedAt: now,
        previewPct: 20,
        accessChangedAt: null,
        privateReason: null,
        privateUntil: null,
        views: 0,
        rating: 0,
        commentCount: 0,
        owned: true,
        finished: false,
        withdrawnAt: null,
      }
    }

    const words = input.id.body.trim() === '' ? 0 : input.id.body.trim().split(/\s+/).length
    const next: ChapterSummary = {
      ...chapter,
      title: input.id.title,
      wordCount: words,
      readMinutes: Math.max(1, Math.round(words / 200)),
      editedAt: now,
    }

    await db.transaction('rw', db.chapters, db.chapterContents, async () => {
      await db.chapters.put(next)
      await db.chapterContents.put({
        id: `${next.id}-id`,
        chapterId: next.id,
        lang: 'id',
        title: input.id.title,
        body: toParagraphs(input.id.body),
        authorNote: input.id.authorNote === '' ? null : input.id.authorNote,
      })

      // Versi English ditulis hanya bila ada isinya; menyimpan baris kosong
      // membuat `hasEnglish()` berbohong seumur hidup bab itu.
      const hasEnglish = input.en.title.trim() !== '' || input.en.body.trim() !== ''
      if (hasEnglish) {
        await db.chapterContents.put({
          id: `${next.id}-en`,
          chapterId: next.id,
          lang: 'en',
          title: input.en.title,
          body: toParagraphs(input.en.body),
          authorNote: input.en.authorNote === '' ? null : input.en.authorNote,
        })
      } else {
        await db.chapterContents.delete(`${next.id}-en`)
      }
    })

    return draftOf(next)
  },
}

/** Bab yang baru digratiskan ditahan tujuh hari · FR-STUDIO-23/36. */
const FREE_LOCK_DAYS = 7
/** Rentang harga bab, dalam koin · FR-STUDIO-25. */
const PRICE_MIN = 1
const PRICE_MAX = 50
/** Bagi hasil penulis — **nilai konfigurasi server**, bukan konstanta klien. */
const AUTHOR_SHARE_PCT = SERVER_CONFIG.authorSharePct

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)))

function daysLeft(since: string | null, span: number): number {
  if (!since) return 0
  const passed = (Date.now() - Date.parse(since)) / 86_400_000
  return Math.max(0, Math.ceil(span - passed))
}

async function accessInfoOf(chapter: ChapterSummary): Promise<ChapterAccessInfo> {
  const profile = await db.authorProfiles.get(currentUserId())
  const buyers = (await db.ownerships.where('chapterId').equals(chapter.id).toArray()).filter(
    (o) => o.source !== 'ad',
  ).length

  return {
    chapterId: chapter.id,
    storyId: chapter.storyId,
    number: chapter.number,
    title: chapter.title,
    access: chapter.access,
    priceCoins: chapter.priceCoins,
    previewPct: chapter.previewPct,
    privateReason: (chapter.privateReason as ChapterAccessInfo['privateReason']) ?? null,
    privateUntil: chapter.privateUntil,
    wordCount: chapter.wordCount,
    buyers,
    // Bab nomor 1 adalah pintu masuk cerita; menyembunyikannya berarti cerita
    // yang tidak bisa dimulai siapa pun.
    canBePrivate: chapter.number !== 1,
    freeLockDaysLeft:
      chapter.access === 'free' ? daysLeft(chapter.accessChangedAt, FREE_LOCK_DAYS) : 0,
    authorVerified: profile?.tier === 'verified',
    authorSharePct: AUTHOR_SHARE_PCT,
  }
}

export const chapterAccessHandlers: Pick<NovelovaApi, 'getChapterAccess' | 'setChapterAccess'> = {
  async getChapterAccess(chapterId: string): Promise<ChapterAccessInfo> {
    return accessInfoOf(await chapterOfAuthor(chapterId))
  },

  /**
   * Mengubah akses bab · FR-STUDIO-23..26 · FR-STUDIO-36.
   *
   * Keempat aturannya ditegakkan **di sini**. Layar boleh menonaktifkan
   * tombolnya lebih dulu — itu kesopanan — tetapi yang menolak permintaannya
   * adalah server, karena layar bisa dilewati dan server tidak.
   */
  async setChapterAccess(input: ChapterAccessInput): Promise<ChapterAccessInfo> {
    const chapter = await chapterOfAuthor(input.chapterId)
    const info = await accessInfoOf(chapter)

    if (input.access === 'private' && !info.canBePrivate) {
      throw new ApiError(
        INTERNAL_CODES.CONFLICT,
        'Bab pertama tidak bisa diprivatkan — ia pintu masuk ceritamu.',
      )
    }

    if (input.access === 'paid') {
      if (!info.authorVerified) {
        throw new ApiError(
          INTERNAL_CODES.FORBIDDEN,
          'Bab berbayar menuntut penulis terverifikasi. Selesaikan identitas pencairan dan 2FA lebih dulu.',
        )
      }
      if (info.freeLockDaysLeft > 0) {
        throw new ApiError(
          INTERNAL_CODES.CONFLICT,
          `Bab ini baru digratiskan. Ia bisa kembali berbayar dalam ${info.freeLockDaysLeft} hari lagi.`,
          { detail: String(info.freeLockDaysLeft) },
        )
      }
    }

    const changed = input.access !== chapter.access
    const next: ChapterSummary = {
      ...chapter,
      access: input.access,
      // Harga dijepit di server juga: klien yang menjepit adalah klien yang
      // bisa diganti dengan `curl`.
      priceCoins: input.access === 'paid' ? clamp(input.priceCoins, PRICE_MIN, PRICE_MAX) : 0,
      previewPct: clamp(input.previewPct, 0, 50),
      // Bab privat menghilang dari daftar pembaca; keadaan terbitnya ikut.
      state:
        input.access === 'private'
          ? 'private'
          : chapter.state === 'private'
            ? 'published'
            : chapter.state,
      privateReason: input.access === 'private' ? input.privateReason : null,
      privateUntil: input.access === 'private' ? input.privateUntil : null,
      // Stempel hanya bergerak saat tipenya benar-benar berubah — mengubah harga
      // tidak boleh memperpanjang masa tahan tujuh hari.
      accessChangedAt: changed ? new Date().toISOString() : chapter.accessChangedAt,
    }

    await db.chapters.put(next)
    return accessInfoOf(next)
  },
}

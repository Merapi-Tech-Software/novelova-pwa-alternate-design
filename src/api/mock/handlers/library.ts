import { todayLocalISO } from '@/lib/date'
import type { NovelovaApi } from '../../client'
import type {
  ChapterSummary,
  LibraryEntry,
  LibraryItem,
  LibraryParams,
  LibrarySummary,
  Paged,
  ReadingProgress,
  ReadState,
  Story,
} from '../../contracts'
import { ApiError, INTERNAL_CODES } from '../../errors'
import { db } from '../db'
import { currentUserId } from './session'

/**
 * Perpustakaan · FR-LIB-01..12.
 *
 * Dua alur yang di prototipe sama sekali tidak punya sumber data ditutup di
 * sini:
 *
 * 1. **Isinya bersumber tunggal dari "Simpan"** (FR-LIB-11). Tidak ada jalan
 *    lain sebuah cerita bisa muncul di rak — bukan rekomendasi, bukan riwayat
 *    baca, bukan seed. Rak yang mengisi dirinya sendiri bukan rak.
 * 2. **Progresnya dihitung dari `ReadingProgress`**, bukan angka yang ditulis di
 *    kartu. Persentase yang tidak bergerak setelah membaca satu jam adalah
 *    angka yang mengajari pembaca untuk berhenti mempercayainya.
 *
 * Menyaring, mencari, dan mengurutkan semuanya **di sini**, dengan paginasi.
 * Prototipe menyaring kartu yang kebetulan ada di DOM, jadi cerita ke-43 tidak
 * pernah ikut tersaring apa pun saringannya.
 */

/**
 * Bab yang benar-benar sudah terbit — draf penulis bukan urusan pembaca.
 *
 * `publishAt: null` berarti terbit tanpa jadwal, jadi ia **ikut**; yang
 * dikecualikan hanya bab yang tanggalnya masih di depan.
 */
async function publishedChapters(storyId: string): Promise<ChapterSummary[]> {
  const now = Date.now()
  return (await db.chapters.where('storyId').equals(storyId).toArray())
    .filter(
      (c) => c.state === 'published' && (c.publishAt === null || Date.parse(c.publishAt) <= now),
    )
    .sort((a, b) => a.number - b.number)
}

/**
 * Aturan status · FR-LIB-11.
 *
 * `finished` menuntut **seluruh** bab terbit selesai, jadi cerita yang tamat
 * lalu merilis bab baru **kembali** jadi `reading` dengan sendirinya: pembaginya
 * bertambah, pembilangnya tidak. Tidak ada kode khusus untuk itu, dan justru
 * itulah yang membuatnya tidak bisa lupa.
 */
function stateOf(finishedCount: number, total: number): ReadState {
  if (finishedCount === 0) return 'not-started'
  return finishedCount >= total ? 'finished' : 'reading'
}

async function buildItem(
  entry: LibraryEntry,
  story: Story,
  progress: ReadingProgress | undefined,
): Promise<LibraryItem> {
  const chapters = await publishedChapters(story.id)
  const total = chapters.length
  const published = new Set(chapters.map((c) => c.id))

  // Bab yang sudah dihapus penulisnya tidak boleh ikut dihitung selesai —
  // kalau ikut, cerita bisa tampil 105% selesai.
  const finished = new Set((progress?.finishedChapterIds ?? []).filter((id) => published.has(id)))
  const finishedCount = finished.size

  const lastChapter = progress?.lastChapterId
    ? chapters.find((c) => c.id === progress.lastChapterId)
    : undefined
  const firstChapter = chapters[0]
  const target = lastChapter ?? firstChapter

  const latestPublish = chapters.at(-1)?.publishAt ?? story.updatedAt
  // "Sejak kunjungan terakhir" — dan bagi cerita yang belum pernah dibuka,
  // sejak ia disimpan. Tanpa itu setiap cerita yang baru disimpan langsung
  // bertitik merah, dan titiknya berhenti berarti apa-apa.
  const since = progress?.updatedAt ?? entry.savedAt

  return {
    story,
    savedAt: entry.savedAt,
    notify: entry.notify,
    state: stateOf(finishedCount, total),
    finishedCount,
    totalChapters: total,
    pct: total === 0 ? 0 : Math.round((finishedCount / total) * 100),
    continueChapterId: target?.id ?? null,
    continueChapterNumber: target?.number ?? null,
    // Terbit setelah kunjungan terakhir **dan** belum dibaca. Syarat kedua
    // perlu: pembaca yang sudah menyusul bab barunya tidak boleh tetap
    // ditandai punya bab baru.
    hasNewChapter: chapters.some(
      (c) =>
        c.publishAt !== null && Date.parse(c.publishAt) > Date.parse(since) && !finished.has(c.id),
    ),
    chapterUpdatedAt: todayLocalISO(new Date(latestPublish)),
  }
}

/** Seluruh rak pembaca, sudah digabung dengan progresnya. */
async function shelfOf(userId: string): Promise<LibraryItem[]> {
  const entries = (await db.libraryEntries.where('userId').equals(userId).toArray()).filter(
    (e) => !e.removed,
  )
  if (entries.length === 0) return []

  const stories = new Map(
    (await db.stories.bulkGet(entries.map((e) => e.storyId)))
      .filter((s): s is Story => s !== undefined)
      .map((s) => [s.id, s]),
  )
  const progress = new Map(
    (await db.progress.where('userId').equals(userId).toArray()).map((p) => [p.storyId, p]),
  )

  const items: LibraryItem[] = []
  for (const entry of entries) {
    const story = stories.get(entry.storyId)
    if (story) items.push(await buildItem(entry, story, progress.get(entry.storyId)))
  }
  return items
}

/**
 * Pencarian · FR-LIB-03.
 *
 * Judul, penulis, dan genre digabung jadi satu untai lalu dicocokkan sebagai
 * **substring** — bukan awalan, bukan kata utuh. Kueri kosong meloloskan
 * semuanya: pencarian tidak pernah menyembunyikan segalanya karena kosong.
 */
function matches(item: LibraryItem, q: string): boolean {
  if (q === '') return true
  const haystack = [item.story.title, item.story.penName, ...item.story.genres]
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

const SORTERS: Record<LibraryParams['sort'], (a: LibraryItem, b: LibraryItem) => number> = {
  saved: (a, b) => b.savedAt.localeCompare(a.savedAt),
  updated: (a, b) => b.chapterUpdatedAt.localeCompare(a.chapterUpdatedAt),
  az: (a, b) => a.story.title.localeCompare(b.story.title, 'id'),
  rating: (a, b) => b.story.stats.rating - a.story.stats.rating,
}

async function entryOf(userId: string, storyId: string): Promise<LibraryEntry> {
  const entry = await db.libraryEntries.where('[userId+storyId]').equals([userId, storyId]).first()
  if (!entry) throw new ApiError(INTERNAL_CODES.NOT_FOUND, 'Cerita ini tidak ada di koleksimu.')
  return entry
}

export const libraryHandlers: Pick<
  NovelovaApi,
  'getLibrary' | 'getLibrarySummary' | 'toggleNotify' | 'removeFromLibrary' | 'undoRemove'
> = {
  /**
   * Rak pembaca · FR-LIB-03/04/05/11.
   *
   * Urutannya **selalu** dijalankan sebelum pemotongan halaman. Mengurutkan
   * setelah memotong berarti halaman dua berisi cerita yang seharusnya di
   * halaman satu — cacat yang tidak terlihat sampai koleksinya lewat 20.
   */
  async getLibrary(params: LibraryParams): Promise<Paged<LibraryItem>> {
    const shelf = await shelfOf(currentUserId())
    const q = (params.q ?? '').trim().toLowerCase()

    // Cari dan saring status bersifat **AND** — keduanya harus terpenuhi.
    const filtered = shelf
      .filter((item) => (params.state === 'all' ? true : item.state === params.state))
      .filter((item) => matches(item, q))
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

  /**
   * Empat metrik · FR-LIB-01.
   *
   * Dihitung dari **seluruh** rak, bukan dari halaman yang sedang tampil —
   * itulah sebabnya ia panggilan terpisah. Angka ringkasan yang ikut berubah
   * saat menyaring bukan ringkasan koleksi, melainkan penghitung hasil, dan
   * keduanya sudah punya tempatnya masing-masing.
   */
  async getLibrarySummary(): Promise<LibrarySummary> {
    const shelf = await shelfOf(currentUserId())

    return {
      saved: shelf.length,
      reading: shelf.filter((i) => i.state === 'reading').length,
      done: shelf.filter((i) => i.state === 'finished').length,
      fresh: shelf.filter((i) => i.hasNewChapter).length,
    }
  },

  /** Sakelar notifikasi bab baru · FR-LIB-08. Disimpan server, bukan di DOM. */
  async toggleNotify(storyId: string): Promise<LibraryEntry> {
    const userId = currentUserId()
    const entry = await entryOf(userId, storyId)
    const next = { ...entry, notify: !entry.notify }
    await db.libraryEntries.put(next)
    return next
  },

  /**
   * Hapus dari koleksi · FR-LIB-09.
   *
   * Ditandai, bukan dihapus: "Urungkan" enam detik kemudian harus mengembalikan
   * **tanggal simpan aslinya**, dan baris yang sudah hilang tidak punya tanggal
   * untuk dikembalikan.
   */
  async removeFromLibrary(storyId: string): Promise<void> {
    const userId = currentUserId()
    const entry = await entryOf(userId, storyId)
    await db.libraryEntries.put({ ...entry, removed: true })
  },

  async undoRemove(storyId: string): Promise<LibraryEntry> {
    const userId = currentUserId()
    const entry = await entryOf(userId, storyId)
    // `savedAt` sengaja tidak disentuh — mengurungkan penghapusan bukan
    // menyimpan ulang, dan urutan "terbaru disimpan" tidak boleh berubah
    // hanya karena pembaca salah tekan.
    const next = { ...entry, removed: false }
    await db.libraryEntries.put(next)
    return next
  },
}

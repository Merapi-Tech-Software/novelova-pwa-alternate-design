import type { NovelovaApi } from '../../client'
import type { HomeFeed, HomeSection, Paged, SectionParams, Story } from '../../contracts'
import { db } from '../db'
import { BANNER, CONTINUE, findSection, type SectionDef, sectionsFor, tabFilter } from './sections'
import { currentUserId } from './session'

/**
 * Beranda · FR-HOME-04 · FR-HOME-13 · FR-HOME-16 · Fase 3b.
 *
 * Tiga aturan yang menentukan seluruh berkas ini:
 *
 * 1. **Tiga section pertama selalu ada** — Populer, Baru & Naik Cepat, Paling
 *    Banyak Dibuka — di tab mana pun, dan tetap ikut tersaring tab itu. Ekornya
 *    berganti: dua section generik dan dua kurasi khas tabnya.
 * 2. **Banner dan Lanjut Membaca tidak ikut tersaring.** Yang pertama kurasi
 *    editorial, yang kedua bacaan pribadi; menyaring keduanya berarti
 *    menyembunyikan bacaan pengguna sendiri karena ia menekan sebuah tab.
 * 3. **Section yang kosong pada tab itu tidak dikirim sama sekali** — judul di
 *    atas ruang kosong terbaca sebagai kerusakan, bukan sebagai hasil nol.
 *
 * Tab **mengurutkan dan menyaring tampilan**, tidak pernah mengunci katalog:
 * tiap cerita tetap dapat dibuka lewat pencarian dan tautan langsung.
 *
 * Favorit onboarding menaikkan cerita ke depan **di dalam** section, bukan
 * menggeser susunan section-nya (`architecture.md` §1.7).
 */

const SIZE = 20

function published(stories: Story[]): Story[] {
  return stories.filter((s) => s.review === 'published' && s.visibility === 'public')
}

async function readerFavorites(userId: string): Promise<string[]> {
  return (await db.readerPrefs.get(userId))?.genres ?? []
}

/** Menaikkan cerita bergenre favorit ke depan **tanpa membuang yang lain**. */
function favoritesFirst(stories: Story[], favorites: string[]): Story[] {
  if (favorites.length === 0) return stories
  const liked = (s: Story) => (s.genres.some((g) => favorites.includes(g)) ? 0 : 1)
  return [...stories].sort((a, b) => liked(a) - liked(b))
}

/** Section tanpa isi dibuang di sini, sekali, bukan di tiap pemakai. */
function build(def: SectionDef, stories: Story[], favorites: string[]): HomeSection | null {
  const picked = stories.filter((s) => def.match?.(s) ?? true).sort(def.order)
  if (picked.length === 0) return null

  return {
    id: def.id,
    title: def.title,
    subtitle: null,
    seeAll: def.browsable === false ? null : def.id,
    stories: favoritesFirst(picked, favorites).slice(0, SIZE),
  }
}

export const homeHandlers: Pick<NovelovaApi, 'getHomeFeed' | 'getSection'> = {
  async getHomeFeed(tab?: string): Promise<HomeFeed> {
    const userId = currentUserId()
    const hidden = new Set((await db.readerPrefs.get(userId))?.hiddenStoryIds ?? [])
    // Yang sudah ditolak pembaca tidak muncul lagi di mana pun (FR-HOME-14).
    const all = published(await db.stories.toArray()).filter((s) => !hidden.has(s.id))
    const inTab = all.filter(tabFilter(tab))

    // Saat tab "Semua" aktif, favorit onboarding yang menentukan apa yang
    // terlihat lebih dulu. Saat sebuah tab dipilih, tab itu yang menang.
    const favorites = tab ? [] : await readerFavorites(userId)

    const progress = await db.progress.where('userId').equals(userId).toArray()
    const reading = progress
      .filter((p) => p.lastChapterId !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((p) => all.find((s) => s.id === p.storyId))
      .filter((s): s is Story => s !== undefined)

    const sections = [
      build(BANNER, all, []),
      ...sectionsFor(tab).map((def) => build(def, inTab, favorites)),
      build(CONTINUE, reading, []),
    ]

    return { genre: tab ?? null, sections: sections.filter((s): s is HomeSection => s !== null) }
  },

  /**
   * Isi satu section, tanpa batas 20 dan dengan paginasi · FR-HOME-10.
   *
   * Aturannya diambil dari registry yang sama dengan beranda — halaman
   * lihat-semua yang urutannya berbeda dari section yang baru saja diketuk
   * terbaca sebagai kesalahan, bukan sebagai halaman lain.
   */
  async getSection(id: string, params: SectionParams): Promise<Paged<Story>> {
    const def = findSection(id)
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20

    const userId = currentUserId()
    const hidden = new Set((await db.readerPrefs.get(userId))?.hiddenStoryIds ?? [])
    const all = published(await db.stories.toArray()).filter((s) => !hidden.has(s.id))

    const scoped = def?.unfiltered ? all : all.filter(tabFilter(params.tab))
    const filtered = scoped.filter(
      (s) =>
        (def?.match?.(s) ?? true) &&
        matchesChip(s, params.chip) &&
        (params.status ? s.status === params.status : true) &&
        (params.language ? s.language === params.language : true) &&
        (params.q ? s.title.toLowerCase().includes(params.q.toLowerCase()) : true),
    )

    // Urutan pilihan pembaca mengalahkan favorit; tanpa pilihan, halaman ini
    // meniru persis apa yang baru saja ia lihat di beranda.
    const chosen = SORTS[params.sort ?? '']
    const favorites = chosen || params.tab ? [] : await readerFavorites(userId)
    const sorted = favoritesFirst(
      [...filtered].sort(chosen ?? def?.order ?? SORTS.reads),
      favorites,
    )
    const start = (page - 1) * pageSize

    return {
      items: sorted.slice(start, start + pageSize),
      page,
      pageSize,
      // Total dihitung dari seluruh hasil, bukan dari halaman ini — penghitung
      // "40 cerita" harus jujur walau yang tampil baru 20.
      total: sorted.length,
      hasMore: start + pageSize < sorted.length,
    }
  },
}

/** Urutan pilihan pembaca di halaman lihat-semua (FR-HOME-11). */
const SORTS: Record<string, (a: Story, b: Story) => number> = {
  reads: (a, b) => b.stats.reads - a.stats.reads,
  rating: (a, b) => b.stats.rating - a.stats.rating,
  updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  saved: (a, b) => b.stats.saves - a.stats.saves,
  growth: (a, b) => b.stats.weeklyReads - a.stats.weeklyReads,
  comments: (a, b) => b.stats.commentCount - a.stats.commentCount,
  unlocked: (a, b) => b.stats.unlockCount - a.stats.unlockCount,
  published: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
}

const DAY = 86_400_000
const PERIOD_DAYS: Record<string, number> = { hari: 1, minggu: 7, bulan: 30, '3bulan': 90 }

/**
 * Chip aktif · FR-HOME-11.
 *
 * Artinya berbeda per kategori, dan setiap aturannya bisa dijelaskan ke
 * pembaca — chip yang menyaring dengan cara yang tidak bisa diterangkan sama
 * saja dengan chip yang tidak berfungsi.
 */
function matchesChip(story: Story, chip: string | undefined): boolean {
  if (!chip || chip === 'semua') return true

  const days = PERIOD_DAYS[chip]
  if (days !== undefined) return Date.now() - Date.parse(story.updatedAt) <= days * DAY

  if (chip === 'terbaik') return story.stats.rating >= 4.7
  if (chip === 'permata') return story.badge === 'PERMATA'
  if (chip === 'penulis-baru') return story.badge === 'BARU'
  if (chip === 'bulan-ini') return Date.now() - Date.parse(story.updatedAt) <= 30 * DAY
  return true
}

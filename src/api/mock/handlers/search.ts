import { SEARCH_MIN_CHARS, SUGGESTION_MAX } from '@/lib/limits'
import { suggest } from '@/lib/similar'
import type { NovelovaApi } from '../../client'
import type { SearchParams, SearchResult, Story, Suggestion, User } from '../../contracts'
import { db } from '../db'

/**
 * Pencarian katalog · prd_11 · FR-SRCH-02.
 *
 * **Penyaringan di sisi seam, bukan di komponen** (prd_11 §7 #1). Menyaring
 * array di klien hanya bekerja selama seluruh katalog muat di memori; begitu
 * katalognya lebih besar dari satu halaman, hasilnya berbohong tanpa ada yang
 * tahu.
 *
 * Bobotnya mengikuti requirement: judul > penulis > tag > genre > sinopsis.
 * Sinopsis paling rendah dengan sengaja — sebuah kata yang kebetulan lewat di
 * paragraf sinopsis bukan alasan cerita itu naik ke atas.
 */

const WEIGHT = { title: 100, prefix: 20, author: 60, tag: 40, genre: 30, synopsis: 10 }

/**
 * Urutan pilihan pembaca · FR-SRCH-04.
 *
 * `relevan` sengaja **tidak** ada di sini: ia bukan perbandingan dua cerita
 * melainkan skor terhadap kueri, dan itu sudah dihitung sebelum daftar ini
 * dipakai.
 */
const SORTS: Record<string, (a: Story, b: Story) => number> = {
  populer: (a, b) => b.stats.reads - a.stats.reads,
  rating: (a, b) => b.stats.rating - a.stats.rating,
  terbaru: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
}

/** Tidak peka huruf besar-kecil, spasi tepi diabaikan (konsisten FR-LIB-03). */
function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function scoreStory(story: Story, q: string): number {
  const title = story.title.toLowerCase()
  let score = 0

  if (title.includes(q)) score += WEIGHT.title + (title.startsWith(q) ? WEIGHT.prefix : 0)
  if (story.penName.toLowerCase().includes(q)) score += WEIGHT.author
  if (story.tags.some((t) => t.toLowerCase().includes(q))) score += WEIGHT.tag
  if (story.genres.some((g) => g.toLowerCase().includes(q))) score += WEIGHT.genre
  if (story.synopsis.toLowerCase().includes(q)) score += WEIGHT.synopsis

  return score
}

function matchesUser(user: User, q: string): boolean {
  return [user.displayName, user.username, user.penName ?? ''].some((v) =>
    v.toLowerCase().includes(q),
  )
}

/** Menandai bagian yang cocok supaya komponen tidak perlu menebaknya lagi. */
function suggestionOf(kind: Suggestion['kind'], id: string, label: string, q: string): Suggestion {
  const at = label.toLowerCase().indexOf(q)
  return {
    id,
    kind,
    label,
    matchStart: Math.max(0, at),
    matchLength: at < 0 ? 0 : q.length,
  }
}

async function catalog(): Promise<Story[]> {
  const stories = await db.stories.toArray()
  return stories.filter((s) => s.review === 'published' && s.visibility === 'public')
}

export const searchHandlers: Pick<NovelovaApi, 'search' | 'getSuggestions' | 'getTrendingQueries'> =
  {
    async search(rawQuery: string, params: SearchParams): Promise<SearchResult> {
      const q = normalize(rawQuery)
      const page = params.page ?? 1
      const pageSize = params.pageSize ?? 20

      const empty: SearchResult = {
        query: rawQuery,
        stories: [],
        authors: [],
        tags: [],
        total: 0,
        page,
        hasMore: false,
        didYouMean: null,
      }
      // Di bawah dua karakter tidak ada permintaan yang dikirim klien; server
      // menolaknya juga supaya aturannya tidak hidup di satu tempat saja.
      if (q.length < SEARCH_MIN_CHARS) return empty

      const all = await catalog()
      // Saringan dipasang **sebelum** skor dipakai: mengurutkan lalu membuang
      // membuat `total` menghitung cerita yang tidak pernah tampil.
      const scoped = all.filter(
        (s) =>
          (params.genre ? s.genres.some((g) => g === params.genre) : true) &&
          (params.status ? s.status === params.status : true) &&
          (params.language ? s.language === params.language : true),
      )

      const chosen = SORTS[params.sort ?? 'relevan']
      const scored = scoped
        .map((story) => ({ story, score: scoreStory(story, q) }))
        .filter((row) => row.score > 0)
        .sort((a, b) =>
          chosen
            ? chosen(a.story, b.story)
            : b.score - a.score || b.story.stats.reads - a.story.stats.reads,
        )

      const users = await db.users.toArray()
      const authors = users.filter((u) => u.role === 'author' && matchesUser(u, q)).slice(0, 10)

      const counts = new Map<string, number>()
      for (const story of all) {
        for (const tag of story.tags) {
          if (tag.toLowerCase().includes(q)) counts.set(tag, (counts.get(tag) ?? 0) + 1)
        }
      }
      const tags = [...counts]
        .map(([tag, storyCount]) => ({ tag, storyCount }))
        .sort((a, b) => b.storyCount - a.storyCount)

      const start = (page - 1) * pageSize
      const nothing = scored.length === 0 && authors.length === 0 && tags.length === 0

      return {
        query: rawQuery,
        stories: scored.slice(start, start + pageSize).map((row) => row.story),
        authors,
        tags,
        total: scored.length,
        page,
        hasMore: start + pageSize < scored.length,
        // Hanya diisi saat benar-benar tidak ada apa pun: menawarkan ejaan lain
        // di atas daftar yang sudah berisi hasil hanya membuat ragu.
        didYouMean: nothing
          ? suggest(q, [...new Set(all.flatMap((s) => [s.title, ...s.tags, ...s.genres]))])
          : null,
      }
    },

    async getSuggestions(rawQuery: string): Promise<Suggestion[]> {
      const q = normalize(rawQuery)
      if (q.length < SEARCH_MIN_CHARS) return []

      const all = await catalog()
      const users = await db.users.toArray()

      const stories = all
        .filter((s) => s.title.toLowerCase().includes(q))
        .sort((a, b) => b.stats.reads - a.stats.reads)
        .map((s) => suggestionOf('cerita', s.id, s.title, q))

      const authors = users
        .filter((u) => u.role === 'author' && matchesUser(u, q))
        .map((u) => suggestionOf('penulis', u.id, u.penName ?? u.displayName, q))

      const tags = [...new Set(all.flatMap((s) => s.tags))]
        .filter((tag) => tag.toLowerCase().includes(q))
        .map((tag) => suggestionOf('tag', `tag-${tag}`, tag, q))

      // Cerita lebih dulu, lalu penulis, lalu tag — urutan yang sama dengan
      // kelompok hasilnya, supaya saran tidak mengajarkan urutan yang berbeda.
      return [...stories, ...authors, ...tags].slice(0, SUGGESTION_MAX)
    },

    /**
     * Kata kunci populer · FR-SRCH-03. Diturunkan dari tag yang paling banyak
     * dipakai katalog, bukan daftar yang ditulis tangan — kata kunci yang tidak
     * berhubungan dengan isi katalog mengantar pembaca ke hasil kosong.
     */
    async getTrendingQueries(): Promise<string[]> {
      const all = await catalog()
      const counts = new Map<string, number>()
      for (const story of all) {
        for (const tag of story.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
      }

      return [...counts]
        .sort((a, b) => b[1] - a[1])
        .slice(0, SUGGESTION_MAX)
        .map(([tag]) => tag)
    },
  }

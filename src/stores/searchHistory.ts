import { create } from 'zustand'
import { SEARCH_HISTORY_MAX } from '@/lib/limits'

/**
 * Riwayat pencarian · FR-SRCH-03.
 *
 * Kunci `novelova:search-history-v1`, isinya **`string[]` polos** — bukan objek
 * berpembungkus, karena bentuk itulah yang tertulis di `architecture.md` §7.1
 * dan yang akan dibaca siapa pun yang membuka penyimpanan peramban. Karena itu
 * `zustand/persist` tidak dipakai di sini; ia membungkus nilai dalam
 * `{ state, version }`.
 *
 * Tiga aturannya: **terbaru di depan**, **tanpa duplikat**, **maksimal sepuluh**.
 * Kueri yang sama diketik dua kali naik ke atas, bukan menambah baris kedua \u2014
 * riwayat yang berisi kata yang sama tiga kali tidak menolong siapa pun.
 */

const KEY = 'novelova:search-history-v1'

/** Dipisah dari store supaya aturannya bisa diuji tanpa menyentuh peramban. */
export function mergeHistory(current: readonly string[], query: string): string[] {
  const entry = query.trim()
  if (entry.length === 0) return [...current]

  const rest = current.filter((q) => q.toLowerCase() !== entry.toLowerCase())
  return [entry, ...rest].slice(0, SEARCH_HISTORY_MAX)
}

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    // Isi asing (versi lama, berkas yang disunting tangan) diperlakukan sebagai
    // riwayat kosong, tanpa error yang terlihat pengguna.
    return Array.isArray(parsed)
      ? parsed.filter((q): q is string => typeof q === 'string').slice(0, SEARCH_HISTORY_MAX)
      : []
  } catch {
    return []
  }
}

function write(entries: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries))
  } catch {
    // Mode privat atau kuota penuh. Riwayat tetap berlaku sepanjang sesi ini.
  }
}

interface SearchHistoryState {
  entries: string[]
  /** Dipanggil saat pengguna **benar-benar mencari**, bukan tiap ketikan. */
  remember: (query: string) => void
  forget: (query: string) => void
  clear: () => void
}

export const useSearchHistory = create<SearchHistoryState>()((set, get) => ({
  entries: read(),

  remember: (query) => {
    const next = mergeHistory(get().entries, query)
    write(next)
    set({ entries: next })
  },

  forget: (query) => {
    const next = get().entries.filter((q) => q !== query)
    write(next)
    set({ entries: next })
  },

  clear: () => {
    write([])
    set({ entries: [] })
  },
}))

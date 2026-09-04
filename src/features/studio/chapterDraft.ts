import type { ChapterLangDraft } from '@/api/contracts'

/**
 * Draf naskah bab di perangkat · FR-STUDIO-34.
 *
 * **Lapis pertama dari dua.** Yang ini bertahan meski jaringan mati; lapis
 * kedua (server) yang bertahan meski perangkatnya hilang. Keduanya perlu, dan
 * yang lokal ditulis lebih sering justru karena ia yang paling murah.
 *
 * Kuncinya **per bab** — `novelova:chapter-draft-<chapter_id>`. Satu kunci
 * bersama berarti membuka bab kedua menimpa draf bab pertama, dan penulis baru
 * menyadarinya saat mencoba memulihkan.
 */

export interface ChapterDraftBody {
  id: ChapterLangDraft
  en: ChapterLangDraft
  savedAt: string
  /** Cerita induknya — dipakai saat draf bab baru belum punya id. */
  storyId: string
}

/** Bab yang belum pernah tersimpan belum punya id; kuncinya per cerita. */
export function chapterDraftKey(chapterId: string | null, storyId: string): string {
  return chapterId
    ? `novelova:chapter-draft-${chapterId}`
    : `novelova:chapter-draft-baru-${storyId}`
}

export function writeChapterDraft(key: string, body: Omit<ChapterDraftBody, 'savedAt'>): void {
  try {
    localStorage.setItem(key, JSON.stringify({ ...body, savedAt: new Date().toISOString() }))
  } catch {
    // Kuota penuh atau penyimpanan diblokir. Autosave lokal adalah jaring
    // pengaman — kegagalannya tidak boleh menjatuhkan editor yang sedang dipakai.
  }
}

export function readChapterDraft(key: string): ChapterDraftBody | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const draft = JSON.parse(raw) as ChapterDraftBody
    if (!draft?.id || typeof draft.savedAt !== 'string') return null
    return draft
  } catch {
    return null
  }
}

export function clearChapterDraft(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Sama seperti di atas.
  }
}

/**
 * Hitungan kata · FR-STUDIO-20.
 *
 * Dipangkas lalu dipecah pada rangkaian spasi, entri kosong dibuang — sehingga
 * naskah kosong menghasilkan **0**, bukan 1. Itu satu-satunya bagian dari
 * hitungan kata yang benar-benar mudah salah.
 */
export function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length
}

/** Versi English dianggap ada bila judul **atau** isinya terisi (FR-STUDIO-19). */
export function hasEnglish(en: ChapterLangDraft): boolean {
  return en.title.trim() !== '' || en.body.trim() !== ''
}

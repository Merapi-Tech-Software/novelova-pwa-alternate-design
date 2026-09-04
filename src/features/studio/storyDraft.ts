import type { StoryForm } from '@/api/contracts'

/**
 * Draf formulir cerita yang belum tersimpan · FR-STUDIO-17 · FR-STUDIO-34.
 *
 * **Isinya, bukan penanda.** Prototipe menulis `'1'` ke `localStorage` — cukup
 * untuk memunculkan kotak "ada draf", tetapi tidak cukup untuk mengembalikan
 * satu huruf pun. Tawaran memulihkan yang tidak bisa memulihkan apa-apa lebih
 * buruk daripada tidak menawarkan sama sekali.
 *
 * Kuncinya **persis** seperti prototipe supaya draf yang sudah ada di perangkat
 * pengguna tidak hilang saat aplikasi ini menggantikannya. Karena itu ditulis
 * langsung, bukan lewat `zustand/persist` yang membungkus nilainya dalam
 * `{ state, version }`.
 */

export type FormMode = 'baru' | 'sunting'

const KEY: Record<FormMode, string> = {
  baru: 'novelova:create-story-draft',
  sunting: 'novelova:edit-story-draft',
}

export interface StoryDraft {
  form: StoryForm
  /** Kapan draf ini terakhir disentuh — kotak pemulihan menyebutkannya. */
  savedAt: string
  /** Cerita mana yang sedang disunting; `null` untuk mode `baru`. */
  storyId: string | null
}

export function writeStoryDraft(mode: FormMode, form: StoryForm, storyId: string | null): void {
  try {
    const draft: StoryDraft = { form, savedAt: new Date().toISOString(), storyId }
    localStorage.setItem(KEY[mode], JSON.stringify(draft))
  } catch {
    // Kuota penuh atau penyimpanan diblokir. Menulis draf adalah kenyamanan —
    // kegagalannya tidak boleh menjatuhkan formulir yang sedang diisi.
  }
}

/**
 * Draf yang tersimpan, atau `null`.
 *
 * Draf mode `sunting` milik cerita **lain** diabaikan: memulihkan isi cerita A
 * ke dalam formulir cerita B adalah cara tercepat menimpa naskah yang benar.
 */
export function readStoryDraft(mode: FormMode, storyId: string | null): StoryDraft | null {
  try {
    const raw = localStorage.getItem(KEY[mode])
    if (!raw) return null

    const draft = JSON.parse(raw) as StoryDraft
    if (!draft?.form || typeof draft.savedAt !== 'string') return null
    if (mode === 'sunting' && draft.storyId !== storyId) return null
    return draft
  } catch {
    return null
  }
}

export function clearStoryDraft(mode: FormMode): void {
  try {
    localStorage.removeItem(KEY[mode])
  } catch {
    // Sama seperti di atas: kegagalan membersihkan draf bukan kegagalan simpan.
  }
}

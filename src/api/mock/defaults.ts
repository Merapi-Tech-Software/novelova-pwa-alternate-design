import type { ReaderPrefs } from '../contracts'
import { db } from './db'

/**
 * Bentuk awal `ReaderPrefs` — **satu tempat, dipakai semuanya**.
 *
 * Sebelum §1.21 bentuknya ditulis ulang di empat tempat: seed, pembuatan akun,
 * fallback onboarding, dan tiap berkas test yang menyiapkan preferensi. Selama
 * kolomnya cuma tiga itu tidak berbahaya; begitu tiga kolom **jalur uang**
 * ditambahkan, melewatkan salah satu tempat berarti pengguna baru punya
 * `undefined` di sana — dan gejalanya muncul jauh dari sebabnya, sebagai
 * auto-unlock yang diam-diam tidak jalan atau tawaran bundel yang tidak pernah
 * muncul.
 *
 * Ia sengaja **bukan** `.default()` skema Zod saja: yang menulis ke Dexie
 * melewati parsing, jadi bawaan skema tidak pernah ikut jalan di jalur itu.
 */
export function emptyReaderPrefs(userId: string): ReaderPrefs {
  return {
    userId,
    genres: [],
    hiddenStoryIds: [],
    autoUnlockStoryIds: [],
    autoUnlockCounts: {},
    bundleOfferSeenStoryIds: [],
    onboardedAt: null,
  }
}

/**
 * Preferensi pembaca beserta bawaannya bila belum pernah ada barisnya.
 *
 * Di sini, bukan di `handlers/onboarding.ts`: `handlers/unlock.ts` juga
 * memerlukannya, dan mengimpornya dari sana akan melingkar lewat
 * `handlers/session.ts`.
 */
export async function readerPrefsOf(userId: string): Promise<ReaderPrefs> {
  return (await db.readerPrefs.get(userId)) ?? emptyReaderPrefs(userId)
}

/**
 * Sakelar dev: melompatkan penghitung buka-otomatis sebuah cerita ke ambangnya.
 *
 * **Bukan metode seam**, dan tidak boleh jadi metode seam — ia menulis langsung
 * ke penghitung yang seharusnya hanya bisa naik lewat pembelian.
 *
 * **Alasannya berubah 5 September.** Dulu ia satu-satunya cara melihat pitanya:
 * saldo contoh 15.300 habis di bab ke-12, dua bab sebelum ambang sepuluh. Saldo
 * itu kini 20.000 dan ambangnya tercapai dengan membaca biasa, jadi tombol ini
 * tinggal berguna untuk **mencoba ulang** — melihat pitanya lagi setelah
 * ditolak, tanpa menghapus data situs.
 */
export async function jumpAutoUnlockCountAsDev(storyId: string, userId: string): Promise<void> {
  const { SERVER_CONFIG } = await import('./config')
  const prefs = await readerPrefsOf(userId)

  await db.readerPrefs.put({
    ...prefs,
    autoUnlockStoryIds: prefs.autoUnlockStoryIds.includes(storyId)
      ? prefs.autoUnlockStoryIds
      : [...prefs.autoUnlockStoryIds, storyId],
    autoUnlockCounts: { ...prefs.autoUnlockCounts, [storyId]: SERVER_CONFIG.bundleOfferAfter },
    // Penolakan sebelumnya ikut dibersihkan; kalau tidak, sakelarnya hanya
    // bekerja sekali dan sesudahnya terlihat rusak.
    bundleOfferSeenStoryIds: prefs.bundleOfferSeenStoryIds.filter((id) => id !== storyId),
  })
}

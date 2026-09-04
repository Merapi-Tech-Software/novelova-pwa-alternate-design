import contentData from '../../../sample_data/new_kbm_main.content_data.json'
import media from '../../../sample_data/new_kbm_main.media.json'

/**
 * Gambar contoh dari `sample_data/`.
 *
 * Dua berkas, dua peran, dan keduanya tidak bisa ditukar:
 *
 * | Berkas | Isi | Dipakai |
 * |---|---|---|
 * | `new_kbm_main.content_data.json` | 100 sampul potret (2:3) | `Story.coverUrl` \u2014 kartu cerita |
 * | `new_kbm_main.media.json` | 20 gambar lanskap | `Story.bannerUrl` \u2014 banner unggulan |
 *
 * Diimpor sebagai modul, bukan diambil lewat `fetch`: ia bagian dari **seed
 * server tiruan**, dan seed harus siap sebelum permintaan pertama dijawab.
 * Karena hanya `api/mock` yang mengimpornya, berkas ini tidak ikut ke bundel
 * mode `http`.
 *
 * Bentuk JSON-nya apa adanya dari sumber \u2014 tidak dirapikan supaya berkasnya bisa
 * diganti kapan saja tanpa menyunting kode ini.
 */

type CoverEntry = { cover_img?: { url?: string } }
type MediaEntry = { url?: string }

function urls(list: readonly unknown[], pick: (entry: never) => string | undefined): string[] {
  return list.map((e) => pick(e as never)).filter((u): u is string => typeof u === 'string')
}

/** Sampul potret untuk kartu cerita. */
export const COVER_URLS: string[] = urls(
  (contentData as Array<{ data?: CoverEntry[] }>).flatMap((block) => block.data ?? []),
  (entry: CoverEntry) => entry.cover_img?.url,
)

/** Gambar lanskap untuk banner unggulan. */
export const BANNER_URLS: string[] = urls(media as MediaEntry[], (entry: MediaEntry) => entry.url)

/**
 * Berputar, bukan acak: seed harus menghasilkan gambar yang sama setiap kali
 * dijalankan, kalau tidak perbandingan visual antar sesi jadi tidak berarti.
 */
export function pickImage(pool: string[], index: number): string | null {
  return pool.length === 0 ? null : (pool[index % pool.length] ?? null)
}

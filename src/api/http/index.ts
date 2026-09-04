import type { NovelovaApi } from '../client'
import { withNotImplemented } from '../errors'

/**
 * Implementasi HTTP — **stub di v1.**
 *
 * Ia ada supaya seam terbukti punya dua sisi: kontrak yang sama, dua
 * implementasi, satu variabel env yang memilih. Kalau berkas ini tidak ada,
 * "ganti backend = tukar satu folder" hanyalah niat, bukan sesuatu yang bisa
 * dibuktikan compiler.
 *
 * Saat backend nyata siap, isi `handlers` dengan `fetch` ke `VITE_API_BASE_URL`,
 * validasi responsnya dengan skema yang sama dari `../contracts`, dan normalkan
 * kegagalannya lewat `toApiError`. Tidak ada komponen yang perlu berubah.
 */

const handlers: Partial<NovelovaApi> = {}

export const api = withNotImplemented<NovelovaApi>(handlers, 'http')

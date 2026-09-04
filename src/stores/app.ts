import { create } from 'zustand'
import { isOutdated } from '@/lib/version'

/**
 * Keadaan aplikasi yang berada di atas sesi · `APP-426`.
 *
 * Versi minimum datang dari `VITE_MIN_SUPPORTED_VERSION`. Di produksi angkanya
 * ditegakkan server (yang menjawab 426); di sini env memerankannya, sehingga
 * layarnya benar-benar bisa dicoba — cukup naikkan nilai itu di `.env` lalu
 * muat ulang. `markOutdated` dipakai saat server yang mengatakannya.
 */
interface AppState {
  outdated: boolean
  markOutdated: () => void
}

export const APP_VERSION = import.meta.env.VITE_APP_VERSION
export const MIN_APP_VERSION = import.meta.env.VITE_MIN_SUPPORTED_VERSION

export const useApp = create<AppState>()((set) => ({
  outdated: isOutdated(APP_VERSION, MIN_APP_VERSION),
  markOutdated: () => set({ outdated: true }),
}))

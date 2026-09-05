import { create } from 'zustand'
import { READER_FONT_DEFAULT, READER_FONT_MAX, READER_FONT_MIN } from '@/lib/limits'

/**
 * Pengaturan baca · FR-READ-03 · FR-READ-04.
 *
 * Kunci `novelova-reader-settings-v1` dipertahankan **byte-exact** dari
 * prototipe, dan isinya tetap objek datar `{ fontSize, darkTheme }`
 * — pengguna lama membawa pengaturannya ikut pindah ke versi ini. Itu juga
 * sebabnya `zustand/persist` tidak dipakai: ia membungkus nilai dalam
 * `{ state, version }`.
 *
 * `applyReaderSettings()` dipanggil dari `main.tsx` **sebelum** React merender
 * apa pun. Tanpa itu, pembaca bertema gelap melihat kedipan putih setiap kali
 * membuka aplikasi — dan kedipan itu paling menyakitkan justru bagi orang yang
 * memilih tema gelap karena membaca di tempat gelap.
 */

const KEY = 'novelova-reader-settings-v1'

/**
 * **Hanya tampilan.** `autoUnlock` pernah tinggal di sini dan dicabut di R4b
 * (`architecture.md` §1.19): ia memberi wewenang memotong koin, dan aturan
 * struktur #5 melarang `stores/` menyimpan apa yang dimiliki pengguna. Sekarang
 * izinnya per cerita, di server, lewat `setAutoUnlock`.
 */
export interface ReaderSettings {
  fontSize: number
  darkTheme: boolean
}

const DEFAULTS: ReaderSettings = {
  fontSize: READER_FONT_DEFAULT,
  darkTheme: false,
}

/** Di luar rentang ini teksnya berhenti bisa dibaca, jadi dijepit, bukan ditolak. */
export function clampFontSize(size: number): number {
  return Math.min(READER_FONT_MAX, Math.max(READER_FONT_MIN, Math.round(size)))
}

export function mergeSettings(raw: string | null): ReaderSettings {
  if (!raw) return { ...DEFAULTS }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULTS }

    const stored = parsed as Partial<ReaderSettings>
    return {
      ...DEFAULTS,
      ...stored,
      fontSize: clampFontSize(
        typeof stored.fontSize === 'number' ? stored.fontSize : DEFAULTS.fontSize,
      ),
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function read(): ReaderSettings {
  try {
    return mergeSettings(localStorage.getItem(KEY))
  } catch {
    return { ...DEFAULTS }
  }
}

function write(settings: ReaderSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Mode privat atau kuota penuh — pengaturan tetap berlaku sepanjang sesi.
  }
}

/** Menempelkan pengaturan ke elemen akar; dipanggil sebelum render pertama. */
export function applyReaderSettings(settings: ReaderSettings = read()): void {
  const root = document.documentElement
  root.style.setProperty('--reader-font-size', `${settings.fontSize}px`)
  root.dataset.theme = settings.darkTheme ? 'dark' : 'light'
}

interface ReaderSettingsState extends ReaderSettings {
  setFontSize: (size: number) => void
  toggleDarkTheme: () => void
}

export const useReaderSettings = create<ReaderSettingsState>()((set, get) => {
  function commit(next: ReaderSettings) {
    write(next)
    applyReaderSettings(next)
    set(next)
  }

  return {
    ...read(),
    setFontSize: (size) => commit({ ...current(get), fontSize: clampFontSize(size) }),
    toggleDarkTheme: () => commit({ ...current(get), darkTheme: !get().darkTheme }),
  }
})

function current(get: () => ReaderSettingsState): ReaderSettings {
  const { fontSize, darkTheme } = get()
  return { fontSize, darkTheme }
}

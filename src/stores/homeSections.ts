import { create } from 'zustand'

/**
 * Tampil/sembunyi blok beranda · FR-HOME-06.
 *
 * **Kuncinya `home_section_visibility_v1`, byte-exact dari prototipe** — bukan
 * gaya penamaan kita (`novelova:*`), dan itu disengaja: pengguna lama membawa
 * pilihannya ikut pindah ke versi ini. Karena itu pula `zustand/persist` tidak
 * dipakai di sini; ia membungkus nilai dalam `{ state, version }`, dan bentuk
 * itu tidak akan terbaca oleh peta datar yang sudah tersimpan.
 *
 * Tiga perilaku yang wajib (architecture.md §7.1):
 * hasil parse **digabung di atas default**, sehingga blok yang baru ditambahkan
 * otomatis tampil · JSON rusak → default, **tanpa error yang terlihat** ·
 * kegagalan menulis (mode privat, kuota penuh) ditelan diam-diam.
 */

const KEY = 'home_section_visibility_v1'

/** Sembilan blok beranda, dengan `data-target` prototipe sebagai kuncinya. */
export const SECTION_KEYS = [
  'sec-banner',
  'sec-genres',
  'sec-popular',
  'sec-ad1',
  'sec-trending',
  'sec-editor',
  'sec-ad2',
  'sec-toprom',
  'sec-continue',
] as const

export type SectionKey = (typeof SECTION_KEYS)[number]
export type VisibilityMap = Record<SectionKey, boolean>

export function defaultVisibility(): VisibilityMap {
  return Object.fromEntries(SECTION_KEYS.map((k) => [k, true])) as VisibilityMap
}

/** Dipisah dari store supaya aturan gabung-di-atas-default bisa diuji langsung. */
export function mergeVisibility(raw: string | null): VisibilityMap {
  const defaults = defaultVisibility()
  if (!raw) return defaults

  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return defaults

    // Hanya nilai `false` yang berarti sesuatu; apa pun selain itu dianggap
    // tampil. Nilai asing dari versi lama tidak boleh menyembunyikan blok.
    const stored = parsed as Record<string, unknown>
    for (const key of SECTION_KEYS) {
      if (stored[key] === false) defaults[key] = false
    }
    return defaults
  } catch {
    return defaults
  }
}

function read(): VisibilityMap {
  try {
    return mergeVisibility(localStorage.getItem(KEY))
  } catch {
    return defaultVisibility()
  }
}

function write(map: VisibilityMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    // Mode privat atau kuota penuh. Pilihannya tetap berlaku sepanjang sesi ini;
    // tidak ada yang perlu dilaporkan ke pengguna.
  }
}

interface HomeSectionsState {
  visible: VisibilityMap
  /** Menyimpan seketika — popover ini tidak punya tombol Simpan (FR-HOME-06). */
  toggle: (key: SectionKey) => void
}

export const useHomeSections = create<HomeSectionsState>()((set, get) => ({
  visible: read(),
  toggle: (key) => {
    const next = { ...get().visible, [key]: !get().visible[key] }
    write(next)
    set({ visible: next })
  },
}))

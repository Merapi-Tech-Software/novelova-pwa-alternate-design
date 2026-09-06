import { create } from 'zustand'

/**
 * Keadaan PWA yang lahir **di luar React** · architecture.md §10.2.
 *
 * Tiga hal masuk ke sini karena ketiganya datang dari peristiwa peramban yang
 * menyala sebelum — atau tanpa — komponen mana pun: pembaruan service worker,
 * `beforeinstallprompt`, dan hasil permintaan izin notifikasi.
 *
 * `stores/` **tidak menyimpan milik pengguna** (aturan struktur #5), dan ketiga
 * hal ini memang bukan: semuanya milik *perangkat ini*, dan tidak satu pun perlu
 * ikut saat pengguna berganti ponsel.
 */

/** Peristiwa `beforeinstallprompt` — belum ada di lib DOM standar. */
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PwaState {
  /** Versi baru sudah menunggu; halaman belum diganti. */
  updateSiap: boolean
  /** Dipanggil saat pengguna menekan "Muat ulang". */
  terapkanUpdate: (() => void) | null

  /** Prompt pasang yang **ditahan** — muncul saat pengguna memintanya, bukan menyembur. */
  installPrompt: InstallPromptEvent | null
  sudahTerpasang: boolean

  setUpdateSiap: (terapkan: () => void) => void
  setInstallPrompt: (event: InstallPromptEvent | null) => void
  setSudahTerpasang: (nilai: boolean) => void
}

export const usePwa = create<PwaState>((set) => ({
  updateSiap: false,
  terapkanUpdate: null,
  installPrompt: null,
  sudahTerpasang: false,

  setUpdateSiap: (terapkan) => set({ updateSiap: true, terapkanUpdate: terapkan }),
  setInstallPrompt: (event) => set({ installPrompt: event }),
  setSudahTerpasang: (nilai) => set({ sudahTerpasang: nilai, installPrompt: null }),
}))

/**
 * Kunci penanda izin push yang **pernah ditolak** · FR-NOTIF-05.
 *
 * Peramban sendiri sudah mengingat penolakannya (`Notification.permission ===
 * 'denied'`), tetapi ada keadaan ketiga yang tidak ia bedakan: pengguna yang
 * menutup dialog tanpa memilih tetap `default`, dan meminta lagi berkali-kali di
 * keadaan itu adalah cara tercepat mendapat penolakan permanen.
 */
const KUNCI_TOLAK = 'novelova:push-ditolak'

export function pushPernahDitolak(): boolean {
  if (typeof Notification !== 'undefined' && Notification.permission === 'denied') return true
  try {
    return localStorage.getItem(KUNCI_TOLAK) === '1'
  } catch {
    return false
  }
}

function catatPenolakan(): void {
  try {
    localStorage.setItem(KUNCI_TOLAK, '1')
  } catch {
    // Mode privat menolak menulis. Yang hilang cuma ingatan penolakannya —
    // peramban tetap punya ingatannya sendiri untuk `denied`.
  }
}

/**
 * Meminta izin push **pada momen yang relevan** · FR-NOTIF-05.
 *
 * Dipanggil dari dua tempat saja: saat pengguna menyalakan sakelar notifikasi
 * cerita pertama kali, dan saat menjadwalkan bab pertama. Bukan saat aplikasi
 * dibuka — prompt di kunjungan pertama adalah cara tercepat mendapat penolakan
 * permanen, dan penolakan permanen tidak bisa diminta ulang lewat kode mana pun.
 *
 * Mengembalikan `true` hanya bila izinnya benar-benar diberikan sekarang atau
 * sudah ada sebelumnya.
 */
export async function mintaIzinPush(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (pushPernahDitolak()) return false

  const hasil = await Notification.requestPermission()
  if (hasil !== 'granted') catatPenolakan()
  return hasil === 'granted'
}
